#!/usr/bin/env node
// Usage: node dev/generate-fixtures.mjs <output-folder>
//
// Writes two synthetic engagement folders for testing the audit-start skill, plus answer keys:
//   harbour-trading-clean/  every check before the statements passes; one transposed figure on the
//                           client's statement of profit or loss.
//   harbour-trading-messy/  planted misstatements in the revenue cycle, so the stop rule fires.
// The generator works forwards (transactions → ledger → client files); expected differences in the
// answer keys come from the plant definitions, never from running the checks.
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";

XLSX.set_fs(fs);

const out = path.resolve(process.argv[2] ?? "fixtures");
const round2 = (n) => Math.round(n * 100) / 100;
const sum = (xs) => round2(xs.reduce((s, x) => s + x, 0));
const addDays = (iso, d) => new Date(Date.parse(iso) + d * 86400000).toISOString().slice(0, 10);
const YE = "2026-12-31";

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCOUNTS = {
  1000: ["Cash at bank", "Cash and cash equivalents"],
  1100: ["Trade receivables control", "Trade receivables"],
  1150: ["Loss allowance on trade receivables", "Trade receivables"],
  1200: ["Inventory", "Inventories"],
  1500: ["Property, plant and equipment", "Property, plant and equipment"],
  2000: ["Trade payables", "Trade and other payables"],
  2900: ["Suspense", "Trade and other payables"],
  3000: ["Share capital", "Share capital"],
  3100: ["Retained earnings", "Retained earnings"],
  4000: ["Revenue", "Revenue"],
  5000: ["Cost of sales", "Cost of sales"],
  6000: ["Administrative expenses", "Administrative expenses"],
  6100: ["Impairment losses on trade receivables", "Impairment losses on trade receivables"],
};
const PNL = new Set(["4000", "5000", "6000", "6100"]);
const RATES = [0.005, 0.02, 0.05, 0.15, 0.5];
const BUCKETS = ["Not yet due", "1-30 days", "31-60 days", "61-90 days", "Over 90 days"];
const bucketOf = (due) => {
  const dpd = Math.round((Date.parse(YE) - Date.parse(due)) / 86400000);
  return dpd <= 0 ? 0 : dpd <= 30 ? 1 : dpd <= 60 ? 2 : dpd <= 90 ? 3 : 4;
};

