#!/usr/bin/env node
// Usage: node status.mjs <engagement-folder> [--live] [--open]
//   --live  the page reloads itself every 10 seconds (used while a run is in progress; finalize
//           writes the final page without it, which ends the reloading)
//   --open  serves the folder on localhost (serve.mjs) and opens the page in the browser: through
//           VS Code's $BROWSER helper when connected remotely, else open / xdg-open / start
//
// Writes <engagement-folder>/status.html: one page showing the engagement's current status and the
// latest run's results: cycle readiness, what awaits the auditor, TB balance checks, rollforwards,
// difference analysis, provision matrix, statements, adjustments and run history. A view only:
// it reads the scan, the runs and the side files, computes nothing new, and is safe to rerun.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { RANK_ORDER, fail, lastCompletedRun, readEngagement, readJson, round2 } from "./lib/common.mjs";
import { parseAmount, readTable } from "./lib/excel.mjs";

const args = process.argv.slice(2);
const live = args.includes("--live");
const openPage = args.includes("--open");
const engArg = args.find((a) => !a.startsWith("--"));
const engDir = path.resolve(engArg ?? fail("Usage: node status.mjs <engagement-folder> [--live] [--open]"));
if (!fs.existsSync(engDir)) fail(`No such folder: ${engDir}`);
const here = path.dirname(fileURLToPath(import.meta.url));
const { settings } = readEngagement(engDir);
const ct = settings.clearlyTrivial;
const pm = settings.performanceMateriality;

