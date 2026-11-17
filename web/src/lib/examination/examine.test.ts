import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { examine } from "./examine";
import type { Classifier } from "./types";
import { answerKey, answerKeyClassifier, editWorkbook, rowOf, sampleFiles } from "./test-support/samples";

const settings = {
  performanceMateriality: 10000,
  clearlyTrivial: 500,
  yearEnd: "2026-12-31",
};

const noClassifier = async () => [];

describe("examine: reading the client package", () => {
  it("rejects a package with a missing file, naming the file, without producing flags", async () => {
    const result = await examine({}, settings, noClassifier);

    expect(result.outcome).toBe("rejected");
    if (result.outcome !== "rejected") return;
    expect(result.problems.map((p) => p.file)).toContain("Journal export");
    expect("flags" in result).toBe(false);
  });

  it("rejects a file with the wrong layout, naming the file and what is wrong, without producing flags", async () => {
    const key = answerKey("client-b");
    const files = sampleFiles("client-b");
    files.journals = editWorkbook(files.journals!, (wb) => {
      wb.Sheets["Journal lines"]["A1"].v = "Entry no.";
    });

    const result = await examine(files, key.settings, answerKeyClassifier(key));

    expect(result).toEqual({
      outcome: "rejected",
      problems: [{ file: expect.stringContaining("Journal export"), message: expect.stringContaining('"Entry number"') }],
    });
  });
});

describe("examine: sample client A (stops at stage 2)", () => {
  const key = answerKey("client-a");

  it("stops before examining the client-prepared statements", async () => {
    const result = await examine(sampleFiles("client-a"), key.settings, answerKeyClassifier(key));

    expect(result.outcome).toBe("stopped");
  });

  it("reports every stage 1-2 difference in the answer key, not just the first, and nothing from the statements", async () => {
    const result = await examine(sampleFiles("client-a"), key.settings, answerKeyClassifier(key));
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    for (const expected of key.plants.flatMap((p) => p.flags)) {
      expect(result.flags).toContainEqual(expect.objectContaining(expected));
    }
    expect(result.flags.filter((f) => f.stage === "statements")).toEqual([]);
  });
});

describe("examine: sample client B (reaches the statements)", () => {
  const key = answerKey("client-b");

  it("flags a clearly trivial difference without stopping, then catches the transposed figure on the statements", async () => {
    const result = await examine(sampleFiles("client-b"), key.settings, answerKeyClassifier(key));
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    expect(result.outcome).toBe("finished");
    for (const expected of key.plants.flatMap((p) => p.flags)) {
      expect(result.flags).toContainEqual(expect.objectContaining(expected));
    }
  });

  it("shows the rebuilt figures alongside the client's, with comparatives from last year's audited statements", async () => {
    const result = await examine(sampleFiles("client-b"), key.settings, answerKeyClassifier(key));
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));
    const transposed = key.plants.flatMap((p) => p.flags).find((f) => f.kind === "statement-amount")!;

    expect(result.rebuilt.statements["Trade receivables"]).toEqual({ current: transposed.expected, comparative: 46320 });
    expect(result.rebuilt.rollforward["Closing balance"]).toBe(transposed.expected);
  });

  it("says which statements it did not examine in v1", async () => {
    const result = await examine(sampleFiles("client-b"), key.settings, answerKeyClassifier(key));
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    expect(result.notExamined).toEqual(
      expect.arrayContaining(["Statement of cash flows", "Statement of changes in equity", "Notes"]),
    );
  });
});

describe.each(["client-a", "client-b"])("examine: %s against its answer key", (client) => {
  const key = answerKey(client);

  it("raises no flags beyond the planted misstatements", async () => {
    const result = await examine(sampleFiles(client), key.settings, answerKeyClassifier(key));
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    const pick = ({ stage, kind, lineItem, expected, difference, ranking }: (typeof result.flags)[number]) => ({
      stage, kind, lineItem, expected, difference, ranking,
    });
    expect(result.flags.map(pick)).toEqual(expect.arrayContaining(key.plants.flatMap((p) => p.flags)));
    expect(result.flags).toHaveLength(key.plants.flatMap((p) => p.flags).length);
    expect(result.outcome).toBe(key.outcome);
  });
});

