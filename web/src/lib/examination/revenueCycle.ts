import { flag, round2 } from "./ranking";
import type { ReadJournalLine, RollforwardRow, TbRow } from "./reader";
import type { ArCategory, Classification, Classifier, Flag, JournalLine, Settings, SourceRef, UnplacedLine } from "./types";

export const LINE_ITEMS = { receivables: "Trade receivables", revenue: "Revenue" } as const;

export type RevenueCycleInput = {
  priorYearTb: TbRow[];
  currentTb: TbRow[];
  journals: ReadJournalLine[];
  arLines: ReadJournalLine[];
  arRollforward: RollforwardRow[];
  revenueRollforward: RollforwardRow[];
  /** Source file labels, for flag sources. */
  labels: { priorYearTb: string; currentTb: string; journals: string; arSchedule: string; revenueSchedule: string };
};

export type Confirmations = Record<string, ArCategory>;

export type RevenueCycleResult = {
  flags: Flag[];
  classifications: Classification[];
  rollforward: Record<string, number>;
  /** True when the rebuilt closing balance includes a line still awaiting the auditor's confirmation. */
  closingRestsOnUnconfirmed: boolean;
};

/** The trade receivables rollforward: each movement's schedule label and its sign in the closing formula. */
const MOVEMENTS: { category: ArCategory; label: string; sign: 1 | -1 }[] = [
  { category: "credit-sale", label: "Credit sales", sign: 1 },
  { category: "receipt", label: "Cash receipts", sign: -1 },
  { category: "credit-note", label: "Credit notes", sign: -1 },
  { category: "write-off", label: "Write-offs", sign: -1 },
];

const sum = (xs: number[]) => round2(xs.reduce((s, x) => s + x, 0));

function accountsOf(tb: TbRow[], lineItem: string) {
  return new Set(tb.filter((r) => r.lineItem === lineItem).map((r) => r.account));
}

function closing(rollforward: RollforwardRow[]) {
  return rollforward.find((r) => r.label === "Closing balance");
}

