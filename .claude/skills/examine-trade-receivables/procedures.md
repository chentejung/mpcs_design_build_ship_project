# Audit procedures for trade receivables

ISA references are from general knowledge as of mid-2026; verify against the current IAASB Handbook. The revised ISA 240 is expected to apply to periods beginning on or after 15 Dec 2026 (unverified).

## Risk framing

- **Revenue fraud presumption** (ISA 240): fraud risk in revenue recognition is presumed, and fictitious or early revenue lands in AR, so existence and cut-off are normally **significant risks**. Rebutting the presumption needs a documented reason.
- A significant risk needs tests of detail designed for it; analytics alone are not enough (ISA 330).
- The loss allowance is an **accounting estimate** (ISA 540 Revised): assess the method, assumptions and data, the degree of estimation uncertainty, and management bias.
- Information produced by the entity (aged listing, customer master) must itself be tested for accuracy and completeness before relying on it (ISA 500).

## Assertions

| Assertion | Procedures |
|---|---|
| Existence | External confirmations (ISA 505); subsequent cash receipts; delivery evidence and signed contracts for unconfirmed balances |
| Cut-off | Shipping and invoicing either side of year-end; credit notes after year-end; bill-and-hold and side letters |
| Valuation | ECL method and inputs; ageing accuracy; retrospective review; subsequent receipts on old balances |
| Completeness / accuracy | Subledger agrees to GL; aged listing foots; rollforwards reconcile |
| Rights and obligations | Factoring and securitisation agreements; pledges and collateral |
| Classification / presentation | Composition tests in `ifrs-rules.md`; disclosure checklist |

## Existence, cut-off and fraud

Confirmations (ISA 505):
- Positive confirmations for balances selected by stratification; key items and all large or unusual balances tested in full (ISA 530).
- The auditor controls sending and receiving; replies routed through the client or from unverified addresses are unreliable.
- Non-response: alternative procedures, chiefly receipts after year-end matched to the specific invoices, then delivery evidence.
- Management refuses to let a customer be confirmed: assess whether the reason is reasonable, treat it as a fraud indicator if not, and consider the effect on the opinion.
- Exceptions: investigate whether each one is a timing difference, dispute or misstatement.

Indicators to search for in the journals and listing:
- Manual journal entries to AR or revenue near period-end, at unusual times, by unusual users, or with round amounts or vague descriptions (ISA 240 journal entry testing).
- Revenue credited to an account outside revenue, or AR debited against something other than revenue, VAT or cash reversals.
- Credit notes issued after year-end that reverse year-end invoices.
- Large sales in the last days of the period to new customers, or growth in AR well above growth in revenue.
- **Lapping**: receipts applied to a different customer's older invoices; customer receipts that do not match any specific invoice.
- Customers sharing an address, bank account or tax ID with employees or related parties.
- Unbalanced entries (flag these first; they break every other check).
- Receipts cleared from suspense long after receipt.

## Valuation

- The aged listing foots, agrees to the GL, and its ageing buckets are right: re-age a sample from invoice date and due date.
- Method meets each requirement in `ifrs-rules.md § Measurement`: lifetime ECL, forward-looking adjustment, grouping by credit risk characteristics, 90-days-past-due default handling, individual assessment of credit-impaired balances.
- Provision matrix: run every check in [§ Provision matrix](#provision-matrix).
- Historical loss rates: recompute from actual write-offs and the ageing they came from; check the lookback period is relevant.
- Forward-looking overlay: compare to observable economic data and to the client's own forecasts used elsewhere (budgets, going concern, impairment tests). Consistency across estimates is a bias check.
- **Retrospective review**: last year's allowance vs what was actually written off or collected this year (ISA 540).
- Overdue balances with no allowance, customers in dispute or bankrupt, and balances collected after year-end (reduces risk) or written off after year-end (adjusting event).
- An allowance that only covers specific doubtful accounts signals an incurred-loss model: flag as non-compliant with IFRS 9.

## Provision matrix

Applies when the client measures the loss allowance with a provision matrix (IFRS 9.B5.5.35). If it uses another method, record which one and test it under § Valuation instead.

**Re-performance**. These checks are arithmetic: compute each one with a script, and flag any difference above CT.

| Check | Computation |
|---|---|
| Matrix ties to the listing | Each bucket's gross balance in the matrix = that bucket's total in the aged listing; sum of buckets = gross AR in the GL |
| Allowance re-performed | Σ (bucket balance × bucket rate) + individually assessed allowance = loss allowance in the GL |
| No double counting | Balances assessed individually as credit-impaired appear in no matrix bucket |
| Disclosure agrees | IFRS 7.35N table (bucket, rate, gross amount, allowance) = the re-performed matrix |

**Rate judgment**. Assess each of these and report it as a flag with your reasoning, or as "assessed, reasonable" with the evidence used:

- **Rates rise with age.** A later bucket with a lower rate than an earlier one needs an explanation.
- **Default presumption.** A bucket past 90 days with a rate well short of full loss means the client has rebutted the presumption (IFRS 9.B5.5.37). Look for its reasonable and supportable evidence.
- **Grouping.** Customer groups with different loss histories (e.g. government vs retail, different regions or products) each have their own rates.
- **Historical base.** Rates trace to actual loss history over a lookback period still relevant to today's customers and terms.
- **Forward-looking adjustment.** Rates include an overlay for forecast conditions, and the overlay agrees in direction with the client's other forecasts.
- **Current-year update.** Rates differ from last year's where loss experience or conditions changed. Identical rates year on year mean the matrix was not updated.

## Analytical procedures (ISA 520)

Set an expectation before computing each one, and investigate differences above the threshold:
- Days sales outstanding (DSO), vs prior year and terms.
- Ageing shift: share of balances over 90 days.
- Allowance coverage: allowance ÷ gross AR, and per ageing bucket.
- Impairment charge ÷ credit sales.
- Concentration: top customers' share of gross AR.
- AR growth vs revenue growth.
- Credit notes ÷ revenue, especially in the first month after year-end.
