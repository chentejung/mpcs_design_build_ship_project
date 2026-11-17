import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { ArCategory, Classifier, PackageFile, PackageFiles, Settings, Slot } from "../types";

const ROOT = path.resolve(__dirname, "../../../..");

const FILE_NAMES: Record<Slot, string> = {
  priorYearTb: "prior-year-audited-tb.xlsx",
  currentTb: "current-tb.xlsx",
  journals: "journal-export.xlsx",
  arSchedule: "trade-receivables-schedule.xlsx",
  revenueSchedule: "revenue-schedule.xlsx",
  priorYearStatements: "prior-year-audited-statements.docx",
  clientStatements: "client-prepared-statements.docx",
};

export type AnswerKey = {
  client: string;
  settings: Settings;
  outcome: "stopped" | "finished";
  plants: {
    id: string;
    description: string;
    flags: { stage: string; kind: string; lineItem: string; expected: number; difference: number; ranking: string }[];
  }[];
  unplacedLines: { entry: string; description: string; category: ArCategory }[];
};

/** The sample client's files exactly as a user would upload them. */
export function sampleFiles(client: string): PackageFiles {
  const files: PackageFiles = {};
  for (const [slot, name] of Object.entries(FILE_NAMES) as [Slot, string][]) {
    files[slot] = { name, data: fs.readFileSync(path.join(ROOT, "public", "samples", client, name)) };
  }
  return files;
}

export function answerKey(client: string): AnswerKey {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "samples", "answer-keys", `${client}.json`), "utf8"));
}

/** A fake classifier that answers from the answer key, as a perfect model would. */
export function answerKeyClassifier(key: AnswerKey): Classifier {
  return async (lines) =>
    lines.map((l) => {
      const known = key.unplacedLines.find((u) => u.entry === l.line.entry);
      if (!known) throw new Error(`Classifier asked about a line not in the answer key: ${l.line.entry}`);
      return { id: l.id, category: known.category, reasoning: `Answer key: ${known.description}` };
    });
}

/** Returns a copy of an Excel package file after applying an edit, as if the client had prepared it that way. */
export function editWorkbook(file: PackageFile, edit: (wb: XLSX.WorkBook) => void): PackageFile {
  const wb = XLSX.read(file.data, { type: "buffer", cellFormula: true });
  edit(wb);
  return { name: file.name, data: XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer };
}

/** Finds the row number (1-based) whose column A holds `label` on a sheet. */
export function rowOf(ws: XLSX.WorkSheet, label: string): number {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  const i = rows.findIndex((r) => r[0] === label);
  if (i < 0) throw new Error(`No row labelled ${label}`);
  return i + 1;
}
