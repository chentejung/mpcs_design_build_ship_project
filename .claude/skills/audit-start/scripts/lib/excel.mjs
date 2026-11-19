// Reads client workbooks through the confirmed column map, so scripts see the schedule template's
// column names whatever the client called them.
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { readJson } from "./common.mjs";

XLSX.set_fs(fs);

export { XLSX };

export function openWorkbook(file) {
  return XLSX.read(fs.readFileSync(file), { cellFormula: true });
}

/**
 * The column map for one file: { "Expected column": "Client's header" }.
 * column-map.json sits in the file's folder and is keyed by file name ("journals" for every
 * file in shared/journals/).
 */
export function columnMapFor(file) {
  const folder = path.dirname(file);
  const inJournals = path.basename(folder) === "journals";
  const mapFile = path.join(inJournals ? path.dirname(folder) : folder, "column-map.json");
  const all = readJson(mapFile, {});
  return all[inJournals ? "journals" : path.basename(file)] ?? {};
}

/** Picks the expected sheet, or the only sheet when the workbook has exactly one. */
function pickSheet(wb, name) {
  if (wb.Sheets[name]) return { ws: wb.Sheets[name], sheet: name };
  if (wb.SheetNames.length === 1) return { ws: wb.Sheets[wb.SheetNames[0]], sheet: wb.SheetNames[0] };
  return null;
}

/** Headers found in every sheet, for reporting column problems. */
export function headersOf(file) {
  const wb = openWorkbook(file);
  const out = {};
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null });
    out[name] = (rows[0] ?? []).filter((h) => h != null).map((h) => String(h).trim());
  }
  return out;
}

/**
 * Checks one sheet spec ({ name, columns, optionalColumns, required }) against a file.
 * Returns problems as plain sentences; an absent optional sheet is not a problem.
 */
export function checkSheet(file, spec) {
  const wb = openWorkbook(file);
  const picked = pickSheet(wb, spec.name);
  if (!picked) return spec.required === false ? [] : [`Missing sheet "${spec.name}" (sheets found: ${wb.SheetNames.join(", ")}).`];
  const map = columnMapFor(file);
  const header = headerRow(picked.ws);
  const missing = spec.columns.filter((c) => !header.includes(map[c] ?? c));
  return missing.length
    ? [`Sheet "${picked.sheet}" is missing column${missing.length > 1 ? "s" : ""} ${missing.map((m) => `"${m}"`).join(", ")} (headers found: ${header.join(", ")}).`]
    : [];
}

function headerRow(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  return (rows[0] ?? []).map((h) => (h == null ? "" : String(h).trim()));
}

/**
 * Reads a sheet into rows keyed by the template's column names. Each row carries its Excel
 * row number and, per column, whether the cell holds a formula.
 * Returns null when an optional sheet is absent; throws when a required one is.
 */
export function readTable(file, spec) {
  const wb = openWorkbook(file);
  const picked = pickSheet(wb, spec.name);
  if (!picked) {
    if (spec.required === false) return null;
    throw new Error(`${file}: missing sheet "${spec.name}".`);
  }
  const map = columnMapFor(file);
  const ws = picked.ws;
  const header = headerRow(ws);
  const wanted = [...spec.columns, ...(spec.optionalColumns ?? [])];
  const index = Object.fromEntries(wanted.map((c) => [c, header.indexOf(map[c] ?? c)]));
  const missing = spec.columns.filter((c) => index[c] < 0);
  if (missing.length) throw new Error(`${file}: sheet "${picked.sheet}" is missing ${missing.join(", ")}.`);
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const out = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const values = {};
    const formulas = {};
    let blank = true;
    for (const c of wanted) {
      if (index[c] < 0) {
        values[c] = null;
        continue;
      }
      const cell = ws[XLSX.utils.encode_cell({ r, c: index[c] })];
      values[c] = cell ? cell.v ?? null : null;
      formulas[c] = Boolean(cell?.f);
      if (values[c] != null && values[c] !== "") blank = false;
    }
    if (!blank) out.push({ row: r + 1, values, formulas });
  }
  return { sheet: picked.sheet, rows: out };
}

/** Blank stays blank (null), never zero; bracketed or leading-minus amounts are negative. */
export function parseAmount(cell) {
  if (cell == null) return null;
  if (typeof cell === "number") return cell;
  const s = String(cell).trim();
  if (s === "" || s === "-" || s === "–") return null;
  const negative = /^\(.*\)$/.test(s) || s.startsWith("-");
  const n = Number(s.replace(/[(),\s-]/g, ""));
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

export function toIsoDate(cell) {
  if (typeof cell === "number") {
    const d = XLSX.SSF.parse_date_code(cell);
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell ?? "").trim();
}
