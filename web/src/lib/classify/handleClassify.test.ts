import { describe, expect, it, vi } from "vitest";
import type { UnplacedLine } from "@/lib/examination/types";
import { handleClassify, type Model } from "./handleClassify";

const suspenseLine: UnplacedLine = {
  id: "ar-row-40",
  line: { entry: "JE0083", date: "2026-04-08", account: "1100", accountName: "Trade receivables control", description: "Clear suspense - remittance identified as Lim Trading", amount: -1500 },
  entry: [
    { entry: "JE0083", date: "2026-04-08", account: "2900", accountName: "Suspense", description: "Clear suspense - remittance identified as Lim Trading", amount: 1500 },
    { entry: "JE0083", date: "2026-04-08", account: "1100", accountName: "Trade receivables control", description: "Clear suspense - remittance identified as Lim Trading", amount: -1500 },
  ],
};

const post = (body: unknown) =>
  new Request("http://localhost/api/classify", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

const signedIn = async () => true;

describe("handleClassify", () => {
  it("returns only a category and reasoning for each line, never amounts", async () => {
    const model: Model = async () =>
      JSON.stringify({ suggestions: [{ id: "ar-row-40", category: "receipt", reasoning: "Suspense cleared to the customer: a receipt.", amount: 999 }] });

    const res = await handleClassify(post({ lines: [suspenseLine] }), { model, authorize: signedIn });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      suggestions: [{ id: "ar-row-40", category: "receipt", reasoning: "Suspense cleared to the customer: a receipt." }],
    });
  });

  it("gives the model the revenue cycle skill and the full journal entry behind each line", async () => {
    const model = vi.fn<Model>(async () => JSON.stringify({ suggestions: [] }));

    await handleClassify(post({ lines: [suspenseLine] }), { model, authorize: signedIn });

    const prompt = model.mock.calls[0][0];
    expect(prompt.system).toMatch(/credit-sale.*receipt.*credit-note.*write-off/s);
    expect(prompt.user).toContain("2900");
    expect(prompt.user).toContain("Suspense");
  });

  it("drops suggestions outside the four categories or for lines it wasn't asked about", async () => {
    const model: Model = async () =>
      JSON.stringify({
        suggestions: [
          { id: "ar-row-40", category: "refund", reasoning: "?" },
          { id: "ar-row-99", category: "receipt", reasoning: "Not asked." },
        ],
      });

    const res = await handleClassify(post({ lines: [suspenseLine] }), { model, authorize: signedIn });

    expect(await res.json()).toEqual({ suggestions: [] });
  });

  it("refuses visitors who aren't signed in, without calling the model", async () => {
    const model = vi.fn<Model>();

    const res = await handleClassify(post({ lines: [suspenseLine] }), { model, authorize: async () => false });

    expect(res.status).toBe(401);
    expect(model).not.toHaveBeenCalled();
  });

  it("refuses malformed requests and more lines than one run can need, without calling the model", async () => {
    const model = vi.fn<Model>();

    const bad = await handleClassify(post({ nope: true }), { model, authorize: signedIn });
    const tooMany = await handleClassify(post({ lines: Array.from({ length: 51 }, (_, i) => ({ ...suspenseLine, id: `ar-row-${i}` })) }), {
      model,
      authorize: signedIn,
    });

    expect(bad.status).toBe(400);
    expect(tooMany.status).toBe(400);
    expect(model).not.toHaveBeenCalled();
  });
});
