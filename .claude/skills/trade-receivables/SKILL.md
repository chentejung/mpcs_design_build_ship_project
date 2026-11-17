---
name: trade-receivables
description: Line-item skill for trade receivables and the loss allowance under IFRS 9/15 and ISA - classifying receivables journal lines, explaining rollforward, TB and aged-listing differences, composition (misclassification) tests, and provision matrix / expected credit loss judgment. Use when examining trade receivables or the loss allowance, judging an AR flag, or answering an IFRS question about receivables.
---

# Trade receivables

The judgment for the **trade receivables** line item: gross receivables plus the loss allowance (`CONTEXT.md`). The revenue cycle agent uses this skill on `runs/<run>/work/revenue.json`; the auditor may also use it directly. Every amount comes from that file, which `audit-start/scripts/cycles/revenue.mjs` computed; you classify, explain and conclude.

Reference, read when a section points to it:
- [references/ifrs-rules.md](references/ifrs-rules.md): composition, recognition, measurement, derecognition, presentation and disclosure, effective dates.
- [references/procedures.md](references/procedures.md): risk framing, assertions, confirmations, fraud indicators, valuation, provision matrix, analytics.

## Classify a pending line

Each pending item carries the line, every line of its entry, its component (gross or loss allowance) and the categories allowed for that component. Choose the category from the **other side of the entry** first, then the description:

| Component | Category | The line is… |
|---|---|---|
| gross | credit-sale | an invoice on credit (receivables debited; revenue or sales tax credited, possibly via a clearing account) |
| gross | receipt | cash from a customer, including receipts first held in suspense and later cleared, and dishonoured receipts reversed (a debit) |
| gross | credit-note | revenue reversed for returns, allowances or pricing errors |
| gross | write-off | an irrecoverable balance removed, against the allowance or directly to impairment loss |
| gross | fx | retranslation of a foreign-currency balance (IAS 21.23) |
| gross | reclassification | a balance moved to or from another line item: customer credit balances to contract liabilities, unbilled amounts from contract assets, non-trade items to other receivables |
| loss-allowance | charge / reversal | an increase or a release of the expected credit loss through impairment loss |
| loss-allowance | write-off-used | the allowance used when a balance is written off |
| loss-allowance | fx | retranslation of the allowance |

Reason in one or two sentences, naming the account or words you relied on. When the other side is a suspense or clearing account, trace what cleared into it (the description, the same customer or invoice number elsewhere in the entry) and say what evidence would confirm it. When nothing fits well, choose the closest category and say plainly why it is uncertain; the auditor confirms every suggestion.

## Explain a difference

Each flag carries expected, actual, difference (actual − expected), sources and **candidates**: the scripted tests that might explain it (`single-line`, `sign-flip`, `transposition`, `missing-from-schedule`, `missing-from-journals`, `outside-period`, `unconfirmed-lines`, `missing-month`, `typed-closing`, `opening-balance`, `combination`, `individually-assessed-in-matrix`). A ✓ (`matched: true`) means the test's amount equals the difference.

Write two to four sentences:
1. **Trace** the cause: lead with the matched candidate, citing its entry numbers and amounts from the flag. For a `combination`, name each part and its amount. For several flags with the same cause (a missing receipt moves the movement, the closing balance and the TB comparison), give the same cause in each, so the auditor sees one root problem.
2. Name the **assertion at risk** and why: overstatement threatens existence; a missing receipt overstates the client's balance.
3. Give the **next procedure** from `references/procedures.md`, e.g. agree the entry to the bank statement, vouch the invoice, or ask the client to correct the schedule.

When no candidate matched, write that the scripted tests found no explanation and name the procedure that would. Leave the cause open rather than guessing one. `transposition` alone is weak evidence (one difference in nine is divisible by 9), so present it as "consistent with" a typing error.

## Composition and valuation flags

Explain each with its IFRS consequence (`references/ifrs-rules.md` § Composition, § Measurement):
- `credit-balances`: these belong in contract liabilities or other payables. Netting them understates both assets and liabilities (IFRS 15.105-108, IAS 32.42). Propose a reclassification.
- `listing-after-year-end`: a cut-off or existence risk.
- `ageing-accuracy`: the ECL inputs are wrong, because the client's buckets do not match a re-ageing from due dates.
- The provision matrix flags (`matrix-bucket-gross`, `matrix-arithmetic`, `allowance-vs-matrix`, `matrix-total-vs-ledger`, `individually-assessed-gross`): say which input is wrong and in which direction the allowance is misstated.

## Judge the provision matrix rates

The script re-performs the matrix. Its results are in `provisionMatrix` and the flags, and `provisionMatrix.rateFacts` holds the client's rates. Conclude on each rate-judgment check in `references/procedures.md` § Provision matrix: rates rising with age, the 90-days-past-due default presumption, grouping, historical base, forward-looking adjustment, and the current-year update. Each conclusion is either a concern with your reasoning, or "assessed, reasonable" with the evidence used. Where the files cannot answer a check (the historical base, for instance), say what to request from the client.

## Information needed

Turn each `infoNeeded` item into a request the auditor can send to the client: what to provide and why. For example: "the expected credit loss methodology and the loss history behind the rates, because IFRS 9.5.5.17 requires reasonable and supportable forward-looking information".
