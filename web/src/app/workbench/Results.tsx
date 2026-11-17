"use client";

import { useState } from "react";
import { describeSource, exportWorkbook } from "@/lib/export/exportWorkbook";
import { CATEGORY_LABELS, KIND_LABELS, RANKING_LABELS, STAGE_LABELS, confirmationLabel } from "@/lib/examination/labels";
import type { ArCategory, ExaminationResult, Flag, Ranking, Settings, Stage } from "@/lib/examination/types";

const RANK_ORDER: Ranking[] = ["above-performance-materiality", "between-thresholds", "clearly-trivial"];
const STAGE_ORDER: Stage[] = ["opening", "schedules", "tb-and-cross-checks", "statements"];
const RANK_STYLE: Record<Ranking, string> = {
  "above-performance-materiality": "bg-red-100 text-red-800",
  "between-thresholds": "bg-amber-100 text-amber-800",
  "clearly-trivial": "bg-slate-100 text-slate-700",
};

const fmt = (n: number) => {
  const s = Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 2 });
  return n < 0 ? `(${s})` : s;
};

type Props = {
  result: ExaminationResult;
  settings: Settings;
  confirmations: Record<string, ArCategory>;
  onConfirm: (confirmations: Record<string, ArCategory>) => void;
  busy: boolean;
};

