# Audit start: user guide

How to run an audit examination with the `audit-start` skill: the files it needs, what you see while it runs, and what it produces. Terms follow `CONTEXT.md`; the design is in ADR 0002 and `docs/skills-harness-diagrams.md`.

## 1. One-time setup

From the repo root:

```bash
npm install --prefix .claude/skills/audit-start/scripts
```

To try it on synthetic data first:

```bash
node .claude/skills/audit-start/scripts/dev/generate-fixtures.mjs engagements
```

This writes two sample engagements with answer keys:

- `engagements/harbour-trading-clean`: everything reconciles; one figure is mistyped on the client's statements.
- `engagements/harbour-trading-messy`: planted trade receivables errors, so the stop rule fires.

`engagements/` is gitignored, so client files are never committed.

## 2. Prepare the engagement folder

One folder per client and year:

```
engagements/<client>-<FYE>/
  engagement.md
  shared/
    prior-year-tb.xlsx
    current-tb.xlsx
    journals/                    one workbook, or one per month
    prior-year-statements.docx
    client-statements.docx
  revenue/
    trade-receivables/
      schedule.xlsx
      aged-listing.xlsx
      provision-matrix.xlsx      optional
    revenue/
      schedule.xlsx
    impairment-loss/             no files needed
```

`engagement.md` holds the settings:

```markdown
# Engagement

- Client: Harbour Trading Ltd
- Year-end: 2026-12-31
- Period start: 2026-01-01
- Framework: IAS 1            (or IFRS 18)
- Performance materiality: 15000
- Clearly trivial: 750
```

### Files and expected columns

| File | Required | Sheet → columns |
|---|---|---|
| `shared/prior-year-tb.xlsx`, `shared/current-tb.xlsx` | Yes | Trial balance → Account, Account name, Debit, Credit, optional Line item |
| `shared/journals/*.xlsx` | Yes | Journal lines → Entry number, Date, Account, Account name, Description, Debit, Credit |
| `shared/prior-year-statements.docx`, `shared/client-statements.docx` | Yes, for the statements step | A heading starting "Statement of financial position" and one starting "Statement of profit or loss", each followed by a table whose amount columns are headed by year (e.g. 2026, 2025) |
| `revenue/trade-receivables/schedule.xlsx` | Yes | Journal lines (every line on the receivables and allowance accounts) · Rollforward → Movement, Amount · Allowance rollforward (when an allowance exists) → Movement, Amount |
| `revenue/trade-receivables/aged-listing.xlsx` | Yes | Aged listing → Customer, Invoice number, Invoice date, Due date, Outstanding, optional Bucket |
| `revenue/trade-receivables/provision-matrix.xlsx` | No | Provision matrix → Bucket, Gross, Rate, Allowance · Individually assessed (optional) → Customer, Gross, Allowance |
| `revenue/revenue/schedule.xlsx` | Yes | Journal lines · Rollforward → Movement, Amount |

Rollforward movement labels:

- Gross trade receivables: Opening balance, Credit sales, Cash receipts, Credit notes, Write-offs, Foreign exchange, Reclassifications, Closing balance.
- Loss allowance: Opening balance, Impairment charge, Reversals, Write-offs used, Foreign exchange, Closing balance.
- Revenue: Opening balance, Credit sales, Cash sales, Credit notes, Other, Closing balance.

Ageing buckets: Not yet due, 1-30 days, 31-60 days, 61-90 days, Over 90 days.

Headers need not match exactly. When a client's columns are named differently (e.g. "Doc No.", "Narrative"), or the TB has no Line item column, the orchestrator proposes a mapping and you confirm it once. The full reference, including the side-file formats, is `.claude/skills/audit-start/references/engagement-folder.md`.

## 3. Start an examination

In Claude Code:

```
audit start engagements/harbour-trading-messy
```

or `/audit-start engagements/harbour-trading-messy`. With a single engagement folder, "audit start" alone is enough.

## 4. What you see

The examples use the messy sample's real results; the agent's wording varies.

**Scan.** For each cycle: ready, unchanged since the last run, or not runnable, with every missing file named and described. For example: "Missing revenue/trade-receivables/aged-listing.xlsx (aged receivables listing at year-end, one row per open invoice)."

**Mappings (only when needed).** One batch of questions, such as "Account 1150 'Provision for doubtful debts': loss allowance?" or "Journal column 'Doc No.': Entry number?". Answers are saved to `shared/account-map.json` and `column-map.json`, so they are never asked again.

**Cycles run.** Each ready cycle's agent works in the background; your conversation stays readable.

**Pending classifications.** Journal lines no rule could place, in one batch, each with the agent's suggestion:

```
JE0156  2026-11-18  "Re-booked INV-1103 Orchid Retail - cleared from suspense"
Dr 1100 Trade receivables 1,250 / Cr 2900 Suspense
Suggested: credit-sale. The description names an invoice re-booked from suspense; confirm against INV-1103.
```

Confirm, change or defer. Confirmed answers go to `confirmations.json` and the cycle re-runs. A deferred line stays in "Unclassified", and every flag that rests on it says so.

**Report.**

