# Audit Workbench

A productivity tool that helps auditors plan and perform line-item-specific procedures faster, tested against synthetic companies with known misstatements.

## Language

### Financial statements

**Financial statements**:
The four primary statements (balance sheet, income statement, statement of changes in equity, cash flow statement) together with their notes, for a single entity.
_Avoid_: Consolidated statements (reserve "consolidated" for combining a parent and subsidiaries, which is out of scope)

**Note**:
A section of the financial statements, beyond the primary statements, that explains a line item or policy in words and supporting tables (e.g. the trade receivables ageing note).
_Avoid_: Sector, section, disclosure (when meaning the whole note)

**Illustrative set**:
A published or firm-owned model set of IFRS financial statements, uploaded by the auditor's firm each year and recording which standards it covers; never bundled with the tool.
_Avoid_: Reference template, model accounts, template

**Client template**:
The illustrative set tailored to one client (notes that don't apply removed, client-specific notes added), carried forward from year to year; the client's notes are compared against it and against last year's audited wording.
_Avoid_: Reference template, template

**Line item**:
A single caption on a financial statement (e.g. Revenue, Trade receivables).
_Avoid_: Account (ambiguous with ledger account), account item, FS item

**Cycle**:
A group of related line items whose balances are moved by the same transactions, examined together (e.g. the revenue cycle covers Revenue, Trade receivables and their notes, because every credit sale moves both).
_Avoid_: Account item, area, module

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

**Journal entry**:
A balanced set of journal lines sharing one entry number (e.g. Dr Cash 100, Dr Accounts receivable 100, Cr Revenue 200).
_Avoid_: Transaction, posting, record

**Journal line**:
One debit or credit to one ledger account within a journal entry.
_Avoid_: Entry (when meaning one side only), record

**Line-item schedule**:
The client's sheet for one line item, listing every journal line that hit its accounts and its rollforward in a fixed layout, with formula cells showing how the client calculated the closing balance.
_Avoid_: Account item sheet, AR sheet, ledger extract

**Supporting schedule**:
A listing, separate from the journals, that substantiates a balance at customer or item level, such as the aged receivables listing.
_Avoid_: Sheet, source sheet, subledger (unless it is literally one)

**Loss allowance**:
The IFRS 9 expected-credit-loss contra-asset deducted from gross receivables to present them net; it has its own rollforward (opening + charge − write-offs used ± reversals = closing), and its charge less reversals is the impairment loss on trade receivables (often labelled bad debt expense in client ledgers).
_Avoid_: Allowance for doubtful debts (the IAS 39 incurred-loss term), provision of AR, bad debt provision (when meaning the balance, not the expense)

**Cross-check**:
A check that an amount on one line item agrees with an amount on another through the journal entries they share (e.g. AR credit sales against revenue, loss allowance charge against impairment loss, AR receipts against cash).
_Avoid_: Tie-out, cross-reference, reconciliation

**Schedule template**:
The expected column layout for one kind of supporting schedule; it differs by line item (a cash book looks nothing like an inventory movement report).
_Avoid_: Format, schema, sheet layout

**Lead schedule**:
The summary workpaper for one line item, listing the client accounts mapped to it with prior-year balance, current-year balance and differences.
_Avoid_: Reconciled sheet, summary sheet

**Account mapping**:
The assignment of each client ledger account to the line item it rolls up into.
_Avoid_: Classification, CoA mapping

**Opening balances**:
The balances at the start of the current period, carried forward from the prior year's audited closing position.
_Avoid_: Beginning values, prior-year figures (those are the comparatives)

**Client-prepared statements**:
The trial balance and financial statements, including notes, that the client produced for the current period; the auditor examines these and does not prepare them.
_Avoid_: Client FS, management accounts, draft FS

**Rebuilt statements**:
The auditor's independent recomputation of the financial statements from opening balances and the client's current-period data, used only as an expectation to compare against the client-prepared statements.
_Avoid_: Draft financial statements, consolidated statements, expected statements

**Proposed adjustment**:
A correction the auditor accepts from a flag, written as a balanced journal entry for the client to post.
_Avoid_: Audit adjustment (until the client has posted it), correction, AJE

**Adjusted statements**:
The client-prepared statements with every accepted proposed adjustment applied; the client reviews and adopts them as its own, so the auditor never becomes their preparer.
_Avoid_: Audited statements (until the opinion is signed), final statements, draft statements

**Flag**:
A specific item the tool raises for the auditor to look into, linked to the entries or schedule rows that triggered it.
_Avoid_: Alert, issue, exception (reserve for a procedure's findings)

**Unreconciled difference**:
The amount by which opening balance plus movements fails to equal the closing balance, or by which a movement fails to agree with its supporting schedule.
_Avoid_: Gap, variance, break

**Stop rule**:
Any difference above the clearly trivial threshold in opening balances, line-item schedules, the trial balance or a cross-check means the client-prepared statements are not examined in that run; every such difference across all line items is still reported first.
_Avoid_: Gate, blocker, halt

### Engagements

**Firm**:
The audit firm a user belongs to; people join only by invitation, and every engagement belongs to exactly one firm.
_Avoid_: Organisation, tenant, company (the client is a company too)

**Orchestrator**:
The agent the auditor talks to: when the auditor starts an audit, it checks every cycle's folder for its required files, starts the cycle agent of each cycle ready to run, runs the cross-checks that span cycles, applies the stop rule and assembles the results.
_Avoid_: Main agent, master agent

**Cycle agent**:
The worker in charge of one cycle: it runs the cycle's checks and calls the line-item skill of each line item in the cycle; every amount comes from the checks, never from the agent.
_Avoid_: Sub-agent, AR agent (an agent owns a cycle, not a line item)

**Line-item skill**:
The instructions and permitted tools the AI model is given for one line item's judgment tasks (e.g. classifying trade receivables journal lines the rules can't place); a cycle agent holds one per line item in its cycle.
_Avoid_: Cycle skill, agent

**Engagement**:
One audit of one client for one reporting year, with its own engagement team, accounting framework (locked once created), files and results.
_Avoid_: Project, job, audit information, client (the client is the audited company, not the audit)

**Engagement folder**:
The directory tree holding one engagement's files: a shared folder for engagement-wide files (trial balances, journal export, statements), one folder per cycle holding one folder per line item for that line item's schedules, and the record of every run.
_Avoid_: Accounting structure, upload area, workspace

**Run**:
One examination of an engagement started by the auditor, recording which files it read and every result; never edited afterwards.
_Avoid_: Job, execution, pass

**Engagement team**:
The people allowed to work on an engagement, added by the engagement manager; each member is a preparer or a reviewer.
_Avoid_: Audit team (when meaning the whole firm), members, users

**Preparer**:
An engagement team member who uploads files and runs cycle checks.
_Avoid_: Staff, junior, user

**Reviewer**:
An engagement team member (senior, manager or partner) who signs off a cycle after its checks have run.
_Avoid_: Approver, supervisor

**Engagement files**:
The inputs every cycle shares: the trial balance, the journal export, the client-prepared statements and last year's audited files.
_Avoid_: Common files, global files, shared files

**Journal export**:
The client's full set of journal lines for the year, possibly delivered as one file per month, which together must cover every month of the reporting year exactly once.
_Avoid_: GL dump, journals, ledger

**Run**:
One execution of a cycle's checks or of the statement examination, kept unchanged forever, recording who ran it, when, which file versions and thresholds it used, its outcome and its flags.
_Avoid_: Job, execution, check (a check is one test within a run)

**File version**:
One upload of a file into its slot; a re-upload creates the next version and never deletes or overwrites earlier ones.
_Avoid_: Revision, replacement, update

**Disposition**:
The preparer's recorded conclusion on one flag or fluctuation: corrected by client, explained and not a misstatement (with note and source), or possible misstatement carried to the summary.
_Avoid_: Resolution, status, response

**Sign-off**:
A reviewer's approval of one specific run of a cycle, recording who, when and any comment; it requires a disposition on every flag and every fluctuation needing explanation, cannot be given by that run's preparer, and is cancelled by a new file version or a re-run.
_Avoid_: Approval, review (review is the activity; sign-off is its recorded outcome)

### Auditing

**Fluctuation**:
The change in a line item's balance from last year's audited figure to this year's; one that exceeds both the percentage and the amount threshold needs an explanation from the auditor, but is not a difference and never triggers the stop rule.
_Avoid_: Difference, variance, movement (movement is a rollforward category)

**Performance materiality**:
An amount the auditor enters for the engagement; flagged differences above it are ranked as most important.
_Avoid_: Threshold, tolerance

**Clearly trivial threshold**:
An amount the auditor enters below which a difference is still flagged but ranked as clearly trivial.
_Avoid_: De minimis, rounding (rounding tolerance is separate and only applies to presented amounts)

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
