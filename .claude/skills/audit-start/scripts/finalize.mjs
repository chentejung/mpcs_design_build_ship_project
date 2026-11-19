#!/usr/bin/env node
// Usage: node finalize.mjs <engagement-folder> <run-id>
//
// Completes a run: gathers every cycle's and the cross-cycle results, attaches the agents'
// narratives and the auditor's earlier decisions, applies the stop rule, compares the
// client-prepared statements with the rebuilt statements when nothing stops the run, and writes
// flags.md, workpapers.xlsx and run.json. Once run.json exists the run is never edited.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { RANK_ORDER, STOP_RULE_STAGES, fail, loadManifests, makeFlag, readEngagement, readJson, round2, sortFlags, writeJson } from "./lib/common.mjs";
import { XLSX } from "./lib/excel.mjs";
import { balanceOf, readStatements, readTb, resolveAccounts } from "./lib/ledger.mjs";
import { captionPlan, profitLineItems, rebuildFigures, totalCompositions } from "./lib/statements.mjs";

const [eng, runId] = process.argv.slice(2);
if (!eng || !runId) fail("Usage: node finalize.mjs <engagement-folder> <run-id>");
const engDir = path.resolve(eng);
const runDir = path.join(engDir, "runs", runId);
const workDir = path.join(runDir, "work");
if (fs.existsSync(path.join(runDir, "run.json"))) fail(`Run ${runId} is already complete; start a new run.`);
const { settings, problems } = readEngagement(engDir);
if (problems.length) fail(`engagement.md: ${problems.join(" ")}`);
const manifests = loadManifests();
const here = path.dirname(fileURLToPath(import.meta.url));
const scan = JSON.parse(execFileSync(process.execPath, [path.join(here, "scan.mjs"), engDir], { encoding: "utf8" }));

// ---------------------------------------------------------------------------
// Gather results
// ---------------------------------------------------------------------------
const cycleResults = {};
const cycles = {};
for (const c of manifests.cycles) {
  const r = readJson(path.join(workDir, `${c.id}.json`), null);
  const s = scan.cycles.find((x) => x.id === c.id);
  if (r) cycleResults[c.id] = r;
  cycles[c.id] = { status: r ? (r.runId === runId ? "ran" : `reused from ${r.runId}`) : s.status, inputsHash: s.inputsHash, missing: s.missing, columnProblems: s.columnProblems };
}
const cross = readJson(path.join(workDir, "cross-cycle.json"), { flags: [], shallow: [], notes: ["Cross-cycle checks were not run."] });
const narratives = Object.assign({}, ...manifests.cycles.map((c) => readJson(path.join(workDir, `${c.id}-narratives.json`), {})), readJson(path.join(workDir, "orchestrator-narratives.json"), {}));
const dispositions = readJson(path.join(engDir, "dispositions.json"), {});

let flags = [...cross.flags, ...Object.values(cycleResults).flatMap((r) => r.flags)];
const stopping = flags.filter((f) => STOP_RULE_STAGES.includes(f.stage) && Math.abs(f.difference) > settings.clearlyTrivial);
const stopped = stopping.length > 0;

