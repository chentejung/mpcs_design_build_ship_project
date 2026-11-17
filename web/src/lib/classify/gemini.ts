import type { Model } from "./handleClassify";

const DEFAULT_MODELS = "gemini-3.8-flash,gemini-3.5-flash-lite";
const RETRYABLE = new Set([429, 500, 503]);

/**
 * Gemini via its REST API. The key stays on the server (GEMINI_API_KEY).
 * GEMINI_MODEL is a comma-separated list tried in order: a busy model (429/5xx) is retried once,
 * then the next model is used; a retired model (404) is skipped.
 */
export const geminiModel: Model = async ({ system, user }) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  const models = (process.env.GEMINI_MODEL || DEFAULT_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
  const failures: string[] = [];

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      });
      if (res.ok) {
        const body = await res.json();
        return body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      }
      failures.push(`${model} ${res.status}`);
      if (!RETRYABLE.has(res.status)) break;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw new Error(`Gemini unavailable (${failures.join(", ")})`);
};
