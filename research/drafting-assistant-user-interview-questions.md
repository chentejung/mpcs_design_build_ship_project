# Auditor assistant: user interview and questionnaire

Based on the product direction confirmed November 6, 2026: preserve existing workbook calculation rules, update source data, analyze differences and prepare draft financial statements using accounting skills and orchestration.

This is a draft research instrument, not a published form. It supersedes the earlier auditor-only survey for this discovery round. Company accountants are an equally valid comparison group; analyze their answers separately from external and internal auditors.

## How to use

Use the short questionnaire to learn respondents' context and recruit follow-ups. Use a 25–30 minute interview to explore one recent workflow; select relevant probes rather than asking every question. Pilot the form before promising a completion time.

Start with actual experience. Do not describe agents, skills or promised time savings until after the workflow questions. Ask accountants about preparation and close; ask external auditors about examination and workpaper review. Internal auditors and specialists should describe their own tasks rather than be forced into a financial-statement preparation workflow.

Opening text:

> I'm researching how accounting and audit teams update recurring spreadsheets and prepare or review financial statements. I'd like to understand your current process, including what already works well. Please use a recent example without sharing client names, confidential figures or documents. Contact information is optional and will only be used for the follow-up you select.

## Short Google Form draft

Questions 1–13 concern current experience. Show the concept only afterward. Include “Other,” “Not applicable” or “Unsure” where appropriate. Make narrative details and follow-up contact optional; do not require file uploads or automatically collect email.

| # | Exact question | Suggested response format |
|---|---|---|
| 1 | Which best describes your current work? | Single choice: external financial-statement auditor; company accountant; accounting manager/controller; internal auditor; other assurance/specialist; other; not currently practicing. |
| 2 | What is your main role in this process? | Single choice: prepare/update workbooks; review workbooks/results; prepare financial statements; review financial statements; manage or approve the process; not involved; other. Optional additional responsibilities. |
| 3 | Where do you mainly work, and which reporting framework do these statements follow? | Country: short text. Framework: IFRS; US GAAP; local GAAP (specify); other; unsure/not applicable. Optional team size: 1; 2–10; 11–50; 51+. |
| 4 | When did you last update or review a recurring accounting workbook or financial-statement package? | Within the past month; 1–3 months ago; 4–12 months ago; more than a year ago; never. Route “never” to a brief alternate question about their relevant work and optional follow-up. |
| 5 | On that occasion, which task took the most hands-on time? | Single choice: obtaining files; cleaning/formatting data; updating source tabs; repairing formulas/links; reconciling balances; analyzing/explaining changes; drafting statements/notes; reviewing/correcting work; other; unsure. |
| 6 | Briefly describe that task: what did you receive, what did you do, and where did you need manual effort? | Optional paragraph. |
| 7 | Approximately how much hands-on time did that task take, including corrections? | Under 1 hour; 1–3; 4–8; 9–20; more than 20; unsure/not applicable. Do not include waiting for others. |
| 8 | How often do you perform or review this workflow? | Monthly; quarterly; annually; per engagement; irregularly; other. |
| 9 | How is new-period data normally added to the workbook? | Select all that apply: replace existing source data; append new transactions; revise existing transactions; refresh a connection/query; manually update calculated/output cells; varies by tab; unsure; other. |
| 10 | What calculations or workbook features must remain unchanged, and how do you check them today? | Optional paragraph; prompt for formulas, layouts, manual adjustments or external links without implying these all exist. |
| 11 | Which comparison do you perform most often after updating the data? | Current versus prior period; revised versus earlier version of the same period; schedule versus ledger/trial balance; actual versus budget/expectation; another comparison; none/not applicable. |
| 12 | Which tools do you actually use for this work? | Checkboxes: Excel/Power Query/macros; Caseware; CCH; Thomson Reuters Engagement Manager; Fieldguide; Workiva; DataSnipper; Truewind; FloQast/BlackLine/Numeric; firm-built tools; other. Optional product/module detail. |
| 13 | What do those tools already handle well, and what do you still do manually? | Optional paragraph. |