let scan = null;
let scanError = null;
try {
  scan = JSON.parse(execFileSync(process.execPath, [path.join(here, "scan.mjs"), engDir], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
} catch (e) {
  scanError = String(e.stderr || e.message).trim();
}

const runsDir = path.join(engDir, "runs");
const runIds = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter((d) => fs.statSync(path.join(runsDir, d)).isDirectory()).sort() : [];
const lastId = lastCompletedRun(engDir);
const last = lastId ? readJson(path.join(runsDir, lastId, "run.json")) : null;
const work = (name) => (lastId ? readJson(path.join(runsDir, lastId, "work", name), null) : null);
const revenue = work("revenue.json");
const cross = work("cross-cycle.json");
const inProgress = runIds.filter((id) => !fs.existsSync(path.join(runsDir, id, "run.json")) && id > (lastId ?? ""));
const dispositions = readJson(path.join(engDir, "dispositions.json"), {});

let adjustments = [];
const adjFile = path.join(engDir, "adjustments.xlsx");
if (fs.existsSync(adjFile)) {
  try {
    adjustments = readTable(adjFile, { name: "Adjustments", columns: ["Adjustment", "Flag", "Account", "Account name", "Debit", "Credit", "Description"] }).rows.map(({ values }) => ({
      adjustment: values.Adjustment, flag: values.Flag, account: values.Account, name: values["Account name"], debit: parseAmount(values.Debit), credit: parseAmount(values.Credit), description: values.Description,
    }));
  } catch {
    adjustments = [];
  }
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n) => (n == null || Number.isNaN(n) ? "—" : n < 0 ? `(${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 2 })})` : n.toLocaleString("en-GB", { maximumFractionDigits: 2 }));
const num = (n) => `<td class="num">${money(n)}</td>`;
const level = (d) => (d == null ? "" : Math.abs(d) <= 0.005 ? "ok" : Math.abs(d) <= ct ? "trivial" : Math.abs(d) <= pm ? "warn" : "bad");
const LEVEL_TEXT = { ok: "agrees", trivial: "clearly trivial", warn: "above clearly trivial", bad: "above performance materiality" };
const diffCell = (d) => (d == null ? "<td></td>" : `<td class="num ${level(d)}">${money(d)}</td>`);
const badge = (text, cls) => `<span class="badge ${cls}">${esc(text)}</span>`;
const table = (head, rows) => (rows.length ? `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>` : `<p class="muted">None.</p>`);
const rel = (p) => esc(path.relative(engDir, p));
const link = (file, text) => (fs.existsSync(file) ? `<a href="${rel(file)}">${esc(text)}</a>` : "");
const srcText = (s) => [s.file, s.sheet, s.row ? `row ${s.row}` : null, s.entry ? `entry ${s.entry}` : null, s.caption].filter(Boolean).join(", ");

const sections = [];
const section = (id, title, body) => sections.push({ id, title, body });

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
const STATUS = { ready: ["ready to run", "warn"], unchanged: ["unchanged since last run", "ok"], "missing-files": ["missing files", "bad"], "column-problems": ["column problems", "bad"] };
let statusBody = "";
if (scanError) statusBody += `<p class="bad">The scan failed: ${esc(scanError)}</p>`;
if (scan) {
  if (scan.settingsProblems.length) statusBody += `<p class="bad">engagement.md: ${esc(scan.settingsProblems.join(" "))}</p>`;
  statusBody += table(
    ["Cycle", "Status", "Last run", "What is missing or wrong"],
    scan.cycles.map((c) => `<tr><td>${esc(c.name)}</td><td>${badge(...(STATUS[c.status] ?? [c.status, ""]))}</td><td>${esc(c.lastRun ?? "—")}</td><td>${esc([...c.missing.map((m) => `missing ${m}`), ...c.columnProblems].join("; ") || "—")}</td></tr>`),
  );
  const sharedMissing = scan.shared.filter((s) => s.required && !s.present).map((s) => s.path);
  if (sharedMissing.length) statusBody += `<p class="warn">Shared files missing: ${esc(sharedMissing.join(", "))}</p>`;
  const unexpected = [...scan.sharedUnexpectedFiles, ...scan.cycles.flatMap((c) => c.lineItems.flatMap((li) => li.unexpectedFiles))];
  if (unexpected.length) statusBody += `<p class="muted">Files not in any template (rename if they are a template file): ${esc(unexpected.join(", "))}</p>`;
}
if (inProgress.length) {
  const id = inProgress.at(-1);
  const wd = path.join(runsDir, id, "work");
  const done = fs.existsSync(wd) ? fs.readdirSync(wd) : [];
  const steps = [
    ...(scan?.cycles ?? []).map((c) => `${c.name}: ${done.includes(`${c.id}.json`) ? (done.includes(`${c.id}-narratives.json`) ? "checked and explained" : "checked, explanations pending") : c.status === "ready" || c.status === "unchanged" ? "running" : "not run"}`),
    `Cross-cycle checks: ${done.includes("cross-cycle.json") ? "done" : "pending"}`,
    "Finalize: pending",
  ];
  statusBody += `<p class="warn">Run ${esc(id)} is in progress. ${esc(steps.join(" · "))}.${lastId ? " The results below are from the last completed run." : ""}</p>`;
}
section("status", "Status", statusBody);

// ---------------------------------------------------------------------------
// Latest run summary
// ---------------------------------------------------------------------------
if (last) {
  const count = (r) => last.flags.filter((f) => f.ranking === r).length;
  const links = [link(path.join(runsDir, lastId, "flags.md"), "flags.md"), link(path.join(runsDir, lastId, "workpapers.xlsx"), "workpapers.xlsx"), link(path.join(runsDir, lastId, "adjusted-statements.xlsx"), "adjusted-statements.xlsx"), link(path.join(runsDir, lastId, "adjusted-statements.docx"), "adjusted-statements.docx")].filter(Boolean).join(" · ");
  section(
    "run",
    `Latest run: ${lastId}`,
    `<p>${last.stopped ? badge("Stopped by the stop rule", "bad") + " Differences above clearly trivial before the statements, so the client-prepared statements were not examined." : badge("Finished", "ok") + " The client-prepared statements were examined."}</p>` +
      table(["Above performance materiality", "Between thresholds", "Clearly trivial", "Total flags"], [`<tr>${num(count("above-performance-materiality"))}${num(count("between-thresholds"))}${num(count("clearly-trivial"))}${num(last.flags.length)}</tr>`]) +
      `<p>Outputs: ${links}</p>` +
      table(["Line item", "Depth"], last.coverage.map((c) => `<tr><td>${esc(c.lineItem)}</td><td>${badge(c.depth, c.depth === "deep" ? "ok" : c.depth === "shallow" ? "warn" : "bad")}</td></tr>`)) +
      `<p class="muted">Not examined: ${esc(last.notExamined.join("; "))}.</p>`,
  );
} else {
  section("run", "Latest run", `<p class="muted">No completed run yet. Say “audit start” to run the examination.</p>`);
}

// ---------------------------------------------------------------------------
// Awaiting the auditor
// ---------------------------------------------------------------------------
{
  let body = "";
  const pendMap = scan?.pendingMappings ?? [];
  if (pendMap.length) body += `<h3>Account mappings to confirm</h3>` + table(["Account", "Name", "Question", "Proposal"], pendMap.map((p) => `<tr><td>${esc(p.account)}</td><td>${esc(p.name)}</td><td>${esc(p.question)}</td><td>${esc(p.proposedComponent ?? p.proposedLineItem ?? "—")}</td></tr>`));
  const pending = revenue?.pending ?? [];
  if (pending.length) body += `<h3>Journal lines to classify</h3>` + table(["Entry", "Date", "Description", "Amount", "Other side of the entry"], pending.map((p) => `<tr><td>${esc(p.line.entry)}</td><td>${esc(p.line.date)}</td><td>${esc(p.line.description)}</td>${num(p.line.amount)}<td>${esc(p.entry.filter((l) => l.account !== p.line.account).map((l) => `${l.account} ${l.accountName} ${money(l.amount)}`).join("; "))}</td></tr>`));
  const info = revenue?.infoNeeded ?? [];
  if (info.length) body += `<h3>Information needed from the client</h3><ul>${info.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  const concerns = (last?.judgments ?? []).filter((j) => j.concern);
  if (concerns.length) body += `<h3>Judgments that need attention</h3><ul>${concerns.map((j) => `<li><b>${esc(j.topic)}</b>: ${esc(j.conclusion)}</li>`).join("")}</ul>`;
  const undecided = (last?.flags ?? []).filter((f) => Math.abs(f.difference) > ct && !dispositions[f.key]);
  if (undecided.length) body += `<h3>Flags above clearly trivial without a decision (${undecided.length})</h3><ul>${undecided.map((f) => `<li><a href="#${esc(f.key)}">${esc(f.lineItem ?? "Journals")}${f.movement ? ` — ${esc(f.movement)}` : ""}: ${esc(f.kind)}</a> (${money(f.difference)})</li>`).join("")}</ul>`;
  section("awaiting", "Awaiting the auditor", body || `<p class="ok">Nothing is waiting for you.</p>`);
}

// ---------------------------------------------------------------------------
// TB balance checks: rebuilt closing (audited opening + the year's journals) against the client's balances
// ---------------------------------------------------------------------------
if (last) {
  const rows = [];
  for (const rf of [revenue?.rollforwards?.gross, revenue?.rollforwards?.["loss-allowance"], revenue?.rollforwards?.revenue].filter(Boolean)) {
    const opening = rf.openingAudited ?? 0;
    rows.push(`<tr><td>${esc(rf.title)} ${badge("deep", "ok")}</td>${num(opening)}${num(round2(rf.closingRebuilt - opening))}${num(rf.closingRebuilt)}${num(rf.closingSchedule)}${num(rf.closingTb)}${num(rf.closingListing)}${diffCell(rf.closingSchedule == null ? null : round2(rf.closingSchedule - rf.closingRebuilt))}${diffCell(round2(rf.closingTb - rf.closingRebuilt))}${diffCell(rf.closingListing == null ? null : round2(rf.closingListing - rf.closingRebuilt))}</tr>`);
  }
  if (revenue?.impairment) {
    const i = revenue.impairment;
    rows.push(`<tr><td>Impairment losses on trade receivables ${badge("cross-check", "ok")}</td><td></td>${num(i.expected)}${num(i.expected)}<td></td>${num(i.tb)}<td></td><td></td>${diffCell(round2(i.tb - i.expected))}<td></td></tr>`);
  }
  for (const s of cross?.shallow ?? []) {
    rows.push(`<tr><td>${esc(s.lineItem)} ${badge("shallow", "warn")}</td>${num(s.opening)}${num(s.movements)}${num(s.rebuiltClosing)}<td></td>${num(s.tbClosing)}<td></td><td></td>${diffCell(s.difference)}<td></td></tr>`);
  }
  section(
    "tb",
    "TB balance checks",
    `<p class="muted">Rebuilt closing = last year's audited closing + every journal line of the year. Differences are the client's figure less the rebuilt figure; colour shows the rank against clearly trivial (${money(ct)}) and performance materiality (${money(pm)}). Deep rows show each balance as positive (the loss allowance and revenue included); shallow rows are debit-positive, so credit balances appear in brackets.</p>` +
      table(["Line item", "Audited opening", "Journal movements", "Rebuilt closing", "Schedule closing", "TB closing", "Aged listing", "Schedule − rebuilt", "TB − rebuilt", "Listing − rebuilt"], rows),
  );

  // Rollforwards, movement by movement.
  let rfBody = "";
  for (const rf of Object.values(revenue?.rollforwards ?? {}).filter(Boolean)) {
    rfBody += `<h3>${esc(rf.title)}</h3>` + table(["Movement", "Rebuilt", "Schedule", "Difference"], rf.rows.map((r) => `<tr><td>${esc(r.label)}</td>${num(r.rebuilt)}${num(r.schedule)}${diffCell(r.schedule == null ? null : round2(r.schedule - r.rebuilt))}</tr>`));
    if (rf.closingIsFormula === false) rfBody += `<p class="warn">The schedule's closing balance is a typed number, not a formula.</p>`;
  }
  if (rfBody) section("rollforwards", "Rollforwards", rfBody);
}

// ---------------------------------------------------------------------------
// Difference analysis
// ---------------------------------------------------------------------------
if (last) {
  const GROUP = { "above-performance-materiality": ["Above performance materiality", "bad"], "between-thresholds": ["Between clearly trivial and performance materiality", "warn"], "clearly-trivial": ["Clearly trivial", "trivial"] };
  let body = "";
  for (const r of RANK_ORDER) {
    const fs_ = last.flags.filter((f) => f.ranking === r);
    if (!fs_.length) continue;
    body += `<h3>${badge(GROUP[r][0], GROUP[r][1])} ${fs_.length} flag(s)</h3>`;
    for (const f of fs_) {
      const d = dispositions[f.key];
      const cands = (f.candidates ?? []).map((c) => `<li>${c.matched ? "✓ " : ""}<b>${esc(c.test)}</b>${c.amount != null ? ` (${money(c.amount)})` : ""}: ${esc(c.note ?? "")}${c.lines?.length ? ` — ${esc(c.lines.map((l) => `${l.entry} ${l.description ?? ""} ${money(l.amount)}`).join("; "))}` : ""}${c.parts ? ` — ${esc(c.parts.map((p) => `${p.test} ${money(p.effect)}`).join(" + "))}` : ""}</li>`).join("");
      body += `<div class="flag ${level(f.difference)}" id="${esc(f.key)}">
<div class="flag-head"><b>${esc(f.lineItem ?? "Journals")}${f.movement ? ` — ${esc(f.movement)}` : ""}</b> <span class="muted">${esc(f.kind)} · ${esc(f.stage)}</span>${f.restsOnUnconfirmed ? " " + badge("rests on unconfirmed lines", "warn") : ""}${d ? " " + badge(`${d.decision}${d.adjustment ? ` (${d.adjustment})` : ""}`, d.decision === "accepted" ? "ok" : "muted") : ""}</div>
<p>${esc(f.description)}</p>
<table class="mini"><tr><th>Expected</th><th>Actual</th><th>Difference</th><th>Assertion</th><th>Reference</th></tr><tr>${num(f.expected)}${num(f.actual)}${diffCell(f.difference)}<td>${esc(f.assertion ?? "")}</td><td>${esc(f.reference ?? "")}</td></tr></table>
${f.narrative ? `<p><b>Explanation:</b> ${esc(f.narrative)}</p>` : ""}
${cands ? `<details${f.narrative ? "" : " open"}><summary>Scripted explanations tested</summary><ul>${cands}</ul></details>` : ""}
${d?.reason ? `<p class="muted">Decision reason: ${esc(d.reason)}</p>` : ""}
<details><summary>Sources (${f.sources.length})</summary><ul>${f.sources.slice(0, 30).map((s) => `<li>${esc(srcText(s))}</li>`).join("")}</ul></details>
</div>`;
    }
  }
  section("differences", "Difference analysis", body || `<p class="ok">No flags.</p>`);
}

// ---------------------------------------------------------------------------
// Provision matrix, judgments, statements, adjustments, history
// ---------------------------------------------------------------------------
const pmx = revenue?.provisionMatrix;
if (pmx) {
  section(
    "matrix",
    "Provision matrix re-performance",
    table(["Bucket", "Listing gross (re-aged)", "Matrix gross", "Rate", "Re-performed allowance", "Client allowance", "Gross difference"], [
      ...pmx.buckets.map((b) => `<tr><td>${esc(b.bucket)}</td>${num(b.listingGross)}${num(b.matrixGross)}<td class="num">${b.rate == null ? "—" : `${round2(b.rate * 100)}%`}</td>${num(b.reperformedAllowance)}${num(b.clientAllowance)}${diffCell(b.matrixGross == null ? null : round2(b.matrixGross - b.listingGross))}</tr>`),
      ...pmx.individuallyAssessed.map((r) => `<tr><td>Individually assessed: ${esc(r.customer)}</td>${num(r.listingBalance)}${num(r.gross)}<td></td>${num(r.allowance)}${num(r.allowance)}${diffCell(round2(r.gross - r.listingBalance))}</tr>`),
      `<tr class="total"><td>Total</td><td></td><td></td><td></td>${num(pmx.reperformedTotal)}${num(pmx.clientTotal)}<td></td></tr>`,
      `<tr><td>Loss allowance per ledger</td><td></td><td></td><td></td><td></td>${num(pmx.ledgerAllowance)}${diffCell(round2(pmx.ledgerAllowance - pmx.reperformedTotal))}</tr>`,
    ]),
  );
}
if (last?.judgments?.length) {
  section("judgments", "Judgments by the cycle agents", `<ul>${last.judgments.map((j) => `<li>${j.concern ? badge("attention", "warn") + " " : ""}<b>${esc(j.topic)}</b>${j.lineItem ? ` (${esc(j.lineItem)})` : ""}: ${esc(j.conclusion)}</li>`).join("")}</ul>`);
}
if (last?.statements?.length) {
  section("statements", "Client-prepared statements vs rebuilt", table(["Statement", "Caption", "Presented", "Rebuilt", "Difference", "Comparative", "Audited prior year"], last.statements.map((s) => `<tr><td>${esc(s.statement)}</td><td>${esc(s.caption)}</td>${num(s.presented)}${num(s.rebuilt)}${diffCell(s.rebuilt == null || s.presented == null ? null : round2(s.presented - s.rebuilt))}${num(s.comparative)}${num(s.auditedPriorYear)}</tr>`)));
}
{
  const decided = Object.entries(dispositions);
  let body = "";
  body += `<h3>Proposed adjustments</h3>` + table(["Adjustment", "Account", "Debit", "Credit", "Description", "Flag"], adjustments.map((a) => `<tr><td>${esc(a.adjustment)}</td><td>${esc(a.account)} ${esc(a.name)}</td>${num(a.debit)}${num(a.credit)}<td>${esc(a.description)}</td><td class="muted">${esc(a.flag)}</td></tr>`));
  body += `<h3>Decisions on flags</h3>` + table(["Flag", "Decision", "Reason", "Adjustment", "Run"], decided.map(([k, d]) => `<tr><td><a href="#${esc(k)}">${esc(k)}</a></td><td>${esc(d.decision)}</td><td>${esc(d.reason ?? "")}</td><td>${esc(d.adjustment ?? "")}</td><td>${esc(d.run ?? "")}</td></tr>`));
  section("adjustments", "Adjustments and decisions", body);
}
section(
  "history",
  "Run history",
  table(["Run", "Outcome", "Flags", "Above PM", "Between thresholds", "Cycles"], runIds.slice().reverse().map((id) => {
    const r = readJson(path.join(runsDir, id, "run.json"), null);
    if (!r) return `<tr><td>${esc(id)}</td><td>${badge("in progress / not finalized", "warn")}</td><td></td><td></td><td></td><td></td></tr>`;
    const c = (rk) => r.flags.filter((f) => f.ranking === rk).length;
    return `<tr><td>${link(path.join(runsDir, id, "flags.md"), id) || esc(id)}</td><td>${r.stopped ? badge("stopped", "bad") : badge("finished", "ok")}</td>${num(r.flags.length)}${num(c("above-performance-materiality"))}${num(c("between-thresholds"))}<td>${esc(Object.entries(r.cycles).map(([k, v]) => `${k}: ${v.status}`).join("; "))}</td></tr>`;
  })),
);

// ---------------------------------------------------------------------------
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(settings.client)} — engagement status</title>${live ? `\n<meta http-equiv="refresh" content="10">` : ""}
<style>
:root { --fg:#1f2328; --muted:#656d76; --bg:#ffffff; --panel:#f6f8fa; --line:#d0d7de; --ok:#1a7f37; --warn:#9a6700; --bad:#cf222e; --trivial:#656d76; }
@media (prefers-color-scheme: dark) { :root { --fg:#e6edf3; --muted:#9198a1; --bg:#0d1117; --panel:#161b22; --line:#30363d; --ok:#3fb950; --warn:#d29922; --bad:#f85149; --trivial:#9198a1; } }
* { box-sizing: border-box; }
body { margin:0; font:14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color:var(--fg); background:var(--bg); }
header { padding:20px 32px; border-bottom:1px solid var(--line); background:var(--panel); }
header h1 { margin:0 0 4px; font-size:20px; }
nav { padding:8px 32px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg); z-index:1; }
nav a { margin-right:16px; color:var(--fg); text-decoration:none; font-size:13px; }
main { padding:8px 32px 48px; max-width:1280px; }
h2 { margin:28px 0 8px; font-size:17px; border-bottom:1px solid var(--line); padding-bottom:4px; }
h3 { margin:18px 0 6px; font-size:14px; }
table { border-collapse:collapse; margin:6px 0 10px; width:100%; }
th, td { border:1px solid var(--line); padding:4px 8px; text-align:left; vertical-align:top; }
th { background:var(--panel); font-weight:600; font-size:12px; }
td.num { text-align:right; font-variant-numeric: tabular-nums; white-space:nowrap; }
tr.total td { font-weight:600; }
table.mini { width:auto; }
.muted { color:var(--muted); }
.ok { color:var(--ok); } .warn { color:var(--warn); } .bad { color:var(--bad); } .trivial { color:var(--trivial); }
td.ok, td.warn, td.bad, td.trivial { font-weight:600; }
.badge { display:inline-block; padding:0 8px; border-radius:10px; border:1px solid currentColor; font-size:12px; white-space:nowrap; }
.badge.ok { color:var(--ok); } .badge.warn { color:var(--warn); } .badge.bad { color:var(--bad); } .badge.muted, .badge.trivial { color:var(--muted); }
.flag { border:1px solid var(--line); border-left:4px solid var(--line); border-radius:6px; padding:8px 12px; margin:8px 0; background:var(--panel); }
.flag.bad { border-left-color:var(--bad); } .flag.warn { border-left-color:var(--warn); } .flag.trivial { border-left-color:var(--trivial); }
.flag p { margin:6px 0; }
details { margin:4px 0; } summary { cursor:pointer; color:var(--muted); }
</style></head>
<body>
<header><h1>${esc(settings.client)}</h1>
${live ? `<div class="warn"><b>Live:</b> this page reloads every 10 seconds while the examination runs.</div>` : ""}<div class="muted">Year ended ${esc(settings.yearEnd)} · ${esc(settings.framework)} · performance materiality ${money(pm)} · clearly trivial ${money(ct)} · page generated ${esc(new Date().toISOString().replace("T", " ").slice(0, 16))} UTC</div></header>
<nav>${sections.map((s) => `<a href="#${s.id}">${esc(s.title.replace(/:.*/, ""))}</a>`).join("")}</nav>
<main>
${sections.map((s) => `<section id="${s.id}"><h2>${esc(s.title)}</h2>${s.body}</section>`).join("\n")}
<p class="muted">Every figure on this page comes from the examination scripts; the page itself computes only the differences shown. Refresh it with <code>node .claude/skills/audit-start/scripts/status.mjs ${esc(path.relative(process.cwd(), engDir) || ".")}</code> or by saying “audit status”.</p>
</main></body></html>
`;
fs.writeFileSync(path.join(engDir, "status.html"), html);
const pagePath = path.relative(process.cwd(), path.join(engDir, "status.html")) || "status.html";
if (!openPage) {
  console.log(pagePath);
} else {
  const url = await serveUrl();
  const opened = url ? openInBrowser(url) : null;
  console.log(JSON.stringify({ page: pagePath, url, opened: opened ?? false, note: opened ? `Opened with ${opened}.` : url ? "No browser opener available here; open the URL yourself (VS Code forwards the port)." : "Could not start the local server; open the file directly." }, null, 2));
}

/** A running serve.mjs for this folder (reused if alive), as http://localhost:<port>/status.html. */
async function serveUrl() {
  const stateFile = path.join(engDir, ".status-server.json");
  const alive = async (st) => {
    if (!st?.pid || !st?.port) return false;
    try {
      process.kill(st.pid, 0);
    } catch {
      return false;
    }
    return new Promise((resolve) => {
      const req = http.request({ host: "127.0.0.1", port: st.port, path: "/status.html", method: "HEAD", timeout: 1000 }, (res) => resolve(res.statusCode === 200));
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  };
  let st = readJson(stateFile, null);
  if (!(await alive(st))) {
    try {
      fs.rmSync(stateFile, { force: true });
    } catch {
      /* ignore */
    }
    spawn(process.execPath, [path.join(here, "serve.mjs"), engDir], { detached: true, stdio: "ignore" }).unref();
    for (let i = 0; i < 30 && !(await alive((st = readJson(stateFile, null)))); i++) await new Promise((r) => setTimeout(r, 100));
    if (!(await alive(st))) return null;
  }
  return `http://localhost:${st.port}/status.html`;
}

/** Opens a URL in the user's browser; returns the opener used, or null. */
function openInBrowser(url) {
  const candidates = [];
  if (process.env.BROWSER) candidates.push([process.env.BROWSER, [url]]);
  if (process.platform === "darwin") candidates.push(["open", [url]]);
  else if (process.platform === "win32") candidates.push(["cmd", ["/c", "start", "", url]]);
  else if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) candidates.push(["xdg-open", [url]]);
  for (const [cmd, a] of candidates) {
    try {
      execFileSync(cmd, a, { stdio: "ignore", timeout: 10000 });
      return path.basename(cmd);
    } catch {
      /* try the next opener */
    }
  }
  return null;
}
