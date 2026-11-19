#!/usr/bin/env node
// Usage: node cycles/revenue.mjs <engagement-folder> <run-id>
//
// The revenue cycle's deterministic checks. Rebuilds the trade receivables rollforwards (gross and
// loss allowance) from last year's audited closing balance plus every journal line of the year,
// compares them with the client's schedule, TB and aged listing, re-performs the provision matrix,
// rebuilds revenue, and runs the cycle's cross-checks. Lines no rule can place are returned as
// pending for the trade receivables skill and the auditor; they sit in "Unclassified" until
// confirmed. Writes runs/<run-id>/work/revenue.json.
import fs from "node:fs";
import path from "node:path";
import { daysBetween, fail, loadManifests, makeFlag, months, readEngagement, readJson, round2, same, sum, writeJson } from "../lib/common.mjs";
import { parseAmount, readTable, toIsoDate } from "../lib/excel.mjs";
import { accountsWhere, balanceOf, groupByEntry, readJournalFile, readJournals, readTb, resolveAccounts } from "../lib/ledger.mjs";

const [eng, runId] = process.argv.slice(2);
if (!eng || !runId) fail("Usage: node cycles/revenue.mjs <engagement-folder> <run-id>");
const engDir = path.resolve(eng);
const { settings, problems } = readEngagement(engDir);
if (problems.length) fail(`engagement.md: ${problems.join(" ")}`);
const manifests = loadManifests();
const cycle = manifests.cycles.find((c) => c.id === "revenue");
const spec = (lineItem, id) => cycle.lineItems.find((li) => li.name === lineItem).files.find((f) => f.id === id);

const sharedDir = path.join(engDir, "shared");
const arDir = path.join(engDir, cycle.folder, "trade-receivables");
const revDir = path.join(engDir, cycle.folder, "revenue");
const rel = (p) => path.relative(engDir, p);
const AR_SCHEDULE = rel(path.join(arDir, "schedule.xlsx"));
const LISTING = rel(path.join(arDir, "aged-listing.xlsx"));
const MATRIX = rel(path.join(arDir, "provision-matrix.xlsx"));
const REV_SCHEDULE = rel(path.join(revDir, "schedule.xlsx"));
const CY_TB = "shared/current-tb.xlsx";
const PY_TB = "shared/prior-year-tb.xlsx";

const pyTb = readTb(path.join(sharedDir, "prior-year-tb.xlsx"));
const cyTb = readTb(path.join(sharedDir, "current-tb.xlsx"));
const journals = readJournals(engDir);
const { accounts, pending: pendingMappings } = resolveAccounts(engDir, [cyTb, pyTb], manifests);
if (pendingMappings.length) fail(`The account mapping has ${pendingMappings.length} pending item(s); run scan.mjs and resolve them first.`);

const TR = "Trade receivables";
const REVENUE = "Revenue";
const IMPAIRMENT = "Impairment losses on trade receivables";
const gross = accountsWhere(accounts, (a) => a.lineItem === TR && a.component === "gross");
const allowance = accountsWhere(accounts, (a) => a.lineItem === TR && a.component === "loss-allowance");
const revenue = accountsWhere(accounts, (a) => a.lineItem === REVENUE);
const cash = accountsWhere(accounts, (a) => a.lineItem === "Cash and cash equivalents");
const impairment = accountsWhere(accounts, (a) => a.lineItem === IMPAIRMENT);
const tax = accountsWhere(accounts, (a) => /\b(vat|gst|sales tax|output tax)\b/i.test(`${a.lineItem} ${a.name}`));
const fx = accountsWhere(accounts, (a) => /exchange/i.test(`${a.lineItem} ${a.name}`));

const flags = [];
const push = (f) => f && flags.push(f);
const flag = (f, tolerance) => push(makeFlag(f, settings, tolerance));
const byEntry = groupByEntry(journals);

// ---------------------------------------------------------------------------
// Line identity: the same journal line keeps its id across runs and between the journal export
// and the client's schedule (entry, account, amount, and occurrence when repeated).
// ---------------------------------------------------------------------------
function withIds(lines) {
  const seen = new Map();
  return lines.map((l) => {
    const base = `${l.entry}|${l.account}|${l.amount.toFixed(2)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { ...l, id: n === 1 ? base : `${base}#${n}` };
  });
}
const src = (l) => ({ file: l.file, sheet: "Journal lines", row: l.row, entry: l.entry });
const strip = ({ entry, date, account, accountName, description, amount }) => ({ entry, date, account, accountName, description, amount });

// ---------------------------------------------------------------------------
// Movements. Amounts are oriented so the balance is positive: debit-positive for gross
// receivables, credit-positive for the loss allowance. sign +1 adds, −1 deducts (shown positive),
// 0 is shown signed.
// ---------------------------------------------------------------------------
const MOVEMENTS = {
  gross: [
    { category: "credit-sale", label: "Credit sales", sign: 1 },
    { category: "receipt", label: "Cash receipts", sign: -1 },
    { category: "credit-note", label: "Credit notes", sign: -1 },
    { category: "write-off", label: "Write-offs", sign: -1 },
    { category: "fx", label: "Foreign exchange", sign: 0 },
    { category: "reclassification", label: "Reclassifications", sign: 0 },
    { category: "unclassified", label: "Unclassified", sign: 0 },
  ],
  "loss-allowance": [
    { category: "charge", label: "Impairment charge", sign: 1 },
    { category: "reversal", label: "Reversals", sign: -1 },
    { category: "write-off-used", label: "Write-offs used", sign: -1 },
    { category: "fx", label: "Foreign exchange", sign: 0 },
    { category: "unclassified", label: "Unclassified", sign: 0 },
  ],
};
const orient = (component, amount) => (component === "gross" ? amount : -amount);
const shown = (m, total) => (m.sign === -1 ? round2(-total) : total);