function build(variant) {
  const messy = variant === "messy";
  const rand = rng(20261231);
  const entries = []; // { date, description, lines: [{ account, amount }] }  amount debit-positive
  const je = (date, description, lines) => entries.push({ date, description, lines });

  // Opening receivables (last year's audited closing): invoices paid or written off this year.
  const invoices = [
    { no: "INV-0950", customer: "Pemberton & Sons", date: "2025-11-20", amount: 6200, pay: "2026-01-14" },
    { no: "INV-0961", customer: "Lim Trading", date: "2025-12-05", amount: 4800, pay: "2026-01-20" },
    { no: "INV-0970", customer: "Harbour Foods", date: "2025-12-15", amount: 7400, pay: "2026-02-03" },
    { no: "INV-0975", customer: "Northgate Supplies", date: "2025-12-20", amount: 3900, pay: "2026-01-22" },
    { no: "INV-0901", customer: "Orchid Retail", date: "2025-07-10", amount: 1100, writeOff: "2026-06-30" },
    { no: "INV-0980", customer: "Kestrel Stores", date: "2025-12-22", amount: 2600, pay: "2026-02-10" },
  ].map((i) => ({ ...i, opening: true, credited: 0, received: 0 }));
  const PY_AR = sum(invoices.map((i) => i.amount)); // 26,000
  const PY_ALLOWANCE = 1500;

  // This year's credit sales: monthly invoices per customer, paid after the customer's usual days.
  const customers = [
    { name: "Pemberton & Sons", days: 25 },
    { name: "Lim Trading", days: 35 },
    { name: "Harbour Foods", days: 45 },
    { name: "Northgate Supplies", days: 30 },
    { name: "Orchid Retail", days: 60 },
  ];
  let n = 1000;
  for (let m = 1; m <= 12; m++) {
    for (const c of customers) {
      const date = `2026-${String(m).padStart(2, "0")}-${String(3 + Math.floor(rand() * 20)).padStart(2, "0")}`;
      const amount = Math.round((2000 + rand() * 7000) / 10) * 10;
      invoices.push({ no: `INV-${++n}`, customer: c.name, date, amount, pay: addDays(date, c.days + Math.floor(rand() * 6)), credited: 0, received: 0 });
    }
  }
  // Kestrel Stores goes into administration: its September invoices are never paid.
  invoices.push({ no: "INV-1100", customer: "Kestrel Stores", date: "2026-09-05", amount: 3200, credited: 0, received: 0 });
  invoices.push({ no: "INV-1101", customer: "Kestrel Stores", date: "2026-09-20", amount: 2900, credited: 0, received: 0 });
  // Westbay Hotels: one invoice; in the messy client it overpays by 500 (a credit balance at year-end).
  invoices.push({ no: "INV-1102", customer: "Westbay Hotels", date: "2026-10-08", amount: 3000, pay: "2026-11-12", overpay: messy ? 500 : 0, credited: 0, received: 0 });

  for (const inv of invoices.filter((i) => !i.opening)) je(inv.date, `Invoice ${inv.no} - ${inv.customer}`, [{ account: "1100", amount: inv.amount }, { account: "4000", amount: -inv.amount }]);
  // Partial credit notes.
  for (const [no, amt] of [["INV-1003", 280], ["INV-1021", 450], ["INV-1047", 320]]) {
    const inv = invoices.find((i) => i.no === no);
    inv.credited = amt;
    je(addDays(inv.date, 5), `Credit note CN-${no.slice(4)} - ${inv.customer}`, [{ account: "4000", amount: amt }, { account: "1100", amount: -amt }]);
  }
  // Receipts.
  for (const inv of invoices) {
    if (inv.writeOff) {
      je(inv.writeOff, `Write-off ${inv.no} - ${inv.customer}`, [{ account: "1150", amount: inv.amount }, { account: "1100", amount: -inv.amount }]);
      inv.received = inv.amount;
      continue;
    }
    if (!inv.pay || inv.pay > YE) continue;
    const amount = round2(inv.amount - inv.credited + (inv.overpay ?? 0));
    inv.received = amount;
    je(inv.pay, `Receipt ${inv.no} - ${inv.customer}`, [{ account: "1000", amount }, { account: "1100", amount: -amount }]);
  }
  // Messy: an invoice re-booked through suspense (no rule can place it).
  if (messy) {
    invoices.push({ no: "INV-1103", customer: "Orchid Retail", date: "2026-11-18", amount: 1250, credited: 0, received: 0, viaSuspense: true });
    je("2026-11-18", "Re-booked INV-1103 Orchid Retail - cleared from suspense", [{ account: "1100", amount: 1250 }, { account: "2900", amount: -1250 }]);
  }
  // Other activity: cash sales, purchases, payments, overheads, depreciation.
  let lastPurchases = 12000;
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const cashSales = Math.round((1000 + rand() * 2000) / 10) * 10;
    je(`2026-${mm}-28`, `Cash sales ${mm}/2026`, [{ account: "1000", amount: cashSales }, { account: "4000", amount: -cashSales }]);
    const purchases = Math.round((14000 + rand() * 6000) / 10) * 10;
    je(`2026-${mm}-15`, `Purchases ${mm}/2026`, [{ account: "5000", amount: purchases }, { account: "2000", amount: -purchases }]);
    je(`2026-${mm}-10`, `Supplier payments ${mm}/2026`, [{ account: "2000", amount: lastPurchases }, { account: "1000", amount: -lastPurchases }]);
    lastPurchases = purchases;
    je(`2026-${mm}-25`, `Overheads ${mm}/2026`, [{ account: "6000", amount: 7000 }, { account: "1000", amount: -7000 }]);
  }
  je("2026-12-31", "Depreciation 2026", [{ account: "6000", amount: 6000 }, { account: "1500", amount: -6000 }]);

  // Year-end aged listing and provision matrix.
  const open = invoices
    .map((i) => ({ ...i, outstanding: round2(i.amount - i.credited - i.received) }))
    .filter((i) => i.outstanding !== 0)
    .map((i) => ({ customer: i.customer, invoice: i.overpay ? "UNAPPLIED" : i.no, date: i.overpay ? i.pay : i.date, due: i.overpay ? i.pay : addDays(i.date, 30), outstanding: i.outstanding }));
  const kestrel = open.filter((r) => r.customer === "Kestrel Stores");
  const KESTREL = sum(kestrel.map((r) => r.outstanding));
  const matrixRows = open.filter((r) => r.customer !== "Kestrel Stores" && r.outstanding > 0);
  const gross = BUCKETS.map((_, i) => sum(matrixRows.filter((r) => bucketOf(r.due) === i).map((r) => r.outstanding)));
  const kestrelBucket = bucketOf(kestrel[0].due);
  if (messy) gross[kestrelBucket] = round2(gross[kestrelBucket] + KESTREL); // plant: individually assessed customer also in the matrix
  const matrix = BUCKETS.map((b, i) => ({ Bucket: b, Gross: gross[i], Rate: RATES[i], Allowance: round2(gross[i] * RATES[i]) }));
  const allowanceRequired = round2(sum(matrix.map((m) => m.Allowance)) + KESTREL);
  const charge = round2(allowanceRequired - (PY_ALLOWANCE - 1100));
  je(YE, "Year-end loss allowance (provision matrix)", [{ account: "6100", amount: charge }, { account: "1150", amount: -charge }]);

  // Number the entries by date and flatten to journal lines.
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
  const lines = entries.flatMap((e, i) => e.lines.map((l) => ({ entry: `JE${String(i + 1).padStart(4, "0")}`, date: e.date, account: l.account, description: e.description, amount: l.amount })));

  // Trial balances (before closing entries).
  const pyTb = { 1000: 40000, 1100: PY_AR, 1150: -PY_ALLOWANCE, 1200: 30000, 1500: 60000, 2000: -12000, 2900: 0, 3000: -50000, 4000: -380000, 5000: 209000, 6000: 90000, 6100: 1200 };
  pyTb[3100] = -round2(Object.values(pyTb).reduce((s, x) => s + x, 0));
  const pyProfit = -round2([...PNL].reduce((s, a) => s + pyTb[a], 0));
  const cyTb = {};
  for (const a of Object.keys(ACCOUNTS)) cyTb[a] = PNL.has(a) ? 0 : pyTb[a] ?? 0;
  cyTb[3100] = round2(cyTb[3100] - pyProfit);
  for (const l of lines) cyTb[l.account] = round2((cyTb[l.account] ?? 0) + l.amount);

  return { messy, lines, pyTb, cyTb, open, matrix, KESTREL, kestrelBucket, PY_AR, PY_ALLOWANCE, charge, invoices, pyProfit };
}

