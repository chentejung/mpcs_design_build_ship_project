---
name: audit-start
description: Runs an audit examination over an engagement folder as the orchestrator - finds which cycles have their files, dispatches each ready cycle agent, batches judgments for the auditor, applies the stop rule, compares the client-prepared statements, records the run and turns accepted flags into proposed adjustments and adjusted statements. Use when the auditor says "audit start" or "audit status", asks to examine or re-run an engagement or to see where it stands, or has uploaded new files to an engagement folder.
---

# Audit start

You are the **orchestrator** (`CONTEXT.md`): the agent the auditor talks to. Cycle agents do each cycle's work; scripts compute every amount (ADR 0001, ADR 0002). Your judgment tasks are proposing mappings, batching questions, writing narratives for cross-cycle flags and drafting proposed adjustments.

`S=.claude/skills/audit-start/scripts` (from the repo root). If `$S/node_modules` is missing, run `npm install --prefix $S` once.

The engagement folder is the auditor's argument, or the only folder under `engagements/`; otherwise ask. Its layout, schedule templates and side-file formats are in [references/engagement-folder.md](references/engagement-folder.md); read it before writing any side file or when explaining to the auditor what to upload.

## Ground rules

- **Every amount is quoted from a script's output** (`scan`, `<cycle>.json`, `flags.md`). When a figure you need is not in an output, say so; arithmetic you do yourself never reaches the auditor or a file.
- **The auditor confirms every judgment before it is saved**: account mappings, column maps, classifications, adjustments, dispositions.
- **Runs are permanent.** Once `run.json` exists, its folder is never edited; new information means a new run.
- **Cite and paraphrase** standards by paragraph (IFRS and ISA text is copyrighted).

## Steps

0. **Open the status page.** `node $S/status.mjs <eng> --open --live`, before anything else. This serves the folder on localhost and opens `status.html` in the auditor's browser (through VS Code's port forwarding when they are connected remotely). Tell the auditor the URL it prints; if `opened` is false, ask them to open the URL themselves. In live mode the page reloads every 10 seconds, so refresh it with `node $S/status.mjs <eng> --live` after each step below, and it follows the run.

1. **Scan.** `node $S/scan.mjs <eng>`. Tell the auditor, per cycle: ready, unchanged since the last run, or not runnable, naming every missing file (with its description from the scan) and every column problem. Offer to rename unexpected files that are plainly a template file under another name. If `settingsProblems` is not empty, ask the auditor to fix `engagement.md` and stop.
   _Done when_ every cycle has a status the auditor has seen, and every problem the scan reported has been put to them.

2. **Resolve mappings.** For each `pendingMappings` item and each column problem, propose the mapping from account names or headers (e.g. "Provision for doubtful debts" → loss allowance; "Doc No." → Entry number). Put them to the auditor in one batch. Write the confirmed answers to `shared/account-map.json` (with `"confirmed": true`) or the folder's `column-map.json`, then scan again.
   _Done when_ the scan shows no pending mappings and no column problems for the cycles you will run, or the auditor has chosen to leave a cycle out.

3. **Start the run.** `RID=$(node $S/run.mjs start <eng>)`.

4. **Dispatch the cycles.** In one message, launch an Agent for every `ready` cycle, with `subagent_type` set to the cycle's `agent` from the scan and a prompt giving the engagement folder, the run id and `S`. For every `unchanged` cycle run `node $S/run.mjs reuse <eng> $RID <cycle>`. Cycles with missing files or column problems are not run.
   _Done when_ every cycle has run, been reused, or been recorded as not run.

5. **Batch the judgments.** From the cycle agents' reports, gather every pending classification (with the agent's suggestion and reasoning) and every information request. Put them to the auditor in one batch, showing for each line its entry, date, description, amount and the other side of the entry. Record each confirmed category in that line item's `confirmations.json`, then re-dispatch the affected cycle agents with the same run id. A line the auditor defers stays in "Unclassified", and its flags say so.
   _Done when_ every pending line is confirmed or explicitly deferred by the auditor.

6. **Cross-cycle checks and finalize.** `node $S/cross-cycle.mjs <eng> $RID`. For each flag in `runs/$RID/work/cross-cycle.json` above clearly trivial, write a two-sentence narrative (what disagrees, the likeliest cause from its sources, the next procedure) to `runs/$RID/work/orchestrator-narratives.json` as `{ "<flag key>": "<narrative>" }`. Then `node $S/finalize.mjs <eng> $RID`.

7. **Report.** Read `runs/$RID/flags.md`. Tell the auditor:
   - the outcome: stopped by the stop rule, or finished with the statements examined;
   - the number of flags in each rank;
   - one line per flag above clearly trivial: line item, difference, explanation;
   - information still needed, judgments that need attention, and coverage gaps.

   Point them to the status page (`<eng>/status.html`, refreshed by `finalize`) and to `workpapers.xlsx` for the full workpapers.
   _Done when_ the auditor has the outcome and every flag above clearly trivial.

8. **Decisions and adjustments**, when the auditor accepts or rejects flags:
   - record each decision in `dispositions.json` (decision, reason, run; a rejection needs a reason);
   - for an accepted flag that a journal entry corrects, draft a balanced proposed adjustment: suggest the accounts, take the amount from the flag's difference, and show it to the auditor;
   - on confirmation, pass it to `node $S/adjust.mjs add <eng> <file.json>`;
   - an accepted `statement-amount` flag is a presentation correction and needs no entry.

   Then run `node $S/adjust.mjs apply <eng> $RID` and tell the auditor where the adjusted statements are.
   _Done when_ every flag the auditor decided on is in `dispositions.json`, and the adjusted statements reflect every accepted one.

## Audit status

When the auditor asks where the engagement stands ("audit status"), run `node $S/status.mjs <eng> --open`, which refreshes the page and opens it, and give them the URL. Then summarise in three lines or fewer: the cycles' readiness, the latest run's outcome, and what awaits them. The page shows:
- cycle readiness and missing files;
- the latest run's outcome and coverage;
- what awaits the auditor;
- TB balance checks (rebuilt closing against the schedule, TB and aged listing for every line item);
- rollforwards, difference analysis with explanations and decisions, provision matrix re-performance, the statements comparison, adjustments and run history.

`finalize` and `adjust` refresh it automatically; `finalize` writes it without live mode, which stops the reloading once the run is complete.

## Adding a cycle

A cycle is a manifest in `cycles/<id>.json` (line items, required files, schedule templates), a cycle agent in `.claude/agents/<agent>.md`, a script in `scripts/cycles/<id>.mjs` writing `runs/<run>/work/<id>.json` in the revenue cycle's shape, and one line-item skill per line item. The orchestrator steps do not change. Line items no cycle examines get the shallow check from `cross-cycle.mjs`.

## Testing

`node $S/dev/generate-fixtures.mjs engagements` writes two synthetic engagements (clean and messy) with answer keys; after a run, `node $S/dev/check-answer-key.mjs <run.json> <answer-key.json>` compares the flags.
