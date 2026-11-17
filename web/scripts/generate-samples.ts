/**
 * Generates the two v1 sample clients from a small balanced double-entry ledger.
 *
 *   npx tsx scripts/generate-samples.ts
 *
 * Writes the client files to public/samples/<client>/ (served to users) and the
 * answer keys to samples/answer-keys/<client>.json (test oracle, not served).
 *
 * The generator works forwards (entries → TB, schedules, statements); the tool
 * works backwards from the files. Every planted misstatement is a literal entry
 * or edit defined below, and its expected difference is recorded from that
 * definition, never by re-running the tool's logic.
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

// ---------------------------------------------------------------------------
// Chart of accounts and statement layout
// ---------------------------------------------------------------------------

type Account = { code: string; name: string; lineItem: string };

const ACCOUNTS: Account[] = [
  { code: "1000", name: "Cash at bank", lineItem: "Cash and cash equivalents" },
  { code: "1100", name: "Trade receivables control", lineItem: "Trade receivables" },
  { code: "1200", name: "Inventory", lineItem: "Inventories" },
  { code: "1500", name: "Property, plant and equipment", lineItem: "Property, plant and equipment" },
  { code: "2000", name: "Trade payables", lineItem: "Trade and other payables" },
  { code: "2100", name: "Other payables", lineItem: "Trade and other payables" },
  { code: "2900", name: "Suspense", lineItem: "Trade and other payables" },
  { code: "3000", name: "Share capital", lineItem: "Share capital" },
  { code: "3100", name: "Retained earnings", lineItem: "Retained earnings" },
  { code: "4000", name: "Revenue", lineItem: "Revenue" },
  { code: "5000", name: "Cost of sales", lineItem: "Cost of sales" },
  { code: "6000", name: "Administrative expenses", lineItem: "Administrative expenses" },
  { code: "6100", name: "Impairment losses on trade receivables", lineItem: "Impairment losses on trade receivables" },
];
const account = (code: string) => {
  const a = ACCOUNTS.find((x) => x.code === code);
  if (!a) throw new Error(`Unknown account ${code}`);
  return a;
};
const PNL = new Set(["4000", "5000", "6000", "6100"]);

type Caption = { caption: string; side?: "debit" | "credit"; header?: boolean; total?: string[] };

const BALANCE_SHEET: Caption[] = [
  { caption: "Assets", header: true },
  { caption: "Property, plant and equipment", side: "debit" },
  { caption: "Inventories", side: "debit" },
  { caption: "Trade receivables", side: "debit" },
  { caption: "Cash and cash equivalents", side: "debit" },
  { caption: "Total assets", total: ["Property, plant and equipment", "Inventories", "Trade receivables", "Cash and cash equivalents"] },
  { caption: "Equity and liabilities", header: true },
  { caption: "Share capital", side: "credit" },
  { caption: "Retained earnings", side: "credit" },
  { caption: "Trade and other payables", side: "credit" },
  { caption: "Total equity and liabilities", total: ["Share capital", "Retained earnings", "Trade and other payables"] },
];

const INCOME_STATEMENT: Caption[] = [
  { caption: "Revenue", side: "credit" },
  { caption: "Cost of sales", side: "credit" },
  { caption: "Gross profit", total: ["Revenue", "Cost of sales"] },
  { caption: "Administrative expenses", side: "credit" },
  { caption: "Impairment losses on trade receivables", side: "credit" },
  { caption: "Profit for the year", total: ["Gross profit", "Administrative expenses", "Impairment losses on trade receivables"] },
];

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

type Line = { account: string; amount: number }; // debit positive
type Entry = { no?: string; date: string; description: string; lines: Line[] };

/** Balances are debit positive. */
type Balances = Record<string, number>;

/** Prior-year (2025) audited pre-closing trial balance. Retained earnings is the 2025 opening figure. */
const PY_TB: Balances = {
  "1000": 38400,
  "1100": 46320,
  "1200": 27500,
  "1500": 60000,
  "2000": -21750,
  "2100": 0,
  "2900": 0,
  "3000": -50000,
  "3100": -35120,
  "4000": -412300,
  "5000": 248600,
  "6000": 96200,
  "6100": 2150,
};