// ---------------------------------------------------------------------------
// Classification by the other side of the entry; confirmed auditor choices win.
// ---------------------------------------------------------------------------
const confirmations = readJson(path.join(arDir, "confirmations.json"), { lines: {} }).lines ?? {};

function placeByRule(line, component) {
  const entry = byEntry.get(line.entry) ?? [];
  const own = component === "gross" ? gross : allowance;
  const others = entry.filter((l) => !own.has(l.account));
  if (!others.length) return null;
  const all = (...sets) => others.every((l) => sets.some((s) => s.has(l.account)));
  if (component === "gross") {
    if (all(revenue, tax) && others.some((l) => revenue.has(l.account))) return line.amount > 0 ? { category: "credit-sale" } : { category: "credit-note" };
    if (all(cash)) return { category: "receipt" };
    if (all(allowance) && line.amount < 0) return { category: "write-off", via: "allowance" };
    if (all(impairment) && line.amount < 0) return { category: "write-off", via: "direct" };
    if (all(fx)) return { category: "fx" };
    return null;
  }
  if (all(impairment)) return line.amount < 0 ? { category: "charge" } : { category: "reversal" };
  if (all(gross) && line.amount > 0) return { category: "write-off-used" };
  if (all(fx)) return { category: "fx" };
  return null;
}

const trJournal = withIds(journals.filter((l) => gross.has(l.account) || allowance.has(l.account)));
const classifications = [];
const pending = [];
for (const line of trJournal) {
  const component = gross.has(line.account) ? "gross" : "loss-allowance";
  const allowed = MOVEMENTS[component].map((m) => m.category);
  const c = confirmations[line.id];
  const rule = placeByRule(line, component);
  let row;
  if (c && allowed.includes(c.category)) row = { category: c.category, by: "auditor", confirmed: true, reasoning: c.reasoning };
  else if (rule) row = { category: rule.category, via: rule.via, by: "rule", confirmed: true };
  else {
    row = { category: "unclassified", by: null, confirmed: false };
    pending.push({ id: line.id, component, allowedCategories: allowed, line: strip(line), entry: (byEntry.get(line.entry) ?? []).map(strip), source: src(line) });
  }
  classifications.push({ id: line.id, component, ...row, line: strip(line), source: src(line) });
}

// ---------------------------------------------------------------------------
// The client's schedule, aged listing and provision matrix
// ---------------------------------------------------------------------------
const arSpec = spec(TR, "arSchedule");
const schedLines = withIds(readJournalFile(path.join(arDir, "schedule.xlsx"), AR_SCHEDULE));
function readRollforward(file, sheetSpec) {
  const t = readTable(file, sheetSpec);
  if (!t) return null;
  return t.rows.map(({ row, values, formulas }) => ({ label: String(values.Movement ?? "").trim(), amount: parseAmount(values.Amount), row, formula: formulas.Amount, sheet: t.sheet }));
}
const schedRf = {
  gross: readRollforward(path.join(arDir, "schedule.xlsx"), arSpec.sheets[1]),
  "loss-allowance": readRollforward(path.join(arDir, "schedule.xlsx"), arSpec.sheets[2]),
};

const listingSpec = spec(TR, "agedListing").sheets[0];
const listing = readTable(path.join(arDir, "aged-listing.xlsx"), listingSpec).rows.map(({ row, values }) => ({
  customer: String(values.Customer ?? "").trim(),
  invoice: String(values["Invoice number"] ?? "").trim(),
  invoiceDate: toIsoDate(values["Invoice date"]),
  dueDate: toIsoDate(values["Due date"]),
  outstanding: parseAmount(values.Outstanding) ?? 0,
  clientBucket: values.Bucket == null ? null : String(values.Bucket).trim(),
  row,
}));

const BUCKETS = ["Not yet due", "1-30 days", "31-60 days", "61-90 days", "Over 90 days"];
const bucketOf = (dueDate) => {
  const dpd = daysBetween(dueDate, settings.yearEnd);
  return dpd <= 0 ? 0 : dpd <= 30 ? 1 : dpd <= 60 ? 2 : dpd <= 90 ? 3 : 4;
};
const bucketIndex = (label) => {
  const s = String(label ?? "").toLowerCase();
  if (/not yet|current|undue/.test(s)) return 0;
  if (/\b1\D{1,5}30\b/.test(s)) return 1;
  if (/\b31\D{1,5}60\b/.test(s)) return 2;
  if (/\b61\D{1,5}90\b/.test(s)) return 3;
  if (/over|more than|>|90\s*\+/.test(s)) return 4;
  return -1;
};

// ---------------------------------------------------------------------------
// Difference candidates: the fixed list of explanations a script can test.
// ---------------------------------------------------------------------------
const journalMonths = new Set(journals.map((l) => l.date.slice(0, 7)));
const missingMonths = months(settings.periodStart, settings.yearEnd).filter((m) => !journalMonths.has(m));

function multisetMinus(a, b) {
  const counts = new Map();
  for (const l of b) counts.set(l.id, (counts.get(l.id) ?? 0) + 1);
  return a.filter((l) => {
    const n = counts.get(l.id) ?? 0;
    if (n > 0) {
      counts.set(l.id, n - 1);
      return false;
    }
    return true;
  });
}

