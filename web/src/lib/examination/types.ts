export const SLOTS = {
  priorYearTb: "Prior-year audited trial balance",
  currentTb: "Current trial balance",
  journals: "Journal export",
  arSchedule: "Trade receivables line-item schedule",
  revenueSchedule: "Revenue line-item schedule",
  priorYearStatements: "Last year's audited statements",
  clientStatements: "Client-prepared statements",
} as const;

export type Slot = keyof typeof SLOTS;

export type PackageFile = { name: string; data: ArrayBuffer | Uint8Array };
export type PackageFiles = Partial<Record<Slot, PackageFile>>;

export type Settings = {
  performanceMateriality: number;
  clearlyTrivial: number;
  /** ISO date, e.g. "2026-12-31" */
  yearEnd: string;
};

export type ArCategory = "credit-sale" | "receipt" | "credit-note" | "write-off";

export type SourceRef = {
  file: string;
  sheet?: string;
  row?: number;
  entry?: string;
  caption?: string;
};

export type JournalLine = {
  entry: string;
  date: string;
  account: string;
  accountName: string;
  description: string;
  /** Debit positive, credit negative. */
  amount: number;
};

export type UnplacedLine = {
  id: string;
  line: JournalLine;
  /** Every line of the journal entry the unplaced line belongs to. */
  entry: JournalLine[];
};

export type Classifier = (
  lines: UnplacedLine[],
) => Promise<{ id: string; category: ArCategory; reasoning: string }[]>;

export type Stage = "opening" | "schedules" | "tb-and-cross-checks" | "statements";
export type Ranking = "above-performance-materiality" | "between-thresholds" | "clearly-trivial";

export type Flag = {
  stage: Stage;
  kind: string;
  lineItem?: string;
  /** Rollforward movement the flag concerns, e.g. "Cash receipts". */
  movement?: string;
  description: string;
  expected: number;
  actual: number;
  difference: number;
  ranking: Ranking;
  sources: SourceRef[];
  restsOnUnconfirmed: boolean;
};

export type Classification = {
  id: string;
  lineRef: SourceRef;
  line: JournalLine;
  category: ArCategory;
  by: "rule" | "agent" | "auditor";
  reasoning?: string;
  confirmed: boolean;
};

export type PackageProblem = { file: string; message: string };

export type ExaminationResult =
  | { outcome: "rejected"; problems: PackageProblem[] }
  | {
      outcome: "stopped" | "finished";
      flags: Flag[];
      classifications: Classification[];
      rebuilt: {
        rollforward: Record<string, number>;
        statements: Record<string, { current: number; comparative: number }>;
      };
      notExamined: string[];
    };