export async function examineRevenueCycle(
  input: RevenueCycleInput,
  settings: Settings,
  classifier: Classifier,
  confirmations: Confirmations = {},
): Promise<RevenueCycleResult> {
  const { currentTb, journals, labels } = input;
  const flags: Flag[] = [];
  const push = (f: Flag | null) => f && flags.push(f);

  const arAccounts = accountsOf(currentTb, LINE_ITEMS.receivables);
  const revenueAccounts = accountsOf(currentTb, LINE_ITEMS.revenue);
  const cashAccounts = accountsOf(currentTb, "Cash and cash equivalents");
  const writeOffAccounts = accountsOf(currentTb, "Impairment losses on trade receivables");
  const byEntry = groupByEntry(journals);

  // Stage 1: classify each journal line on the trade receivables schedule by the other side of its entry.
  const placeByRule = (line: ReadJournalLine, entry: ReadJournalLine[]): ArCategory | null => {
    const other = entry.filter((l) => !arAccounts.has(l.account));
    if (!other.length) return null;
    const all = (accounts: Set<string>) => other.every((l) => accounts.has(l.account));
    if (all(revenueAccounts)) return line.amount > 0 ? "credit-sale" : "credit-note";
    if (all(cashAccounts) && line.amount < 0) return "receipt";
    if (all(writeOffAccounts) && line.amount < 0) return "write-off";
    return null;
  };
  const classifications: Classification[] = [];
  const unplaced: UnplacedLine[] = [];
  for (const line of input.arLines) {
    const id = `ar-row-${line.row}`;
    const entry = byEntry.get(line.entry) ?? [];
    const lineRef: SourceRef = { file: labels.arSchedule, sheet: "Journal lines", row: line.row, entry: line.entry };
    const confirmed = confirmations[id];
    const category = placeByRule(line, entry);
    if (confirmed) classifications.push({ id, lineRef, line: strip(line), category: confirmed, by: "auditor", confirmed: true });
    else if (category) classifications.push({ id, lineRef, line: strip(line), category, by: "rule", confirmed: true });
    else unplaced.push({ id, line: strip(line), entry: entry.map(strip) });
  }
  if (unplaced.length) {
    // A classifier outage must not block the run: the lines wait for the auditor instead.
    let suggestions: Awaited<ReturnType<Classifier>> = [];
    let unavailable: string | null = null;
    try {
      suggestions = await classifier(unplaced);
    } catch (err) {
      unavailable = err instanceof Error ? err.message : String(err);
    }
    for (const u of unplaced) {
      const s = suggestions.find((x) => x.id === u.id);
      // Without a suggestion, a placeholder by direction (debit: credit sale, credit: receipt) until the auditor chooses.
      const placeholder: ArCategory = u.line.amount > 0 ? "credit-sale" : "receipt";
      const line = input.arLines.find((l) => `ar-row-${l.row}` === u.id)!;
      classifications.push({
        id: u.id,
        lineRef: { file: labels.arSchedule, sheet: "Journal lines", row: line.row, entry: line.entry },
        line: u.line,
        category: s?.category ?? placeholder,
        by: "agent",
        reasoning:
          s?.reasoning ??
          (unavailable
            ? `The AI classifier was unavailable (${unavailable}). Choose the category yourself.`
            : "The AI classifier gave no valid suggestion. Choose the category yourself."),
        confirmed: false,
      });
    }
  }

  // Opening balances: each schedule's opening against last year's audited closing balance
  // (zero for revenue, an income statement line item).
  for (const [lineItem, rollforward, file, sign] of [
    [LINE_ITEMS.receivables, input.arRollforward, labels.arSchedule, 1],
    [LINE_ITEMS.revenue, input.revenueRollforward, labels.revenueSchedule, 0],
  ] as const) {
    const pyRows = input.priorYearTb.filter((r) => r.lineItem === lineItem);
    const row = rollforward.find((r) => r.label === "Opening balance");
    push(
      flag(
        {
          stage: "opening",
          kind: "opening-balance",
          lineItem,
          description: `${lineItem} opening balance on the schedule does not agree with last year's audited closing balance.`,
          expected: sign * sum(pyRows.map((r) => r.balance)),
          actual: row?.amount ?? 0,
          sources: [
            { file, sheet: "Rollforward", row: row?.row },
            ...pyRows.map((r): SourceRef => ({ file: labels.priorYearTb, sheet: "Trial balance", row: r.row })),
          ],
        },
        settings,
      ),
    );
  }

  // Stage 1: rebuild the gross trade receivables rollforward from the audited opening balance
  // and compare each schedule movement.
  const opening = sum(
    input.priorYearTb.filter((r) => r.lineItem === LINE_ITEMS.receivables).map((r) => r.balance),
  );
  const rollforward: Record<string, number> = { "Opening balance": opening };
  let rebuiltClosing = opening;
  for (const m of MOVEMENTS) {
    const lines = classifications.filter((c) => c.category === m.category);
    const total = round2(m.sign * sum(lines.map((c) => c.line.amount)));
    rollforward[m.label] = total;
    rebuiltClosing = round2(rebuiltClosing + m.sign * total);
    const scheduleRow = input.arRollforward.find((r) => r.label === m.label);
    push(
      flag(
        {
          stage: "schedules",
          kind: "schedule-movement",
          lineItem: LINE_ITEMS.receivables,
          movement: m.label,
          description: `${m.label} on the trade receivables schedule does not agree with the classified journal lines.`,
          expected: total,
          actual: scheduleRow?.amount ?? 0,
          sources: [{ file: labels.arSchedule, sheet: "Rollforward", row: scheduleRow?.row }, ...lines.map((c) => c.lineRef)],
          restsOnUnconfirmed: lines.some((c) => !c.confirmed),
        },
        settings,
      ),
    );
  }
  rollforward["Closing balance"] = rebuiltClosing;
  const closingRestsOnUnconfirmed = classifications.some((c) => !c.confirmed);

  // Stage 1: the schedule's typed closing against its own opening plus the classified movements
  // (catches arithmetic errors and numbers typed over the closing formula).
  const scheduleOpening = input.arRollforward.find((r) => r.label === "Opening balance")?.amount ?? 0;
  const arClosing = closing(input.arRollforward);
  push(
    flag(
      {
        stage: "schedules",
        kind: "schedule-closing",
        lineItem: LINE_ITEMS.receivables,
        description: "Trade receivables schedule closing balance does not follow from its opening balance and the classified movements.",
        expected: round2(scheduleOpening + rebuiltClosing - opening),
        actual: arClosing?.amount ?? 0,
        sources: [{ file: labels.arSchedule, sheet: "Rollforward", row: arClosing?.row }],
        restsOnUnconfirmed: closingRestsOnUnconfirmed,
      },
      settings,
    ),
  );

  // Stage 2: each line-item schedule's closing balance against the TB.
  // Trade receivables is a debit balance; revenue is presented as a positive credit.
  for (const [lineItem, rollforward, file, sign] of [
    [LINE_ITEMS.receivables, input.arRollforward, labels.arSchedule, 1],
    [LINE_ITEMS.revenue, input.revenueRollforward, labels.revenueSchedule, -1],
  ] as const) {
    const tbRows = currentTb.filter((r) => r.lineItem === lineItem);
    const close = closing(rollforward);
    push(
      flag(
        {
          stage: "tb-and-cross-checks",
          kind: "schedule-vs-tb",
          lineItem,
          description: `${lineItem} schedule closing balance does not agree with the trial balance.`,
          expected: sign * sum(tbRows.map((r) => r.balance)),
          actual: close?.amount ?? 0,
          sources: [
            { file, sheet: "Rollforward", row: close?.row },
            ...tbRows.map((r): SourceRef => ({ file: labels.currentTb, sheet: "Trial balance", row: r.row })),
          ],
        },
        settings,
      ),
    );
  }

  // Stage 2: cross-check credit sales net of credit notes on the trade receivables schedule against
  // the receivables side of every revenue entry in the journal export.
  const revenueToReceivables = sum(
    [...byEntry.values()]
      .filter((lines) => lines.some((l) => revenueAccounts.has(l.account)))
      .flatMap((lines) => lines.filter((l) => arAccounts.has(l.account)).map((l) => l.amount)),
  );
  const salesClassified = classifications.filter((c) => c.category === "credit-sale" || c.category === "credit-note");
  push(
    flag(
      {
        stage: "tb-and-cross-checks",
        kind: "cross-check-revenue",
        lineItem: LINE_ITEMS.revenue,
        description: "Credit sales less credit notes on the trade receivables schedule do not agree with revenue entries posted to trade receivables.",
        expected: revenueToReceivables,
        actual: round2(rollforward["Credit sales"] - rollforward["Credit notes"]),
        sources: [{ file: labels.arSchedule, sheet: "Rollforward" }, { file: labels.journals, sheet: "Journal lines" }],
        restsOnUnconfirmed: salesClassified.some((c) => !c.confirmed),
      },
      settings,
    ),
  );

  // Stage 2: revenue credited against anything other than trade receivables or cash (ISA 240).
  for (const [entryNo, lines] of byEntry) {
    const revenueLines = lines.filter((l) => revenueAccounts.has(l.account));
    if (!revenueLines.length) continue;
    const others = lines.filter(
      (l) => !revenueAccounts.has(l.account) && !arAccounts.has(l.account) && !cashAccounts.has(l.account),
    );
    if (!others.length) continue;
    push(
      flag(
        {
          stage: "tb-and-cross-checks",
          kind: "revenue-unusual-account",
          lineItem: LINE_ITEMS.revenue,
          description: `Entry ${entryNo} credits revenue against ${others.map((o) => `${o.account} ${o.accountName}`).join(", ")} rather than trade receivables or cash.`,
          expected: 0,
          actual: sum(others.map((o) => o.amount)),
          sources: lines.map((l): SourceRef => ({ file: labels.journals, sheet: "Journal lines", row: l.row, entry: entryNo })),
        },
        settings,
      ),
    );
  }

  return { flags, classifications, rollforward, closingRestsOnUnconfirmed };
}

function strip(line: ReadJournalLine): JournalLine {
  const { entry, date, account, accountName, description, amount } = line;
  return { entry, date, account, accountName, description, amount };
}

export function groupByEntry<L extends { entry: string }>(lines: L[]) {
  const map = new Map<string, L[]>();
  for (const l of lines) {
    const list = map.get(l.entry) ?? [];
    list.push(l);
    map.set(l.entry, list);
  }
  return map;
}
