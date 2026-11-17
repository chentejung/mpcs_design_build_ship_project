import { flag, round2 } from "./ranking";
import type { ReadJournalLine } from "./reader";
import { groupByEntry } from "./revenueCycle";
import type { Flag, Settings } from "./types";

/** Every journal entry must balance: debits = credits. difference = credits − debits. */
export function unbalancedEntries(journals: ReadJournalLine[], file: string, settings: Settings): Flag[] {
  const flags: Flag[] = [];
  for (const [entryNo, lines] of groupByEntry(journals)) {
    const debits = round2(lines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0));
    const credits = round2(-lines.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0));
    const f = flag(
      {
        stage: "schedules",
        kind: "unbalanced-entry",
        description: `Journal entry ${entryNo} does not balance: debits ${debits}, credits ${credits}.`,
        expected: debits,
        actual: credits,
        sources: lines.map((l) => ({ file, sheet: "Journal lines", row: l.row, entry: entryNo })),
      },
      settings,
    );
    if (f) flags.push(f);
  }
  return flags;
}