// ---------------------------------------------------------------------------
// Writers
// ---------------------------------------------------------------------------
const tbSheet = (tb) => [["Account", "Account name", "Line item", "Debit", "Credit"], ...Object.entries(tb).map(([a, b]) => [a, ACCOUNTS[a][0], ACCOUNTS[a][1], b > 0 ? b : null, b < 0 ? -b : null])];
const journalRows = (ls) => [["Entry number", "Date", "Account", "Account name", "Description", "Debit", "Credit"], ...ls.map((l) => [l.entry, l.date, l.account, ACCOUNTS[l.account][0], l.description, l.amount > 0 ? l.amount : null, l.amount < 0 ? -l.amount : null])];

function writeBook(file, sheets) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const wb = XLSX.utils.book_new();
  for (const [name, aoa, edit] of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    if (edit) edit(ws);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, file);
}

function statementTables(tb, pyTbForComparative, years, comparativeFigures) {
  const bal = (accs) => round2(accs.reduce((s, a) => s + (tb[a] ?? 0), 0));
  const profit = -round2([...PNL].reduce((s, a) => s + (tb[a] ?? 0), 0));
  const f = {
    "Property, plant and equipment": bal(["1500"]),
    Inventories: bal(["1200"]),
    "Trade receivables": bal(["1100", "1150"]),
    "Cash and cash equivalents": bal(["1000"]),
    "Share capital": -bal(["3000"]),
    "Retained earnings": round2(-bal(["3100"]) + profit),
    "Trade and other payables": -bal(["2000", "2900"]),
    Revenue: -bal(["4000"]),
    "Cost of sales": -bal(["5000"]),
    "Administrative expenses": -bal(["6000"]),
    "Impairment losses on trade receivables": -bal(["6100"]),
  };
  f["Total assets"] = sum([f["Property, plant and equipment"], f.Inventories, f["Trade receivables"], f["Cash and cash equivalents"]]);
  f["Total equity and liabilities"] = sum([f["Share capital"], f["Retained earnings"], f["Trade and other payables"]]);
  f["Gross profit"] = sum([f.Revenue, f["Cost of sales"]]);
  f["Profit for the year"] = sum([f["Gross profit"], f["Administrative expenses"], f["Impairment losses on trade receivables"]]);
  return f;
}
const SOFP = ["Property, plant and equipment", "Inventories", "Trade receivables", "Cash and cash equivalents", "Total assets", "Share capital", "Retained earnings", "Trade and other payables", "Total equity and liabilities"];
const PL = ["Revenue", "Cost of sales", "Gross profit", "Administrative expenses", "Impairment losses on trade receivables", "Profit for the year"];

