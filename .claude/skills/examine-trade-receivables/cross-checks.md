# Cross-checks for trade receivables

Each row is a **cross-check**: an amount on AR that must agree with an amount on another line item through the journal entries they share. Compute each with a script and report the difference against CT.

| Related line item | Typical journal entry | Check |
|---|---|---|
| Revenue | Dr AR / Cr Revenue (Cr VAT) | Credit sales in the AR rollforward + cash sales = revenue, net of output VAT |
| Output VAT / sales tax payable | Cr VAT on the sales entry | Gross credit sales − net credit revenue = output VAT on credit sales |
| Cash and bank | Dr Cash / Cr AR | AR receipts = customer receipts in the cash journal, including suspense clearings |
| Loss allowance | Dr Impairment loss / Cr Loss allowance | Allowance rollforward: opening + charge − write-offs used ± reversals = closing |
| Impairment loss on trade receivables (P&L; often "bad debt expense") | As above | Allowance charge − reversals = P&L impairment line |
| Write-offs | Dr Loss allowance / Cr AR | Write-offs in the gross AR rollforward = write-offs used in the allowance rollforward |
| Sales returns, discounts, rebates; refund liabilities | Dr Revenue / Cr AR or refund liability | Credit notes in the AR rollforward = revenue reductions for returns and allowances |
| Contract assets / contract liabilities | Dr AR / Cr Contract asset on billing; Dr Cash / Cr Contract liability for advances | Movements agree to the IFRS 15.116 note; credit balances reclassified |
| Inventory / cost of sales | Dr COGS / Cr Inventory for the same shipment | Revenue and COGS recorded in the same period around year-end |
| FX gains and losses | Dr/Cr AR, Cr/Dr FX gain/loss | Foreign-currency balances × closing rate − carrying amount = FX movement |
| Interest income | Dr AR / Cr Interest income | Unwinding of a significant financing component; late-payment interest |
| Borrowings | Dr Cash / Cr Borrowing for factoring with recourse | Factored balances not derecognised = related borrowing |
| Deferred tax | Dr Deferred tax asset / Cr Tax expense | Allowance (if deductible only on write-off) × tax rate = temporary difference |
| Related-party balances | — | Related-party balances in the listing = IAS 24 note |
| Cash flow statement | — | Change in trade receivables in operating cash flows = gross movement net of non-cash items (write-offs, FX) |
| Retained earnings | Prior-period error correction | Restated opening AR = prior-year audited closing ± correction |
| Statement of financial position | — | Gross AR − loss allowance = presented trade receivables |