function candidates(difference, ctx) {
  const abs = Math.abs(difference);
  const out = [];
  const ids = (ls) => ls.slice(0, 8).map((l) => ({ entry: l.entry, date: l.date, description: l.description, amount: l.amount, file: l.file, row: l.row }));
  const seen = new Set();
  const lines = (ctx.lines ?? []).filter((l) => {
    const k = `${l.entry}|${l.amount}|${l.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const single = lines.filter((l) => same(Math.abs(l.amount), abs));
  if (single.length) out.push({ test: "single-line", matched: true, note: "A single line equals the difference.", lines: ids(single) });
  const flip = lines.filter((l) => same(2 * Math.abs(l.amount), abs));
  if (flip.length) out.push({ test: "sign-flip", matched: true, note: "The difference is twice a line, consistent with a line posted with the wrong sign.", lines: ids(flip) });
  if (abs >= 9 && Number.isInteger(round2(abs)) && round2(abs) % 9 === 0) out.push({ test: "transposition", matched: true, note: "The difference is divisible by 9, consistent with transposed digits." });
  for (const [test, ls, note] of [
    ["missing-from-schedule", ctx.missingFromSchedule ?? [], "Journal export lines on these accounts that are not on the client's schedule."],
    ["missing-from-journals", ctx.missingFromJournals ?? [], "Schedule lines that are not in the journal export."],
    ["outside-period", ctx.outsidePeriod ?? [], "Lines dated outside the period."],
  ]) {
    if (!ls.length) continue;
    const total = sum(ls.map((l) => l.amount));
    out.push({ test, matched: same(Math.abs(total), abs) || ls.some((l) => same(Math.abs(l.amount), abs)), amount: total, note, lines: ids(ls) });
  }
  if (ctx.unconfirmed && !same(ctx.unconfirmed, 0)) out.push({ test: "unconfirmed-lines", matched: same(Math.abs(ctx.unconfirmed), abs), amount: ctx.unconfirmed, note: "Lines still awaiting the auditor's classification." });
  if (missingMonths.length && ctx.journalBased) out.push({ test: "missing-month", matched: false, months: missingMonths, note: "Months of the period with no lines in the journal export." });
  if (ctx.typedClosing) out.push({ test: "typed-closing", matched: false, note: "The schedule's closing balance is a typed number, not a formula." });
  if (ctx.openingDifference && !same(ctx.openingDifference, 0)) out.push({ test: "opening-balance", matched: same(Math.abs(ctx.openingDifference), abs), amount: ctx.openingDifference, note: "The schedule's opening balance differs from last year's audited closing." });

  // Two or more causes together: each part's signed effect on the client's figure.
  const parts = [
    ctx.missingFromSchedule?.length && { test: "missing-from-schedule", effect: -sum(ctx.missingFromSchedule.map((l) => l.amount)) },
    ctx.missingFromJournals?.length && { test: "missing-from-journals", effect: sum(ctx.missingFromJournals.map((l) => l.amount)) },
    ctx.outsidePeriod?.length && { test: "outside-period", effect: sum(ctx.outsidePeriod.map((l) => l.amount)) },
    ctx.openingDifference && !same(ctx.openingDifference, 0) && { test: "opening-balance", effect: ctx.openingDifference },
  ].filter(Boolean);
  for (let mask = 1; mask < 1 << parts.length; mask++) {
    const subset = parts.filter((_, i) => mask & (1 << i));
    if (subset.length < 2) continue;
    if (same(sum(subset.map((p) => p.effect)), difference)) {
      out.push({ test: "combination", matched: true, parts: subset, note: `Together, ${subset.map((p) => `${p.test} (${p.effect})`).join(" + ")} explain the whole difference.` });
      break;
    }
  }
  // Divisible by 9 is a one-in-nine coincidence; drop it when another cause explains the amount.
  const explained = out.some((c) => c.matched && !["transposition", "typed-closing", "missing-month"].includes(c.test));
  return explained ? out.filter((c) => c.test !== "transposition") : out;
}

// ---------------------------------------------------------------------------
// Trade receivables rollforwards
// ---------------------------------------------------------------------------
const rollforwards = {};
const unconfirmedBy = (component) => sum(classifications.filter((c) => c.component === component && !c.confirmed).map((c) => orient(component, c.line.amount)));

for (const component of ["gross", "loss-allowance"]) {
  const own = component === "gross" ? gross : allowance;
  const label = component === "gross" ? "Gross trade receivables" : "Loss allowance";
  const sheet = component === "gross" ? "Rollforward" : "Allowance rollforward";
  const rf = schedRf[component];
  const audited = orient(component, balanceOf(pyTb, own));
  const tbClosing = orient(component, balanceOf(cyTb, own));
  const lines = classifications.filter((c) => c.component === component);
  if (!own.size && !rf) continue;
  if (!rf) {
    if (own.size && (audited || tbClosing || lines.length)) {
      flag({ stage: "schedules", kind: "schedule-missing", lineItem: TR, movement: label, description: `The trade receivables schedule has no "${sheet}" sheet although the ledger has ${label.toLowerCase()} accounts.`, expected: tbClosing, actual: 0, assertion: "Completeness", reference: "ISA 500", sources: [{ file: AR_SCHEDULE }] });
    }
    continue;
  }

  const row = (l) => rf.find((r) => r.label.toLowerCase() === l.toLowerCase());
  const schedOpening = row("Opening balance");
  const schedClosing = row("Closing balance");
  const known = new Set(["opening balance", "closing balance", ...MOVEMENTS[component].map((m) => m.label.toLowerCase())]);
  const unknownRows = rf.filter((r) => !known.has(r.label.toLowerCase()) && r.amount != null);

  const journalLines = trJournal.filter((l) => own.has(l.account)).map((l) => ({ ...l, amount: orient(component, l.amount) }));
  const scheduleLines = schedLines.filter((l) => own.has(l.account)).map((l) => ({ ...l, amount: orient(component, l.amount) }));
  const missingFromSchedule = multisetMinus(journalLines, scheduleLines);
  const missingFromJournals = multisetMinus(scheduleLines, journalLines);
  const outsidePeriod = scheduleLines.filter((l) => l.date < settings.periodStart || l.date > settings.yearEnd);
  const openingDifference = round2((schedOpening?.amount ?? 0) - audited);
  const ctx = { lines: [...journalLines, ...missingFromJournals], missingFromSchedule, missingFromJournals, outsidePeriod, unconfirmed: unconfirmedBy(component), typedClosing: schedClosing && !schedClosing.formula, openingDifference };
  const schedSrc = (r) => ({ file: AR_SCHEDULE, sheet, row: r?.row });

  // Opening: last year's audited closing.
  flag({ stage: "opening", kind: "opening-balance", lineItem: TR, movement: label, description: `${label} opening balance on the schedule does not agree with last year's audited closing balance.`, expected: audited, actual: schedOpening?.amount ?? 0, assertion: "Opening balances", reference: "ISA 510", sources: [schedSrc(schedOpening), { file: PY_TB }], candidates: candidates(openingDifference, { lines: [] }) });

  // Movements: each one rebuilt from the year's journal lines.
  let rebuiltClosing = audited;
  const rows = [{ label: "Opening balance", rebuilt: audited, schedule: schedOpening?.amount ?? null }];
  for (const m of MOVEMENTS[component]) {
    const ls = lines.filter((c) => c.category === m.category);
    const total = sum(ls.map((c) => orient(component, c.line.amount)));
    rebuiltClosing = round2(rebuiltClosing + total);
    const r = row(m.label);
    rows.push({ label: m.label, rebuilt: shown(m, total), schedule: r?.amount ?? null });
    if (m.category === "unclassified") {
      if (ls.length) flag({ stage: "schedules", kind: "unclassified-lines", lineItem: TR, movement: label, description: `${ls.length} ${label.toLowerCase()} journal line(s) are not yet classified; the rebuilt rollforward carries them as "Unclassified" until the auditor confirms a category.`, expected: 0, actual: total, assertion: "Accuracy and classification", reference: "ISA 500", sources: ls.map((c) => c.source), restsOnUnconfirmed: true });
      continue;
    }
    const scheduleLinesOfMovement = ls.map((c) => ({ ...c.line, amount: orient(component, c.line.amount), file: c.source.file, row: c.source.row }));
    flag({ stage: "schedules", kind: "schedule-movement", lineItem: TR, movement: `${label}: ${m.label}`, description: `${m.label} on the ${label.toLowerCase()} rollforward does not agree with the journal lines classified as ${m.label.toLowerCase()}.`, expected: shown(m, total), actual: r?.amount ?? 0, assertion: m.category === "credit-sale" ? "Occurrence and cut-off" : "Accuracy and completeness", reference: "ISA 500", sources: [schedSrc(r), ...ls.slice(0, 20).map((c) => c.source)], restsOnUnconfirmed: ls.some((c) => !c.confirmed), candidates: candidates(round2((r?.amount ?? 0) - shown(m, total)), { ...ctx, lines: scheduleLinesOfMovement.concat(ctx.lines) }) });
  }
  for (const r of unknownRows) {
    flag({ stage: "schedules", kind: "schedule-unknown-movement", lineItem: TR, movement: `${label}: ${r.label}`, keySuffix: r.label, description: `The schedule has a movement "${r.label}" that is not in the schedule template; its lines should be classified into a template movement.`, expected: 0, actual: r.amount, assertion: "Classification", reference: "ISA 500", sources: [schedSrc(r)] });
  }
  rows.push({ label: "Closing balance", rebuilt: rebuiltClosing, schedule: schedClosing?.amount ?? null });

  // The schedule's own arithmetic: its closing should follow from its opening and movements.
  const schedArith = round2(
    (schedOpening?.amount ?? 0) +
      MOVEMENTS[component].reduce((s, m) => {
        const r = row(m.label);
        return s + (r?.amount == null ? 0 : m.sign === -1 ? -r.amount : r.amount);
      }, 0) +
      unknownRows.reduce((s, r) => s + r.amount, 0),
  );
  flag({ stage: "schedules", kind: "schedule-arithmetic", lineItem: TR, movement: label, description: `${label} closing balance on the schedule does not follow from the schedule's own opening balance and movements.`, expected: schedArith, actual: schedClosing?.amount ?? 0, assertion: "Accuracy", reference: "ISA 500", sources: [schedSrc(schedClosing)], candidates: candidates(round2((schedClosing?.amount ?? 0) - schedArith), { typedClosing: ctx.typedClosing }) });

  // Rebuilt closing against the client's three closing balances.
  flag({ stage: "schedules", kind: "rebuilt-vs-schedule", lineItem: TR, movement: label, description: `${label} closing balance on the schedule does not agree with last year's audited closing plus the year's journal lines.`, expected: rebuiltClosing, actual: schedClosing?.amount ?? 0, assertion: "Existence and accuracy", reference: "ISA 500; ISA 510", sources: [schedSrc(schedClosing)], restsOnUnconfirmed: !same(ctx.unconfirmed, 0), candidates: candidates(round2((schedClosing?.amount ?? 0) - rebuiltClosing), ctx) });
  flag({ stage: "tb-and-cross-checks", kind: "schedule-vs-tb", lineItem: TR, movement: label, description: `${label} closing balance on the schedule does not agree with the trial balance.`, expected: tbClosing, actual: schedClosing?.amount ?? 0, assertion: "Accuracy", reference: "ISA 500", sources: [schedSrc(schedClosing), { file: CY_TB }], candidates: candidates(round2((schedClosing?.amount ?? 0) - tbClosing), ctx) });
  flag({ stage: "tb-and-cross-checks", kind: "rebuilt-vs-tb", lineItem: TR, movement: label, description: `${label} on the trial balance does not equal last year's audited closing plus the year's journal lines (the journal export and the TB disagree).`, expected: rebuiltClosing, actual: tbClosing, assertion: "Completeness", reference: "ISA 500", sources: [{ file: CY_TB }, { file: "shared/journals/" }], candidates: candidates(round2(tbClosing - rebuiltClosing), { ...ctx, journalBased: true }) });

  rollforwards[component] = { title: label, rows, openingAudited: audited, closingRebuilt: rebuiltClosing, closingSchedule: schedClosing?.amount ?? null, closingTb: tbClosing, closingIsFormula: Boolean(schedClosing?.formula) };
}

// ---------------------------------------------------------------------------
// Aged listing: totals, credit balances, cut-off, ageing accuracy
// ---------------------------------------------------------------------------
const listingTotal = sum(listing.map((r) => r.outstanding));
if (rollforwards.gross) {
  rollforwards.gross.closingListing = listingTotal;
  flag({ stage: "tb-and-cross-checks", kind: "listing-vs-rebuilt", lineItem: TR, movement: "Gross trade receivables", description: "The aged receivables listing total does not agree with the rebuilt gross trade receivables closing balance (the subledger and the ledger disagree).", expected: rollforwards.gross.closingRebuilt, actual: listingTotal, assertion: "Existence and accuracy", reference: "ISA 500.9 (information produced by the entity)", sources: [{ file: LISTING, sheet: listingSpec.name }], candidates: candidates(round2(listingTotal - rollforwards.gross.closingRebuilt), { lines: listing.map((r) => ({ entry: r.invoice, date: r.invoiceDate, description: r.customer, amount: r.outstanding, file: LISTING, row: r.row })) }) });
}
const byCustomer = new Map();
for (const r of listing) byCustomer.set(r.customer, round2((byCustomer.get(r.customer) ?? 0) + r.outstanding));
const creditCustomers = [...byCustomer].filter(([, v]) => v < 0);
if (creditCustomers.length) {
  flag({ stage: "valuation-and-composition", kind: "credit-balances", lineItem: TR, description: `Customer(s) with credit balances in the aged listing: ${creditCustomers.map(([c, v]) => `${c} (${v})`).join(", ")}. Credit balances are contract liabilities or other payables and are not netted against trade receivables.`, expected: 0, actual: sum(creditCustomers.map(([, v]) => v)), assertion: "Classification and presentation", reference: "IFRS 15.105-108; IAS 32.42", sources: listing.filter((r) => creditCustomers.some(([c]) => c === r.customer)).map((r) => ({ file: LISTING, row: r.row })) });
}
const afterYe = listing.filter((r) => r.invoiceDate > settings.yearEnd);
if (afterYe.length) {
  flag({ stage: "valuation-and-composition", kind: "listing-after-year-end", lineItem: TR, description: `Invoices dated after the year-end are in the year-end aged listing: ${afterYe.map((r) => r.invoice).join(", ")}.`, expected: 0, actual: sum(afterYe.map((r) => r.outstanding)), assertion: "Cut-off and existence", reference: "ISA 500; ISA 240", sources: afterYe.map((r) => ({ file: LISTING, row: r.row })) });
}
const misaged = listing.filter((r) => r.clientBucket != null && bucketIndex(r.clientBucket) !== bucketOf(r.dueDate));
if (misaged.length) {
  flag({ stage: "valuation-and-composition", kind: "ageing-accuracy", lineItem: TR, description: `${misaged.length} invoice(s) sit in the wrong ageing bucket when re-aged from their due date at the year-end (e.g. ${misaged.slice(0, 3).map((r) => `${r.invoice}: client "${r.clientBucket}", re-aged "${BUCKETS[bucketOf(r.dueDate)]}"`).join("; ")}).`, expected: 0, actual: sum(misaged.map((r) => r.outstanding)), assertion: "Valuation and allocation", reference: "ISA 500.9; IFRS 9.B5.5.35", sources: misaged.slice(0, 20).map((r) => ({ file: LISTING, row: r.row })) });
}

// ---------------------------------------------------------------------------
// Provision matrix re-performance
// ---------------------------------------------------------------------------
const infoNeeded = [];
let provisionMatrix = null;
const allowanceClosing = rollforwards["loss-allowance"]?.closingTb ?? orient("loss-allowance", balanceOf(cyTb, allowance));
const matrixPath = path.join(arDir, "provision-matrix.xlsx");
if (fs.existsSync(matrixPath)) {
  const mSpec = spec(TR, "provisionMatrix");
  const rate = (v) => {
    const n = typeof v === "string" ? parseAmount(v.replace("%", "")) : v;
    if (n == null) return null;
    return n > 1 ? n / 100 : n;
  };
  const matrix = readTable(matrixPath, mSpec.sheets[0]).rows.map(({ row, values }) => ({ bucket: String(values.Bucket ?? "").trim(), index: bucketIndex(values.Bucket), gross: parseAmount(values.Gross) ?? 0, rate: rate(values.Rate) ?? 0, allowance: parseAmount(values.Allowance) ?? 0, row }));
  const iaTable = readTable(matrixPath, mSpec.sheets[1]);
  const ia = (iaTable?.rows ?? []).map(({ row, values }) => ({ customer: String(values.Customer ?? "").trim(), gross: parseAmount(values.Gross) ?? 0, allowance: parseAmount(values.Allowance) ?? 0, row }));
  const iaNames = new Set(ia.map((r) => r.customer.toLowerCase()));
  // Credit balances are reclassified (not receivables), so they stay out of the expected credit loss.
  const computed = BUCKETS.map((_, i) => sum(listing.filter((r) => r.outstanding > 0 && !iaNames.has(r.customer.toLowerCase()) && bucketOf(r.dueDate) === i).map((r) => r.outstanding)));
  const mSrc = (r) => ({ file: MATRIX, sheet: mSpec.sheets[0].name, row: r.row });

  for (const m of matrix) {
    if (m.index < 0) {
      flag({ stage: "valuation-and-composition", kind: "matrix-unknown-bucket", lineItem: TR, movement: m.bucket, keySuffix: m.bucket, description: `Provision matrix bucket "${m.bucket}" does not match a standard ageing bucket (${BUCKETS.join(", ")}).`, expected: 0, actual: m.gross, assertion: "Valuation and allocation", reference: "IFRS 9.B5.5.35", sources: [mSrc(m)] });
      continue;
    }
    const diff = round2(m.gross - computed[m.index]);
    const iaMatch = ia.filter((r) => same(r.gross, Math.abs(diff)));
    flag({ stage: "valuation-and-composition", kind: "matrix-bucket-gross", lineItem: TR, movement: BUCKETS[m.index], description: `Provision matrix gross for "${m.bucket}" does not agree with the aged listing re-aged at the year-end (individually assessed customers excluded).`, expected: computed[m.index], actual: m.gross, assertion: "Valuation and allocation", reference: "IFRS 9.B5.5.35", sources: [mSrc(m), { file: LISTING }], candidates: iaMatch.length ? [{ test: "individually-assessed-in-matrix", matched: true, note: `The difference equals the individually assessed balance of ${iaMatch.map((r) => r.customer).join(", ")}, which appears to be counted in the matrix as well.` }] : [] });
    flag({ stage: "valuation-and-composition", kind: "matrix-arithmetic", lineItem: TR, movement: BUCKETS[m.index], description: `Provision matrix allowance for "${m.bucket}" is not gross × rate.`, expected: round2(m.gross * m.rate), actual: m.allowance, assertion: "Valuation and allocation", reference: "IFRS 9.B5.5.35", sources: [mSrc(m)] }, 0.5);
  }
  for (const r of ia) {
    flag({ stage: "valuation-and-composition", kind: "individually-assessed-gross", lineItem: TR, movement: r.customer, keySuffix: r.customer, description: `Individually assessed gross for ${r.customer} does not agree with that customer's balance in the aged listing.`, expected: byCustomer.get(r.customer) ?? 0, actual: r.gross, assertion: "Valuation and allocation", reference: "IFRS 9.5.5.17", sources: [{ file: MATRIX, sheet: "Individually assessed", row: r.row }] });
  }
  const rateOf = (i) => matrix.find((m) => m.index === i)?.rate ?? null;
  const reperformed = round2(BUCKETS.reduce((s, _, i) => s + computed[i] * (rateOf(i) ?? 0), 0) + sum(ia.map((r) => r.allowance)));
  const clientTotal = round2(sum(matrix.map((m) => m.allowance)) + sum(ia.map((r) => r.allowance)));
  flag({ stage: "valuation-and-composition", kind: "allowance-vs-matrix", lineItem: TR, movement: "Loss allowance", description: "The loss allowance in the ledger does not agree with the provision matrix re-performed on the aged listing (re-aged bucket totals × the client's rates + individually assessed allowances).", expected: reperformed, actual: allowanceClosing, assertion: "Valuation and allocation", reference: "IFRS 9.5.5.15; IFRS 9.B5.5.35", sources: [{ file: MATRIX }, { file: LISTING }, { file: CY_TB }] }, 0.5);
  flag({ stage: "valuation-and-composition", kind: "matrix-total-vs-ledger", lineItem: TR, movement: "Loss allowance", description: "The client's own provision matrix total does not agree with the loss allowance in the ledger.", expected: clientTotal, actual: allowanceClosing, assertion: "Valuation and allocation", reference: "IFRS 9.5.5.15", sources: [{ file: MATRIX }, { file: CY_TB }] }, 0.5);
  const rates = BUCKETS.map((b, i) => ({ bucket: b, rate: rateOf(i) }));
  const present = rates.filter((r) => r.rate != null);
  provisionMatrix = {
    buckets: BUCKETS.map((b, i) => ({ bucket: b, listingGross: computed[i], matrixGross: matrix.find((m) => m.index === i)?.gross ?? null, rate: rateOf(i), reperformedAllowance: round2(computed[i] * (rateOf(i) ?? 0)), clientAllowance: matrix.find((m) => m.index === i)?.allowance ?? null })),
    individuallyAssessed: ia.map((r) => ({ customer: r.customer, gross: r.gross, listingBalance: byCustomer.get(r.customer) ?? 0, allowance: r.allowance })),
    reperformedTotal: reperformed,
    clientTotal,
    ledgerAllowance: allowanceClosing,
    rateFacts: { rates, ratesIncrease: present.every((r, i) => i === 0 || r.rate >= present[i - 1].rate), over90Rate: rateOf(4) },
  };
} else if (allowance.size && !same(allowanceClosing, 0)) {
  infoNeeded.push("The ledger has a loss allowance but there is no provision-matrix.xlsx in revenue/trade-receivables/. Ask the client how the expected credit loss was measured (IFRS 9.5.5.15).");
} else if (!allowance.size && rollforwards.gross && rollforwards.gross.closingTb > 0) {
  infoNeeded.push("Trade receivables carry no loss allowance at all. IFRS 9 requires lifetime expected credit losses (simplified approach); ask the client for its ECL assessment.");
}

// ---------------------------------------------------------------------------
// Revenue: rebuilt from the journals, against the revenue schedule and TB
// ---------------------------------------------------------------------------
const revLines = withIds(journals.filter((l) => revenue.has(l.account)));
const revMovement = (l) => {
  const entry = byEntry.get(l.entry) ?? [];
  const r = -l.amount; // revenue is credit-positive
  if (entry.some((x) => gross.has(x.account))) return r >= 0 ? "Credit sales" : "Credit notes";
  if (entry.some((x) => cash.has(x.account))) return r >= 0 ? "Cash sales" : "Credit notes";
  return "Other";
};
const REV_MOVES = [
  { label: "Credit sales", sign: 1 },
  { label: "Cash sales", sign: 1 },
  { label: "Credit notes", sign: -1 },
  { label: "Other", sign: 0 },
];
const revTotals = Object.fromEntries(REV_MOVES.map((m) => [m.label, sum(revLines.filter((l) => revMovement(l) === m.label).map((l) => -l.amount))]));
const revRebuilt = sum(Object.values(revTotals));
const revTb = -balanceOf(cyTb, revenue);
let revenueRf = null;
if (fs.existsSync(path.join(revDir, "schedule.xlsx"))) {
  const rSpec = spec(REVENUE, "revenueSchedule");
  const rf = readRollforward(path.join(revDir, "schedule.xlsx"), rSpec.sheets[1]);
  const rRow = (l) => rf.find((r) => r.label.toLowerCase() === l.toLowerCase());
  const sched = withIds(readJournalFile(path.join(revDir, "schedule.xlsx"), REV_SCHEDULE)).filter((l) => revenue.has(l.account));
  const jl = revLines.map((l) => ({ ...l, amount: -l.amount }));
  const sl = sched.map((l) => ({ ...l, amount: -l.amount }));
  const ctx = { lines: jl, missingFromSchedule: multisetMinus(jl, sl), missingFromJournals: multisetMinus(sl, jl), outsidePeriod: sl.filter((l) => l.date < settings.periodStart || l.date > settings.yearEnd) };
  const rs = (r) => ({ file: REV_SCHEDULE, sheet: "Rollforward", row: r?.row });
  flag({ stage: "opening", kind: "opening-balance", lineItem: REVENUE, description: "Revenue schedule opening balance should be nil (an income statement line item starts each year at zero).", expected: 0, actual: rRow("Opening balance")?.amount ?? 0, assertion: "Opening balances", reference: "ISA 510", sources: [rs(rRow("Opening balance"))] });
  const rows = [{ label: "Opening balance", rebuilt: 0, schedule: rRow("Opening balance")?.amount ?? null }];
  for (const m of REV_MOVES) {
    const r = rRow(m.label);
    const value = m.sign === -1 ? round2(-revTotals[m.label]) : revTotals[m.label];
    rows.push({ label: m.label, rebuilt: value, schedule: r?.amount ?? null });
    flag({ stage: "schedules", kind: "schedule-movement", lineItem: REVENUE, movement: m.label, description: `${m.label} on the revenue schedule does not agree with the revenue journal lines.`, expected: value, actual: r?.amount ?? 0, assertion: "Occurrence and accuracy", reference: "ISA 500; IFRS 15", sources: [rs(r)], candidates: candidates(round2((r?.amount ?? 0) - value), ctx) });
  }
  const close = rRow("Closing balance");
  rows.push({ label: "Closing balance", rebuilt: revRebuilt, schedule: close?.amount ?? null });
  flag({ stage: "schedules", kind: "rebuilt-vs-schedule", lineItem: REVENUE, description: "Revenue closing balance on the schedule does not agree with the year's revenue journal lines.", expected: revRebuilt, actual: close?.amount ?? 0, assertion: "Occurrence and completeness", reference: "ISA 500", sources: [rs(close)], candidates: candidates(round2((close?.amount ?? 0) - revRebuilt), { ...ctx, typedClosing: close && !close.formula }) });
  flag({ stage: "tb-and-cross-checks", kind: "schedule-vs-tb", lineItem: REVENUE, description: "Revenue closing balance on the schedule does not agree with the trial balance.", expected: revTb, actual: close?.amount ?? 0, assertion: "Accuracy", reference: "ISA 500", sources: [rs(close), { file: CY_TB }], candidates: candidates(round2((close?.amount ?? 0) - revTb), ctx) });
  revenueRf = { title: "Revenue", rows, closingRebuilt: revRebuilt, closingSchedule: close?.amount ?? null, closingTb: revTb, closingIsFormula: Boolean(close?.formula) };
}
flag({ stage: "tb-and-cross-checks", kind: "rebuilt-vs-tb", lineItem: REVENUE, description: "Revenue on the trial balance does not equal the year's revenue journal lines.", expected: revRebuilt, actual: revTb, assertion: "Completeness", reference: "ISA 500", sources: [{ file: CY_TB }, { file: "shared/journals/" }], candidates: candidates(round2(revTb - revRebuilt), { journalBased: true, lines: [] }) });

// Cross-check: credit sales less credit notes on receivables against the receivables side of
// every revenue entry (revenue plus any sales tax on those entries).
if (rollforwards.gross) {
  const g = rollforwards.gross.rows;
  const arNetSales = round2((g.find((r) => r.label === "Credit sales")?.rebuilt ?? 0) - (g.find((r) => r.label === "Credit notes")?.rebuilt ?? 0));
  const revEntries = [...byEntry.values()].filter((ls) => ls.some((l) => revenue.has(l.account)) && ls.some((l) => gross.has(l.account)));
  const revenueSide = sum(revEntries.flatMap((ls) => ls.filter((l) => revenue.has(l.account) || tax.has(l.account)).map((l) => -l.amount)));
  const unconf = classifications.some((c) => c.component === "gross" && !c.confirmed);
  flag({ stage: "tb-and-cross-checks", kind: "cross-check-revenue", lineItem: REVENUE, description: "Credit sales less credit notes on trade receivables do not agree with the revenue (and sales tax) posted in the same entries.", expected: revenueSide, actual: arNetSales, assertion: "Occurrence and completeness", reference: "IFRS 15.108; ISA 500", sources: [{ file: AR_SCHEDULE }, { file: "shared/journals/" }], restsOnUnconfirmed: unconf, candidates: candidates(round2(arNetSales - revenueSide), { unconfirmed: unconfirmedBy("gross") }) });
}

// Revenue credited against anything other than receivables, cash or sales tax (ISA 240).
for (const [entryNo, ls] of byEntry) {
  const revenueLines = ls.filter((l) => revenue.has(l.account));
  if (!revenueLines.length) continue;
  const others = ls.filter((l) => !revenue.has(l.account) && !gross.has(l.account) && !cash.has(l.account) && !tax.has(l.account));
  if (!others.length) continue;
  flag({ stage: "tb-and-cross-checks", kind: "revenue-unusual-account", lineItem: REVENUE, keySuffix: entryNo, description: `Entry ${entryNo} posts revenue against ${others.map((o) => `${o.account} ${o.accountName}`).join(", ")} rather than trade receivables, cash or sales tax.`, expected: 0, actual: sum(others.map((o) => o.amount)), assertion: "Occurrence", reference: "ISA 240", sources: ls.map((l) => src(l)) });
}

// Journal entry tests for the revenue skill to judge (ISA 240): late, round or undocumented entries.
const lastWeek = new Date(Date.parse(settings.yearEnd) - 7 * 86400000).toISOString().slice(0, 10);
const journalEntryTests = [];
for (const [entryNo, ls] of byEntry) {
  const revenueLines = ls.filter((l) => revenue.has(l.account));
  if (!revenueLines.length) continue;
  const amount = sum(revenueLines.map((l) => -l.amount));
  const reasons = [];
  if (ls[0].date > lastWeek) reasons.push("posted in the last week of the period");
  if (Math.abs(amount) >= 5000 && Math.abs(amount) % 1000 === 0) reasons.push("round amount");
  if (!/\b(inv|invoice|cn|credit note|receipt|sale)/i.test(ls.map((l) => l.description).join(" "))) reasons.push("no document reference in the description");
  if (reasons.length >= 2 || (reasons.includes("posted in the last week of the period") && Math.abs(amount) >= settings.clearlyTrivial)) {
    journalEntryTests.push({ entry: entryNo, date: ls[0].date, amount, reasons, lines: ls.map(strip) });
  }
}

// ---------------------------------------------------------------------------
// Impairment loss: allowance charge − reversals + direct write-offs = the P&L line
// ---------------------------------------------------------------------------
const allow = rollforwards["loss-allowance"]?.rows ?? [];
const charge = allow.find((r) => r.label === "Impairment charge")?.rebuilt ?? 0;
const reversals = allow.find((r) => r.label === "Reversals")?.rebuilt ?? 0;
const directWriteOffs = sum(classifications.filter((c) => c.component === "gross" && c.category === "write-off" && c.via === "direct").map((c) => -c.line.amount));
const impairmentTb = balanceOf(cyTb, impairment);
const impairmentExpected = round2(charge - reversals + directWriteOffs);
flag({ stage: "tb-and-cross-checks", kind: "cross-check-impairment", lineItem: IMPAIRMENT, description: "Impairment losses on trade receivables in the trial balance do not equal the allowance charge less reversals plus direct write-offs.", expected: impairmentExpected, actual: impairmentTb, assertion: "Accuracy and classification", reference: "IFRS 9.5.5.15; IAS 1.82(ba) / IFRS 18", sources: [{ file: CY_TB }, { file: AR_SCHEDULE, sheet: "Allowance rollforward" }], restsOnUnconfirmed: classifications.some((c) => !c.confirmed), candidates: candidates(round2(impairmentTb - impairmentExpected), { unconfirmed: unconfirmedBy("loss-allowance") }) });

// ---------------------------------------------------------------------------
const result = {
  cycle: "revenue",
  runId,
  computedAt: new Date().toISOString(),
  settings,
  accounts: { gross: [...gross], lossAllowance: [...allowance], revenue: [...revenue], cash: [...cash], impairment: [...impairment], tax: [...tax], fx: [...fx] },
  rollforwards: { ...rollforwards, revenue: revenueRf },
  net: rollforwards.gross ? { rebuilt: round2(rollforwards.gross.closingRebuilt - (rollforwards["loss-allowance"]?.closingRebuilt ?? 0)), tb: round2(rollforwards.gross.closingTb - (rollforwards["loss-allowance"]?.closingTb ?? 0)) } : null,
  impairment: { charge, reversals, directWriteOffs, expected: impairmentExpected, tb: impairmentTb },
  provisionMatrix,
  flags,
  pending,
  classifications,
  forReview: { journalEntryTests, rateFacts: provisionMatrix?.rateFacts ?? null },
  infoNeeded,
};
writeJson(path.join(engDir, "runs", runId, "work", "revenue.json"), result);
console.log(JSON.stringify({ cycle: "revenue", flags: flags.length, pending: pending.length, journalEntryTests: journalEntryTests.length, infoNeeded, output: rel(path.join(engDir, "runs", runId, "work", "revenue.json")) }, null, 2));