export function Results({ result, settings, confirmations, onConfirm, busy }: Props) {
  if (result.outcome === "rejected") {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-5">
        <h2 className="font-semibold text-red-900">The package can&apos;t be examined yet</h2>
        <p className="mt-1 text-sm text-red-800">Fix these files and run again. No flags were produced.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">
          {result.problems.map((p, i) => (
            <li key={i}>
              <span className="font-medium">{p.file}:</span> {p.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const flags = [...result.flags].sort(
    (a, b) => RANK_ORDER.indexOf(a.ranking) - RANK_ORDER.indexOf(b.ranking) || STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
  );
  const stopping = result.flags.filter((f) => f.stage !== "statements" && Math.abs(f.difference) > settings.clearlyTrivial);
  const pending = result.classifications.filter((c) => !c.confirmed);

  function download() {
    if (result.outcome === "rejected") return;
    const blob = new Blob([exportWorkbook(result) as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-workbench-flags.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      {result.outcome === "stopped" ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-5">
          <h2 className="text-lg font-semibold text-red-900">Stopped before the client-prepared statements</h2>
          <p className="mt-1 text-sm text-red-800">
            {stopping.length} difference{stopping.length === 1 ? "" : "s"} above the clearly trivial threshold ({fmt(settings.clearlyTrivial)}) in
            opening balances, line-item schedules, the TB or cross-checks. The statements would be built on books that don&apos;t agree, so
            they were not examined. Send the client every query below, then re-run with the corrected package.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <h2 className="text-lg font-semibold text-emerald-900">Finished: the statements were examined</h2>
          <p className="mt-1 text-sm text-emerald-800">
            Stages 1–2 had no difference above clearly trivial, so every amount on the balance sheet and income statement was compared.{" "}
            {result.flags.length} flag{result.flags.length === 1 ? "" : "s"} below.
          </p>
        </div>
      )}

      {pending.length > 0 && <Confirmations result={result} confirmations={confirmations} onConfirm={onConfirm} busy={busy} />}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Flags ({flags.length})</h2>
          <button type="button" onClick={download} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Download Excel
          </button>
        </div>
        <p className="text-sm text-slate-600">
          Ranked against performance materiality ({fmt(settings.performanceMateriality)}) and clearly trivial ({fmt(settings.clearlyTrivial)}).
          Difference = client&apos;s figure − expected.
        </p>
        {flags.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No flags.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Ranking</th>
                  <th className="pr-3">Stage</th>
                  <th className="pr-3">Check</th>
                  <th className="pr-3 text-right">Expected</th>
                  <th className="pr-3 text-right">Client</th>
                  <th className="pr-3 text-right">Difference</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f, i) => (
                  <FlagRow key={i} flag={f} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Rebuilt trade receivables rollforward</h2>
          <p className="text-sm text-slate-600">From last year&apos;s audited opening balance and the classified journal lines.</p>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {Object.entries(result.rebuilt.rollforward).map(([label, v]) => (
                <tr key={label} className="border-b last:border-0">
                  <td className="py-1.5">{label}</td>
                  <td className="text-right tabular-nums">{fmt(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Rebuilt statements</h2>
          <p className="text-sm text-slate-600">
            The tool&apos;s expectation for this year, beside last year&apos;s audited figures. Revenue-cycle lines come from the rebuilt
            rollforward; other lines are summed from the TB.
          </p>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th />
                <th className="text-right">Rebuilt</th>
                <th className="text-right">Last year</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.rebuilt.statements).map(([caption, v]) => (
                <tr key={caption} className="border-b last:border-0">
                  <td className="py-1.5">{caption}</td>
                  <td className="text-right tabular-nums">{fmt(v.current)}</td>
                  <td className="text-right tabular-nums text-slate-500">{fmt(v.comparative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
        <h2 className="font-semibold">Not examined in this run</h2>
        <ul className="mt-2 list-disc pl-5">
          {result.notExamined.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="mt-2 text-slate-600">
          Balance sheet and income statement lines outside the revenue cycle are only agreed to the TB; v1 has no deep checks for them.
        </p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">All classified journal lines ({result.classifications.length})</summary>
        <table className="mt-2 w-full">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-1">Entry</th>
              <th>Date</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
              <th className="pl-3">Category</th>
              <th>Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {result.classifications.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-1">{c.line.entry}</td>
                <td>{c.line.date}</td>
                <td>{c.line.description}</td>
                <td className="text-right tabular-nums">{fmt(c.line.amount)}</td>
                <td className="pl-3">{CATEGORY_LABELS[c.category]}</td>
                <td>{confirmationLabel(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function FlagRow({ flag: f }: { flag: Flag }) {
  return (
    <tr className="border-b align-top last:border-0">
      <td className="py-2 pr-3">
        <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${RANK_STYLE[f.ranking]}`}>{RANKING_LABELS[f.ranking]}</span>
      </td>
      <td className="pr-3 text-slate-600">{STAGE_LABELS[f.stage]}</td>
      <td className="pr-3">
        <div className="font-medium">{KIND_LABELS[f.kind] ?? f.kind}</div>
        <div className="text-xs text-slate-500">{[f.lineItem, f.movement].filter(Boolean).join(" · ")}</div>
        {f.restsOnUnconfirmed && (
          <div className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-800">Rests on unconfirmed classifications</div>
        )}
      </td>
      <td className="pr-3 text-right tabular-nums">{fmt(f.expected)}</td>
      <td className="pr-3 text-right tabular-nums">{fmt(f.actual)}</td>
      <td className="pr-3 text-right font-medium tabular-nums">{fmt(f.difference)}</td>
      <td className="max-w-md">
        <div>{f.description}</div>
        {f.sources.length > 0 && (
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Sources ({f.sources.length})</summary>
            <ul className="mt-1 space-y-0.5">
              {f.sources.slice(0, 50).map((s, i) => (
                <li key={i}>{describeSource(s)}</li>
              ))}
              {f.sources.length > 50 && <li>… and {f.sources.length - 50} more (see the Excel download)</li>}
            </ul>
          </details>
        )}
      </td>
    </tr>
  );
}

function Confirmations({
  result,
  confirmations,
  onConfirm,
  busy,
}: {
  result: Exclude<ExaminationResult, { outcome: "rejected" }>;
  confirmations: Record<string, ArCategory>;
  onConfirm: (c: Record<string, ArCategory>) => void;
  busy: boolean;
}) {
  const pending = result.classifications.filter((c) => !c.confirmed);
  const [choices, setChoices] = useState<Record<string, ArCategory>>(() =>
    Object.fromEntries(pending.map((c) => [c.id, c.category])),
  );

  return (
    <div className="rounded-xl border border-purple-300 bg-purple-50 p-5">
      <h2 className="text-lg font-semibold text-purple-900">Classifications awaiting your confirmation ({pending.length})</h2>
      <p className="mt-1 text-sm text-purple-900">
        The rules couldn&apos;t place these trade receivables journal lines, so the AI suggested a category. Until you confirm, any amount that
        depends on them is marked as resting on unconfirmed classifications.
      </p>
      <ul className="mt-3 space-y-3">
        {pending.map((c) => (
          <li key={c.id} className="rounded-lg border border-purple-200 bg-white p-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">
                {c.line.entry} · {c.line.date} · {c.line.description}
              </span>
              <span className="tabular-nums">{fmt(c.line.amount)}</span>
            </div>
            <p className="mt-1 text-slate-600">
              <span className="font-medium">
                {c.reasoning?.startsWith("The AI classifier") ? "No AI suggestion" : `AI suggestion: ${CATEGORY_LABELS[c.category]}`}.
              </span>{" "}
              {c.reasoning}
            </p>
            <label className="mt-2 flex items-center gap-2">
              <span>Your classification:</span>
              <select
                value={choices[c.id]}
                onChange={(e) => setChoices({ ...choices, [c.id]: e.target.value as ArCategory })}
                className="rounded-md border border-slate-300 px-2 py-1"
              >
                {(Object.keys(CATEGORY_LABELS) as ArCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={busy}
        onClick={() => onConfirm({ ...confirmations, ...choices })}
        className="mt-4 rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
      >
        {busy ? "Re-running…" : "Confirm and re-run"}
      </button>
    </div>
  );
}
