import type { ArCategory, Classifier } from "@/lib/examination/types";

type Suggestion = { id: string; category: ArCategory; reasoning: string };

/**
 * Classifier that calls the server route, remembering earlier answers so re-running the
 * examination with the auditor's confirmations doesn't ask the model again.
 */
export function createBrowserClassifier(cache: Map<string, Suggestion>): Classifier {
  return async (lines) => {
    const key = (id: string, entry: string) => `${entry}:${id}`;
    const missing = lines.filter((l) => !cache.has(key(l.id, l.line.entry)));
    if (missing.length) {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: missing }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `The classification service answered ${res.status}.`);
      }
      const { suggestions } = (await res.json()) as { suggestions: Suggestion[] };
      for (const s of suggestions) {
        const line = missing.find((l) => l.id === s.id);
        if (line) cache.set(key(s.id, line.line.entry), s);
      }
    }
    return lines.flatMap((l) => {
      const s = cache.get(key(l.id, l.line.entry));
      return s ? [s] : [];
    });
  };
}
