"use client";

import { useRef, useState } from "react";
import { examine } from "@/lib/examination/examine";
import { SLOTS, type ArCategory, type ExaminationResult, type Settings, type Slot } from "@/lib/examination/types";
import { createBrowserClassifier } from "./browserClassifier";
import { Results } from "./Results";
import { loadSample, SAMPLE_CLIENTS, SAMPLE_FILE_NAMES, SAMPLE_SETTINGS } from "./samples";

type Suggestion = { id: string; category: ArCategory; reasoning: string };

const STEPS = [
  ["Opening balances", "Each line-item schedule's opening balance against last year's audited closing balance."],
  [
    "Line-item schedules",
    "Every journal entry balances; each trade receivables journal line is classified by the other side of its entry; the gross rollforward is rebuilt and compared with the schedule.",
  ],
  ["TB and cross-checks", "Each schedule against the trial balance; credit sales against revenue; revenue credited to unusual accounts."],
  ["Stop rule", "Any difference above clearly trivial so far stops the run: you get every difference, and the statements aren't examined."],
  ["Client-prepared statements", "Otherwise every amount on the balance sheet and income statement in the Word file is compared with the rebuilt statements and last year's audited figures."],
] as const;

export function Workbench() {
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({});
  const [settings, setSettings] = useState<Settings>(SAMPLE_SETTINGS);
  const [packageName, setPackageName] = useState<string | null>(null);
  const [result, setResult] = useState<ExaminationResult | null>(null);
  const [confirmations, setConfirmations] = useState<Record<string, ArCategory>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const suggestionCache = useRef(new Map<string, Suggestion>());

  async function run(
    useFiles: Partial<Record<Slot, File>>,
    useSettings: Settings,
    useConfirmations: Record<string, ArCategory>,
    { keepResults = false } = {},
  ) {
    setBusy(true);
    setError(null);
    // A new package or settings: clear the old results so they can't be mistaken for this run's.
    if (!keepResults) setResult(null);
    setStatus("Reading the files and running the checks…");
    const classify = createBrowserClassifier(suggestionCache.current);
    try {
      const packageFiles = Object.fromEntries(
        await Promise.all(
          (Object.entries(useFiles) as [Slot, File][]).map(async ([slot, file]) => [
            slot,
            { name: file.name, data: await file.arrayBuffer() },
          ]),
        ),
      );
      const r = await examine(
        packageFiles,
        useSettings,
        async (lines) => {
          setStatus(
            `The AI is classifying ${lines.length} journal line${lines.length === 1 ? "" : "s"} the rules couldn't place. This can take up to a minute…`,
          );
          return classify(lines);
        },
        useConfirmations,
      );
      setResult(r);
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  async function trySample(clientId: string, name: string) {
    setBusy(true);
    setError(null);
    setResult(null);
    setStatus(`Loading ${name}…`);
    try {
      const sample = await loadSample(clientId);
      suggestionCache.current.clear();
      setFiles(sample);
      setSettings(SAMPLE_SETTINGS);
      setPackageName(name);
      setConfirmations({});
      await run(sample, SAMPLE_SETTINGS, {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
      setStatus(null);
    }
  }

  function chooseFile(slot: Slot, file: File | undefined) {
    const next = { ...files };
    if (file) next[slot] = file;
    else delete next[slot];
    setFiles(next);
    setPackageName("Your package");
    setResult(null);
    setConfirmations({});
    suggestionCache.current.clear();
  }

  function confirm(next: Record<string, ArCategory>) {
    setConfirmations(next);
    void run(files, settings, next, { keepResults: true });
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Examine a client&apos;s revenue cycle</h1>
          <p className="text-slate-600">
            Load a year-end package and get one ranked list of flags. Every amount is recomputed by deterministic code; the AI
            only suggests categories for journal lines the rules can&apos;t place, and you confirm them.
          </p>
          <ol className="space-y-2 text-sm">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white">{i + 1}</span>
                <span>
                  <span className="font-medium">{title}.</span> <span className="text-slate-600">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-semibold">Try a sample client</h2>
          <p className="text-sm text-slate-600">Synthetic companies with planted misstatements. No confidential data needed.</p>
          {SAMPLE_CLIENTS.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => trySample(c.id, c.name)}
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {c.name} →
              </button>
              <p className="mt-2 text-xs text-slate-600">{c.blurb}</p>
              <details className="mt-1 text-xs">
                <summary className="cursor-pointer text-slate-500">Download its files to see the layouts</summary>
                <ul className="mt-1 list-disc pl-5">
                  {(Object.entries(SAMPLE_FILE_NAMES) as [Slot, string][]).map(([slot, name]) => (
                    <li key={slot}>
                      <a className="text-blue-700 underline" href={`/samples/${c.id}/${name}`} download>
                        {SLOTS[slot]}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold">Or upload your own package</h2>
        <p className="mb-4 text-sm text-slate-600">
          Files are read in your browser and never stored on a server. Use the same layouts as the sample files.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(SLOTS) as Slot[]).map((slot) => (
            <label key={slot} className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{SLOTS[slot]}</span>
              <input
                type="file"
                accept={slot.endsWith("Statements") ? ".docx" : ".xlsx,.xls"}
                onChange={(e) => chooseFile(slot, e.target.files?.[0])}
                className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5"
              />
              {files[slot] && <span className="text-xs text-slate-500">Loaded: {files[slot]!.name}</span>}
            </label>
          ))}
        </div>

        <h3 className="mt-6 font-medium">Settings</h3>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <NumberField
            label="Performance materiality"
            value={settings.performanceMateriality}
            onChange={(v) => setSettings({ ...settings, performanceMateriality: v })}
          />
          <NumberField
            label="Clearly trivial threshold"
            value={settings.clearlyTrivial}
            onChange={(v) => setSettings({ ...settings, clearlyTrivial: v })}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Year-end</span>
            <input
              type="date"
              value={settings.yearEnd}
              onChange={(e) => setSettings({ ...settings, yearEnd: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(files, settings, confirmations)}
          className="mt-5 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {busy ? "Examining…" : result ? "Re-run examination" : "Run examination"}
        </button>
        {packageName && <span className="ml-3 text-sm text-slate-500">Package: {packageName}</span>}
      </section>

      {status && (
        <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
          {status}
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {result && (
        <section id="results">
          <Results result={result} settings={settings} confirmations={confirmations} onConfirm={confirm} busy={busy} />
        </section>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-slate-300 px-2 py-1.5"
      />
    </label>
  );
}
