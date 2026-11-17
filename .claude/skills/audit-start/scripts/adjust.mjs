#!/usr/bin/env node
// Usage:
//   node adjust.mjs add <engagement-folder> <adjustments.json>
//       Appends proposed adjustments the auditor has confirmed to adjustments.xlsx. The JSON is
//       [{ "adjustment": "ADJ-1", "flag": "<flag key>", "description": "...",
//          "lines": [{ "account": "1100", "debit": 0, "credit": 4315 }, ...] }]
//   node adjust.mjs apply <engagement-folder> <run-id>
//       Applies every proposed adjustment to the client-prepared statements, plus a presentation
//       correction for each statement-amount flag of that run the auditor accepted in
//       dispositions.json (a figure typed wrongly on the statement, which no journal entry fixes),
//       and writes adjusted-statements.xlsx and .docx into the run folder.
import fs from "node:fs";
import path from "node:path";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { fail, loadManifests, readEngagement, readJson, round2, same, sum } from "./lib/common.mjs";
import { XLSX, parseAmount, readTable } from "./lib/excel.mjs";
import { balanceOf, readStatements, readTb, resolveAccounts } from "./lib/ledger.mjs";
import { captionPlan, profitLineItems, rebuildFigures, totalCompositions } from "./lib/statements.mjs";

const [cmd, eng, arg] = process.argv.slice(2);
if (!cmd || !eng || !arg) fail("Usage: node adjust.mjs add <engagement-folder> <adjustments.json> | apply <engagement-folder> <run-id>");
const engDir = path.resolve(eng);
const { settings, problems } = readEngagement(engDir);
if (problems.length) fail(`engagement.md: ${problems.join(" ")}`);
const manifests = loadManifests();
const shared = path.join(engDir, "shared");
const pyTb = readTb(path.join(shared, "prior-year-tb.xlsx"));
const cyTb = readTb(path.join(shared, "current-tb.xlsx"));
const { accounts } = resolveAccounts(engDir, [cyTb, pyTb], manifests);
const ADJ_FILE = path.join(engDir, "adjustments.xlsx");
const COLUMNS = ["Adjustment", "Flag", "Account", "Account name", "Debit", "Credit", "Description"];

function readAdjustments() {
  if (!fs.existsSync(ADJ_FILE)) return [];
  return readTable(ADJ_FILE, { name: "Adjustments", columns: COLUMNS }).rows.map(({ values }) => ({
    adjustment: String(values.Adjustment ?? "").trim(),
    flag: String(values.Flag ?? "").trim(),
    account: String(values.Account ?? "").trim(),
    accountName: String(values["Account name"] ?? ""),
    amount: round2((parseAmount(values.Debit) ?? 0) - (parseAmount(values.Credit) ?? 0)),
    description: String(values.Description ?? ""),
  }));
}

function validate(rows) {
  const errors = [];
  const byAdj = new Map();
  for (const r of rows) {
    if (!accounts.has(r.account)) errors.push(`${r.adjustment}: account ${r.account} is not in the trial balance.`);
    byAdj.set(r.adjustment, round2((byAdj.get(r.adjustment) ?? 0) + r.amount));
  }
  for (const [adj, net] of byAdj) if (!same(net, 0)) errors.push(`${adj} does not balance (debits − credits = ${net}).`);
  return errors;
}

