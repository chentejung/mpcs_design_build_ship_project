#!/usr/bin/env node
// Usage: node cross-cycle.mjs <engagement-folder> <run-id>
//
// Checks that span cycles or cover what no cycle examined in depth:
// - every journal entry balances;
// - shallow check for each line item no cycle examined this run:
//   last year's audited closing + the year's journal lines = the client's TB;
// - AR receipts against the cash side of the same entries (revenue cycle ↔ cash).
// Run after every cycle agent has written its results. Writes runs/<run-id>/work/cross-cycle.json.
import fs from "node:fs";
import path from "node:path";
import { fail, loadManifests, makeFlag, readEngagement, readJson, round2, sum, writeJson } from "./lib/common.mjs";
import { balanceOf, groupByEntry, readJournals, readStatements, readTb, resolveAccounts } from "./lib/ledger.mjs";
import { profitLineItems } from "./lib/statements.mjs";

const [eng, runId] = process.argv.slice(2);
if (!eng || !runId) fail("Usage: node cross-cycle.mjs <engagement-folder> <run-id>");
const engDir = path.resolve(eng);
const { settings, problems } = readEngagement(engDir);
if (problems.length) fail(`engagement.md: ${problems.join(" ")}`);
const manifests = loadManifests();
const workDir = path.join(engDir, "runs", runId, "work");
const shared = path.join(engDir, "shared");

const pyTb = readTb(path.join(shared, "prior-year-tb.xlsx"));
const cyTb = readTb(path.join(shared, "current-tb.xlsx"));
const journals = readJournals(engDir);
const { accounts } = resolveAccounts(engDir, [cyTb, pyTb], manifests);
const byEntry = groupByEntry(journals);
const flags = [];
const notes = [];
const flag = (f) => {
  const x = makeFlag(f, settings);
  if (x) flags.push(x);
};

// Every entry must balance.
for (const [entryNo, ls] of byEntry) {
  const debits = sum(ls.filter((l) => l.amount > 0).map((l) => l.amount));
  const credits = round2(-sum(ls.filter((l) => l.amount < 0).map((l) => l.amount)));
  flag({ stage: "schedules", kind: "unbalanced-entry", keySuffix: entryNo, description: `Journal entry ${entryNo} does not balance: debits ${debits}, credits ${credits}.`, expected: debits, actual: credits, assertion: "Accuracy", reference: "ISA 500", sources: ls.map((l) => ({ file: l.file, sheet: "Journal lines", row: l.row, entry: entryNo })) });
}

// Which line items a cycle examined in depth this run.
const deep = new Set();
for (const c of manifests.cycles) {
  if (fs.existsSync(path.join(workDir, `${c.id}.json`))) c.lineItems.forEach((li) => deep.add(li.name));
}

// Profit or loss line items start the year at nil; retained earnings opens at last year's
// balance plus last year's profit (both TBs are before closing entries).
const lineItems = new Set([...accounts.values()].map((a) => a.lineItem).filter(Boolean));
let profitItems = null;
try {
  const year = Number(settings.yearEnd.slice(0, 4));
  const py = await readStatements(path.join(shared, "prior-year-statements.docx"), { current: year - 1, comparative: year - 2 });
  profitItems = profitLineItems(py, lineItems);
} catch (e) {
  notes.push(`Could not read last year's statements to tell profit-or-loss line items apart (${e.message}); shallow checks were skipped.`);
}

const shallow = [];
if (profitItems) {
  const accountsOf = (li) => new Set([...accounts.values()].filter((a) => a.lineItem === li).map((a) => a.account));
  const isProfit = (li) => profitItems.has(li);
  const pyProfit = -round2([...lineItems].filter(isProfit).reduce((s, li) => s + balanceOf(pyTb, accountsOf(li)), 0));
  for (const li of [...lineItems].sort()) {
    if (deep.has(li)) continue;
    const accs = accountsOf(li);
    let opening = isProfit(li) ? 0 : balanceOf(pyTb, accs);
    if (li.trim().toLowerCase() === "retained earnings") opening = round2(opening - pyProfit);
    const movements = sum(journals.filter((l) => accs.has(l.account)).map((l) => l.amount));
    const expected = round2(opening + movements);
    const actual = balanceOf(cyTb, accs);
    shallow.push({ lineItem: li, accounts: [...accs], opening, movements, rebuiltClosing: expected, tbClosing: actual, difference: round2(actual - expected) });
    flag({ stage: "tb-and-cross-checks", kind: "shallow-rebuilt-vs-tb", lineItem: li, description: `${li} on the trial balance does not equal last year's audited closing plus the year's journal lines.`, expected, actual, assertion: "Completeness and accuracy", reference: "ISA 500; ISA 510", sources: [{ file: "shared/current-tb.xlsx" }, { file: "shared/prior-year-tb.xlsx" }, { file: "shared/journals/" }] });
  }
}

// AR receipts (revenue cycle) against the cash side of the same entries.
const revenue = readJson(path.join(workDir, "revenue.json"), null);
if (revenue) {
  const cash = new Set(revenue.accounts.cash);
  const receipts = revenue.classifications.filter((c) => c.component === "gross" && c.category === "receipt");
  const arSide = round2(-sum(receipts.map((c) => c.line.amount)));
  const entries = new Set(receipts.map((c) => c.line.entry));
  const cashSide = sum([...entries].flatMap((e) => (byEntry.get(e) ?? []).filter((l) => cash.has(l.account)).map((l) => l.amount)));
  flag({ stage: "tb-and-cross-checks", kind: "cross-check-cash-receipts", lineItem: "Trade receivables", movement: "Cash receipts", description: "Cash receipts credited to trade receivables do not agree with the cash debited in the same entries.", expected: cashSide, actual: arSide, assertion: "Existence and accuracy", reference: "ISA 500", sources: [{ file: "shared/journals/" }] });
} else {
  notes.push("The revenue cycle did not run, so the cash receipts cross-check was not performed.");
}

writeJson(path.join(workDir, "cross-cycle.json"), { runId, computedAt: new Date().toISOString(), flags, shallow, deepLineItems: [...deep], notes });
console.log(JSON.stringify({ flags: flags.length, shallowChecks: shallow.length, notes }, null, 2));
