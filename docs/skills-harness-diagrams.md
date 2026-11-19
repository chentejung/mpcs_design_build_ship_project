# Audit examination as Claude Code skills: folder and harness diagrams

Diagrams of the design agreed on 2026-11-17 (ADR 0002). Terms follow `CONTEXT.md`. Rule throughout: scripts compute every amount; agents only map, classify, explain and draft (ADR 0001).

1. [Engagement folder](#1-engagement-folder)
2. [Harness files in the repo](#2-harness-files-in-the-repo)
3. [Agent harness structure](#3-agent-harness-structure)
4. ["Audit start" run sequence](#4-audit-start-run-sequence)
5. [Trade receivables rollforward check](#5-trade-receivables-rollforward-check)

---

## 1. Engagement folder

One folder per engagement, gitignored. The auditor uploads into `shared/` and the line-item folders. Agents write only the mapping and confirmation files (after the auditor confirms), `adjustments.xlsx`, and new runs. Runs are never edited.

```mermaid
flowchart LR
    ENG["engagements/client-FYE/"]

    ENG --> SET["engagement.md<br/>year-end · framework (IAS 1 / IFRS 18)<br/>performance materiality · clearly trivial"]
    ENG --> SH["shared/"]
    ENG --> REV["revenue/<br/>(cycle)"]
    ENG --> TRE["treasury/<br/>(cycle)"]
    ENG --> OTH["… one folder per cycle"]
    ENG --> ADJ["adjustments.xlsx<br/>proposed adjustments,<br/>edited across runs"]
    ENG --> RUNS["runs/"]

    SH --> SH1["prior-year-tb.xlsx<br/>current-tb.xlsx"]
    SH --> SH2["journals/<br/>1 file or 12 monthly files"]
    SH --> SH3["prior-year-statements.docx<br/>client-statements.docx"]
    SH --> SH4["account-map.json<br/>(confirmed by auditor)"]

    REV --> AR["trade-receivables/<br/>(line item)"]
    REV --> RV["revenue/<br/>(line item)"]
    REV --> IL["impairment-loss/<br/>(line item)"]

    AR --> AR1["schedule.xlsx<br/>journal lines + rollforward<br/>(gross AR and loss allowance)"]
    AR --> AR2["aged-listing.xlsx"]
    AR --> AR3["provision-matrix.xlsx"]
    AR --> AR4["column-map.json<br/>confirmations.json"]

    RV --> RV1["schedule.xlsx<br/>column-map.json · confirmations.json"]
    IL --> IL1["schedule.xlsx<br/>column-map.json · confirmations.json"]

    TRE --> CASH["cash/<br/>(future cycle; until then shallow-checked<br/>from the shared files)"]

    RUNS --> RUN["timestamp/"]
    RUN --> R1["flags.md<br/>ranked flags"]
    RUN --> R2["workpapers.xlsx<br/>lead schedules · rollforwards ·<br/>cross-checks · flags"]
    RUN --> R3["run.json<br/>file hashes · check results"]
    RUN --> R4["adjusted-statements.docx / .xlsx<br/>(once adjustments are accepted)"]

    classDef auditor fill:#e8f0fe,stroke:#4a6fa5
    classDef agent fill:#fff4e5,stroke:#b7791f
    classDef immutable fill:#eeeeee,stroke:#777777
    class SET,SH1,SH2,SH3,AR1,AR2,AR3,RV1,IL1 auditor
    class SH4,AR4,ADJ agent
    class R1,R2,R3,R4 immutable
```

Legend: blue = uploaded or set by the auditor · amber = written by an agent after the auditor confirms · grey = run output, never edited.

---

## 2. Harness files in the repo

Where the skills, agents, manifests and scripts live (as built). Adding a cycle means adding a manifest, a cycle script, one agent and its line-item skills; the orchestrator does not change. Manifests are JSON inside the orchestrator skill because the scripts read them too, and all scripts share one Node package.

```mermaid
flowchart LR
    CL[".claude/"]

    CL --> SK["skills/"]
    CL --> AG["agents/"]

    SK --> AS["audit-start/<br/>SKILL.md (orchestrator)<br/>references/engagement-folder.md"]
    AS --> CY["cycles/<br/>shared.json · revenue.json<br/>(manifests: line items, required files,<br/>schedule templates)"]
    AS --> SC["scripts/ (Node + SheetJS, mammoth, docx)<br/>scan · run · cross-cycle (incl. shallow checks) ·<br/>finalize (stop rule, statements, run record) · adjust"]
    SC --> SCC["scripts/cycles/revenue.mjs<br/>rollforwards · aged listing · provision matrix ·<br/>revenue · cross-checks · difference candidates"]
    SC --> LIB["scripts/lib/<br/>column map reader · TB, journals, account map ·<br/>Word statements · flags and ranking"]
    SC --> DEV["scripts/dev/<br/>fixture generator · answer-key checker"]
    SK --> TR["trade-receivables/<br/>SKILL.md (line-item skill)<br/>references/ifrs-rules.md · procedures.md"]
    SK --> RS["revenue/<br/>SKILL.md (line-item skill)"]
    SK --> IS["impairment-loss/<br/>SKILL.md (line-item skill)"]

    AG --> RCA["revenue-cycle.md<br/>(cycle agent)"]
    AG --> MORE["… one agent per cycle"]
```

---

## 3. Agent harness structure

Who calls whom, and what each reads and writes. Agents never produce an amount: every number comes from a script.

```mermaid
flowchart TB
    AUD(["Auditor"])

    subgraph ORCH["Orchestrator: audit-start skill (main conversation)"]
        O1["Read engagement.md<br/>+ every cycle manifest"]
        O2["Scan engagement folder:<br/>missing · unchanged · new or changed"]
        O3["Batch pending judgments<br/>for the auditor"]
        O4["Cross-cycle checks · shallow check for<br/>line items no cycle examined · stop rule"]
        O5["Compare client-prepared statements<br/>with rebuilt statements"]
        O6["Write run · draft proposed<br/>adjustments · adjusted statements"]
    end

    subgraph RC["Revenue cycle agent (subagent, own context)"]
        C1["Run cycle scripts"]
        C2["Cross-checks within the cycle<br/>credit sales vs revenue ·<br/>allowance charge vs impairment loss"]
        subgraph LIS["Line-item skills (judgment only)"]
            L1["Trade receivables<br/>classify unplaced lines · explain differences ·<br/>composition tests · provision matrix rates"]
            L2["Revenue"]
            L3["Impairment loss"]
        end
    end

    subgraph OC["Other cycle agents (as cycles are added)"]
        X1["Their own cycle scripts<br/>and line-item skills"]
    end

    subgraph SCR["Scripts (Node + SheetJS) — every amount"]
        S1["Read files through<br/>column map + account map"]
        S2["Rollforwards ·<br/>provision matrix re-performance"]
        S3["Difference candidates"]
        S4["Flag ranking vs<br/>PM / clearly trivial"]
    end

    FS[("Engagement folder")]

    AUD -->|"audit start"| O1 --> O2
    O2 -->|"dispatch ready cycles<br/>in parallel"| RC & OC
    C1 --> S1 & S2 & S3 & S4
    C1 --> LIS
    LIS -->|"category · mapping ·<br/>narrative (no amounts)"| C2
    RC & OC -->|"flags · rollforwards ·<br/>pending judgments"| O3
    O3 <-->|"confirm / change"| AUD
    O3 -->|"save confirmations,<br/>re-run affected cycle"| O2
    O3 --> O4 --> O5 --> O6
    O6 -->|"ranked flags"| AUD
    AUD -->|"accept / reject flags"| O6
    FS -.->|"read"| O2 & S1
    O6 -.->|"write runs/, adjustments.xlsx"| FS
    O3 -.->|"write column-map, account-map,<br/>confirmations"| FS
```

---

## 4. "Audit start" run sequence

One run, from the auditor's command to adjusted statements.

```mermaid
sequenceDiagram
    autonumber
    actor A as Auditor
    participant O as Orchestrator (audit-start)
    participant F as Engagement folder
    participant C as Revenue cycle agent
    participant S as Scripts
    participant L as Line-item skills

    A->>O: "audit start"
    O->>F: Read engagement.md, cycle manifests, file hashes vs last run
    O-->>A: Cycles missing files (named) · cycles unchanged (results kept)
    par Each new or changed cycle
        O->>C: Dispatch with engagement folder path
        C->>S: Read files via column map, classify lines by rule
        S-->>C: Movements, unplaced lines, rollforwards
        C->>L: Unplaced lines, unexplained differences
        L-->>C: Suggested categories and narratives (no amounts)
        C->>S: Cross-checks, difference candidates, flag ranking
        S-->>C: Differences and matched explanations
        C-->>O: Flags, rollforwards, pending judgments
    end
    O-->>A: Pending column maps, account maps, classifications (one batch)
    A->>O: Confirm or change
    O->>F: Save confirmations
    O->>C: Re-run affected cycles
    C-->>O: Updated flags
    O->>S: Cross-cycle checks, stop rule
    alt Any difference above clearly trivial
        O-->>A: All differences reported, statements not examined
    else Nothing above clearly trivial
        O->>S: Compare client-prepared statements with rebuilt statements
        S-->>O: Statement differences
        O-->>A: Ranked flags
    end
    O->>F: Write runs/timestamp (flags.md, workpapers.xlsx, run.json)
    A->>O: Accept or reject flags (reason for each rejection)
    O-->>A: Draft proposed adjustments (accounts suggested, amounts from flags)
    A->>O: Confirm adjustments
    O->>F: Update adjustments.xlsx
    O->>S: Apply adjustments to client-prepared statements
    S->>F: adjusted-statements.docx and .xlsx
```

---

## 5. Trade receivables rollforward check

The check inside the revenue cycle: last year's audited closing as the opening, the whole year's AR journal lines as movements, and the rebuilt closing compared with the client's closing balances.

```mermaid
flowchart TB
    PY["Prior-year audited TB<br/>closing AR + loss allowance"] --> OPEN["Opening balances"]
    SCHO["Schedule opening"] --> CHK0{"Schedule opening =<br/>PY audited closing?"}
    OPEN --> CHK0

    JE["Year's AR journal lines<br/>+ every line of their entries"] --> RULE{"Placed by rule?<br/>(other side of the entry)"}
    RULE -- yes --> MOV
    RULE -- no --> SKILL["Trade receivables skill<br/>suggests category"] --> CONF{"Auditor confirms"}
    CONF -- confirmed --> MOV
    CONF -- pending --> UNC["Unclassified<br/>(results rest on unconfirmed lines)"] --> MOV

    subgraph MOV["Movements (scripts)"]
        G["Gross AR<br/>+ credit sales − receipts − credit notes<br/>− write-offs ± FX ± reclassifications ± unclassified"]
        AL["Loss allowance<br/>+ impairment charge − reversals<br/>− write-offs used ± FX"]
    end

    OPEN --> MOV
    MOV --> RB["Rebuilt closing<br/>gross · allowance · net"]

    RB --> K1{"= schedule closing?"}
    RB --> K2{"= TB?"}
    RB --> K3{"Gross = aged listing total?"}
    RB --> K4{"Allowance = provision matrix<br/>re-performed?"}
    RB --> K5{"Net = statements?<br/>(after stop rule)"}

    K1 & K2 & K3 & K4 & K5 & CHK0 -- difference --> DC["Difference candidates (scripts)<br/>single line · sign flip (2×) · transposition (÷9) ·<br/>lines missing from schedule or journals ·<br/>entries outside period · missing month ·<br/>unconfirmed lines · typed-over formula · opening"]
    DC --> NAR["Trade receivables skill writes narrative<br/>quoting entry numbers, or 'no explanation found'"]
    NAR --> FLAG["Flag: amount · source rows · assertion ·<br/>IFRS/ISA paragraph · rank vs PM / CT"]
```
