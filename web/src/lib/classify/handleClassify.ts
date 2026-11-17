import type { ArCategory, UnplacedLine } from "@/lib/examination/types";
import { REVENUE_CYCLE_CATEGORIES, REVENUE_CYCLE_INSTRUCTIONS } from "@/skills/revenue-cycle/skill";

/** A language model: takes a system and user prompt, returns its raw text response (expected JSON). */
export type Model = (prompt: { system: string; user: string }) => Promise<string>;

export type ClassifyDeps = {
  model: Model;
  /** Whether the request comes from a signed-in user. */
  authorize: (request: Request) => Promise<boolean>;
};

export const MAX_LINES = 50;

type Suggestion = { id: string; category: ArCategory; reasoning: string };

function isUnplacedLine(x: unknown): x is UnplacedLine {
  const l = x as UnplacedLine;
  return !!l && typeof l.id === "string" && !!l.line && typeof l.line.entry === "string" && Array.isArray(l.entry);
}

function describe(l: UnplacedLine) {
  const side = (n: number) => (n > 0 ? `Dr ${n}` : `Cr ${-n}`);
  return [
    `Line ${l.id}: entry ${l.line.entry} dated ${l.line.date}, "${l.line.description}", ${side(l.line.amount)} to ${l.line.account} ${l.line.accountName}`,
    "Full entry:",
    ...l.entry.map((e) => `  ${e.account} ${e.accountName}: ${side(e.amount)} ("${e.description}")`),
  ].join("\n");
}

/** POST /api/classify: classifies trade receivables journal lines the rules couldn't place. */
export async function handleClassify(request: Request, deps: ClassifyDeps): Promise<Response> {
  if (!(await deps.authorize(request))) return Response.json({ error: "Sign in to classify journal lines." }, { status: 401 });

  let lines: UnplacedLine[];
  try {
    const body = await request.json();
    if (!Array.isArray(body?.lines) || !body.lines.every(isUnplacedLine)) throw new Error();
    lines = body.lines;
  } catch {
    return Response.json({ error: "Expected { lines: UnplacedLine[] }." }, { status: 400 });
  }
  if (lines.length > MAX_LINES) {
    return Response.json({ error: `At most ${MAX_LINES} lines per request.` }, { status: 400 });
  }
  if (!lines.length) return Response.json({ suggestions: [] });

  const raw = await deps.model({
    system: REVENUE_CYCLE_INSTRUCTIONS,
    user: lines.map(describe).join("\n\n"),
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return Response.json({ error: "The model's answer could not be read." }, { status: 502 });
  }
  const asked = new Set(lines.map((l) => l.id));
  const suggestions: Suggestion[] = [];
  for (const s of (parsed as { suggestions?: unknown[] })?.suggestions ?? []) {
    const { id, category, reasoning } = s as Record<string, unknown>;
    if (typeof id !== "string" || !asked.has(id)) continue;
    if (!REVENUE_CYCLE_CATEGORIES.includes(category as ArCategory)) continue;
    suggestions.push({ id, category: category as ArCategory, reasoning: typeof reasoning === "string" ? reasoning : "" });
  }
  return Response.json({ suggestions });
}
