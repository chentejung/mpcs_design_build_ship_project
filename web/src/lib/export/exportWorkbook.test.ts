import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { examine } from "@/lib/examination/examine";
import { answerKey, answerKeyClassifier, sampleFiles } from "@/lib/examination/test-support/samples";
import { exportWorkbook } from "./exportWorkbook";

async function examined(client: string) {
  const key = answerKey(client);
  const result = await examine(sampleFiles(client), key.settings, answerKeyClassifier(key));
  if (result.outcome === "rejected") throw new Error("rejected");
  return result;
}

const sheetRows = (wb: XLSX.WorkBook, name: string) => XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name]);

describe("exportWorkbook", () => {
  it("writes every flag with its stage, amounts, difference and ranking", async () => {
    const result = await examined("client-a");
    const wb = XLSX.read(exportWorkbook(result));

    const flags = sheetRows(wb, "Flags");
    expect(flags).toHaveLength(result.flags.length);
    expect(flags).toContainEqual(
      expect.objectContaining({
        Stage: "TB and cross-checks",
        Check: "Revenue credited to an unusual account",
        "Line item": "Revenue",
        Expected: 0,
        Actual: 12000,
        Difference: 12000,
        Ranking: "Above performance materiality",
      }),
    );
  });

  it("writes the rebuilt rollforward and every classified journal line, marking unconfirmed ones", async () => {
    const result = await examined("client-b");
    const wb = XLSX.read(exportWorkbook(result));

    const rollforward = sheetRows(wb, "Rollforward");
    expect(rollforward).toContainEqual({ Movement: "Closing balance", Rebuilt: result.rebuilt.rollforward["Closing balance"] });

    const lines = sheetRows(wb, "Classified journal lines");
    expect(lines).toHaveLength(result.classifications.length);
    expect(lines.filter((l) => l.Confirmed === "No — agent suggestion")).toHaveLength(2);
  });
});
