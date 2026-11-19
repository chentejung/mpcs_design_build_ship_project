---
name: impairment-loss
description: Line-item skill for impairment losses on trade receivables in the revenue cycle - explaining the cross-check between the loss allowance movements and the P&L line, and its presentation under IAS 1 or IFRS 18.
disable-model-invocation: true
---

# Impairment losses on trade receivables

The judgment for the **impairment losses on trade receivables** line item, used by the revenue cycle agent on `runs/<run>/work/revenue.json`. The figures are in `impairment` (charge, reversals, direct write-offs, expected, TB) and in the `cross-check-impairment` flag. Every amount comes from the file.

## What the line should hold

The P&L line equals the loss allowance charge less reversals, plus balances written off directly without passing through the allowance. Recoveries of amounts written off earlier also go through profit or loss. Under IFRS 9 the allowance is lifetime expected credit loss (the simplified approach, 9.5.5.15). An entity that only charges bad debts when they happen is using an incurred-loss model, which IFRS 9 does not allow.

Presentation: impairment losses (and reversals) determined under IFRS 9 Section 5.5 are a separate line on the face of profit or loss, under both IAS 1.82(ba) and IFRS 18. Under IFRS 18 (periods beginning on or after 1 Jan 2027, or earlier if adopted), impairment on trade receivables normally sits in the **operating** category.

## Explain a `cross-check-impairment` flag

Use the method in the trade receivables skill's "Explain a difference" section, with these usual causes:
- the allowance charge posted to another expense line (administrative expenses, for example): a **classification** misstatement, look at the other side of the allowance entries;
- direct write-offs posted to a different expense account, so the P&L line looks low;
- a recovery or reversal netted elsewhere;
- allowance lines still unclassified (`unconfirmed-lines`), so the figure waits on the auditor.

Give the next procedure: trace the year-end allowance entry to the provision matrix, and review the expense accounts for charges to receivables.

## Presentation check

When the statements are examined, a difference on the impairment caption alone usually means the line was merged into another expense caption. Say whether the framework set in `engagement.md` requires it shown separately (it does under both IAS 1 and IFRS 18).