### Concept description — show only after Q13

> We are exploring an assistant that uses your existing workbook and new company data to update designated source areas, preserve agreed calculation rules, identify differences and prepare draft financial statements for review. It would show changes and supporting references and flag missing information or uncertain mappings. This is a proposed workflow, not a claim that the product already supports every workbook or reporting framework.

| # | Exact question | Suggested response format |
|---|---|---|
| 14 | Where would this proposed assistant be useful, if anywhere? | Single choice: source-data updating; checking workbook integrity; difference analysis; drafting statements/notes; coordinating the whole process; current tools already cover this; not relevant; unsure. Optional explanation of the most valuable step. |
| 15 | What would you need to verify before using its output? | Select up to three: source completeness; unchanged formulas; correct calculations; explanation of changes; traceable supporting records; compatibility with existing files/tools; reviewer approval/history; reporting framework suitability; other; unsure. |
| 16 | What is the biggest obstacle to trying this workflow? | Data approval; setup effort; accuracy/review effort; compatibility; methodology/firm policy; price/procurement; no significant unmet need; other; unsure. |
| 17 | Would you be interested in a follow-up? | A short interview; testing with synthetic data; both; updates only; no. Optional contact field. |

## Follow-up interview: investigate one real assignment

### 1. Understand the workflow before discussing automation

1. **Walk me through the last time you updated or reviewed this workbook, from receiving the files to accepting the final output.** Who did each step?
2. **Which workbooks and tabs were involved, and what was each one for?** What was the final deliverable: a workpaper, reconciliation, analysis, statement, note or something else?
3. **Where did you spend hands-on time, and where were you waiting?** Separate initial preparation, corrections, review and client follow-up.
4. **What already worked smoothly?** Which existing tool or template would you want to keep?

Purpose: verify the job, frequency, ownership and baseline rather than assume the proposed workflow is valuable.

### 2. Understand source updates and protected calculations

5. **For each source tab, do you replace, append or correct the data?** How do you prevent transactions from being counted twice?
6. **How consistent are the client's exports between periods?** Tell me about the last time columns, account codes or layouts changed.
7. **Which cells may be changed, and which must be preserved?** Do source tabs also contain formulas, manual adjustments, comments or helper calculations?
8. **Where are the calculation rules documented?** Are they in the workbook, written instructions, prior review notes or someone's knowledge? Who decides when a rule needs to change?
9. **What happens when new rows, accounts or entities appear?** How do you check that the main-tab formulas include them?
10. **Does the workbook depend on macros, queries, pivots, named ranges, external files or particular Excel features?** Which dependencies are essential, and how do you confirm everything refreshed?

Purpose: define a workbook profile and expose whether preserving formulas is enough to preserve intended calculations.

### 3. Understand difference analysis and exceptions

11. **What exactly do you compare after an update?** Clarify prior-period versus revised-current-period versus ledger/schedule comparisons, and quarter-only versus year-to-date figures.
12. **Describe the last significant difference you investigated.** How did you find it, decide it mattered, trace it and resolve it?
13. **What evidence do you need before writing an explanation?** What can the data show, and what requires a response from the company?
14. **Which automated flags do you currently ignore or find unhelpful?** What would make a flagged item actionable?
15. **Tell me about the last corrected file you received after analysis or review had started.** How did you identify affected calculations, explanations, statements and approvals?

Purpose: distinguish numerical changes, data-quality issues and potential accounting problems; identify the actual orchestration burden.

### 4. Understand financial-statement drafting

