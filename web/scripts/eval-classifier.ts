/**
 * Hand-run eval: real Gemini on the journal lines the rules can't place, measured against the
 * sample clients' answer keys. Synthetic data only.
 *
 *   npm run eval:classifier        (reads GEMINI_API_KEY / GEMINI_MODEL from .env)
 */
import { examine } from "@/lib/examination/examine";
import { answerKey, sampleFiles } from "@/lib/examination/test-support/samples";
import { geminiModel } from "@/lib/classify/gemini";
import { handleClassify } from "@/lib/classify/handleClassify";
import type { Classifier } from "@/lib/examination/types";

const viaRoute: Classifier = async (lines) => {
  const res = await handleClassify(
    new Request("http://local/api/classify", { method: "POST", body: JSON.stringify({ lines }) }),
    { model: geminiModel, authorize: async () => true },
  );
  if (!res.ok) throw new Error(`classify answered ${res.status}: ${JSON.stringify(await res.json())}`);
  return (await res.json()).suggestions;
};

async function main() {
  let right = 0;
  let total = 0;
  console.log(`Models: ${process.env.GEMINI_MODEL || "default list"}\n`);
  for (const client of ["client-a", "client-b"]) {
    const key = answerKey(client);
    const result = await examine(sampleFiles(client), key.settings, viaRoute);
    if (result.outcome === "rejected") throw new Error(JSON.stringify(result.problems));
    for (const u of key.unplacedLines) {
      const c = result.classifications.find((x) => x.line.entry === u.entry);
      const fromModel = c?.by === "agent" && !c.reasoning?.startsWith("The AI classifier");
      const ok = fromModel && c?.category === u.category;
      total++;
      if (ok) right++;
      console.log(`${ok ? "✓" : "✗"} ${client} ${u.entry} "${u.description}"\n   expected ${u.category}, got ${c?.category}: ${c?.reasoning}\n`);
    }
  }
  console.log(`Accuracy: ${right}/${total}`);
  if (right < total) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
