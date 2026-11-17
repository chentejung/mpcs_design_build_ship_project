---
name: examine-trade-receivables
description: IFRS/ISA procedure for examining trade receivables (AR): composition, rollforwards, ECL loss allowance, cross-checks to revenue/cash/VAT, fraud indicators, presentation and disclosure. Use when examining a client's AR or revenue cycle, designing or reviewing AR checks, or judging an AR flag.
---

# Examine trade receivables

You examine a client's **trade receivables** line item the way an external auditor does under IFRS and ISA, and you end with a ranked list of **flags**. Vocabulary follows `CONTEXT.md` (line item, cycle, rollforward, movement, cross-check, flag, stop rule).

Inputs you may be given: prior-year audited TB and statements, current TB, journal export, the AR line-item schedule, the aged receivables listing, client-prepared statements and notes, performance materiality (PM) and the clearly trivial threshold (CT).

## Ground rules

- **Every amount comes from a script** run over the source files, never mental arithmetic, and every amount cites the rows or entry numbers it came from (ADR 0001).
- **Cite and paraphrase**: name the paragraph (e.g. IFRS 9.5.5.15, ISA 505) and state the rule in your own words; IFRS and ISA text is copyrighted.
- **Skeptic's direction**: the main risk on AR is overstatement, so existence, cut-off and valuation get the deepest look; test existence from ledger to evidence, completeness from evidence to ledger.

## Steps

1. **Set the frame.** Record the year-end, period start date, framework version and PM/CT. Framework: IFRS 18 if the period begins on or after 1 Jan 2027 or the auditor marks early adoption; IAS 1 otherwise. Check which amendments are in force for the period in [ifrs-rules.md § Effective dates](ifrs-rules.md#effective-dates).
   _Done when_ all four are recorded; ask the auditor for any you cannot find.

2. **Map the composition.** Assign every TB account touching receivables to gross trade receivables, loss allowance, contract assets, contract liabilities, other receivables, or another line item, using [ifrs-rules.md § Composition](ifrs-rules.md#composition).
   _Done when_ every receivable-type account is mapped and each misclassification test in that section has been run (credit balances, contract assets, non-trade, related parties, non-current, factored).

3. **Rebuild both rollforwards.** Gross AR: opening + credit sales − receipts − credit notes − write-offs ± FX = closing. Loss allowance: opening + charge − write-offs used ± reversals = closing. Classify every journal line on the AR accounts by the other side of its entry. Opening balances must equal last year's audited closing.
   _Done when_ every journal line sits in exactly one movement and each rollforward's closing agrees to the TB and the line-item schedule, or the unreconciled difference is a flag.

4. **Run the cross-checks** in [cross-checks.md](cross-checks.md).
   _Done when_ every row there is either computed with its difference, or marked not applicable with the reason.

5. **Apply the stop rule.** Any difference above CT from steps 3–4 or opening balances: report all of them and skip step 8 (statements and notes) for this run.

6. **Test valuation.** Check the ECL method against [ifrs-rules.md § Measurement](ifrs-rules.md#measurement), then the evidence in [procedures.md § Valuation](procedures.md#valuation). Where the client uses a provision matrix, run [procedures.md § Provision matrix](procedures.md#provision-matrix).
   _Done when_ each ECL requirement there is marked met, not met (flag) or not determinable from the files (flag as information needed), and, for a provision matrix, every re-performance check has a computed difference and every rate-judgment check has a conclusion.

7. **Hunt for fraud and cut-off indicators** using [procedures.md § Existence, cut-off and fraud](procedures.md#existence-cut-off-and-fraud).
   _Done when_ every indicator there has been searched for in the journals and listing, with hits flagged and misses recorded as "searched, none found".

8. **Examine presentation and disclosure** against [ifrs-rules.md § Presentation and disclosure](ifrs-rules.md#presentation-and-disclosure) for the framework set in step 1.
   _Done when_ every required item for that framework is matched to a quoted sentence or table in the client's notes, or flagged missing or conflicting.

9. **Report flags.** Each flag carries: amount, source rows or entry numbers, the assertion at risk, the standard paragraph, and rank (above PM, between CT and PM, below CT). Order by rank, then by assertion (existence, cut-off, valuation first).
   _Done when_ every flag has all five fields and the procedures you ran but that found nothing are listed, so coverage is visible.

## Reference

- [ifrs-rules.md](ifrs-rules.md): effective dates, composition, recognition, measurement, derecognition, presentation and disclosure.
- [procedures.md](procedures.md): assertions, ISA procedures, analytics, fraud indicators.
- [cross-checks.md](cross-checks.md): related line items, journal entries and the checks between them.
