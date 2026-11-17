import * as XLSX from "xlsx";
import { SLOTS, type JournalLine, type PackageFile, type PackageProblem, type Slot } from "./types";

export class PackageError extends Error {
  constructor(public problems: PackageProblem[]) {
    super(problems.map((p) => `${p.file}: ${p.message}`).join("\n"));
  }
}

function label(slot: Slot, file: PackageFile) {
  return `${SLOTS[slot]} (${file.name})`;
}

export function readWorkbook(slot: Slot, file: PackageFile) {
  try {
    return XLSX.read(file.data, { type: file.data instanceof ArrayBuffer ? "array" : "buffer" });
  } catch {
    throw new PackageError([{ file: label(slot, file), message: "Could not be read as an Excel workbook." }]);
  }
}

type Cell = string | number | null;

/** Reads a sheet whose first row is a header, returning one object per row keyed by header. */
export function readTable<H extends string>(
  slot: Slot,
  file: PackageFile,
  sheetName: string,
  headers: readonly H[],
): { row: number; values: Record<H, Cell> }[] {
  const wb = readWorkbook(slot, file);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new PackageError([{ file: label(slot, file), message: `Missing sheet "${sheetName}".` }]);
  const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, defval: null, raw: true });
  const header = (rows[0] ?? []).map((h) => (h == null ? "" : String(h).trim()));
  const missing = headers.filter((h) => !header.includes(h));
  if (missing.length) {
    throw new PackageError([
      {
        file: label(slot, file),
        message: `Sheet "${sheetName}" is missing column${missing.length > 1 ? "s" : ""} ${missing.map((m) => `"${m}"`).join(", ")}.`,
      },
    ]);
  }
  const out: { row: number; values: Record<H, Cell> }[] = [];
  rows.slice(1).forEach((r, i) => {
    if (r.every((c) => c == null || c === "")) return;
    const values = {} as Record<H, Cell>;
    for (const h of headers) values[h] = r[header.indexOf(h)] ?? null;
    out.push({ row: i + 2, values });
  });
  return out;
}

/** Parses an amount cell. Blank stays blank (null), never zero; bracketed amounts are negative. */
export function parseAmount(cell: Cell): number | null {
  if (cell == null) return null;
  if (typeof cell === "number") return cell;
  const s = cell.trim();
  if (s === "" || s === "-" || s === "–") return null;
  const negative = /^\(.*\)$/.test(s) || s.startsWith("-");
  const n = Number(s.replace(/[(),\s-]/g, ""));
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

export type TbRow = { account: string; name: string; lineItem: string; balance: number; row: number };

export function readTrialBalance(slot: Slot, file: PackageFile): TbRow[] {
  return readTable(slot, file, "Trial balance", ["Account", "Account name", "Line item", "Debit", "Credit"] as const).map(
    ({ row, values }) => ({
      account: String(values.Account ?? "").trim(),
      name: String(values["Account name"] ?? ""),
      lineItem: String(values["Line item"] ?? "").trim(),
      balance: (parseAmount(values.Debit) ?? 0) - (parseAmount(values.Credit) ?? 0),
      row,
    }),
  );
}

export type RollforwardRow = { label: string; amount: number | null; row: number };

export function readRollforward(slot: Slot, file: PackageFile): RollforwardRow[] {
  return readTable(slot, file, "Rollforward", ["Movement", "Amount"] as const).map(({ row, values }) => ({
    label: String(values.Movement ?? "").trim(),
    amount: parseAmount(values.Amount),
    row,
  }));
}

const JOURNAL_HEADERS = ["Entry number", "Date", "Account", "Account name", "Description", "Debit", "Credit"] as const;

export type ReadJournalLine = JournalLine & { row: number };

function toIsoDate(cell: Cell): string {
  if (typeof cell === "number") {
    const d = XLSX.SSF.parse_date_code(cell);
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  return String(cell ?? "").trim();
}

/** Reads journal lines from the journal export or a line-item schedule's "Journal lines" sheet. */
export function readJournalLines(slot: Slot, file: PackageFile): ReadJournalLine[] {
  return readTable(slot, file, "Journal lines", JOURNAL_HEADERS).map(({ row, values }) => ({
    entry: String(values["Entry number"] ?? "").trim(),
    date: toIsoDate(values.Date),
    account: String(values.Account ?? "").trim(),
    accountName: String(values["Account name"] ?? ""),
    description: String(values.Description ?? ""),
    amount: (parseAmount(values.Debit) ?? 0) - (parseAmount(values.Credit) ?? 0),
    row,
  }));
}
