// Rebuilds statement captions from a trial balance, working out each caption's sign and each
// total's composition from the documents themselves.
import { round2, same } from "./common.mjs";

const norm = (s) => String(s ?? "").trim().toLowerCase();

/** Line items (their names as mapped) whose captions sit on the profit or loss statement. */
export function profitLineItems(statements, lineItems) {
  const captions = new Set((statements["Statement of profit or loss"] ?? []).map((r) => norm(r.caption)));
  return new Set([...lineItems].filter((li) => captions.has(norm(li))));
}

/**
 * For each caption: the line item it maps to (same name), or a total. A caption that is the name
 * of a line item presents that line item's balance; "side" says whether the presented amount is
 * the debit balance (assets, and expenses shown positive) or its negative.
 */
export function captionPlan(statements, lineItemNames, pyBalances, cyBalances) {
  const names = new Map([...lineItemNames].map((n) => [norm(n), n]));
  const plan = {};
  for (const [name, rows] of Object.entries(statements)) {
    plan[name] = rows.map((r) => {
      const li = names.get(norm(r.caption));
      if (!li) return { caption: r.caption, total: true };
      const py = pyBalances(li);
      const cy = cyBalances(li);
      let side = null;
      if (r.comparative != null && py !== 0) side = same(r.comparative, py, 1) ? "debit" : same(r.comparative, -py, 1) ? "credit" : null;
      if (!side && r.current != null && cy !== 0) side = same(r.current, cy, 1) ? "debit" : same(r.current, -cy, 1) ? "credit" : null;
      if (!side) side = (r.current ?? r.comparative ?? 0) * (cy || py || 1) < 0 ? "credit" : "debit";
      return { caption: r.caption, lineItem: li, side };
    });
  }
  return plan;
}

/**
 * Works out which rows each total adds up, by testing the presented figures: rows since the
 * previous total ("reset"), those rows plus the previous total ("running"), or every line row so
 * far ("all"). A composition fits when the presented components, or the alternative (rebuilt)
 * figures for them, add up to the presented total, so one wrong line does not hide its total.
 * Returns { caption: [component captions] } for totals that could be explained.
 */
export function totalCompositions(statements, plan, alternative = {}) {
  const out = {};
  for (const [name, rows] of Object.entries(statements)) {
    let lastTotal = null;
    let since = [];
    const lineRows = [];
    rows.forEach((r, i) => {
      const p = plan[name][i];
      if (!p.total) {
        since.push(r.caption);
        lineRows.push(r.caption);
        return;
      }
      const value = (c) => rows.find((x) => x.caption === c)?.current ?? 0;
      const options = [since, lastTotal ? [lastTotal, ...since] : null, lineRows].filter(Boolean);
      const alt = (c) => alternative[c] ?? value(c);
      const fits = (o, f) => same(o.reduce((s, c) => s + f(c), 0), r.current ?? 0, 1);
      const fit = options.find((o) => o.length && (fits(o, value) || fits(o, alt)));
      if (fit) out[r.caption] = [...fit];
      lastTotal = r.caption;
      since = [];
    });
  }
  return out;
}

/**
 * Presented figures for every caption from balances by line item. Retained earnings picks up the
 * year's profit when the TB is before closing entries.
 */
export function rebuildFigures(statements, plan, compositions, balance, profitItems) {
  const profit = -round2([...profitItems].reduce((s, li) => s + balance(li), 0));
  const figures = {};
  for (const [name, rows] of Object.entries(statements)) {
    rows.forEach((r, i) => {
      const p = plan[name][i];
      if (p.total) return;
      let v = p.side === "debit" ? balance(p.lineItem) : -balance(p.lineItem);
      if (norm(p.lineItem) === "retained earnings") v = round2(v + profit);
      figures[r.caption] = round2(v);
    });
  }
  for (const [name, rows] of Object.entries(statements)) {
    rows.forEach((r, i) => {
      if (!plan[name][i].total) return;
      const parts = compositions[r.caption];
      figures[r.caption] = parts ? round2(parts.reduce((s, c) => s + (figures[c] ?? 0), 0)) : null;
    });
  }
  return figures;
}
