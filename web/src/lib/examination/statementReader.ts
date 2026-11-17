import mammoth from "mammoth";
import { parseAmount, PackageError } from "./reader";

export type StatementName = "Statement of financial position" | "Statement of profit or loss";
export const STATEMENT_NAMES: StatementName[] = ["Statement of financial position", "Statement of profit or loss"];

export type PresentedStatement = Record<string, { current: number | null; comparative: number | null }>;
export type PresentedStatements = Record<StatementName, PresentedStatement>;

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

/**
 * Reads the balance sheet and income statement tables from a Word file: each statement is the
 * first table after a heading that starts with its name; columns are picked by their year header.
 */
export async function readStatements(
  fileLabel: string,
  data: ArrayBuffer | Uint8Array,
  years: { current: number; comparative: number },
): Promise<PresentedStatements> {
  let html: string;
  try {
    const input = data instanceof ArrayBuffer ? { arrayBuffer: data } : { buffer: data as Buffer };
    html = (await mammoth.convertToHtml(input as { arrayBuffer: ArrayBuffer })).value;
  } catch {
    throw new PackageError([{ file: fileLabel, message: "Could not be read as a Word document." }]);
  }

  const result = {} as PresentedStatements;
  for (const name of STATEMENT_NAMES) {
    const headings = [...html.matchAll(/<h\d[^>]*>([\s\S]*?)<\/h\d>/g)];
    const heading = headings.find((h) => text(h[1]).toLowerCase().startsWith(name.toLowerCase()));
    if (!heading) throw new PackageError([{ file: fileLabel, message: `No heading starting "${name}".` }]);
    const after = html.slice(heading.index! + heading[0].length);
    const table = after.match(/<table[^>]*>([\s\S]*?)<\/table>/);
    if (!table) throw new PackageError([{ file: fileLabel, message: `No table under "${name}".` }]);

    const rows = [...table[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
      [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1])),
    );
    const header = rows[0] ?? [];
    const currentCol = header.indexOf(String(years.current));
    const comparativeCol = header.indexOf(String(years.comparative));
    if (currentCol < 0 || comparativeCol < 0) {
      throw new PackageError([
        {
          file: fileLabel,
          message: `"${name}" should have columns headed ${years.current} and ${years.comparative}; found ${header.filter(Boolean).join(", ") || "none"}.`,
        },
      ]);
    }
    const statement: PresentedStatement = {};
    for (const row of rows.slice(1)) {
      const caption = row[0];
      if (!caption) continue;
      const current = parseAmount(row[currentCol] ?? null);
      const comparative = parseAmount(row[comparativeCol] ?? null);
      if (current == null && comparative == null) continue; // section header
      statement[caption] = { current, comparative };
    }
    result[name] = statement;
  }
  return result;
}