describe("examine: classifying trade receivables journal lines", () => {
  const key = answerKey("client-b");

  it("places lines by rule and returns the ones the rules can't place as agent suggestions, unconfirmed", async () => {
    const result = await examine(sampleFiles("client-b"), key.settings, answerKeyClassifier(key));
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    const byAgent = result.classifications.filter((c) => c.by === "agent");
    expect(byAgent.map((c) => c.line.entry).sort()).toEqual(key.unplacedLines.map((u) => u.entry).sort());
    for (const c of byAgent) {
      expect(c.confirmed).toBe(false);
      expect(c.reasoning).toBeTruthy();
      expect(c.category).toBe(key.unplacedLines.find((u) => u.entry === c.line.entry)!.category);
    }
    const byRule = result.classifications.filter((c) => c.by === "rule");
    expect(byRule.length).toBeGreaterThan(100);
    expect(byRule.every((c) => c.confirmed)).toBe(true);
  });

  it("still completes when the classifier is unavailable, leaving those lines unconfirmed for the auditor", async () => {
    const unavailable: Classifier = async () => {
      throw new Error("model down");
    };

    const result = await examine(sampleFiles("client-b"), key.settings, unavailable);
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    const unplaced = result.classifications.filter((c) => !c.confirmed);
    expect(unplaced.map((c) => c.line.entry).sort()).toEqual(key.unplacedLines.map((u) => u.entry).sort());
    expect(unplaced.every((c) => /unavailable/i.test(c.reasoning ?? ""))).toBe(true);
  });

  it("flags movements that rest on an unconfirmed agent guess, and the auditor's confirmation changes the totals and clears them", async () => {
    const suspense = key.unplacedLines.find((u) => u.description.startsWith("Clear suspense"))!;
    const wrongGuess: Classifier = async (lines) =>
      lines.map((l) => ({
        id: l.id,
        category: l.line.entry === suspense.entry ? "write-off" : key.unplacedLines.find((u) => u.entry === l.line.entry)!.category,
        reasoning: "Guess",
      }));

    const guessed = await examine(sampleFiles("client-b"), key.settings, wrongGuess);
    if (guessed.outcome === "rejected") throw new Error(JSON.stringify(guessed.problems));
    const line = guessed.classifications.find((c) => c.line.entry === suspense.entry)!;
    const amount = -line.line.amount; // the credit to trade receivables

    const movements = guessed.flags.filter((f) => f.kind === "schedule-movement");
    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ movement: "Cash receipts", difference: amount, restsOnUnconfirmed: true }),
        expect.objectContaining({ movement: "Write-offs", difference: -amount, restsOnUnconfirmed: true }),
      ]),
    );
    expect(movements).toHaveLength(2);
    expect(guessed.outcome).toBe("stopped");

    const confirmed = await examine(sampleFiles("client-b"), key.settings, wrongGuess, { [line.id]: "receipt" });
    if (confirmed.outcome === "rejected") throw new Error(JSON.stringify(confirmed.problems));
    expect(confirmed.flags.filter((f) => f.kind === "schedule-movement")).toEqual([]);
    expect(confirmed.classifications.find((c) => c.id === line.id)).toMatchObject({ by: "auditor", category: "receipt", confirmed: true });
    expect(confirmed.rebuilt.rollforward["Cash receipts"] - guessed.rebuilt.rollforward["Cash receipts"]).toBe(amount);
    expect(confirmed.outcome).toBe("finished");
  });
});

describe("examine: line-item schedule checks", () => {
  const key = answerKey("client-b");
  const run = (files: ReturnType<typeof sampleFiles>) => examine(files, key.settings, answerKeyClassifier(key));

  it("flags an opening balance that differs from last year's audited closing balance", async () => {
    const files = sampleFiles("client-b");
    files.arSchedule = editWorkbook(files.arSchedule!, (wb) => {
      const ws = wb.Sheets["Rollforward"];
      const opening = ws[`B${rowOf(ws, "Opening balance")}`];
      const closing = ws[`B${rowOf(ws, "Closing balance")}`];
      opening.v += 200;
      closing.v += 200;
    });

    const result = await run(files);
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    expect(result.flags).toContainEqual(
      expect.objectContaining({ stage: "opening", kind: "opening-balance", lineItem: "Trade receivables", expected: 46320, actual: 46520, difference: 200 }),
    );
  });

  it("flags a closing balance typed over the formula that doesn't follow from the schedule's movements", async () => {
    const files = sampleFiles("client-b");
    files.arSchedule = editWorkbook(files.arSchedule!, (wb) => {
      const ws = wb.Sheets["Rollforward"];
      const ref = `B${rowOf(ws, "Closing balance")}`;
      ws[ref] = { t: "n", v: ws[ref].v + 900 }; // typed number, formula gone
    });

    const result = await run(files);
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    expect(result.flags).toContainEqual(
      expect.objectContaining({ stage: "schedules", kind: "schedule-closing", lineItem: "Trade receivables", difference: 900 }),
    );
    expect(result.outcome).toBe("stopped");
  });

  it("cross-checks credit sales on the trade receivables schedule against revenue entries posted to receivables", async () => {
    const files = sampleFiles("client-b");
    let invoiceAmount = 0;
    files.arSchedule = editWorkbook(files.arSchedule!, (wb) => {
      // The client left one invoice off the schedule and adjusted the rollforward to match.
      const lines = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Journal lines"], { header: 1 });
      const i = lines.findIndex((r) => String(r[4]).startsWith("Invoice"));
      invoiceAmount = Number(lines[i][5]);
      lines.splice(i, 1);
      wb.Sheets["Journal lines"] = XLSX.utils.aoa_to_sheet(lines);
      const ws = wb.Sheets["Rollforward"];
      ws[`B${rowOf(ws, "Credit sales")}`].v -= invoiceAmount;
      ws[`B${rowOf(ws, "Closing balance")}`].v -= invoiceAmount;
    });

    const result = await run(files);
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    expect(result.flags).toContainEqual(
      expect.objectContaining({ stage: "tb-and-cross-checks", kind: "cross-check-revenue", lineItem: "Revenue", difference: -invoiceAmount }),
    );
  });

  it("flags an unbalanced journal entry before anything else", async () => {
    const files = sampleFiles("client-b");
    let entryNo = "";
    files.journals = editWorkbook(files.journals!, (wb) => {
      const ws = wb.Sheets["Journal lines"];
      const lines = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
      const i = lines.findIndex((r) => r[4] === "Cash sales - counter" && r[6] != null); // the revenue credit
      entryNo = String(lines[i][0]);
      ws[XLSX.utils.encode_cell({ r: i, c: 6 })].v += 100;
    });

    const result = await run(files);
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));

    expect(result.flags[0]).toMatchObject({ stage: "schedules", kind: "unbalanced-entry", difference: 100 });
    expect(result.flags[0].sources.every((s) => s.entry === entryNo)).toBe(true);
  });
});
