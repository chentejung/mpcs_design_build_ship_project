# Deterministic code computes every number; agents only exercise judgment

Audit Workbench uses an orchestrator with one agent per cycle, but no agent ever produces an amount. Every figure in the rebuilt statements, every rollforward and every difference is computed by deterministic code. Agents only suggest account mappings, choose which procedures and flags apply, read the client's notes, and write narrative explaining flags that the rules already computed. We chose this so that results are reproducible, every amount traces to a source row, and evaluation against a synthetic company's answer key measures the tool rather than LLM arithmetic noise.

## Considered Options

- **Agents compute their cycle's amounts**: the more literal "multi-agent" reading. Rejected because the same input could produce different numbers between runs, and no auditor can rely on a workpaper that might not reproduce.
