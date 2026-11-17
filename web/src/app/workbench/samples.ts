import type { Settings, Slot } from "@/lib/examination/types";

export const SAMPLE_FILE_NAMES: Record<Slot, string> = {
  priorYearTb: "prior-year-audited-tb.xlsx",
  currentTb: "current-tb.xlsx",
  journals: "journal-export.xlsx",
  arSchedule: "trade-receivables-schedule.xlsx",
  revenueSchedule: "revenue-schedule.xlsx",
  priorYearStatements: "prior-year-audited-statements.docx",
  clientStatements: "client-prepared-statements.docx",
};

export const SAMPLE_CLIENTS = [
  {
    id: "client-a",
    name: "Sample client A — Kestrel Supplies Ltd",
    blurb: "Its books don't agree, so the run stops before the statements and lists every difference.",
  },
  {
    id: "client-b",
    name: "Sample client B — Larkfield Components Ltd",
    blurb: "Its books agree, so the run reaches the Word statements and checks every amount.",
  },
] as const;

export const SAMPLE_SETTINGS: Settings = { performanceMateriality: 10000, clearlyTrivial: 500, yearEnd: "2026-12-31" };

export async function loadSample(clientId: string): Promise<Record<Slot, File>> {
  const entries = await Promise.all(
    (Object.entries(SAMPLE_FILE_NAMES) as [Slot, string][]).map(async ([slot, name]) => {
      const res = await fetch(`/samples/${clientId}/${name}`);
      if (!res.ok) throw new Error(`Could not load ${name}`);
      return [slot, new File([await res.blob()], name)] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<Slot, File>;
}
