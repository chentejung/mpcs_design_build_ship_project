---
name: revenue
description: Line-item skill for revenue in the revenue cycle - explaining revenue rollforward and cross-check flags, judging ISA 240 journal entry tests and revenue posted to unusual accounts.
disable-model-invocation: true
---

# Revenue

The judgment for the **revenue** line item, used by the revenue cycle agent on `runs/<run>/work/revenue.json`. The script has already rebuilt revenue from the journals and run the checks. You explain flags and conclude on journal entry tests. Every amount comes from the file.

## Why revenue gets a skeptic's reading

Revenue recognition carries a **presumed fraud risk** (ISA 240): unless rebutted, fictitious or early revenue is treated as a significant risk, and it lands in trade receivables. Revenue is recognised when control of goods or services passes to the customer, at the amount of consideration expected (IFRS 15.31, 15.47). Variable consideration (rebates, returns) is estimated and constrained (IFRS 15.50-59). Bill-and-hold sales need every IFRS 15.B79-B82 criterion met.

## Explain a revenue flag

Use the method in the trade receivables skill's "Explain a difference" section: trace the cause from the matched candidates, name the assertion, give the next procedure. Revenue-specific readings:
- `schedule-movement` / `rebuilt-vs-schedule` on revenue: compare with the trade receivables flags first. A credit sale missing on one side usually shows on both.
- `cross-check-revenue`: credit sales on receivables disagree with revenue posted in the same entries. Look for sales tax posted to an unexpected account, invoices split across entries, or receivables lines still unclassified.
- `revenue-unusual-account`: revenue credited against an account that is neither receivables, cash nor sales tax. This is an **occurrence** risk (ISA 240). Say what the other account is and the most innocent and the most concerning reading. The next procedure is to vouch the entry to its underlying contract or delivery evidence.
- `rebuilt-vs-tb` on revenue: the journal export and the TB disagree. Check `missing-month` before anything else.

## Conclude on the journal entry tests

`forReview.journalEntryTests` lists revenue entries the script selected: posted in the last week of the period, round amounts, or with no document reference. For each one, conclude:
- **expected**, with the reason: a routine month-end cash sale, say, or a recurring invoice to a known customer; or
- **needs the auditor**, with the reason: a large round sale to a new customer on the last day, no reference, or a credit to revenue reversed after year-end.

Name the procedure: vouch to invoice and delivery note, check for a credit note after year-end, confirm with the customer.

Record each conclusion as a review item with `topic: "Journal entry test <entry>"`.
