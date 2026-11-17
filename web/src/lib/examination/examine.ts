import { PackageError, readJournalLines, readRollforward, readTrialBalance } from "./reader";
import { unbalancedEntries } from "./journalChecks";
import { examineRevenueCycle, type Confirmations } from "./revenueCycle";
import { readStatements, STATEMENT_NAMES } from "./statementReader";
import { compareStatements, rebuildStatements } from "./statements";
import {
  SLOTS,
  type Classifier,
  type ExaminationResult,
  type PackageFile,
  type PackageFiles,
  type Settings,
  type Slot,
} from "./types";

export async function examine(
  files: PackageFiles,
  settings: Settings,
  classifier: Classifier,
  confirmations: Confirmations = {},
): Promise<ExaminationResult> {
  const missing = (Object.keys(SLOTS) as Slot[]).filter((slot) => !files[slot]);
  if (missing.length) {
    return {
      outcome: "rejected",
      problems: missing.map((slot) => ({ file: SLOTS[slot], message: "File is missing." })),
    };
  }
  const f = files as Record<Slot, PackageFile>;
  const label = (slot: Slot) => `${SLOTS[slot]} (${f[slot].name})`;

  try {
    const year = Number(settings.yearEnd.slice(0, 4));
    const currentTb = readTrialBalance("currentTb", f.currentTb);
    const journals = readJournalLines("journals", f.journals);
    const revenue = await examineRevenueCycle(
      {
        priorYearTb: readTrialBalance("priorYearTb", f.priorYearTb),
        currentTb,
        journals,
        arLines: readJournalLines("arSchedule", f.arSchedule),
        arRollforward: readRollforward("arSchedule", f.arSchedule),
        revenueRollforward: readRollforward("revenueSchedule", f.revenueSchedule),
        labels: {
          priorYearTb: label("priorYearTb"),
          currentTb: label("currentTb"),
          journals: label("journals"),
          arSchedule: label("arSchedule"),
          revenueSchedule: label("revenueSchedule"),
        },
      },
      settings,
      classifier,
      confirmations,
    );
    const flags = [...unbalancedEntries(journals, label("journals"), settings), ...revenue.flags];
    const stopped = flags.some((fl) => Math.abs(fl.difference) > settings.clearlyTrivial);

    const rebuilt = rebuildStatements(currentTb, { "Trade receivables": revenue.rollforward["Closing balance"] });
    const priorYear = await readStatements(label("priorYearStatements"), f.priorYearStatements.data, {
      current: year - 1,
      comparative: year - 2,
    });
    const statements: Record<string, { current: number; comparative: number }> = {};
    for (const name of STATEMENT_NAMES) {
      for (const [caption, current] of Object.entries(rebuilt)) {
        const audited = priorYear[name][caption];
        if (audited) statements[caption] = { current, comparative: audited.current ?? 0 };
      }
    }

    if (!stopped) {
      const presented = await readStatements(label("clientStatements"), f.clientStatements.data, {
        current: year,
        comparative: year - 1,
      });
      flags.push(
        ...compareStatements(presented, priorYear, rebuilt, { client: label("clientStatements") }, settings, (caption) =>
          revenue.closingRestsOnUnconfirmed && caption === "Trade receivables",
        ),
      );
    }

    return {
      outcome: stopped ? "stopped" : "finished",
      flags,
      classifications: revenue.classifications,
      rebuilt: { rollforward: revenue.rollforward, statements },
      notExamined: [
        ...(stopped ? STATEMENT_NAMES : []),
        "Statement of cash flows",
        "Statement of changes in equity",
        "Notes",
      ],
    };
  } catch (err) {
    if (err instanceof PackageError) return { outcome: "rejected", problems: err.problems };
    throw err;
  }
}
