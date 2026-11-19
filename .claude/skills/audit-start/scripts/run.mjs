#!/usr/bin/env node
// Usage:
//   node run.mjs start <engagement-folder>             → creates runs/<id>/work/, prints the run id
//   node run.mjs reuse <engagement-folder> <id> <cycle> → copies an unchanged cycle's results from the last completed run
// A run becomes complete (and is never edited again) when finalize.mjs writes its run.json.
import fs from "node:fs";
import path from "node:path";
import { fail, lastCompletedRun } from "./lib/common.mjs";

const [cmd, eng, runId, cycle] = process.argv.slice(2);
if (!cmd || !eng) fail("Usage: node run.mjs start|reuse <engagement-folder> [run-id cycle]");
const engDir = path.resolve(eng);

if (cmd === "start") {
  const id = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  fs.mkdirSync(path.join(engDir, "runs", id, "work"), { recursive: true });
  console.log(id);
} else if (cmd === "reuse") {
  if (!runId || !cycle) fail("Usage: node run.mjs reuse <engagement-folder> <run-id> <cycle>");
  const last = lastCompletedRun(engDir);
  if (!last) fail("There is no completed run to reuse results from.");
  const from = path.join(engDir, "runs", last, "work");
  const to = path.join(engDir, "runs", runId, "work");
  const copied = [];
  for (const name of [`${cycle}.json`, `${cycle}-narratives.json`]) {
    if (fs.existsSync(path.join(from, name))) {
      fs.copyFileSync(path.join(from, name), path.join(to, name));
      copied.push(name);
    }
  }
  if (!copied.length) fail(`Run ${last} has no results for cycle "${cycle}".`);
  console.log(`Reused ${copied.join(", ")} from run ${last}.`);
} else {
  fail(`Unknown command "${cmd}".`);
}
