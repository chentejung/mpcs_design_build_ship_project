import * as XLSX from "xlsx";
import { CATEGORY_LABELS, confirmationLabel, KIND_LABELS, RANKING_LABELS, STAGE_LABELS } from "@/lib/examination/labels";
import type { ExaminationResult, SourceRef } from "@/lib/examination/types";

type Examined = Exclude<ExaminationResult, { outcome: "rejected" }>;

export function describeSource(s: SourceRef) {
  return [s.file, s.sheet, s.row != null ? `row ${s.row}` : null, s.entry ? `entry ${s.entry}` : null, s.caption]
    .filter(Boolean)
    .join(" · ");
}

/** Writes the flags, the rebuilt rollforward and the classified journal lines to one workbook. */
export function exportWorkbook(result: Examined): Uint8Array {
  const wb = XLSX.utils.book_new();

  const flags = result.flags.map((f) => ({
    Stage: STAGE_LABELS[f.stage],
    Check: KIND_LABELS[f.kind] ?? f.kind,
    "Line item": f.lineItem ?? "",
    Movement: f.movement ?? "",
    Expected: f.expected,
    Actual: f.actual,
    Difference: f.difference,
    Ranking: RANKING_LABELS[f.ranking],
    "Rests on unconfirmed classifications": f.restsOnUnconfirmed ? "Yes" : "No",
    Description: f.description,
    Sources: f.sources.map(describeSource).join("\n"),
  }));
  XLSX.utils.book_append_sheet(
    wb,
    flags.length ? XLSX.utils.json_to_sheet(flags) : XLSX.utils.aoa_to_sheet([["No flags"]]),
    "Flags",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(Object.entries(result.rebuilt.rollforward).map(([Movement, Rebuilt]) => ({ Movement, Rebuilt }))),
    "Rollforward",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      result.classifications.map((c) => ({
        "Entry number": c.line.entry,
        Date: c.line.date,
        Account: c.line.account,
        Description: c.line.description,
        Debit: c.line.amount > 0 ? c.line.amount : null,
        Credit: c.line.amount < 0 ? -c.line.amount : null,
        Category: CATEGORY_LABELS[c.category],
        Confirmed: confirmationLabel(c),
        Reasoning: c.reasoning ?? "",
        "Schedule row": c.lineRef.row ?? "",
      })),
    ),
    "Classified journal lines",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      Object.entries(result.rebuilt.statements).map(([Caption, v]) => ({ Caption, Rebuilt: v.current, "Last year audited": v.comparative })),
    ),
    "Rebuilt statements",
  );

  return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
}
