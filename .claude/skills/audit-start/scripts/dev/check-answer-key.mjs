#!/usr/bin/env node
// Usage: node dev/check-answer-key.mjs <run.json> <answer-key.json>
// Compares a completed run's flags with a fixture's answer key: every expected flag must appear
// with the expected difference; any other flag is reported as unexpected. Exits 1 on a mismatch.
import fs from "node:fs";

const [runFile, keyFile] = process.argv.slice(2);
if (!runFile || !keyFile) {
  console.error("Usage: node dev/check-answer-key.mjs <run.json> <answer-key.json>");
  process.exit(1);
}
const run = JSON.parse(fs.readFileSync(runFile, "utf8"));
const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));
const matches = (f, e) => f.kind === e.kind && f.lineItem === e.lineItem && (e.movement == null || f.movement === e.movement) && Math.abs(f.difference - e.difference) < 0.01;

const found = [];
const missing = [];
for (const e of key.expectedFlags) (run.flags.some((f) => matches(f, e)) ? found : missing).push(e);
const unexpected = run.flags.filter((f) => !key.expectedFlags.some((e) => matches(f, e)));
const stopOk = run.stopped === key.stopRuleFires;

console.log(`Stop rule: ${run.stopped ? "fired" : "did not fire"} (expected ${key.stopRuleFires ? "fired" : "not fired"}) ${stopOk ? "✓" : "✗"}`);
console.log(`Expected flags found: ${found.length}/${key.expectedFlags.length}`);
for (const e of missing) console.log(`  MISSING ${e.kind} | ${e.lineItem} | ${e.movement ?? ""} | ${e.difference} — ${e.why}`);
console.log(`Unexpected flags: ${unexpected.length}`);
for (const f of unexpected) console.log(`  EXTRA ${f.kind} | ${f.lineItem} | ${f.movement ?? ""} | ${f.difference} — ${f.description}`);
process.exit(missing.length || unexpected.length || !stopOk ? 1 : 0);