/** 2024 figures, shown only as comparatives on last year's audited statements. */
const PY2_TB: Balances = {
  "1000": 12370,
  "1100": 41050,
  "1200": 24800,
  "1500": 26800,
  "2000": -19900,
  "2100": 0,
  "2900": 0,
  "3000": -50000,
  "3100": 17280, // 2024 opening retained earnings (debit = accumulated loss); closes to -35,120
  "4000": -371900,
  "5000": 226400,
  "6000": 91300,
  "6100": 1800,
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUSTOMERS = ["Harbour Foods", "Lim Trading", "Ashgrove Retail", "Pemberton & Sons", "Coastline Hotels", "Brightwater Cafe"];

function iso(month: number, day: number) {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function entry(date: string, description: string, ...pairs: [string, number][]): Entry {
  return { date, description, lines: pairs.map(([account, amount]) => ({ account, amount })) };
}

/** The 2026 books every sample client shares in shape; the seed varies the amounts. */
function baseLedger(seed: number): Entry[] {
  const rand = mulberry32(seed);
  const between = (lo: number, hi: number, step = 10) => Math.round((lo + rand() * (hi - lo)) / step) * step;
  const entries: Entry[] = [];
  let lastMonthSales = 46320;

  for (let m = 1; m <= 12; m++) {
    // Receipts against last month's sales (and the opening balance in January).
    let toCollect = Math.round((lastMonthSales * 0.93) / 10) * 10;
    let r = 0;
    while (toCollect > 0) {
      const amt = Math.min(toCollect, between(2500, 9000));
      const c = CUSTOMERS[(m + r) % CUSTOMERS.length];
      entries.push(entry(iso(m, 3 + r * 3), `Receipt - ${c}`, ["1000", amt], ["1100", -amt]));
      toCollect -= amt;
      r++;
    }

    // Credit sales.
    let monthSales = 0;
    for (let i = 0; i < 8; i++) {
      const amt = between(1000, 9000);
      const c = CUSTOMERS[(m * 3 + i) % CUSTOMERS.length];
      entries.push(entry(iso(m, 2 + i * 3), `Invoice INV-${m}${String(i + 1).padStart(2, "0")} - ${c}`, ["1100", amt], ["4000", -amt]));
      monthSales += amt;
    }

    // Cash sales.
    for (let i = 0; i < 3; i++) {
      const amt = between(200, 1500);
      entries.push(entry(iso(m, 6 + i * 8), `Cash sales - counter`, ["1000", amt], ["4000", -amt]));
    }

    // Credit notes every other month.
    if (m % 2 === 0) {
      const amt = between(200, 800);
      const c = CUSTOMERS[m % CUSTOMERS.length];
      entries.push(entry(iso(m, 20), `Credit note CN-${m} - ${c}`, ["4000", amt], ["1100", -amt]));
      monthSales -= amt;
    }

    // Purchases, cost of sales, supplier payments, overheads, depreciation.
    const purchases = between(22000, 28000, 100);
    entries.push(entry(iso(m, 5), "Inventory purchases", ["1200", purchases], ["2000", -purchases]));
    const cos = Math.round((monthSales * 0.6) / 10) * 10;
    entries.push(entry(iso(m, 28), "Cost of sales for the month", ["5000", cos], ["1200", -cos]));
    const pay = Math.round((purchases * 0.98) / 100) * 100;
    entries.push(entry(iso(m, 15), "Payment to suppliers", ["2000", pay], ["1000", -pay]));
    const admin = between(6500, 8500);
    entries.push(entry(iso(m, 25), "Salaries and office costs", ["6000", admin], ["1000", -admin]));
    entries.push(entry(iso(m, 28), "Depreciation", ["6000", 500], ["1500", -500]));

    lastMonthSales = monthSales;
  }

  // Write-off of an irrecoverable balance.
  entries.push(entry(iso(11, 30), "Write-off - Brightwater Cafe (liquidation)", ["6100", 1850], ["1100", -1850]));

  // Journal lines the rules can't place (other side is not revenue, cash, or bad debts).
  entries.push(entry(iso(3, 11), "Unidentified bank receipt", ["1000", 1500], ["2900", -1500]));
  entries.push(entry(iso(4, 8), "Clear suspense - remittance identified as Lim Trading", ["2900", 1500], ["1100", -1500]));
  entries.push(entry(iso(6, 19), "Dishonoured cheque - Harbour Foods", ["1100", 2000], ["1000", -2000]));

  return entries;
}

/** The true category of each journal line the rules can't place, keyed by description. */
const UNPLACED = [
  { description: "Clear suspense - remittance identified as Lim Trading", category: "receipt" },
  { description: "Dishonoured cheque - Harbour Foods", category: "receipt" },
] as const;

function number(entries: Entry[]) {
  entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  entries.forEach((e, i) => (e.no = `JE${String(i + 1).padStart(4, "0")}`));
  for (const e of entries) {
    const sum = e.lines.reduce((s, l) => s + l.amount, 0);
    if (sum !== 0) throw new Error(`Unbalanced entry ${e.no}: ${e.description}`);
  }
}

function closingTb(entries: Entry[]): Balances {
  const pyProfit = -[...PNL].reduce((s, a) => s + PY_TB[a], 0);
  const tb: Balances = {};
  for (const a of ACCOUNTS) tb[a.code] = PNL.has(a.code) ? 0 : PY_TB[a.code];
  tb["3100"] = PY_TB["3100"] - pyProfit;
  for (const e of entries) for (const l of e.lines) tb[l.account] += l.amount;
  return tb;
}

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

type Figures = Record<string, number>; // caption → presented amount

function statementFigures(tb: Balances): Figures {
  const byLineItem: Record<string, number> = {};
  for (const a of ACCOUNTS) byLineItem[a.lineItem] = (byLineItem[a.lineItem] ?? 0) + tb[a.code];
  const profit = -[...PNL].reduce((s, a) => s + tb[a], 0);
  const f: Figures = {};
  for (const c of [...BALANCE_SHEET, ...INCOME_STATEMENT]) {
    if (c.header) continue;
    if (c.total) f[c.caption] = c.total.reduce((s, x) => s + f[x], 0);
    else f[c.caption] = c.side === "debit" ? byLineItem[c.caption] : -byLineItem[c.caption];
  }
  f["Retained earnings"] += profit;
  f["Total equity and liabilities"] += profit;
  if (f["Total assets"] !== f["Total equity and liabilities"]) throw new Error("Balance sheet does not balance");
  if (f["Profit for the year"] !== profit) throw new Error("Profit does not agree");
  return f;
}

function fmt(n: number) {
  const s = Math.abs(n).toLocaleString("en-GB");
  return n < 0 ? `(${s})` : s;
}

function statementTable(layout: Caption[], current: Figures, comparative: Figures, years: [number, number]) {
  const cell = (text: string, opts: { bold?: boolean; right?: boolean } = {}) =>
    new TableCell({
      children: [
        new Paragraph({
          alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [new TextRun({ text, bold: opts.bold })],
        }),
      ],
    });
  const rows = [
    new TableRow({ children: [cell(""), cell(String(years[0]), { bold: true, right: true }), cell(String(years[1]), { bold: true, right: true })] }),
    ...layout.map((c) =>
      c.header
        ? new TableRow({ children: [cell(c.caption, { bold: true }), cell(""), cell("")] })
        : new TableRow({
            children: [
              cell(c.caption, { bold: !!c.total }),
              cell(fmt(current[c.caption]), { right: true, bold: !!c.total }),
              cell(fmt(comparative[c.caption]), { right: true, bold: !!c.total }),
            ],
          }),
    ),
  ];
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
}

async function statementsDocx(company: string, years: [number, number], current: Figures, comparative: Figures, label: string) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: company, heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `${label} for the year ended 31 December ${years[0]}` }),
          new Paragraph({ text: "Amounts in CU" }),
          new Paragraph({ text: `Statement of financial position as at 31 December ${years[0]}`, heading: HeadingLevel.HEADING_1 }),
          statementTable(BALANCE_SHEET, current, comparative, years),
          new Paragraph({ text: `Statement of profit or loss for the year ended 31 December ${years[0]}`, heading: HeadingLevel.HEADING_1 }),
          statementTable(INCOME_STATEMENT, current, comparative, years),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