// ---------------------------------------------------------------------------
// Client-prepared statements against rebuilt statements
// ---------------------------------------------------------------------------
const notExamined = ["Statement of cash flows", "Statement of changes in equity", "Notes"];
let statementsTable = null;
if (stopped) {
  notExamined.unshift("Statement of financial position", "Statement of profit or loss");
} else {
  try {
    const year = Number(settings.yearEnd.slice(0, 4));
    const shared = path.join(engDir, "shared");
    const py = await readStatements(path.join(shared, "prior-year-statements.docx"), { current: year - 1, comparative: year - 2 });
    const client = await readStatements(path.join(shared, "client-statements.docx"), { current: year, comparative: year - 1 });
    const pyTb = readTb(path.join(shared, "prior-year-tb.xlsx"));
    const cyTb = readTb(path.join(shared, "current-tb.xlsx"));
    const { accounts } = resolveAccounts(engDir, [cyTb, pyTb], manifests);
    const lineItems = new Set([...accounts.values()].map((a) => a.lineItem).filter(Boolean));
    const accs = (li) => new Set([...accounts.values()].filter((a) => a.lineItem === li).map((a) => a.account));
    const overrides = {};
    const rev = cycleResults.revenue;
    if (rev?.net) overrides["Trade receivables"] = rev.net.rebuilt;
    const cyBal = (li) => overrides[li] ?? balanceOf(cyTb, accs(li));
    const pyBal = (li) => balanceOf(pyTb, accs(li));
    const plan = captionPlan(client, lineItems, pyBal, cyBal);
    const profitItems = profitLineItems(client, lineItems);
    const comps = totalCompositions(client, plan, rebuildFigures(client, plan, {}, cyBal, profitItems));
    const rebuilt = rebuildFigures(client, plan, comps, cyBal, profitItems);
    statementsTable = [];
    for (const [name, rows] of Object.entries(client)) {
      for (const r of rows) {
        const audited = py[name]?.find((x) => x.caption.toLowerCase() === r.caption.toLowerCase())?.current ?? null;
        const expected = rebuilt[r.caption];
        statementsTable.push({ statement: name, caption: r.caption, presented: r.current, rebuilt: expected, comparative: r.comparative, auditedPriorYear: audited });
        const source = [{ file: "shared/client-statements.docx", caption: `${name}: ${r.caption}` }];
        if (expected == null) {
          notExamined.push(`${name}: ${r.caption} (total whose components could not be identified)`);
        } else {
          const f = makeFlag({ stage: "statements", kind: "statement-amount", lineItem: r.caption, description: `${r.caption} on the ${name.toLowerCase()} does not agree with the rebuilt figure.`, expected, actual: r.current ?? 0, assertion: "Presentation and accuracy", reference: settings.framework?.toUpperCase().includes("18") ? "IFRS 18" : "IAS 1", sources: source, restsOnUnconfirmed: r.caption === "Trade receivables" && (rev?.pending?.length ?? 0) > 0 }, settings, 1);
          if (f) flags.push(f);
        }
        if (audited != null) {
          const f = makeFlag({ stage: "statements", kind: "statement-comparative", lineItem: r.caption, description: `${r.caption} comparative on the ${name.toLowerCase()} does not agree with last year's audited statements.`, expected: audited, actual: r.comparative ?? 0, assertion: "Presentation (comparatives)", reference: "ISA 710", sources: source }, settings, 1);
          if (f) flags.push(f);
        }
      }
    }
  } catch (e) {
    notExamined.unshift("Statement of financial position", "Statement of profit or loss");
    cross.notes.push(`Statements were not examined: ${e.message}`);
  }
}

flags = sortFlags(flags).map((f) => ({ ...f, narrative: narratives[f.key] ?? null, previousDecision: dispositions[f.key] ?? null }));

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------
const coverage = [];
for (const c of manifests.cycles) for (const li of c.lineItems) coverage.push({ lineItem: li.name, depth: cycleResults[c.id] ? "deep" : "not examined", cycle: c.name });
for (const s of cross.shallow) coverage.push({ lineItem: s.lineItem, depth: "shallow", cycle: "—" });

