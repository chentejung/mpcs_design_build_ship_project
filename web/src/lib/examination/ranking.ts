import type { Flag, Ranking, Settings } from "./types";

export function rank(difference: number, settings: Settings): Ranking {
  const d = Math.abs(difference);
  if (d > settings.performanceMateriality) return "above-performance-materiality";
  if (d > settings.clearlyTrivial) return "between-thresholds";
  return "clearly-trivial";
}

export type Difference = Omit<Flag, "ranking" | "difference" | "restsOnUnconfirmed"> & {
  restsOnUnconfirmed?: boolean;
};

/** Turns a comparison into a flag, or nothing when the amounts agree. difference = actual − expected. */
export function flag(d: Difference, settings: Settings, tolerance = 0): Flag | null {
  const difference = round2(d.actual - d.expected);
  if (Math.abs(difference) <= tolerance) return null;
  return { ...d, difference, ranking: rank(difference, settings), restsOnUnconfirmed: d.restsOnUnconfirmed ?? false };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