if (cmd === "add") {
  const incoming = JSON.parse(fs.readFileSync(path.resolve(arg), "utf8"));
  const existing = readAdjustments();
  const taken = new Set(existing.map((r) => r.adjustment));
  const rows = incoming.flatMap((a) => {
    if (taken.has(a.adjustment)) fail(`${a.adjustment} already exists in adjustments.xlsx.`);
    return a.lines.map((l) => ({ adjustment: a.adjustment, flag: a.flag ?? "", account: String(l.account), accountName: accounts.get(String(l.account))?.name ?? "", amount: round2((l.debit ?? 0) - (l.credit ?? 0)), description: a.description ?? "" }));
  });
  const errors = validate(rows);
  if (errors.length) fail(errors.join("\n"));
  const all = [...existing, ...rows];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(all.map((r) => ({ Adjustment: r.adjustment, Flag: r.flag, Account: r.account, "Account name": r.accountName, Debit: r.amount > 0 ? r.amount : null, Credit: r.amount < 0 ? -r.amount : null, Description: r.description })), { header: COLUMNS }), "Adjustments");
  XLSX.writeFile(wb, ADJ_FILE);
  console.log(`Added ${incoming.length} adjustment(s); adjustments.xlsx now holds ${new Set(all.map((r) => r.adjustment)).size}.`);
} else if (cmd === "apply") {
  const runDir = path.join(engDir, "runs", arg);
  if (!fs.existsSync(path.join(runDir, "run.json"))) fail(`Run ${arg} is not complete.`);
  const adjustments = readAdjustments();
  const run = readJson(path.join(runDir, "run.json"));
  const dispositions = readJson(path.join(engDir, "dispositions.json"), {});
  const corrections = Object.fromEntries(run.flags.filter((f) => f.kind === "statement-amount" && dispositions[f.key]?.decision === "accepted").map((f) => [f.lineItem, round2(f.expected - f.actual)]));
  if (!adjustments.length && !Object.keys(corrections).length) fail("There are no proposed adjustments in adjustments.xlsx and no accepted statement-amount flags for this run.");
  const errors = validate(adjustments);
  if (errors.length) fail(errors.join("\n"));

  const year = Number(settings.yearEnd.slice(0, 4));
  const client = await readStatements(path.join(shared, "client-statements.docx"), { current: year, comparative: year - 1 });
  const lineItems = new Set([...accounts.values()].map((a) => a.lineItem).filter(Boolean));
  const accs = (li) => new Set([...accounts.values()].filter((a) => a.lineItem === li).map((a) => a.account));
  const base = (li) => balanceOf(cyTb, accs(li));
  const adjusted = (li) => round2(base(li) + sum(adjustments.filter((r) => accs(li).has(r.account)).map((r) => r.amount)));
  const plan = captionPlan(client, lineItems, (li) => balanceOf(pyTb, accs(li)), base);
  const profit = profitLineItems(client, lineItems);
  const comps = totalCompositions(client, plan, rebuildFigures(client, plan, {}, base, profit));
  const before = rebuildFigures(client, plan, comps, base, profit);
  const after = rebuildFigures(client, plan, comps, adjusted, profit);

  const tables = {};
  const unexplained = [];
  for (const [name, rows] of Object.entries(client)) {
    tables[name] = rows.map((r) => {
      const effect = before[r.caption] == null || after[r.caption] == null ? null : round2(after[r.caption] - before[r.caption]);
      if (effect == null) unexplained.push(r.caption);
      const correction = corrections[r.caption] ?? 0;
      return { caption: r.caption, clientPrepared: r.current, adjustments: effect ?? 0, correction, adjusted: round2((r.current ?? 0) + (effect ?? 0) + correction), comparative: r.comparative };
    });
  }

  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(tables)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.map((r) => ({ Caption: r.caption, "Client-prepared": r.clientPrepared, "Proposed adjustments": r.adjustments, "Presentation corrections": r.correction, Adjusted: r.adjusted, [`${year - 1} (comparative)`]: r.comparative }))), name.slice(0, 31));
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(adjustments.map((r) => ({ Adjustment: r.adjustment, Flag: r.flag, Account: r.account, "Account name": r.accountName, Debit: r.amount > 0 ? r.amount : null, Credit: r.amount < 0 ? -r.amount : null, Description: r.description }))), "Proposed adjustments");
  XLSX.writeFile(wb, path.join(runDir, "adjusted-statements.xlsx"));

  const fmt = (n) => (n == null ? "" : n < 0 ? `(${Math.abs(n).toLocaleString("en-GB")})` : n.toLocaleString("en-GB"));
  const cell = (t, bold = false, right = false) => new TableCell({ width: { size: right ? 1800 : 4200, type: WidthType.DXA }, children: [new Paragraph({ alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text: String(t), bold })] })] });
  const children = [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(`${settings.client}: adjusted statements`)] }), new Paragraph(`Year ended ${settings.yearEnd}. The client-prepared statements with the proposed adjustments applied, for the client to review and adopt as its own.`)];
  for (const [name, rows] of Object.entries(tables)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(name)] }));
    children.push(new Table({ rows: [new TableRow({ children: [cell("", true), cell("Client-prepared", true, true), cell("Adjustments", true, true), cell("Corrections", true, true), cell(String(year), true, true), cell(String(year - 1), true, true)] }), ...rows.map((r) => new TableRow({ children: [cell(r.caption), cell(fmt(r.clientPrepared), false, true), cell(r.adjustments ? fmt(r.adjustments) : "", false, true), cell(r.correction ? fmt(r.correction) : "", false, true), cell(fmt(r.adjusted), true, true), cell(fmt(r.comparative), false, true)] }))] }));
  }
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Proposed adjustments")] }));
  for (const adj of new Set(adjustments.map((r) => r.adjustment))) {
    const ls = adjustments.filter((r) => r.adjustment === adj);
    children.push(new Paragraph({ children: [new TextRun({ text: `${adj}: ${ls[0].description}`, bold: true })] }));
    for (const l of ls) children.push(new Paragraph(`${l.amount > 0 ? "Dr" : "    Cr"} ${l.account} ${l.accountName}  ${fmt(Math.abs(l.amount))}`));
  }
  fs.writeFileSync(path.join(runDir, "adjusted-statements.docx"), await Packer.toBuffer(new Document({ sections: [{ children }] })));
  console.log(JSON.stringify({ adjustments: new Set(adjustments.map((r) => r.adjustment)).size, presentationCorrections: corrections, outputs: ["adjusted-statements.xlsx", "adjusted-statements.docx"].map((f) => path.relative(process.cwd(), path.join(runDir, f))), totalsNotRecalculated: unexplained }, null, 2));
} else {
  fail(`Unknown command "${cmd}".`);
}
