import { flag, round2 } from "./ranking";
import type { TbRow } from "./reader";
import type { PresentedStatements, StatementName } from "./statementReader";
import type { Flag, Settings } from "./types";

type Caption = { caption: string; side?: "debit" | "credit"; total?: string[] };

/** The fixed v1 statement layout. "side" is the balance that presents as positive. */
export const LAYOUT: Record<StatementName, Caption[]> = {
  "Statement of financial position": [
    { caption: "Property, plant and equipment", side: "debit" },
    { caption: "Inventories", side: "debit" },
    { caption: "Trade receivables", side: "debit" },
    { caption: "Cash and cash equivalents", side: "debit" },
    { caption: "Total assets", total: ["Property, plant and equipment", "Inventories", "Trade receivables", "Cash and cash equivalents"] },
    { caption: "Share capital", side: "credit" },
    { caption: "Retained earnings", side: "credit" },
    { caption: "Trade and other payables", side: "credit" },
    { caption: "Total equity and liabilities", total: ["Share capital", "Retained earnings", "Trade and other payables"] },
  ],
  "Statement of profit or loss": [
    { caption: "Revenue", side: "credit" },
    { caption: "Cost of sales", side: "credit" },
    { caption: "Gross profit", total: ["Revenue", "Cost of sales"] },
    { caption: "Administrative expenses", side: "credit" },
    { caption: "Impairment losses on trade receivables", side: "credit" },
    { caption: "Profit for the year", total: ["Gross profit", "Administrative expenses", "Impairment losses on trade receivables"] },
  ],
};

const PROFIT_LINE_ITEMS = LAYOUT["Statement of profit or loss"].filter((c) => c.side).map((c) => c.caption);

/** Presented-amount rounding tolerance: statements are presented in whole currency units. */
export const ROUNDING_TOLERANCE = 1;

/**
 * Rebuilds the current-year statements from the TB's line-item mapping (a pre-closing TB, so
 * retained earnings picks up the profit for the year). `overrides` replaces a line item's TB
 * figure with the revenue cycle's rebuilt balance (debit positive).
 */
export function rebuildStatements(tb: TbRow[], overrides: Record<string, number> = {}) {
  const balance = (lineItem: string) =>
    overrides[lineItem] ?? round2(tb.filter((r) => r.lineItem === lineItem).reduce((s, r) => s + r.balance, 0));
  const profit = -round2(PROFIT_LINE_ITEMS.reduce((s, li) => s + balance(li), 0));
  const figures: Record<string, number> = {};
  for (const name of Object.keys(LAYOUT) as StatementName[]) {
    for (const c of LAYOUT[name]) {
      if (c.total) figures[c.caption] = round2(c.total.reduce((s, x) => s + figures[x], 0));
      else figures[c.caption] = c.side === "debit" ? balance(c.caption) : -balance(c.caption);
      if (c.caption === "Retained earnings") figures[c.caption] = round2(figures[c.caption] + profit);
    }
  }
  return figures;
}

export function compareStatements(
  presented: PresentedStatements,
  priorYear: PresentedStatements,
  rebuilt: Record<string, number>,
  labels: { client: string },
  settings: Settings,
  restsOnUnconfirmed: (caption: string) => boolean = () => false,
): Flag[] {
  const flags: Flag[] = [];
  for (const name of Object.keys(LAYOUT) as StatementName[]) {
    for (const { caption } of LAYOUT[name]) {
      const shown = presented[name][caption];
      const source = { file: labels.client, caption: `${name}: ${caption}` };
      const current = flag(
        {
          stage: "statements",
          kind: "statement-amount",
          lineItem: caption,
          description: `${caption} on the ${name.toLowerCase()} does not agree with the rebuilt figure.`,
          expected: rebuilt[caption],
          actual: shown?.current ?? 0,
          sources: [source],
          restsOnUnconfirmed: restsOnUnconfirmed(caption),
        },
        settings,
        ROUNDING_TOLERANCE,
      );
      if (current) flags.push(current);
      const audited = priorYear[name][caption]?.current ?? 0;
      const comparative = flag(
        {
          stage: "statements",
          kind: "statement-comparative",
          lineItem: caption,
          description: `${caption} comparative on the ${name.toLowerCase()} does not agree with last year's audited statements.`,
          expected: audited,
          actual: shown?.comparative ?? 0,
          sources: [source],
        },
        settings,
        ROUNDING_TOLERANCE,
      );
      if (comparative) flags.push(comparative);
    }
  }
  return flags;
}
