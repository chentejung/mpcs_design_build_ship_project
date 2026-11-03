# Audit Workbench

A productivity tool that helps auditors plan and perform line-item-specific procedures faster, tested against synthetic companies with known misstatements.

## Language

### Financial statements

**Line item**:
A single caption on a financial statement (e.g. Revenue, Trade receivables).
_Avoid_: Account (ambiguous with ledger account), FS item

**Accounting policy**:
The framework rule (e.g. an IFRS requirement) that determines how a line item should be recognised, measured and presented.
_Avoid_: Audit principle, accounting rule

**Application example**:
A worked illustration of applying an accounting policy to a specific fact pattern.
_Avoid_: Case, sample

### Balances and movements

**Rollforward**:
The reconciliation of a line item from its opening balance, through each movement in the period, to its closing balance.
_Avoid_: Roll-forward schedule, movement analysis, bridge

**Movement**:
One category of change within a rollforward, such as credit sales, cash receipts, returns or write-offs.
_Avoid_: Add/deduct item, change, activity

**Supporting schedule**:
A listing that substantiates one movement or balance, such as a sales journal, cash receipts journal, credit note listing or aged receivables listing.
_Avoid_: Sheet, source sheet, subledger (unless it is literally one)

**Schedule template**:
The expected column layout for one kind of supporting schedule; it differs by line item (a cash book looks nothing like an inventory movement report).
_Avoid_: Format, schema, sheet layout

**Lead schedule**:
The summary workpaper for one line item, listing the client accounts mapped to it with prior-year balance, current-year balance and differences.
_Avoid_: Reconciled sheet, summary sheet

**Account mapping**:
The assignment of each client ledger account to the line item it rolls up into.
_Avoid_: Classification, CoA mapping

**Client-prepared statements**:
The trial balance and financial statements the client produced, which the tool independently rebuilds from journals and compares against.
_Avoid_: Client FS, management accounts

**Flag**:
A specific item the tool raises for the auditor to look into, linked to the entries or schedule rows that triggered it.
_Avoid_: Alert, issue, exception (reserve for a procedure's findings)

**Unreconciled difference**:
The amount by which opening balance plus movements fails to equal the closing balance, or by which a movement fails to agree with its supporting schedule.
_Avoid_: Gap, variance, break

### Auditing

**Assertion**:
A claim management implicitly makes about a line item — existence/occurrence, completeness, valuation, rights and obligations, cutoff, presentation.
_Avoid_: Audit principle, audit objective

**Procedure**:
A specific audit test performed to gather evidence over an assertion (e.g. confirmation, vouching, cutoff testing, analytical procedure).
_Avoid_: Checking method, check, test step

**Source document**:
Evidence underlying a transaction, such as an invoice, shipping document, contract, or bank statement.
_Avoid_: Support, backup, voucher

### Synthetic test data

**Synthetic company**:
A generated company whose ledger, source documents and financial statements are produced by a balanced double-entry engine, used in place of confidential client data.
_Avoid_: Pseudo company, fake company, client


**Planted misstatement**:
A deliberate error or fraud injected into a synthetic company after its books balance, recorded in the answer key.
_Avoid_: Bug, fake error, anomaly

**Answer key**:
The hidden record of every planted misstatement, including which line item, assertion and procedure should detect it; used to measure whether the tool flags it.
_Avoid_: Solution, ground truth