// ---------------------------------------------------------------------------
// Excel files
// ---------------------------------------------------------------------------

function xlsx(sheets: Record<string, XLSX.WorkSheet>) {
  const wb = XLSX.utils.book_new();
  for (const [name, ws] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, ws, name);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function tbSheet(tb: Balances) {
  return XLSX.utils.aoa_to_sheet([
    ["Account", "Account name", "Line item", "Debit", "Credit"],
    ...ACCOUNTS.map((a) => [a.code, a.name, a.lineItem, tb[a.code] > 0 ? tb[a.code] : null, tb[a.code] < 0 ? -tb[a.code] : null]),
  ]);
}

const JOURNAL_HEADER = ["Entry number", "Date", "Account", "Account name", "Description", "Debit", "Credit"];

function journalRows(entries: Entry[], only?: string) {
  const rows: (string | number | null)[][] = [];
  for (const e of entries)
    for (const l of e.lines)
      if (!only || l.account === only)
        rows.push([e.no!, e.date, l.account, account(l.account).name, e.description, l.amount > 0 ? l.amount : null, l.amount < 0 ? -l.amount : null]);
  return rows;
}

function rollforwardSheet(rows: [string, number][], closingFormula: string) {
  const ws = XLSX.utils.aoa_to_sheet([["Movement", "Amount"], ...rows.map(([l, v]) => [l, v]), ["Closing balance", null]]);
  const closingRow = rows.length + 2;
  const value = closingFormula
    .split(/(?=[+-])/)
    .reduce((s, term) => {
      const sign = term.startsWith("-") ? -1 : 1;
      const r = Number(term.replace(/[+-]?B/, ""));
      return s + sign * rows[r - 2][1];
    }, 0);
  ws[`B${closingRow}`] = { t: "n", v: value, f: closingFormula };
  return ws;
}

// ---------------------------------------------------------------------------
// Sample clients
// ---------------------------------------------------------------------------

/** `expected` (the reference amount) is filled in from the forward ledger once the books are built. */
type ExpectedFlag = { stage: string; kind: string; lineItem: string; expected?: number; difference: number; ranking: string };
type Plant = { id: string; description: string; flags: ExpectedFlag[] };

type ClientSpec = {
  id: string;
  company: string;
  seed: number;
  outcome: "stopped" | "finished";
  /** Extra entries posted to the books. */
  extraEntries: Entry[];
  /** Descriptions of entries the client left off a line-item schedule. */
  omitFromArSchedule: string[];
  omitFromRevenueSchedule: string[];
  transposeTradeReceivables: boolean;
  plants: Plant[];
};

const SETTINGS = { performanceMateriality: 10000, clearlyTrivial: 500, yearEnd: "2026-12-31" };

function rank(diff: number) {
  const d = Math.abs(diff);
  return d > SETTINGS.performanceMateriality ? "above-performance-materiality" : d > SETTINGS.clearlyTrivial ? "between-thresholds" : "clearly-trivial";
}

const CLIENTS: ClientSpec[] = [
  {
    id: "client-a",
    company: "Kestrel Supplies Ltd",
    seed: 11,
    outcome: "stopped",
    extraEntries: [
      entry(iso(12, 18), "Receipt - Coastline Hotels (December remittance)", ["1000", 7800], ["1100", -7800]),
      entry(iso(12, 31), "Year-end revenue adjustment per MD", ["2100", 12000], ["4000", -12000]),
      entry(iso(8, 14), "Cash sale - sundry", ["1000", 40], ["4000", -40]),
    ],
    omitFromArSchedule: ["Receipt - Coastline Hotels (December remittance)"],
    omitFromRevenueSchedule: ["Cash sale - sundry"],
    transposeTradeReceivables: false,
    plants: [
      {
        id: "A1",
        description: "A December receipt of 7,800 is missing from the trade receivables schedule, so its closing balance is 7,800 higher than the TB.",
        flags: [{ stage: "tb-and-cross-checks", kind: "schedule-vs-tb", lineItem: "Trade receivables", difference: 7800, ranking: "between-thresholds" }],
      },
      {
        id: "A2",
        description: "Revenue of 12,000 credited against Other payables (not trade receivables or cash) as a year-end adjustment.",
        flags: [{ stage: "tb-and-cross-checks", kind: "revenue-unusual-account", lineItem: "Revenue", difference: 12000, ranking: "above-performance-materiality" }],
      },
      {
        id: "A3",
        description: "A cash sale of 40 is missing from the revenue schedule (clearly trivial).",
        flags: [{ stage: "tb-and-cross-checks", kind: "schedule-vs-tb", lineItem: "Revenue", difference: -40, ranking: "clearly-trivial" }],
      },
    ],
  },
  {
    id: "client-b",
    company: "Larkfield Components Ltd",
    seed: 23,
    outcome: "finished",
    extraEntries: [entry(iso(9, 3), "Cash sale - sundry", ["1000", 35], ["4000", -35])],
    omitFromArSchedule: [],
    omitFromRevenueSchedule: ["Cash sale - sundry"],
    transposeTradeReceivables: true,
    plants: [
      {
        id: "B1",
        description: "A cash sale of 35 is missing from the revenue schedule (clearly trivial, so the run continues).",
        flags: [{ stage: "tb-and-cross-checks", kind: "schedule-vs-tb", lineItem: "Revenue", difference: -35, ranking: "clearly-trivial" }],
      },
      // B2 (transposed trade receivables on the balance sheet) is added once the true figure is known.
    ],
  },
];

function transpose(n: number): number {
  const digits = String(n).split("");
  for (let i = 0; i < digits.length - 1; i++) {
    if (digits[i] === digits[i + 1]) continue;
    const swapped = [...digits];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    const candidate = Number(swapped.join(""));
    const d = Math.abs(candidate - n);
    if (d > SETTINGS.clearlyTrivial && d <= SETTINGS.performanceMateriality) return candidate;
  }
  throw new Error(`No suitable transposition for ${n}`);
}

async function generate(spec: ClientSpec, root: string) {
  const entries = [...baseLedger(spec.seed), ...spec.extraEntries];
  number(entries);
  const tb = closingTb(entries);

  const outDir = path.join(root, "public", "samples", spec.id);
  fs.mkdirSync(outDir, { recursive: true });
  const write = (name: string, data: Buffer) => fs.writeFileSync(path.join(outDir, name), data);

  write("prior-year-audited-tb.xlsx", xlsx({ "Trial balance": tbSheet(PY_TB) }));
  write("current-tb.xlsx", xlsx({ "Trial balance": tbSheet(tb) }));
  write("journal-export.xlsx", xlsx({ "Journal lines": XLSX.utils.aoa_to_sheet([JOURNAL_HEADER, ...journalRows(entries)]) }));

  // Trade receivables schedule, as the client prepared it.
  const arEntries = entries.filter((e) => !spec.omitFromArSchedule.includes(e.description));
  const arLines = arEntries.flatMap((e) => e.lines.filter((l) => l.account === "1100").map((l) => ({ e, l })));
  const trueCategory = (e: Entry): string => {
    const other = e.lines.find((l) => l.account !== "1100")!.account;
    const unplaced = UNPLACED.find((u) => u.description === e.description);
    if (unplaced) return unplaced.category;
    return other === "4000" ? (e.lines.find((l) => l.account === "1100")!.amount > 0 ? "credit-sale" : "credit-note") : other === "1000" ? "receipt" : "write-off";
  };
  const sumBy = (cat: string) => arLines.filter(({ e }) => trueCategory(e) === cat).reduce((s, { l }) => s + l.amount, 0);
  write(
    "trade-receivables-schedule.xlsx",
    xlsx({
      "Journal lines": XLSX.utils.aoa_to_sheet([JOURNAL_HEADER, ...journalRows(arEntries, "1100")]),
      Rollforward: rollforwardSheet(
        [
          ["Opening balance", PY_TB["1100"]],
          ["Credit sales", sumBy("credit-sale")],
          ["Cash receipts", -sumBy("receipt")],
          ["Credit notes", -sumBy("credit-note")],
          ["Write-offs", -sumBy("write-off")],
        ],
        "B2+B3-B4-B5-B6",
      ),
    }),
  );

  // Revenue schedule, as the client prepared it.
  const revEntries = entries.filter((e) => !spec.omitFromRevenueSchedule.includes(e.description));
  const revLines = revEntries.flatMap((e) => e.lines.filter((l) => l.account === "4000"));
  write(
    "revenue-schedule.xlsx",
    xlsx({
      "Journal lines": XLSX.utils.aoa_to_sheet([JOURNAL_HEADER, ...journalRows(revEntries, "4000")]),
      Rollforward: rollforwardSheet(
        [
          ["Opening balance", 0],
          ["Revenue recognised", -revLines.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0)],
          ["Credit notes", revLines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0)],
        ],
        "B2+B3-B4",
      ),
    }),
  );

  // Statements.
  const py = statementFigures(PY_TB);
  const py2 = statementFigures(PY2_TB);
  const cy = statementFigures(tb);
  const plants = [...spec.plants];
  const presented = { ...cy };
  if (spec.transposeTradeReceivables) {
    presented["Trade receivables"] = transpose(cy["Trade receivables"]);
    const difference = presented["Trade receivables"] - cy["Trade receivables"];
    plants.push({
      id: "B2",
      description: `Trade receivables on the balance sheet typed as ${fmt(presented["Trade receivables"])} instead of ${fmt(cy["Trade receivables"])} (transposed digits); totals are correct.`,
      flags: [{ stage: "statements", kind: "statement-amount", lineItem: "Trade receivables", difference, ranking: rank(difference) }],
    });
  }
  const referenceAmount = (f: ExpectedFlag): number => {
    if (f.kind === "schedule-vs-tb") return f.lineItem === "Revenue" ? -tb["4000"] : tb["1100"];
    if (f.kind === "revenue-unusual-account") return 0;
    if (f.kind === "statement-amount") return cy[f.lineItem];
    throw new Error(`No reference amount for ${f.kind}`);
  };
  for (const p of plants) for (const f of p.flags) f.expected = referenceAmount(f);
  write("prior-year-audited-statements.docx", await statementsDocx(spec.company, [2025, 2024], py, py2, "Audited financial statements"));
  write("client-prepared-statements.docx", await statementsDocx(spec.company, [2026, 2025], presented, py, "Financial statements (client-prepared)"));

  const answerKey = {
    client: spec.id,
    company: spec.company,
    settings: SETTINGS,
    outcome: spec.outcome,
    plants,
    unplacedLines: UNPLACED.map((u) => ({
      entry: entries.find((e) => e.description === u.description)!.no,
      description: u.description,
      category: u.category,
    })),
  };
  const keyDir = path.join(root, "samples", "answer-keys");
  fs.mkdirSync(keyDir, { recursive: true });
  fs.writeFileSync(path.join(keyDir, `${spec.id}.json`), JSON.stringify(answerKey, null, 2) + "\n");
  console.log(`${spec.id}: ${entries.length} entries, AR closing ${tb["1100"]}, revenue ${-tb["4000"]}, ${plants.length} planted misstatements`);
}

async function main() {
  const root = path.resolve(__dirname, "..");
  for (const spec of CLIENTS) await generate(spec, root);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
