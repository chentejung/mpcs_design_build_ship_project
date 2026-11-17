import type { ArCategory, Classification, Ranking, Stage } from "./types";

export const STAGE_LABELS: Record<Stage, string> = {
  opening: "Opening balances",
  schedules: "Line-item schedules",
  "tb-and-cross-checks": "TB and cross-checks",
  statements: "Client-prepared statements",
};

export const KIND_LABELS: Record<string, string> = {
  "unbalanced-entry": "Unbalanced journal entry",
  "opening-balance": "Opening balance vs last year's audited",
  "schedule-movement": "Schedule movement vs journal lines",
  "schedule-closing": "Schedule closing vs its movements",
  "schedule-vs-tb": "Schedule closing vs TB",
  "cross-check-revenue": "Credit sales vs revenue cross-check",
  "revenue-unusual-account": "Revenue credited to an unusual account",
  "statement-amount": "Statement amount vs rebuilt",
  "statement-comparative": "Comparative vs last year's audited",
};

export const RANKING_LABELS: Record<Ranking, string> = {
  "above-performance-materiality": "Above performance materiality",
  "between-thresholds": "Between the thresholds",
  "clearly-trivial": "Clearly trivial",
};

export const CATEGORY_LABELS: Record<ArCategory, string> = {
  "credit-sale": "Credit sale",
  receipt: "Receipt",
  "credit-note": "Credit note",
  "write-off": "Write-off",
};

export function confirmationLabel(c: Classification) {
  if (c.by === "rule") return "Yes — rule";
  if (c.by === "auditor") return "Yes — auditor";
  return "No — agent suggestion";
}
