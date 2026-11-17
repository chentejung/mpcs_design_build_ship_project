# Claude Code skills, with scripts computing every amount

The examination is built as Claude Code skills, not as the web app: the orchestrator is the agent the auditor talks to (triggered by "audit start"), each cycle runs in its own cycle agent (a subagent), and each line item has its own line-item skill. This reverses PLAN.md's Nov 16 decision that the orchestrator is code. Every amount is still computed deterministically, extending ADR 0001: Node scripts using SheetJS read the client's files through a column mapping and an account mapping that an agent suggests and the auditor confirms, so once the mappings are saved, the same files give the same numbers on every run.

## Considered Options

- **Orchestrator as code (the Nov 16 design)**: rejected for now; the auditor wants to drive the examination in conversation, and the orchestrator's real judgment tasks (account mapping, batching confirmations, drafting proposed adjustments, the run summary) suit an agent.
- **Agents compute amounts**: rejected for the same reasons as ADR 0001; results must reproduce and trace to source rows.
- **Strict column names with no mapping**: rejected; real client exports rarely match a schedule template, and choosing a mapping is judgment, which an agent may make once the auditor confirms it.
- **Python scripts**: rejected; Node and SheetJS are already installed, and the v1 readers and checks in `web/src/lib/examination` can be carried over.

## Consequences

- The web app is set aside; PLAN.md's platform roadmap no longer describes what is being built.
- Subagents cannot ask the auditor questions, so cycle agents return pending judgments and the orchestrator puts them to the auditor in one batch.