```
Outcome: STOPPED. 5 differences above clearly trivial before the statements, so the
client-prepared statements were not examined (stop rule).
Flags: 0 above performance materiality · 7 between thresholds · 3 clearly trivial

• Gross trade receivables, schedule closing vs rebuilt: 5,580. Receipt JE0115 (5,490) is
  missing from the schedule, and the opening balance was typed 26,090 instead of the
  audited 26,000 (90).
• Cash receipts: −5,490. The Harbour Foods receipt JE0115 is not on the schedule.
• Provision matrix, 61-90 days: 6,100. Kestrel Stores is in the matrix and also assessed
  individually, which overstates the allowance by 915.
• Credit balances: −500. Westbay Hotels overpaid; reclassify it to contract liabilities.
```

**Decisions and adjustments.** Tell the orchestrator which flags you accept or reject; a rejection needs a reason. For accepted flags it drafts balanced proposed adjustments (accounts suggested, amount from the flag), for example "ADJ-1 Dr 1000 Cash 5,490 / Cr 1100 Trade receivables 5,490". After you confirm, it produces the adjusted statements. Accepting a figure mistyped on the statements is a presentation correction and needs no journal entry.

## 5. Status page

Every engagement has a status page, `engagements/<client>-<FYE>/status.html`. It **opens in your browser as soon as the skill starts** ("audit start" or "audit status"):

- The orchestrator serves the engagement folder on the server at `http://localhost:8740/status.html` (the next free port up to 8759), bound to localhost only.
- When you work through VS Code Remote-SSH, VS Code forwards that port and opens the page in the browser on your own computer. On a desktop machine it opens with the system browser. If nothing can be opened, the orchestrator gives you the URL.
- While a run is going, the page is in **live mode**: it reloads every 10 seconds and shows each cycle's progress. When the run finishes, the final page stops reloading.
- The local server stops by itself after two hours without a request.

The page is also refreshed after adjustments. To refresh it by hand, say "audit status" or run `node .claude/skills/audit-start/scripts/status.mjs <engagement-folder> --open`.

| Section | Shows |
|---|---|
| Status | Each cycle: ready, unchanged since the last run, missing files (named), column problems; a run still in progress |
| Latest run | Outcome (stopped by the stop rule or finished), flag counts by rank, links to `flags.md`, `workpapers.xlsx` and the adjusted statements, coverage by line item |
| Awaiting the auditor | Account mappings to confirm, journal lines to classify (with the other side of each entry), information needed from the client, judgments needing attention, flags above clearly trivial without a decision |
| TB balance checks | For every line item: audited opening, the year's journal movements, rebuilt closing, and the client's schedule, TB and aged listing closings, with each difference coloured by rank |
| Rollforwards | Each movement, rebuilt against the client's schedule |
| Difference analysis | Every flag: expected, actual, difference, assertion, reference, the explanation, the scripted explanations tested (✓ where one matches), sources, and your decision |
| Provision matrix re-performance | Each bucket: re-aged listing gross against the matrix, rates, re-performed and client allowance, against the ledger |
| Statements | Client-prepared figures against the rebuilt figures and last year's audited comparatives (when examined) |
| Adjustments and decisions | Proposed adjustments and every accept/reject decision with its reason |
| Run history | Every run with its outcome and flag counts |

## 6. Output

Each run writes `engagements/<client>-<FYE>/runs/<timestamp>/`. The folder is never changed once complete.

| File | Contents |
|---|---|
| `flags.md` | The report: outcome; flags ranked against performance materiality and clearly trivial, each with expected, actual, difference, assertion, IFRS/ISA reference, explanation, source rows and any earlier decision; the cycle agents' judgments (journal entry tests, provision matrix rates); items awaiting you; coverage |
| `workpapers.xlsx` | Summary · Flags · Lead schedules (every account, prior year vs current) · Rollforwards (rebuilt vs schedule, with TB and aged listing closings) · Shallow checks · Classified lines (every receivables line, its category and who placed it) · Provision matrix (re-performed vs client) · Statements (presented vs rebuilt, when examined) |
| `run.json` | The permanent record: file fingerprints, every check result, flags and coverage; the next run uses it to see what changed |
| `adjusted-statements.xlsx` and `.docx` | Once flags are accepted: client-prepared figures, proposed adjustments, presentation corrections and adjusted figures, with the list of adjustments |

These engagement-level files carry over between runs: `adjustments.xlsx`, `dispositions.json` (your decisions and reasons), and the mapping and confirmation files.

## 7. Re-running

Upload a corrected or new file into its folder and say "audit start" again. Only cycles whose files changed run again; unchanged cycles reuse their last results, and earlier decisions appear next to the matching flags.

## 8. What is checked

| Area | Depth |
|---|---|
| Trade receivables (gross and loss allowance), revenue, impairment losses on trade receivables | Deep: rebuilt from last year's audited closing and every journal line; compared with the schedule, TB and aged listing; provision matrix re-performed; cross-checks to revenue, impairment loss and cash; difference explanations |
| Every other line item | Shallow: last year's audited closing + the year's journal lines = TB |
| Statement of financial position and statement of profit or loss | Compared with the rebuilt figures when the stop rule does not fire |
| Statement of cash flows, statement of changes in equity, notes | Not examined yet |

## 9. Checking the scripts

After a run on a sample engagement, compare its flags with the answer key:

```bash
node .claude/skills/audit-start/scripts/dev/check-answer-key.mjs \
  engagements/harbour-trading-messy/runs/<run-id>/run.json \
  engagements/harbour-trading-messy.answer-key.json
```
