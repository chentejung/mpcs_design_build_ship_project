// Trial balances, journals, the account mapping and the Word statements.
import fs from "node:fs";
import path from "node:path";
import mammoth from "mammoth";
import { readJson, round2 } from "./common.mjs";
import { parseAmount, readTable, toIsoDate } from "./excel.mjs";

const TB_SPEC = { name: "Trial balance", columns: ["Account", "Account name", "Debit", "Credit"], optionalColumns: ["Line item"] };
const JOURNAL_SPEC = { name: "Journal lines", columns: ["Entry number", "Date", "Account", "Account name", "Description", "Debit", "Credit"] };

/** Trial balance rows; balance is debit positive. */
export function readTb(file) {
  return readTable(file, TB_SPEC).rows.map(({ row, values }) => ({
    account: String(values.Account ?? "").trim(),
    name: String(values["Account name"] ?? "").trim(),
    lineItem: values["Line item"] == null ? null : String(values["Line item"]).trim() || null,
    balance: round2((parseAmount(values.Debit) ?? 0) - (parseAmount(values.Credit) ?? 0)),
    row,
  }));
}

/** Journal lines from a workbook (journal export or a line-item schedule); amount is debit positive. */
export function readJournalFile(file, label = path.basename(file)) {
  return readTable(file, JOURNAL_SPEC).rows.map(({ row, values }) => ({
    entry: String(values["Entry number"] ?? "").trim(),
    date: toIsoDate(values.Date),
    account: String(values.Account ?? "").trim(),
    accountName: String(values["Account name"] ?? "").trim(),
    description: String(values.Description ?? "").trim(),
    amount: round2((parseAmount(values.Debit) ?? 0) - (parseAmount(values.Credit) ?? 0)),
    file: label,
    row,
  }));
}

export function journalFiles(engDir) {
  const dir = path.join(engDir, "shared", "journals");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".xlsx") && !f.startsWith("~$"))
    .sort()
    .map((f) => path.join(dir, f));
}

export function readJournals(engDir) {
  return journalFiles(engDir).flatMap((f) => readJournalFile(f, `shared/journals/${path.basename(f)}`));
}

export function groupByEntry(lines) {
  const map = new Map();
  for (const l of lines) {
    if (!map.has(l.entry)) map.set(l.entry, []);
    map.get(l.entry).push(l);
  }
  return map;
}

const ALLOWANCE_NAME = /allowance|provision|doubtful|impair|expected credit|\becl\b/i;

/**
 * Resolves every TB account to a line item (and, for line items with components such as trade
 * receivables, to gross or loss allowance). Confirmed entries in shared/account-map.json win;
 * otherwise the TB's "Line item" column is the client's mapping. Anything still open is
 * returned as a pending proposal for the auditor.
 */
export function resolveAccounts(engDir, tbs, manifests) {
  const map = readJson(path.join(engDir, "shared", "account-map.json"), { accounts: {} }).accounts ?? {};
  const withComponents = new Map(
    manifests.cycles.flatMap((c) => c.lineItems.filter((li) => li.components).map((li) => [li.name, li.components])),
  );
  const accounts = new Map();
  const pending = [];
  for (const tb of tbs) {
    for (const r of tb) {
      if (accounts.has(r.account)) {
        const a = accounts.get(r.account);
        if (!a.lineItem && r.lineItem) a.lineItem = r.lineItem;
        continue;
      }
      accounts.set(r.account, { account: r.account, name: r.name, lineItem: r.lineItem, component: null, confirmed: false });
    }
  }
  for (const a of accounts.values()) {
    const m = map[a.account];
    if (m?.confirmed) {
      a.lineItem = m.lineItem;
      a.component = m.component ?? null;
      a.confirmed = true;
    }
    const components = withComponents.get(a.lineItem);
    if (!a.lineItem) {
      pending.push({ account: a.account, name: a.name, question: "line item", proposedLineItem: m?.lineItem ?? null });
      continue;
    }
    if (components && !a.component) {
      const proposed = ALLOWANCE_NAME.test(a.name) ? "loss-allowance" : "gross";
      a.component = proposed;
      pending.push({ account: a.account, name: a.name, question: "component", lineItem: a.lineItem, proposedComponent: proposed });
      continue;
    }
    if (!a.confirmed) a.confirmed = true; // the client's own TB mapping
  }
  return { accounts, pending };
}

export function accountsWhere(accounts, pred) {
  return new Set([...accounts.values()].filter(pred).map((a) => a.account));
}

export function balanceOf(tb, accountSet) {
  return round2(tb.filter((r) => accountSet.has(r.account)).reduce((s, r) => s + r.balance, 0));
}

// ---------------------------------------------------------------------------
// Word statements
// ---------------------------------------------------------------------------

export const STATEMENTS = {
  "Statement of financial position": [/^statement of financial position/i, /^balance sheet/i],
  "Statement of profit or loss": [/^statement of profit or loss/i, /^income statement/i, /^statement of comprehensive income/i],
};

const text = (html) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

/**
 * Reads the balance sheet and income statement from a Word file: each is the first table after a
 * heading that starts with its name; the two amount columns are found by their year headers.
 * Rows keep their order (totals are worked out from position).
 */
export async function readStatements(file, years) {
  const html = (await mammoth.convertToHtml({ path: file })).value;
  const headings = [...html.matchAll(/<(h\d|p)[^>]*>([\s\S]*?)<\/\1>/g)];
  const result = {};
  for (const [name, patterns] of Object.entries(STATEMENTS)) {
    const heading = headings.find((h) => patterns.some((p) => p.test(text(h[2]))));
    if (!heading) throw new Error(`${path.basename(file)}: no heading for "${name}".`);
    const after = html.slice(heading.index + heading[0].length);
    const table = after.match(/<table[^>]*>([\s\S]*?)<\/table>/);
    if (!table) throw new Error(`${path.basename(file)}: no table under "${name}".`);
    const rows = [...table[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
      [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1])),
    );
    const header = rows[0] ?? [];
    const cur = header.indexOf(String(years.current));
    const cmp = header.indexOf(String(years.comparative));
    if (cur < 0 || cmp < 0) {
      throw new Error(`${path.basename(file)}: "${name}" needs columns headed ${years.current} and ${years.comparative}; found ${header.filter(Boolean).join(", ")}.`);
    }
    result[name] = rows
      .slice(1)
      .map((r) => ({ caption: r[0], current: parseAmount(r[cur] ?? null), comparative: parseAmount(r[cmp] ?? null) }))
      .filter((r) => r.caption && (r.current != null || r.comparative != null));
  }
  return result;
}
