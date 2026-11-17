# Project Plan — Audit Workbench (Design, Build, Ship, MPCS 51238)

> Working plan for Audit Workbench, the only project in scope. **v1 due Tue Nov 17, 5:30 PM**; fair Dec 1. Proposal page: `proposal/index.html`.
> Research: `research/idea1-audit.md`, `research/ifrs-isa-sources.md`. Vocabulary: `CONTEXT.md`. Decisions: `docs/adr/`.

---


## One-liner
Auditors at small firms spend days hand-building rollforwards and lead schedules from client journals before they can even start testing; Audit Workbench turns raw journals into reconciled workpapers and a flagged list of what to look into.

## Who it's for
Long-term audience: **all auditors**, as clarified on Nov 6. Small external audit firms and sole practitioners are a possible initial segment, not a permanent constraint. The current Revenue/AR prototype assumes **IFRS + ISA**; interviews should segment respondents by audit type, organization size, jurisdiction and frameworks before choosing the initial market. Earlier broad competitor price estimates are unverified and should not drive positioning.

## The problem (in my words, as a former auditor)
Every line item has its own movements, its own supporting schedules and its own column layouts. Inventory = opening + purchases − cost of sales ± adjustments − write-downs; cash, AR, inventory all come from completely different source sheets. Reconciling each one and spotting what doesn't make sense is slow, manual and repetitive.

## Ideal version (the ambition)
An orchestrator with one agent per **cycle** examines a client's **client-prepared statements** (four statements plus notes) the way an auditor does: start from last year's audited figures, load the client's current-year data, check every line-item schedule and the TB, and only if those agree compare the client's Word statements — amounts and wording — against the auditor's **rebuilt statements**, last year's audited wording and the **client template** tailored from the firm's yearly **illustrative set**. Every difference becomes a ranked flag. Vocabulary: `CONTEXT.md`; key decision: `docs/adr/0001-deterministic-numbers-agents-for-judgment.md`.

## How it works (full design, agreed Nov 16)
**Inputs** (single entity, continuing audits only, IFRS):
- Last year's audited TB and audited statements (Word) → opening balances and last year's wording.
- Client's current-year TB, full journal export with an entry number on every journal line (Excel), one **line-item schedule** per line item (Excel, fixed layout: journal lines + rollforward with formula cells), aged AR listing (Excel).
- Client-prepared statements and notes (Word, one fixed template for synthetic clients).
- Auditor enters performance materiality and clearly trivial threshold.

**Stage 1 — line-item schedules**
- Every line item (shallow): opening = last year's audited closing; opening + movements = closing; formula cells not overwritten with typed numbers.
- Revenue cycle (deep): each journal line on the AR schedule classified by the other side of its entry (Cr Revenue → credit sale, Dr Cash → receipt, Dr Allowance → write-off …); lines the rules can't place are classified by an agent and confirmed by the auditor. Two rollforwards — gross AR (opening + credit sales − receipts − credit notes − write-offs) and allowance for doubtful debts (opening + charge − write-offs used ± reversals). Journal entry tests (ISA 240). Unbalanced entries flagged first.

**Stage 2 — TB and cross-checks**
- Every line-item schedule closing balance = TB.
- Revenue-cycle cross-checks through shared entries: credit sales + cash sales (+ output VAT) = revenue split; allowance charge − reversals = bad debt expense; AR receipts = cash journal receipts.

**Stop rule**: any difference above clearly trivial in Stages 1–2 (or opening balances) → report all of them across every line item, skip Stage 3. Re-run = re-upload the whole package; previous flags shown as resolved/unresolved.

**Stage 3 — client-prepared statements**
- Amounts on all four statements vs rebuilt statements (rounding tolerance for presented amounts).
- Cash flow: net change in cash = change in balance-sheet cash; receivables line = AR rollforward; casts. Other lines marked "not examined".
- Notes (revenue cycle + accounting policy): numbers in text match rebuilt figures; stale wording; three-way comparison against last year's audited wording and the client template (missing required item / conflicting wording / changed vs last year without template change → flags; same meaning → matched with agent's reasoning and quoted sentence).
- Template version chosen by the client's year-end (e.g. IAS 1 for FY2026, IFRS 18 for periods beginning on/after 1 Jan 2027; early adoption marked by the auditor).

**Output**: flags ranked against performance materiality and clearly trivial, each linked to the rows/entries/sentences behind it; Excel export.

**Rule**: deterministic code computes every amount; agents only map, classify, compare wording and narrate (ADR 0001).

## Test data: synthetic companies
A deterministic double-entry engine generates two years of ledger per company (with VAT), every line-item schedule, the aged AR listing, last year's audited and this year's client-prepared statements in Word, planted misstatements and an answer key. The demo illustrative set is written by me (published illustrative sets are copyrighted and are only ever uploaded by a firm, never bundled or sent to a free-tier model).

## Focus: Holistic Journey + AI — evals
Plant at least one misstatement per stage: opening balance ≠ last year's audited; typed number over a formula; schedule movement ≠ journals; allowance charge ≠ bad debt expense; revenue credited to an unusual account; transposed digits on the statement face; stale year in a note; missing ageing table; conflicting policy wording. Measure detection and false flags per stage, whether the stop rule fired exactly when it should (and not for differences below clearly trivial), classification-agent accuracy vs true categories, and wording-agent accuracy on planted missing/conflicting items.

