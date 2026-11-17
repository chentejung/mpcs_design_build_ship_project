#!/usr/bin/env node
// Usage: node scan.mjs <engagement-folder>
// Reports, as JSON: settings problems, shared-file status, pending account mappings, and for each
// cycle whether it is missing files, has column problems, is unchanged since the last run, or is
// ready to run.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fail, lastCompletedRun, loadManifests, readEngagement, readJson, sha256 } from "./lib/common.mjs";
import { checkSheet } from "./lib/excel.mjs";
import { journalFiles, readTb, resolveAccounts } from "./lib/ledger.mjs";

const engDir = path.resolve(process.argv[2] ?? fail("Usage: node scan.mjs <engagement-folder>"));
if (!fs.existsSync(engDir)) fail(`No such folder: ${engDir}`);

const { settings, problems: settingsProblems } = readEngagement(engDir);
const manifests = loadManifests();
const SIDE_FILES = new Set(["column-map.json", "confirmations.json", "account-map.json"]);

/** Status of one manifest file spec at a folder. */
function fileStatus(spec, folder) {
  const rel = (p) => path.relative(engDir, p);
  if (spec.folder) {
    const files = journalFiles(engDir);
    if (!files.length) return { id: spec.id, path: rel(path.join(folder, spec.folder)) + "/", present: false, required: spec.required, problems: [] };
    const problems = files.flatMap((f) => spec.sheets.flatMap((s) => checkSheet(f, s)).map((p) => `${rel(f)}: ${p}`));
    return { id: spec.id, path: rel(path.join(folder, spec.folder)) + "/", present: true, required: spec.required, files: files.map(rel), problems, hashes: Object.fromEntries(files.map((f) => [rel(f), sha256(f)])) };
  }
  const file = path.join(folder, spec.file);
  if (!fs.existsSync(file)) return { id: spec.id, path: rel(file), present: false, required: spec.required, problems: [] };
  let problems = [];
  try {
    problems = (spec.sheets ?? []).flatMap((s) => checkSheet(file, s));
  } catch (e) {
    problems = [`Could not be read: ${e.message}`];
  }
  return { id: spec.id, path: rel(file), present: true, required: spec.required, problems, hashes: { [rel(file)]: sha256(file) } };
}

function unexpectedFiles(folder, specs) {
  if (!fs.existsSync(folder)) return [];
  const known = new Set(specs.map((s) => s.file ?? s.folder));
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .filter((d) => d.isFile() && !known.has(d.name) && !SIDE_FILES.has(d.name) && !d.name.startsWith("."))
    .map((d) => path.relative(engDir, path.join(folder, d.name)));
}

function sideFileHashes(folder) {
  const out = {};
  for (const name of SIDE_FILES) {
    const f = path.join(folder, name);
    if (fs.existsSync(f)) out[path.relative(engDir, f)] = sha256(f);
  }
  return out;
}

const sharedDir = path.join(engDir, "shared");
const shared = manifests.shared.files.map((s) => fileStatus(s, sharedDir));
const sharedById = Object.fromEntries(shared.map((s) => [s.id, s]));

// Account mapping: needs both trial balances.
let pendingMappings = [];
let mappingError = null;
if (sharedById.priorYearTb.present && sharedById.currentTb.present && !sharedById.priorYearTb.problems.length && !sharedById.currentTb.problems.length) {
  try {
    const tbs = [readTb(path.join(sharedDir, "current-tb.xlsx")), readTb(path.join(sharedDir, "prior-year-tb.xlsx"))];
    pendingMappings = resolveAccounts(engDir, tbs, manifests).pending;
  } catch (e) {
    mappingError = e.message;
  }
}

const last = lastCompletedRun(engDir);
const lastRun = last ? readJson(path.join(engDir, "runs", last, "run.json")) : null;
const engagementHash = fs.existsSync(path.join(engDir, "engagement.md")) ? sha256(path.join(engDir, "engagement.md")) : null;

const cycles = manifests.cycles.map((cycle) => {
  const cycleDir = path.join(engDir, cycle.folder);
  const lineItems = cycle.lineItems.map((li) => {
    const folder = path.join(cycleDir, li.folder);
    return {
      name: li.name,
      folder: path.relative(engDir, folder),
      skill: li.skill,
      files: li.files.map((s) => fileStatus(s, folder)),
      unexpectedFiles: unexpectedFiles(folder, li.files),
      sideFiles: sideFileHashes(folder),
    };
  });
  const needShared = cycle.sharedFiles.map((id) => sharedById[id]);
  const missing = [
    ...needShared.filter((s) => s.required && !s.present).map((s) => s.path),
    ...lineItems.flatMap((li) => li.files.filter((f) => f.required && !f.present).map((f) => f.path)),
  ];
  const columnProblems = [...needShared, ...lineItems.flatMap((li) => li.files)].flatMap((f) => f.problems);
  const hashes = {
    engagement: engagementHash,
    ...Object.assign({}, ...needShared.map((s) => s.hashes ?? {})),
    ...sideFileHashes(sharedDir),
    ...Object.assign({}, ...lineItems.flatMap((li) => [...li.files.map((f) => f.hashes ?? {}), li.sideFiles])),
  };
  const inputsHash = crypto.createHash("sha256").update(JSON.stringify(Object.entries(hashes).sort())).digest("hex");
  const lastHash = lastRun?.cycles?.[cycle.id]?.inputsHash ?? null;
  const status = missing.length
    ? "missing-files"
    : columnProblems.length
      ? "column-problems"
      : lastHash === inputsHash && lastRun?.cycles?.[cycle.id]?.status !== "missing-files"
        ? "unchanged"
        : "ready";
  return { id: cycle.id, name: cycle.name, agent: cycle.agent, status, missing, columnProblems, inputsHash, lastRun: lastHash ? last : null, lineItems };
});

const out = {
  engagement: path.relative(process.cwd(), engDir) || ".",
  settings,
  settingsProblems,
  shared: shared.map(({ hashes, ...s }) => s),
  sharedUnexpectedFiles: unexpectedFiles(sharedDir, manifests.shared.files),
  pendingMappings,
  mappingError,
  lastRun: last,
  cycles: cycles.map((c) => ({ ...c, lineItems: c.lineItems.map(({ sideFiles, files, ...li }) => ({ ...li, files: files.map(({ hashes, ...f }) => f) })) })),
};
console.log(JSON.stringify(out, null, 2));
