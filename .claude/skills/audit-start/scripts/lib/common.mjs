// Shared helpers: money arithmetic, engagement settings, manifests, flags, JSON files.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const round2 = (n) => Math.round(n * 100) / 100;
export const sum = (xs) => round2(xs.reduce((s, x) => s + x, 0));
export const same = (a, b, tolerance = 0.005) => Math.abs(a - b) <= tolerance;

export function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

export function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Parses engagement.md: "- Key: value" lines. */
export function readEngagement(engDir) {
  const file = path.join(engDir, "engagement.md");
  if (!fs.existsSync(file)) return { problems: ["engagement.md is missing."] };
  const kv = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*[-*]\s*([^:]+):\s*(.+?)\s*$/);
    if (m) kv[m[1].trim().toLowerCase()] = m[2].trim();
  }
  const num = (k) => (kv[k] == null ? NaN : Number(kv[k].replace(/[,\s]/g, "")));
  const settings = {
    client: kv["client"] ?? path.basename(engDir),
    yearEnd: kv["year-end"],
    periodStart: kv["period start"],
    framework: kv["framework"],
    performanceMateriality: num("performance materiality"),
    clearlyTrivial: num("clearly trivial"),
  };
  const problems = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(settings.yearEnd ?? "")) problems.push("Year-end must be a date like 2026-12-31.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(settings.periodStart ?? "")) problems.push("Period start must be a date like 2026-01-01.");
  if (!settings.framework) problems.push("Framework is missing (IAS 1 or IFRS 18).");
  if (!(settings.performanceMateriality > 0)) problems.push("Performance materiality must be a positive number.");
  if (!(settings.clearlyTrivial > 0)) problems.push("Clearly trivial must be a positive number.");
  if (settings.clearlyTrivial >= settings.performanceMateriality) problems.push("Clearly trivial must be below performance materiality.");
  return { settings, problems };
}

/** The shared-folder manifest and every cycle manifest. */
export function loadManifests() {
  const dir = path.join(SKILL_DIR, "cycles");
  const shared = readJson(path.join(dir, "shared.json"));
  const cycles = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "shared.json")
    .map((f) => readJson(path.join(dir, f)));
  return { shared, cycles };
}

export const STOP_RULE_STAGES = ["opening", "schedules", "tb-and-cross-checks"];
export const STAGE_ORDER = ["opening", "schedules", "tb-and-cross-checks", "valuation-and-composition", "statements"];
export const RANK_ORDER = ["above-performance-materiality", "between-thresholds", "clearly-trivial"];

export function rank(difference, settings) {
  const d = Math.abs(difference);
  if (d > settings.performanceMateriality) return "above-performance-materiality";
  if (d > settings.clearlyTrivial) return "between-thresholds";
  return "clearly-trivial";
}

/**
 * Turns a comparison into a flag, or null when the amounts agree within the tolerance.
 * difference = actual − expected. The key identifies the same flag across runs.
 */
export function makeFlag(f, settings, tolerance = 0.005) {
  const difference = round2(f.actual - f.expected);
  if (Math.abs(difference) <= tolerance) return null;
  return {
    key: [f.kind, f.lineItem ?? "", f.movement ?? "", f.keySuffix ?? ""].join("|"),
    stage: f.stage,
    kind: f.kind,
    lineItem: f.lineItem,
    movement: f.movement,
    description: f.description,
    expected: round2(f.expected),
    actual: round2(f.actual),
    difference,
    ranking: rank(difference, settings),
    assertion: f.assertion,
    reference: f.reference,
    sources: f.sources ?? [],
    restsOnUnconfirmed: f.restsOnUnconfirmed ?? false,
    candidates: f.candidates ?? [],
  };
}

export function sortFlags(flags) {
  return [...flags].sort(
    (a, b) =>
      RANK_ORDER.indexOf(a.ranking) - RANK_ORDER.indexOf(b.ranking) ||
      STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
      Math.abs(b.difference) - Math.abs(a.difference),
  );
}

export function months(periodStart, yearEnd) {
  const out = [];
  let [y, m] = periodStart.split("-").map(Number);
  const [ey, em] = yearEnd.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86400000);
}

export function lastCompletedRun(engDir) {
  const runsDir = path.join(engDir, "runs");
  if (!fs.existsSync(runsDir)) return null;
  const done = fs
    .readdirSync(runsDir)
    .filter((d) => fs.existsSync(path.join(runsDir, d, "run.json")))
    .sort();
  return done.length ? done[done.length - 1] : null;
}
