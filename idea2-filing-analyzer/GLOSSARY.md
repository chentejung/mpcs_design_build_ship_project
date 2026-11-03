# Filing Analyzer

Explains the financial condition of a US SEC-filing company, centred on values that changed between the filings that reported them.

## Language

**Revised value**:
A reported amount for a given concept and period that differs between two filings reporting that same period.
_Avoid_: Restatement (that is only one cause), change, diff

**Revision cause**:
The classification of why a revised value differs: split adjustment, reclassification, standard adoption, or correction.
_Avoid_: Reason, type

**Split adjustment**:
A per-share revised value caused by a stock split or reverse split.

**Reclassification**:
A revised value caused by moving an amount between line items without changing totals in substance.

**Standard adoption**:
A revised value caused by retrospective application of a new accounting standard.

**Correction**:
A revised value caused by fixing an error in previously issued statements, whether a reissuance ("Big R") or a revision ("little r").
_Avoid_: Restatement (when the revision cause is not yet known)
