# Excel workpaper updates and drafted financial statements: competitive workflow research

Research date: 2026-11-06. User question: can existing software update quarterly/annual accounting spreadsheets and produce draft financial statements, how does it work, and where does the proposed product stand?

## Answer and evidence standard

Yes: substantial parts of this workflow are established product capabilities. Engagement systems, linked reporting platforms, and newer AI workpaper products all overlap the idea. The evidence does **not** establish a universal product that safely interprets every arbitrary workbook, completes every audit procedure and produces fully reviewed statements without setup or intervention.

This is primary-source desk research: operational help pages are prioritized; vendor announcements are labeled as claims. No product was tested hands-on, no pricing comparison was established, and no market gap was proved. Packages, reporting frameworks, regions, versions and release status matter.

## Clarify the task

Three kinds of work are currently grouped together:

1. **Period rollover:** copy the engagement into a new period, shift comparative columns, update dates, retain reusable structure and reset period-specific evidence/sign-offs.
2. **Data refresh and recomputation:** import new balances and activity, update linked schedules, calculate movements and identify differences.
3. **Statement preparation and review:** populate statement lines and notes, add information beyond ledger balances, review presentation, adjustments and disclosures.

A fourth activity—performing the audit—uses these outputs but also requires evidence and judgment. As an example of the responsibility distinction, US PCAOB AS 1000 identifies financial-statement preparation as management's responsibility and expressing an audit opinion as the auditor's. This is not a jurisdiction-specific assessment of whether a particular firm may provide drafting assistance. [PCAOB AS 1000](https://pcaobus.org/oversight/standards/auditing-standards/details/as-1000--general-responsibilities-of-the-auditor-in-conducting-an-audit).

Also distinguish an engagement rollover from an AR rollforward calculation: the latter reconciles opening balance plus movements to closing balance.

## Products to understand

### Caseware and CCH

These are central comparisons for the audit-firm workflow, not merely adjacent analytics products. Detailed product-specific evidence and distinctions between Caseware Working Papers, Financials, Connector, CCH ProSystem fx Engagement and CCH Axcess Engagement are in [the Caseware/CCH research](workpaper-automation-caseware-cch.md).

A concrete boundary: Caseware Financials' cash-flow worksheet still asks the preparer to select the reporting method, perform analysis and ensure the worksheet balances. Calculated activity totals flow to a summary, but the tool does not eliminate the need to determine what those movements represent. [Cash-flow worksheet](https://www.caseware.com/docs/en/desktop/financials/user-help/statement-of-cash-flows-worksheet/c-cash-flow-worksheet-overview).

### Thomson Reuters Engagement Manager

**Documented:** create the next-period engagement from an existing one, retaining structure and account numbers while the new trial balance excludes current-period balances. Users choose prior-year reporting periods and what to clear or retain. [Roll forward](https://www.thomsonreuters.com/en-us/help/engagement-manager/engagements/roll-forward-an-engagement).

**Documented:** import XLSX trial balances, assign account classifications/groupings and record adjustments. Its guide explicitly describes preparing a spreadsheet for QuickBooks data rather than a direct import in that workflow. [Trial balance and journals](https://www.thomsonreuters.com/en-us/help/engagement-manager/user-guide/work-with-the-trial-balance-and-journal-entries).

**Documented:** Word/Excel engagement links and linked Excel data in Word support statements and notes. These are configured links; the guide does not demonstrate automatic interpretation of every existing workbook. [Manage workpapers](https://www.thomsonreuters.com/en-us/help/engagement-manager/user-guide/manage-workpapers).

**Important qualification:** generated Custom Excel workpapers have a documented recalculation action, and recalculation can remove text/formatting edits outside designated areas. Separately, the newer web add-in offers a preference to recalculate on opening workpapers. Do not generalize either behavior to every document type or add-in. [Custom Excel workpapers](https://www.thomsonreuters.com/en-us/help/engagement-manager/workpapers/add-custom-excel-workpapers-linked), [add-in setup](https://www.thomsonreuters.com/en-us/help/engagement-manager/install/setup).

### Workiva and Fieldguide

Workiva documents period copying with explicit choices about whether links follow new source copies or remain linked to originals. Link handling is configuration, not an incidental detail. [Copy files/folders](https://support.workiva.com/hc/en-us/articles/360035639992-Copy-a-file-or-folder).

Its September 2026 help also explicitly describes an AI Roll forward workflow; access depends on workspace entitlement. Therefore the comparison must include newer AI assistance, not present Workiva as only conventional copying. [Workiva AI workflows](https://support.workiva.com/hc/en-us/articles/51755818511124-Workiva-AI-is-now-your-global-companion).

Fieldguide's August 2026 announcement describes a live Drafting Agent using a prior-year report and current engagement data to create a linked draft. Its launch announcement separates that availability from planned Review & Tie-Out and Disclosure agents; a future date alone does not establish that those later agents shipped. [Launch](https://www.fieldguide.com/blog/fieldguide-launch-and-brand-refresh), [Drafting Agent](https://www.fieldguide.com/blog/field-financials-drafting-agent).

Current product pages market disclosure and tie-out capabilities too. This research did not establish a dated general-availability confirmation for each subsequent agent; verify those capabilities and entitlements rather than treating them as either proven available everywhere or absent. [Field Financials](https://www.fieldguide.com/products/agents/field-financials).

See [reporting-platform research](workpaper-automation-reporting-platforms.md) for operational details, Excel import/link limitations and availability qualifications.

### Truewind: a particularly relevant workbook competitor

This discovery broadens the prior competitor list. Its support instructions explicitly describe uploading an existing workbook and supporting files, explaining the workbook's requirements, and inspecting a generated reusable standard operating procedure (SOP). [Start with an existing workbook](https://www.truewind.ai/support/workpaper-agent/studio/start-with-your-own-workbook).

The next-period workflow retains the SOP and workbook structure, accepts new files/instructions, selects a period and creates a new run. Documentation says this works best when the process remains similar across periods. [Roll forward](https://www.truewind.ai/support/workpaper-agent/studio/roll-forward).

Scheduling supports one-time, weekly and monthly workpaper runs. The checklist flow assigns preparers/reviewers and handles missing input with an Input Needed state. This is close-work automation; these pages do not establish a complete statutory financial-statement package or autonomous external audit. Do not infer a native quarterly/yearly scheduling option from the listed frequencies. [Schedules](https://www.truewind.ai/support/workpaper-agent/schedules/create-a-scheduled-workpaper), [checklist workflow](https://www.truewind.ai/support/checklist/overview/schedule-a-monthly-roll-forward-workpaper-task).

### Datarails and Excel Power Query

Datarails advertises Excel-oriented data consolidation and financial reports, including P&L, balance sheet and cash flow, with approvals and exports. This establishes reporting overlap; it does not verify statutory note completeness or performance on arbitrary spreadsheets. [Financial reporting](https://www.datarails.com/solutions/financial-reporting/).

Excel itself is a meaningful baseline. Power Query can repeatedly combine same-schema files and apply saved transformations on refresh. A new product whose benefit is simply replacing recurring copy/paste should be compared with a configured Power Query workbook. [Microsoft documentation](https://support.microsoft.com/en-gb/excel/import-data-from-a-folder-with-multiple-files-power-query).

## Typical workflow: initial setup versus recurring operation

The following is a synthesis of the documented patterns, not one vendor's exact UI.

### Initial setup

1. Choose the engagement/reporting template appropriate to the entity and reporting framework.
2. Import prior/current trial balances and identify accounts, periods, entities, currencies and source versions.
3. Map client account codes to reporting groups and statement lines. Confirm signs and balance types.
4. Connect workpaper cells and statement tables to those groups. Configure schedule calculations, dates and note references.
5. Define required schedules, additional disclosures, period handling and review ownership.
6. Test a complete reporting package before relying on the recurring refresh.

The work is shifted toward configuring reusable relationships. New AI-based approaches may propose those relationships or infer a draft workflow, but the documentation still includes user instructions and review.

### Next quarter or year

1. Copy the engagement/reporting package with the intended source-link behavior; preserve the previous approved period.
2. Supply new trial balance, transaction exports and supporting schedules.
3. Validate period/entity, completeness, duplicates, sign conventions and new/unmapped accounts.
4. Refresh or recalculate linked schedules and statements.
5. Investigate differences and prepare or record reviewed adjustments; retain the original source and distinguish proposed versus accepted changes.
6. Refresh affected outputs; identify commentary, manual overrides and earlier review conclusions that may now be stale.
7. Complete disclosures and cash-flow analysis needing additional information.
8. Review, approve, export and retain the completed package.

Quarterly and annual processing may share infrastructure, but period semantics differ. For example, quarter-only activity and year-to-date activity must not be interchanged. Annual disclosure templates also cannot simply be assumed suitable for an interim package. These are product-design constraints to verify for the chosen jurisdiction and engagement.

## Concrete example: what a linked model changes

Illustrative figures, not a claim about any client's data:

- Prior AR balance: 100.
- Credit sales: 500; receipts: 420; credit notes: 10; write-offs: 5.
- Rebuilt closing AR: 100 + 500 − 420 − 10 − 5 = 165.
- Client trial balance initially reports AR of 170.

The tool can show a difference of 5. It should not silently force the records to agree. Investigation might establish a missing item in a schedule, a ledger error, a mapping error or an invalid assumption. Which explanation is correct needs evidence.

If investigation supports a reviewed journal debiting revenue by 5 and crediting AR by 5, the adjusted ledger has AR of 165 and revenue lower by 5. Connected lead schedules, statements and variance tables can update from that adjusted data. The original source balance and the adjustment should remain distinguishable.

Those updated numbers do not automatically resolve revenue recognition, collectibility, tax effects or disclosure requirements. Likewise, a fixed-asset balance increase does not by itself identify cash purchases: some additions could be noncash. Financial-statement generation needs more than copying final balances into a layout.

## Where the proposed project stands

**High competitive overlap:** importing a trial balance, mapping accounts, reusing prior-year work, producing linked lead schedules and drafting statements are established. New AI products also compete on interpreting prior workbooks/reports. “AI updates Excel and drafts financial statements” is therefore not a differentiated claim by itself.

**Current repo limitation:** Revenue/AR is one cycle. A complete financial-statement package requires other balances, adjustments, disclosure inputs and framework-specific presentation. Adding statement templates would not make the current Revenue/AR engine a full accounts-production system.

**Potential opportunity, not a verified gap:** help a specific team update a particular set of existing workbooks with less setup and correction, preserving formulas, reviewer context and provenance. Test against both a configured incumbent and a simple Excel solution, not only against manual retyping. Truewind and Fieldguide make this a competitive hypothesis too.

## Recommended next evidence

Obtain a permitted walkthrough of last period's workpapers and the new-period inputs. Inventory the repeated edits: dates/labels, imported data, formulas/ranges, account mapping, calculated schedules, explanations, notes and approvals. Identify what is linked already and why remaining edits are manual.

Run a comparable demonstration with these cases:

1. An unchanged structure with new values.
2. A new account or changed source column layout.
3. A late adjustment after an initial draft.
4. A prior-period manual override or stale narrative.
5. A missing supporting schedule and a noncash movement.

Measure initial setup effort, recurring preparation time, correction/review time, output fidelity and traceability. Ask which exact cells changed and why, whether a second run is safe, and whether missing input is shown as unresolved rather than invented.

Three useful next discussion questions: Which files do you mean by “all Excel sheets”? What tool did the team already use, and which updates remained manual? Must the output preserve the exact existing Excel/Word files, or can users adopt a managed template/platform?

No product pivot or expanded implementation scope is approved by this research.