// ---------------------------------------------------------------------------
// flags.md
// ---------------------------------------------------------------------------
const money = (n) => (n == null ? "—" : n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
const srcText = (s) => [s.file, s.sheet, s.row ? `row ${s.row}` : null, s.entry ? `entry ${s.entry}` : null, s.caption].filter(Boolean).join(", ");
const md = [];
md.push(`# Examination run ${runId}`);
md.push("");
md.push(`**${settings.client}**, year ended ${settings.yearEnd} · ${settings.framework} · performance materiality ${money(settings.performanceMateriality)} · clearly trivial ${money(settings.clearlyTrivial)}`);
md.push("");
md.push(stopped ? `**Outcome: stopped.** ${stopping.length} difference(s) above clearly trivial in opening balances, schedules, the TB or cross-checks, so the client-prepared statements were not examined (stop rule).` : "**Outcome: finished.** No difference above clearly trivial before the statements, so the client-prepared statements were examined.");
md.push("");
const groups = { "above-performance-materiality": "Above performance materiality", "between-thresholds": "Between clearly trivial and performance materiality", "clearly-trivial": "Clearly trivial" };
let n = 0;
for (const r of RANK_ORDER) {
  const fs_ = flags.filter((f) => f.ranking === r);
  md.push(`## ${groups[r]} (${fs_.length})`);
  md.push("");
  if (!fs_.length) md.push("None.", "");
  for (const f of fs_) {
    n += 1;
    md.push(`### ${n}. ${f.lineItem ?? "Journals"}${f.movement ? ` — ${f.movement}` : ""}: ${f.kind}`);
    md.push("");
    md.push(f.description);
    md.push("");
    md.push(`- Expected ${money(f.expected)} · actual ${money(f.actual)} · **difference ${money(f.difference)}**`);
    md.push(`- Stage: ${f.stage} · assertion: ${f.assertion ?? "—"} · reference: ${f.reference ?? "—"}`);
    if (f.restsOnUnconfirmed) md.push("- Rests on journal lines still awaiting the auditor's classification.");
    if (f.narrative) md.push(`- Explanation: ${f.narrative}`);
    else if (f.candidates?.length) md.push(`- Possible explanations (script): ${f.candidates.map((c) => `${c.test}${c.matched ? " ✓" : ""}${c.amount != null ? ` (${money(c.amount)})` : ""}${c.lines?.length ? ` — ${c.lines.map((l) => l.entry).join(", ")}` : ""}`).join("; ")}`);
    if (f.previousDecision) md.push(`- Earlier decision: ${f.previousDecision.decision}${f.previousDecision.reason ? ` — ${f.previousDecision.reason}` : ""}${f.previousDecision.adjustment ? ` (${f.previousDecision.adjustment})` : ""}`);
    md.push(`- Sources: ${f.sources.slice(0, 6).map(srcText).join("; ")}${f.sources.length > 6 ? ` (+${f.sources.length - 6} more)` : ""}`);
    md.push(`- Flag key: \`${f.key}\``);
    md.push("");
  }
}
const reviews = manifests.cycles.flatMap((c) => (readJson(path.join(workDir, `${c.id}-review.json`), { items: [] }).items ?? []).map((i) => ({ cycle: c.name, ...i })));
md.push("## Judgments by the cycle agents");
md.push("");
if (!reviews.length) md.push("None recorded.");
for (const r of reviews) md.push(`- **${r.topic}** (${r.cycle}${r.lineItem ? `, ${r.lineItem}` : ""}): ${r.conclusion}${r.concern ? " — **needs the auditor's attention**" : ""}`);
md.push("");
const pendingAll = Object.values(cycleResults).flatMap((r) => r.pending ?? []);
const info = Object.values(cycleResults).flatMap((r) => r.infoNeeded ?? []);
md.push("## Awaiting the auditor");
md.push("");
md.push(pendingAll.length ? `${pendingAll.length} journal line(s) await classification (they sit in "Unclassified").` : "No journal lines await classification.");
for (const i of info) md.push(`- Information needed: ${i}`);
md.push("");
md.push("## Coverage");
md.push("");
md.push("| Line item | Depth |", "|---|---|");
for (const c of coverage) md.push(`| ${c.lineItem} | ${c.depth} |`);
md.push("");
md.push(`Not examined: ${notExamined.join("; ")}.`);
for (const c of Object.entries(cycles).filter(([, v]) => v.status === "missing-files" || v.status === "column-problems")) md.push(`- ${c[0]} cycle not run (${c[1].status}): ${[...c[1].missing, ...c[1].columnProblems].join("; ")}`);
for (const note of cross.notes) md.push(`- ${note}`);
md.push("");
fs.writeFileSync(path.join(runDir, "flags.md"), md.join("\n"));

// ---------------------------------------------------------------------------
// workpapers.xlsx
// ---------------------------------------------------------------------------
const wb = XLSX.utils.book_new();
const add = (name, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ "": "None" }]), name);
add("Summary", [
  { Item: "Client", Value: settings.client },
  { Item: "Year-end", Value: settings.yearEnd },
  { Item: "Framework", Value: settings.framework },
  { Item: "Performance materiality", Value: settings.performanceMateriality },
  { Item: "Clearly trivial", Value: settings.clearlyTrivial },
  { Item: "Outcome", Value: stopped ? "Stopped (stop rule)" : "Finished" },
  { Item: "Flags", Value: flags.length },
  ...Object.entries(cycles).map(([id, c]) => ({ Item: `Cycle: ${id}`, Value: c.status })),
]);
add("Flags", flags.map((f, i) => ({ "#": i + 1, Ranking: f.ranking, Stage: f.stage, "Line item": f.lineItem ?? "", Movement: f.movement ?? "", Kind: f.kind, Description: f.description, Expected: f.expected, Actual: f.actual, Difference: f.difference, Assertion: f.assertion ?? "", Reference: f.reference ?? "", Explanation: f.narrative ?? f.candidates.filter((c) => c.matched).map((c) => c.test).join(", "), "Rests on unconfirmed": f.restsOnUnconfirmed ? "yes" : "", "Earlier decision": f.previousDecision?.decision ?? "", Key: f.key })));
try {
  const shared = path.join(engDir, "shared");
  const pyTb = readTb(path.join(shared, "prior-year-tb.xlsx"));
  const cyTb = readTb(path.join(shared, "current-tb.xlsx"));
  const { accounts } = resolveAccounts(engDir, [cyTb, pyTb], manifests);
  add("Lead schedules", [...accounts.values()].sort((a, b) => (a.lineItem ?? "").localeCompare(b.lineItem ?? "") || a.account.localeCompare(b.account)).map((a) => {
    const py = pyTb.find((r) => r.account === a.account)?.balance ?? 0;
    const cy = cyTb.find((r) => r.account === a.account)?.balance ?? 0;
    return { "Line item": a.lineItem ?? "", Component: a.component ?? "", Account: a.account, "Account name": a.name, "Prior year (audited)": py, "Current year": cy, Change: round2(cy - py) };
  }));
} catch {
  /* lead schedules need both TBs */
}
const rfRows = [];
for (const r of Object.values(cycleResults)) {
  for (const rf of Object.values(r.rollforwards ?? {})) {
    if (!rf) continue;
    for (const row of rf.rows) rfRows.push({ Rollforward: rf.title, Movement: row.label, Rebuilt: row.rebuilt, Schedule: row.schedule, Difference: row.schedule == null ? null : round2(row.schedule - row.rebuilt) });
    rfRows.push({ Rollforward: rf.title, Movement: "Closing per trial balance", Rebuilt: rf.closingTb });
    if (rf.closingListing != null) rfRows.push({ Rollforward: rf.title, Movement: "Closing per aged listing", Rebuilt: rf.closingListing });
    rfRows.push({});
  }
}
add("Rollforwards", rfRows);
add("Shallow checks", cross.shallow.map((s) => ({ "Line item": s.lineItem, "Opening (audited)": s.opening, "Journal movements": s.movements, "Rebuilt closing": s.rebuiltClosing, "TB closing": s.tbClosing, Difference: s.difference })));
add("Classified lines", Object.values(cycleResults).flatMap((r) => (r.classifications ?? []).map((c) => ({ Component: c.component, Entry: c.line.entry, Date: c.line.date, Account: c.line.account, Description: c.line.description, Amount: c.line.amount, Category: c.category, By: c.by ?? "pending", Confirmed: c.confirmed ? "yes" : "no", Source: srcText(c.source) }))));
const pm = cycleResults.revenue?.provisionMatrix;
if (pm) add("Provision matrix", [...pm.buckets.map((b) => ({ Bucket: b.bucket, "Listing gross (re-aged)": b.listingGross, "Matrix gross": b.matrixGross, Rate: b.rate, "Re-performed allowance": b.reperformedAllowance, "Client allowance": b.clientAllowance })), ...pm.individuallyAssessed.map((r) => ({ Bucket: `Individually assessed: ${r.customer}`, "Listing gross (re-aged)": r.listingBalance, "Matrix gross": r.gross, "Re-performed allowance": r.allowance, "Client allowance": r.allowance })), { Bucket: "Total", "Re-performed allowance": pm.reperformedTotal, "Client allowance": pm.clientTotal }, { Bucket: "Loss allowance per ledger", "Client allowance": pm.ledgerAllowance }]);
if (statementsTable) add("Statements", statementsTable.map((s) => ({ Statement: s.statement, Caption: s.caption, Presented: s.presented, Rebuilt: s.rebuilt, Difference: s.rebuilt == null || s.presented == null ? null : round2(s.presented - s.rebuilt), Comparative: s.comparative, "Audited prior year": s.auditedPriorYear })));
XLSX.writeFile(wb, path.join(runDir, "workpapers.xlsx"));

// ---------------------------------------------------------------------------
// run.json: the run's permanent record
// ---------------------------------------------------------------------------
writeJson(path.join(runDir, "run.json"), { runId, completedAt: new Date().toISOString(), settings, stopped, cycles, files: scan, flags, judgments: reviews, statements: statementsTable, coverage, notExamined, notes: cross.notes });

// Refresh the engagement's status page (a view; a failure here never fails the run).
let statusPage = null;
try {
  statusPage = execFileSync(process.execPath, [path.join(here, "status.mjs"), engDir], { encoding: "utf8" }).trim();
} catch {
  statusPage = null;
}

const count = (r) => flags.filter((f) => f.ranking === r).length;
console.log(JSON.stringify({ runId, stopped, flags: flags.length, abovePerformanceMateriality: count("above-performance-materiality"), betweenThresholds: count("between-thresholds"), clearlyTrivial: count("clearly-trivial"), pendingClassifications: pendingAll.length, infoNeeded: info, outputs: ["flags.md", "workpapers.xlsx", "run.json"].map((f) => path.relative(process.cwd(), path.join(runDir, f))), statusPage }, null, 2));