async function writeStatements(file, title, years, current, comparative) {
  const fmt = (n) => (n < 0 ? `(${Math.abs(n).toLocaleString("en-GB")})` : n.toLocaleString("en-GB"));
  const cell = (t, right = false, bold = false) => new TableCell({ width: { size: right ? 2000 : 5000, type: WidthType.DXA }, children: [new Paragraph({ alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text: String(t), bold })] })] });
  const table = (captions) => new Table({ rows: [new TableRow({ children: [cell(""), cell(years[0], true, true), cell(years[1], true, true)] }), ...captions.map((c) => new TableRow({ children: [cell(c, false, c.startsWith("Total") || c.includes("profit")), cell(fmt(current[c]), true), cell(fmt(comparative[c]), true)] }))] });
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Statement of financial position as at 31 December ${years[0]}`)] }),
        table(SOFP),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Statement of profit or loss for the year ended 31 December ${years[0]}`)] }),
        table(PL),
      ],
    }],
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, await Packer.toBuffer(doc));
}

async function writeEngagement(variant) {
  const d = build(variant);
  const dir = path.join(out, `harbour-trading-${variant}`);
  fs.rmSync(dir, { recursive: true, force: true });
  const key = { variant, stopRuleFires: d.messy, expectedFlags: [], notes: [] };

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "engagement.md"), `# Engagement\n\n- Client: Harbour Trading Ltd (${variant} sample)\n- Year-end: ${YE}\n- Period start: 2026-01-01\n- Framework: IAS 1\n- Performance materiality: 15000\n- Clearly trivial: 750\n`);

  // Shared files.
  writeBook(path.join(dir, "shared", "prior-year-tb.xlsx"), [["Trial balance", tbSheet(d.pyTb)]]);
  writeBook(path.join(dir, "shared", "current-tb.xlsx"), [["Trial balance", tbSheet(d.cyTb)]]);
  if (d.messy) {
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, "0");
      writeBook(path.join(dir, "shared", "journals", `journals-2026-${mm}.xlsx`), [["Journal lines", journalRows(d.lines.filter((l) => l.date.slice(5, 7) === mm))]]);
    }
  } else {
    writeBook(path.join(dir, "shared", "journals", "journals-2026.xlsx"), [["Journal lines", journalRows(d.lines)]]);
  }
  fs.writeFileSync(path.join(dir, "shared", "account-map.json"), JSON.stringify({ accounts: { 1100: { lineItem: "Trade receivables", component: "gross", confirmed: true }, 1150: { lineItem: "Trade receivables", component: "loss-allowance", confirmed: true } } }, null, 2) + "\n");

  // Statements: last year's audited (2025 vs 2024), the client's (2026 vs 2025).
  const py = statementTables(d.pyTb);
  const py2024 = Object.fromEntries(Object.entries(py).map(([k, v]) => [k, round2(v * 0.92)]));
  await writeStatements(path.join(dir, "shared", "prior-year-statements.docx"), "Harbour Trading Ltd: audited financial statements 2025", ["2025", "2024"], py, py2024);
  const cy = statementTables(d.cyTb);
  const presented = { ...cy };
  if (!d.messy) {
    // Plant (clean): two digits of revenue transposed on the face of the statement; totals are right.
    const s = String(cy.Revenue);
    const typo = Number(s.slice(0, 1) + s[2] + s[1] + s.slice(3));
    presented.Revenue = typo;
    key.expectedFlags.push({ kind: "statement-amount", lineItem: "Revenue", difference: round2(typo - cy.Revenue), why: "Revenue digits transposed on the client's statement of profit or loss" });
  }
  await writeStatements(path.join(dir, "shared", "client-statements.docx"), "Harbour Trading Ltd: financial statements 2026 (client-prepared)", ["2026", "2025"], presented, py);

  // Trade receivables schedule.
  const ar = d.lines.filter((l) => l.account === "1100" || l.account === "1150");
  let schedLines = ar;
  const cls = (l) => {
    if (l.account === "1150") return l.description.startsWith("Write-off") ? "wou" : "charge";
    if (l.description.startsWith("Invoice") || l.description.startsWith("Re-booked")) return "sale";
    if (l.description.startsWith("Receipt")) return "receipt";
    if (l.description.startsWith("Credit note")) return "cn";
    if (l.description.startsWith("Write-off")) return "wo";
    return "other";
  };
  let omitted = null;
  if (d.messy) {
    // Plant (messy): a Harbour Foods receipt is missing from the schedule's journal lines.
    omitted = ar.find((l) => l.description.startsWith("Receipt") && l.description.includes("Harbour Foods") && l.date >= "2026-09-01");
    schedLines = ar.filter((l) => l !== omitted);
  }
  const total = (c) => sum(schedLines.filter((l) => cls(l) === c).map((l) => Math.abs(l.amount)));
  const openingTyped = d.messy ? d.PY_AR + 90 : d.PY_AR; // plant (messy): opening typed with two digits transposed (26,000 → 26,090)
  const grossRf = [["Movement", "Amount"], ["Opening balance", openingTyped], ["Credit sales", total("sale")], ["Cash receipts", round2(total("receipt"))], ["Credit notes", total("cn")], ["Write-offs", total("wo")], ["Foreign exchange", 0], ["Reclassifications", 0], ["Closing balance", null]];
  const allowRf = [["Movement", "Amount"], ["Opening balance", d.PY_ALLOWANCE], ["Impairment charge", total("charge")], ["Reversals", 0], ["Write-offs used", total("wou")], ["Foreign exchange", 0], ["Closing balance", null]];
  const grossClose = round2(openingTyped + total("sale") - total("receipt") - total("cn") - total("wo"));
  const allowClose = round2(d.PY_ALLOWANCE + total("charge") - total("wou"));
  writeBook(path.join(dir, "revenue", "trade-receivables", "schedule.xlsx"), [
    ["Journal lines", journalRows(schedLines)],
    ["Rollforward", grossRf, (ws) => (ws.B9 = { t: "n", v: grossClose, f: "B2+B3-B4-B5-B6+B7+B8" })],
    ["Allowance rollforward", allowRf, (ws) => (ws.B7 = { t: "n", v: allowClose, f: "B2+B3-B4-B5+B6" })],
  ]);

  // Aged listing.
  let listing = d.open.map((r) => ({ ...r, bucket: BUCKETS[bucketOf(r.due)] }));
  let misaged = null;
  if (d.messy) {
    // Plant (messy): one invoice placed a bucket too young.
    misaged = listing.find((r) => bucketOf(r.due) === 1 && r.customer !== "Kestrel Stores" && r.outstanding > 0);
    if (misaged) misaged.bucket = BUCKETS[0];
  }
  writeBook(path.join(dir, "revenue", "trade-receivables", "aged-listing.xlsx"), [["Aged listing", [["Customer", "Invoice number", "Invoice date", "Due date", "Outstanding", "Bucket"], ...listing.map((r) => [r.customer, r.invoice, r.date, r.due, r.outstanding, r.bucket])]]]);

  // Provision matrix.
  writeBook(path.join(dir, "revenue", "trade-receivables", "provision-matrix.xlsx"), [
    ["Provision matrix", [["Bucket", "Gross", "Rate", "Allowance"], ...d.matrix.map((m) => [m.Bucket, m.Gross, m.Rate, m.Allowance])]],
    ["Individually assessed", [["Customer", "Gross", "Allowance"], ["Kestrel Stores", d.KESTREL, d.KESTREL]]],
  ]);

  // Revenue schedule.
  const rev = d.lines.filter((l) => l.account === "4000");
  const revOf = (pred) => sum(rev.filter(pred).map((l) => -l.amount));
  const creditSales = revOf((l) => l.description.startsWith("Invoice"));
  const cashSales = revOf((l) => l.description.startsWith("Cash sales"));
  const creditNotes = -revOf((l) => l.description.startsWith("Credit note"));
  writeBook(path.join(dir, "revenue", "revenue", "schedule.xlsx"), [
    ["Journal lines", journalRows(rev)],
    ["Rollforward", [["Movement", "Amount"], ["Opening balance", 0], ["Credit sales", creditSales], ["Cash sales", cashSales], ["Credit notes", creditNotes], ["Other", 0], ["Closing balance", null]], (ws) => (ws.B7 = { t: "n", v: round2(creditSales + cashSales - creditNotes), f: "B2+B3+B4-B5+B6" })],
  ]);

  if (d.messy) {
    const R = Math.abs(omitted.amount);
    const rate = RATES[d.kestrelBucket];
    key.expectedFlags.push(
      { kind: "opening-balance", lineItem: "Trade receivables", movement: "Gross trade receivables", difference: 90, why: "Opening typed 26,090 instead of the audited 26,000 (transposition)" },
      { kind: "schedule-movement", lineItem: "Trade receivables", movement: "Gross trade receivables: Cash receipts", difference: -R, why: `Receipt ${omitted.entry} (${omitted.description}) missing from the schedule` },
      { kind: "schedule-movement", lineItem: "Trade receivables", movement: "Gross trade receivables: Credit sales", difference: 1250, why: "Client counted the suspense re-booking as a credit sale; the tool leaves it unclassified until confirmed" },
      { kind: "unclassified-lines", lineItem: "Trade receivables", movement: "Gross trade receivables", difference: 1250, why: "Dr receivables / Cr suspense: no rule places it" },
      { kind: "rebuilt-vs-schedule", lineItem: "Trade receivables", movement: "Gross trade receivables", difference: round2(90 + R), why: "Opening typo + missing receipt" },
      { kind: "schedule-vs-tb", lineItem: "Trade receivables", movement: "Gross trade receivables", difference: round2(90 + R), why: "Opening typo + missing receipt" },
      { kind: "credit-balances", lineItem: "Trade receivables", difference: -500, why: "Westbay Hotels overpaid by 500" },
      { kind: "matrix-bucket-gross", lineItem: "Trade receivables", movement: BUCKETS[d.kestrelBucket], difference: d.KESTREL, why: "Kestrel Stores (individually assessed) also counted in the matrix" },
      { kind: "allowance-vs-matrix", lineItem: "Trade receivables", movement: "Loss allowance", difference: round2(d.KESTREL * rate), why: "Allowance double counts Kestrel Stores at the bucket rate" },
    );
    if (misaged) key.expectedFlags.push({ kind: "ageing-accuracy", lineItem: "Trade receivables", difference: misaged.outstanding, why: `${misaged.invoice} labelled "${BUCKETS[0]}" but is ${BUCKETS[1]}` });
    key.expectedPending = [{ entryDescription: "Re-booked INV-1103 Orchid Retail - cleared from suspense", amount: 1250, sensibleCategory: "credit-sale (once the auditor confirms the original invoice) or reclassification" }];
    key.notes.push("The stop rule fires, so the client-prepared statements are not examined.");
  } else {
    key.notes.push("Every check before the statements agrees; the statements are examined and only Revenue differs.");
  }
  fs.writeFileSync(path.join(out, `harbour-trading-${variant}.answer-key.json`), JSON.stringify(key, null, 2) + "\n");
  return dir;
}

for (const v of ["clean", "messy"]) console.log(`Wrote ${path.relative(process.cwd(), await writeEngagement(v))}`);