16. **Who prepares the first draft, and who reviews or approves it?** What software and files are used at each handoff?
17. **Which statement figures already flow automatically from the workbook, and which are copied or entered manually?** Ask them to describe one specific transfer.
18. **Which notes or other parts need information that is not in the trial balance or workbook?** How is that information collected and updated?
19. **What does the reviewer most often send back?** Ask for a recent example: numbers, classification, disclosure, formatting, missing support or another issue.
20. **Must the output remain in the exact existing Excel/Word format?** What would prevent your team from accepting a different format or platform?

Purpose: establish a real drafting boundary and distinguish a linked numerical draft from a complete reviewed statement package.

## After showing the concept: test fit and adoption

21. **Which step would this replace in your actual process?** Which steps would still need to happen, and could it introduce duplicate work?
22. **Where would you want the assistant to stop for your input?** Give examples of a routine update, an unfamiliar account and a changed formula range.
23. **What would make its output take longer to review than doing the work yourself?** What evidence or presentation would reduce that burden?
24. **What setup would you be willing to do once, and what would be unacceptable every period?** Probe mapping, template configuration, training and manual conversion.
25. **Who would approve use of a new tool and the data it processes?** What deployment, retention or processing restrictions would that person need to confirm? Do not ask respondents to disclose security details they are not authorized to share.
26. **What tool did your team last trial, buy, reject or renew for this work?** Why? If the respondent knows, ask about the budget owner and licensing unit; do not force a hypothetical price.
27. **What would a successful pilot have to demonstrate?** Agree a task, current baseline, correctness checks, acceptable review effort and a meaningful improvement.
28. **Would you participate in the next concrete step?** Options include a synthetic-case test or a permitted walkthrough of a blank template. Interest is not evidence of permission to share real client data.

## Role-specific probes

| Respondent | Additional probes |
|---|---|
| Company accountant/preparer | What must be corrected in the ledger versus explained only in a workpaper? Which audit requests lead to repeated rework? Does the same workbook serve monthly close and annual audit? |
| External auditor | Which client-prepared information do you independently check? Which parts of updating the workbook are preparation versus audit procedures? What must be retained to support your conclusion? |
| Reviewer/manager/partner | What makes you reopen completed work? What changes require a fresh review? What evidence lets you accept an update without reperforming everything? |
| Controller/buyer | Which team owns the cost and benefit? What alternative would you evaluate? What measurable result justified the last tool purchase? |
| Internal auditor/specialist | Does this financial-statement workflow occur in your work at all? If not, what recurring workbook process is relevant? Keep those needs separate rather than treating them as direct validation. |

## Optional scenario prompts

Use these after the respondent's own examples. They test expectations, not their accounting knowledge.

- **More source rows:** last year's formula covers 500 rows and the new export has 700. What should the assistant do, and who may approve a range change?
- **Late correction:** revised sales data arrives after a draft and review. Which outputs and approvals need to be revisited?
- **Missing schedule:** one required source is unavailable. What output, if any, is still useful, and how should its incomplete status be shown?
- **Unexplained movement:** the numbers reconcile but a balance changes substantially. What additional evidence is necessary before writing an explanation?

## Recording and interpretation

For each respondent record: role, team, jurisdiction/framework, recent task, source/update method, protected features, comparison baseline, actual tool/module, hands-on time, review/rework, adoption owner and concrete follow-up commitment.

Capture examples and attributable permissions rather than inventing quotes. Analyze accountant, external-auditor and reviewer responses separately before looking for shared needs. Small interview samples reveal hypotheses, not market-wide prevalence.

Strong evidence: a repeated recent task, demonstrable manual work despite existing tools, accessible permitted inputs, and a reviewer willing to compare outputs. Weak evidence: general enthusiasm for AI, a feature wish list or hypothetical willingness to pay.

Reconsider the product assumptions if existing tools already handle updates well, preparation dominates any potential savings, reviewers would redo the work, drafting is not the respondent's responsibility, or required workbook features cannot be preserved.

Do not ask whether users want “multi-agent orchestration.” Ask whether they need the concrete behavior: coordinated updates, visible dependencies, safe reruns, refreshed analysis and reviewable drafts.