## Roadmap
| When | Build |
|---|---|
| **v1 — due Tue Nov 17, 5:30 PM** | Live link. "Try the sample client" first run (or upload). Two scripted sample clients: A stops at Stage 2, B passes and has a transposed figure on its Word statements. Revenue cycle only: opening balances, gross AR rollforward, schedule vs TB, credit sales vs revenue cross-check, stop rule, Stage 3 amounts on balance sheet + income statement read from Word. Classification agent (Gemini, server-side key, spending limit). Flags list + Excel download. No sign-up, no database — files parsed in the browser. First task: ≤45-minute spike reading Word in the browser; fallback is statements in Excel. |
| **v2 — Nov 18 → Dec 1 (fair)** | 1. Illustrative set upload + client template + three-way wording comparison for revenue-cycle notes and the accounting policy note. 2. Allowance rollforward + bad debt expense cross-check, cash cross-check, VAT. 3. Shallow checks for every line item; cash flow and equity statements; "not examined" coverage map. 4. Re-run with resolved flags. 5. Full synthetic engine + eval harness. 6. Sign-up + saved runs (Supabase with RLS). 7. AI summary. Priorities adjusted from v1 user tests. |

**Out**: group consolidation, reading client formulas to explain differences, cutoff/shipping listing, recomputing expected credit loss rates, proposed adjustments list, re-running only the changed file, deep checks for cycles beyond revenue, FX, arbitrary client layouts, automatic template updates.

## Tech stack
- **Next.js on Vercel** — UI and the one server route that calls the model.
- **SheetJS** for Excel in the browser; a Word reader (to be chosen in the spike) for the client's statements.
- **Gemini free tier** — synthetic data only; spending limit set before sharing the link.
- **Supabase** — from v2 (auth, saved runs, illustrative sets), RLS on.
- MCP/CLIs: Vercel CLI, GitHub CLI, Supabase MCP (v2).

## Risks
- One day for v1: keep it to the revenue cycle and two scripted sample clients.
- Reading Word reliably: fixed template in v1; spike first.
- Wording comparison is judgment: agent must quote the sentence it relied on; evaluated on planted items.
- Copyright: illustrative sets and IFRS text are never bundled or sent to a free-tier model.

---

## User interviews — to fill in

At least 3 auditors. Record their words.

1. Tell me about the last time you built a rollforward or lead schedule for a client. What did you start from?
2. What took the longest on that engagement before you could start actual testing?
3. When the numbers didn't tie, how did you find out why?
4. How do you decide which fluctuations or entries to look deeper into?
5. What tools or spreadsheets do you use for this today, and what do you wish they did?

---

## Decisions log
- **Nov 16:** focus only on Audit Workbench; Filing Analyzer plan and proposal removed.
- **Nov 16 design session (Audit Workbench):** multi-agent design agreed — orchestrator with one agent per cycle; full four-statement skeleton plus one deep cycle (revenue: Revenue, AR, allowance); deterministic code computes every number (ADR 0001); three stages with a stop rule before examining the client's Word statements; wording compared against last year's audited wording and a client template tailored from the firm's yearly illustrative set. "Consolidated" means group consolidation and stays out of scope. Workbook-formula understanding (Nov 6) becomes a later input mode. v1 scope cut to fit the Nov 17 deadline; see Roadmap.
- **Nov 6 latest direction:** start with financial-statement draft automation through accounting skills and orchestration. Focus on understanding existing workbook rules/formulas, preserving calculation logic during source updates, and detecting anomalies. See `research/2026-11-06-drafting-assistant-direction.md`. Earlier Revenue/AR scope remains a possible first skill; it is not a complete specification for the newly chosen drafting outcome. Detailed scope and implementation remain pending.
- **Nov 6 audience clarification:** the ambition is to serve all auditors. Small external audit firms can be the initial goal; the discovery form should include other auditor segments and analyze their needs separately. This does not expand the current Revenue/AR prototype scope automatically.
- **Nov 3 update:** page now covers **Audit Workbench only** (Filing Analyzer dropped). Users: auditors. Focus: **Holistic Journey + AI** — AI gives suggestions for the initial financial analysis for auditors to inspect. Problem statement rewritten in my own words on the page.
- Audit Workbench = auditor productivity tool (not a training simulator).
- Frameworks: IFRS + ISA; v1 = Revenue + AR only; synthetic companies via deterministic engine; fixed schedule templates in v1.
- Compares against client-prepared statements (rebuilding from the same journals alone always ties).
- AI focus; IFRS/ISA paraphrased + cited, never reproduced.

## Still to do for v1 (due Nov 17, 5:30 PM)
- [ ] Rewrite the out-of-date parts of `proposal/index.html` (v1 inputs, out-of-scope list, roadmap) in your own words.
- [ ] Build v1 slice by slice and deploy to Vercel early (see Roadmap).
- [ ] Before shipping: keys in env vars only, deny rule for `.env`, model spending limit, `/security-review`.
- [ ] Test with ≥2 real auditors, watching without helping; record what they did and said.
- [ ] Write the v2 plan from those tests.
