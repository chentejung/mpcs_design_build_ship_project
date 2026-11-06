# Financial-statement drafting assistant: confirmed direction

## User decision

The user chose to start with **automating financial-statement drafts using skills and orchestration**. Their stated technical focus is understanding existing workbook rules and Excel formulas, keeping spreadsheets updated while preserving their logic, and detecting anomalies.

This supersedes treating the accountant-versus-auditor choice as the immediate blocker. The working product identity is an auditor assistant. Exact first users, reporting jurisdiction, supported workbook features, statement coverage and pilot acceptance criteria remain open.

## Workflow context supplied by the user

A workbook has multiple source tabs containing company journals or transaction exports. Formulas on a main tab retrieve and calculate results from those tabs. Auditors update the source data without changing the agreed main-tab calculations, then perform difference analysis.

## Recommended design — not yet approved implementation

### Make workbook understanding explicit

Maintain a versioned workbook profile containing editable input ranges, protected formulas, source mappings, period semantics, dependency relationships, output destinations and validation checks. Separate reusable accounting skills from client-specific workbook configuration.

Classify each rule by provenance:

- **Observed:** a formula, table definition, named range, existing validation rule or explicit instruction.
- **Inferred:** an agent's hypothesis about the meaning of a range, calculation or accounting treatment.
- **Confirmed:** a mapping or rule accepted by an authorized reviewer.

Do not silently promote an inferred rule to an approved accounting policy. Preserving an existing formula does not establish its correctness, completeness or current-period applicability.

### Proposed sequence

1. Inspect the workbook without modification and inventory features, inputs, formulas, outputs and dependencies.
2. Have agents propose semantic labels, source mappings and explanations; confirm ambiguities needed for execution.
3. Create a baseline from the prior approved workbook and retain unresolved baseline errors.
4. Prepare and validate proposed source updates against the workbook profile.
5. Apply controlled updates to a new copy, then recalculate using an engine compatible with supported workbook features.
6. Check formula preservation, reference coverage, source completeness and reconciliation results.
7. Run analysis on a fixed validated version; distinguish numerical changes, workbook errors and potential accounting anomalies.
8. Populate draft statements from validated outputs and a confirmed presentation mapping; mark missing information and unresolved disclosures.
9. Present changed data, affected outputs, evidence and unresolved items for auditor review.

A corrected source must invalidate affected calculations, analysis, draft content and prior approvals as appropriate. Repeated execution must not duplicate data or adjustments.

### Anomaly categories

- Input problems: duplicate records, missing periods, changed schemas, missing expected files, incompatible signs/currencies.
- Workbook problems: broken references, overwritten formulas, stale calculated values, new rows outside formula ranges, changed external dependencies.
- Accounting differences: schedules not agreeing, unexplained movements, unusual entries, changes needing investigation. These are not automatically misstatements.
- Draft inconsistencies: statement figures disagreeing with validated workbook outputs, stale comparative labels or narrative, missing disclosure inputs.

### Boundaries for initial proof

Recommend one permitted workbook family, one reporting framework, a defined statement package and explicit treatment of macros/external links/unsupported features. These scope choices remain pending.

Demonstrate baseline reproduction plus normal refresh, added rows/accounts, changed columns, missing input, late corrected data, and repeat execution. Measure correctness, missed anomalies, unnecessary flags, formula/layout preservation, source traceability and total auditor review effort.

## Relationship to earlier plan

The earlier Revenue/AR prototype is a possible first accounting skill, not yet a sufficient specification for the newly chosen financial-statement drafting outcome. The broader drafting workflow needs confirmed mappings and inputs for its declared statement coverage. No implementation has been authorized or completed in this discussion.
