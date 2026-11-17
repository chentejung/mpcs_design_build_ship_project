# IFRS rules for trade receivables

Paragraph references are from general knowledge as of mid-2026. Verify against the IFRS Foundation's current Standards before citing them in a workpaper (sources: `research/ifrs-isa-sources.md`).

## Effective dates

| Change | Effective for periods beginning on or after | Effect on AR |
|---|---|---|
| IAS 21 amendments, lack of exchangeability | 1 Jan 2025 | Foreign-currency receivables where a currency is not exchangeable: estimate a spot rate and disclose. |
| IFRS 9 / IFRS 7 amendments, classification and measurement (2024) | 1 Jan 2026 | Receivables are derecognised on settlement date, when the cash arrives. The early-derecognition option for electronic payments covers financial liabilities only. |
| Annual Improvements Volume 11 (2024) | 1 Jan 2026 | IFRS 9.5.1.3: trade receivables are initially measured at the amount determined by applying IFRS 15 (replaces the conflicting "transaction price" wording). Clarifications to IFRS 7 credit risk guidance. |
| IFRS 18, replaces IAS 1 | 1 Jan 2027, retrospective, early adoption allowed | New P&L categories, line-item and disaggregation rules. Indirect cash flow reconciliation starts from operating profit. IAS 8 renamed. |
| IFRS 19, reduced disclosures for eligible subsidiaries | 1 Jan 2027 | Fewer IFRS 7 disclosures if the entity elects it. |

## Composition

A **trade receivable** is a right to consideration that is unconditional: only the passage of time must pass before payment is due (IFRS 15.108). It is a financial asset in the scope of IFRS 9.

Belongs in gross trade receivables:
- Invoiced amounts for goods or services, including sales tax or VAT (revenue excludes it).
- Unbilled receivables where the right is already unconditional (service delivered, invoice not yet raised).
- Trade notes or bills receivable.
- Retentions, once unconditional.
- Receivables transferred to a factor but not derecognised.

Misclassification tests, each a potential flag:

| Item | Correct home | Test |
|---|---|---|
| Right still conditional on further performance | Contract asset, separate line (IFRS 15.107) | Unbilled amounts and retentions: is anything left to perform? |
| Credit balances in the AR ledger (overpayments, advances) | Contract liability or other payable; never netted | Customer-level listing: any negative balances? |
| Refund liability, asset for goods expected to be returned | Separate items; never netted against AR | Returns provisions posted to the AR control account |
| Non-trade receivables (employee loans, deposits, interest, dividends) | Other receivables | Accounts or customers that are not customers |
| VAT recoverable, prepayments | Not financial assets; outside IFRS 7/9 | Included in the IFRS 7 credit risk tables? |
| Finance lease receivables | IFRS 16, own ECL policy choice | Leasing customers in the listing |
| Related-party balances | Disclosed separately (IAS 24.18) | Listing names vs the related-party list |
| Due after more than 12 months | Non-current; check for a significant financing component | Contract terms, ageing "not yet due" beyond 12 months |
| Offset against payables to the same party | Only with an enforceable right and intent to settle net (IAS 32.42) | Netting entries between AR and AP |

## Recognition

- Recognise when the right to consideration becomes unconditional (IFRS 15.108), typically when control of goods or services transfers and payment depends only on time.
- Bill-and-hold: revenue and receivable only when all the IFRS 15 bill-and-hold criteria are met (IFRS 15.B79–B82).
- Initial amount: the IFRS 15 amount, including estimated variable consideration (rebates, discounts, returns) subject to the constraint (IFRS 15.50–59).

## Measurement

- **Classification**: amortised cost when the business model is to collect cash and the cash flows are solely principal and interest (IFRS 9.4.1.2). Routine factoring of a portfolio can mean collect-and-sell (FVOCI) or sell (FVTPL); test the business model where factoring is significant.
- **Significant financing component**: discount if the payment terms give significant financing; practical expedient when the gap between transfer and payment is one year or less (IFRS 15.60–63, IFRS 9.5.1.3).
- **Simplified approach**: lifetime ECL always, with no staging, for trade receivables and contract assets without a significant financing component (IFRS 9.5.5.15). For those with a significant financing component, and for lease receivables, it is a policy choice.
- **ECL requirements** (IFRS 9.5.5.17): unbiased and probability-weighted, time value of money, and reasonable and supportable information about past events, current conditions and **forecasts** of future conditions. A provision matrix built only on historical loss rates fails the forward-looking requirement.
- **Provision matrix**: allowed as a practical expedient (IFRS 9.B5.5.35); group receivables by shared credit risk characteristics (customer type, geography, ageing).
- **Default**: rebuttable presumption that default happens no later than 90 days past due (IFRS 9.B5.5.37); rebutting it needs reasonable and supportable evidence.
- **Credit-impaired** balances (customer bankruptcy, severe financial difficulty, breach of contract) are measured individually.
- **Write-off**: reduce the gross carrying amount when there is no reasonable expectation of recovery (IFRS 9.5.4.4). Recoveries after write-off go to P&L.
- **Foreign currency**: monetary item, retranslated at the closing rate, with differences in P&L (IAS 21.23, 21.28).
- **Tax**: the ECL charge is often deductible only on write-off, giving a deferred tax asset (IAS 12).

## Derecognition

- Derecognise when the contractual rights to cash flows expire (on settlement, under the 2026 amendments) or the receivable is transferred and the transfer qualifies (IFRS 9.3.2.3).
- Transfers (factoring, securitisation): substantially all risks and rewards transferred → derecognise; retained → keep the receivable and recognise a borrowing for the cash received; neither → depends on control, with continuing involvement (IFRS 9.3.2.6).
- Factoring **with recourse** almost always fails derecognition.

## Presentation and disclosure

Statement of financial position:
- Trade and other receivables, contract assets and contract liabilities presented separately (IFRS 15.105).
- Current / non-current split.

Profit or loss:
- Impairment losses and reversals under IFRS 9 Section 5.5 as a separate line item. This holds under both IAS 1 (82(ba)) and IFRS 18.
- Under IFRS 18, impairment on trade receivables normally falls in the **operating** category.

Cash flows:
- Change in trade receivables within operating activities (indirect method). Under IFRS 18 the reconciliation starts from operating profit, not profit or loss.

Notes:
- Accounting policy for receivables and ECL (classification, simplified approach, write-off policy).
- Loss allowance reconciliation, opening to closing (IFRS 7.35H).
- Credit risk exposure by grade or ageing; provision matrix information (IFRS 7.35M–35N).
- Inputs, assumptions and techniques for ECL, including forward-looking information (IFRS 7.35G).
- Amounts written off but still subject to enforcement (IFRS 7.35L).
- Concentrations of credit risk (IFRS 7.34(c)) and collateral held.
- Opening and closing receivables, contract assets and contract liabilities (IFRS 15.116).
- Impairment losses on contract receivables and contract assets, shown separately from other impairment (IFRS 15.113(b)).
- Transferred receivables not derecognised and receivables pledged as collateral (IFRS 7.14, 7.42D).
- Related-party balances and their allowance (IAS 24.18–19).
- Customer bankruptcy after the reporting date: usually an adjusting event (IAS 10.9(b)(i)).
