# Audit Workbench — data flow and user workflow

Diagrams of the current plan (`PLAN.md`, specs in issue #1 for v1 and issue #2 for v2). Terms follow `CONTEXT.md`. Rule throughout: deterministic code computes every amount, and the AI only classifies, compares wording and drafts text (ADR 0001).

1. [v1 system data flow](#1-v1-system-data-flow)
2. [Examination pipeline (stages and stop rule)](#2-examination-pipeline-stages-and-stop-rule)
3. [v1 user workflow](#3-v1-user-workflow)
4. [v2 platform data flow](#4-v2-platform-data-flow)
5. [v2 engagement workflow by role](#5-v2-engagement-workflow-by-role)
6. [v2 line-item status](#6-v2-line-item-status)
7. [v2 sign-off lifecycle](#7-v2-sign-off-lifecycle)

---

## 1. v1 system data flow

Client files never leave the browser. The only data sent to a server is the journal lines the rules can't classify, and those go to the classifier route. The database holds user profiles and nothing else.

```mermaid
flowchart LR
    subgraph Inputs["Client package (or sample client A / B)"]
        PYTB["Last year's audited TB<br/>(Excel)"]
        PYFS["Last year's audited statements<br/>(Word)"]
        TB["Current-year TB<br/>(Excel, with line-item mapping)"]
        JE["Journal export<br/>(Excel, entry no. on every line)"]
        SCH["AR + Revenue line-item schedules<br/>(Excel, fixed layout)"]
        CFS["Client-prepared statements<br/>(Word)"]
        SET["Settings: performance materiality,<br/>clearly trivial, year-end"]
    end

    subgraph Browser["Browser (all client data stays here)"]
        READ["Package reader<br/>SheetJS + mammoth<br/>layout checks"]
        PKG[("In-memory<br/>client package")]
        EXAM["examine(files, settings, classifier)<br/>orchestrator — pure code"]
        RANK["Flag ranking<br/>vs PM / clearly trivial"]
        UI["Results page<br/>flags · rebuilt figures ·<br/>unconfirmed classifications ·<br/>not-examined list"]
        XLS["Excel export<br/>flags + rollforward +<br/>classified journal lines"]
    end

    subgraph Server["Vercel"]
        ROUTE["Classifier server route<br/>(key in env var)"]
    end

    GEM["Gemini free tier<br/>revenue cycle skill"]
    SUPA[("Supabase Auth +<br/>profiles (RLS)")]

    PYTB & PYFS & TB & JE & SCH & CFS --> READ
    SET --> EXAM
    READ --> PKG --> EXAM
    EXAM -- "unplaceable journal lines<br/>+ their full entries" --> ROUTE
    ROUTE <--> GEM
    ROUTE -- "category + reasoning<br/>(no amounts)" --> EXAM
    EXAM --> RANK --> UI
    UI -- "auditor confirms / changes<br/>classifications → re-run" --> EXAM
    UI --> XLS
    UI -.->|session check| SUPA
```

---

## 2. Examination pipeline (stages and stop rule)

What happens inside one run of `examine`. v1 covers the revenue cycle and the balance sheet + income statement in Stage 3. The full design (v2+) adds the allowance rollforward, cash and VAT cross-checks, shallow checks for every line item, the cash flow statement and notes wording.

```mermaid
flowchart TD
    START(["Run starts"]) --> S1

    subgraph S1["Stage 1 — line-item schedules"]
        OB["Opening balances =<br/>last year's audited closing"]
        BAL["Every journal entry balances<br/>(unbalanced flagged first)"]
        CLS{"Rules can classify the<br/>AR journal line by the<br/>other side of its entry?"}
        RULE["Credit sale / receipt /<br/>credit note / write-off"]
        AI["Cycle skill suggests category<br/>+ reasoning — marked unconfirmed"]
        RF["Rebuild gross AR rollforward<br/>opening + credit sales − receipts<br/>− credit notes − write-offs"]
        MOV["Schedule movements =<br/>classified journal totals;<br/>typed closing = rebuilt closing"]
        OB --> BAL --> CLS
        CLS -- yes --> RULE --> RF
        CLS -- no --> AI --> RF
        RF --> MOV
    end

    S1 --> S2

    subgraph S2["Stage 2 — TB and cross-checks"]
        TBC["Each schedule closing = TB<br/>(AR and Revenue)"]
        XC["Cross-check: credit sales + cash sales<br/>− credit notes = revenue"]
        ODD["Revenue credited against anything<br/>other than AR or cash → own flag (ISA 240)"]
        TBC --> XC --> ODD
    end

    S2 --> STOP{"Stop rule:<br/>any Stage 1–2 difference<br/>above clearly trivial?"}

    STOP -- "yes" --> STOPPED(["Stopped — report every Stage 1–2<br/>difference across all line items,<br/>say what the client must fix"])
    STOP -- "no" --> S3

    subgraph S3["Stage 3 — client-prepared statements"]
        WORD["Read statement tables<br/>from client's Word file"]
        AMT["Current year vs rebuilt statements;<br/>comparatives vs last year's audited<br/>(rounding tolerance on presented amounts)"]
        WORD --> AMT
    end

    S3 --> DONE(["Finished — ranked flags,<br/>each linked to its source rows"])
    STOPPED --> RANKS
    DONE --> RANKS["Every flag ranked:<br/>above PM · between thresholds · clearly trivial"]
```

---

## 3. v1 user workflow

```mermaid
flowchart TD
    A(["Open live link"]) --> B{"Logged in?"}
    B -- no --> C["Sign up<br/>email + password + employee ID"]
    B -- "no, has account" --> D["Log in<br/>(or reset password by email)"]
    C --> D
    B -- yes --> E
    D --> E["Start page<br/>what the tool checks, in what order"]

    E --> F{"Choose input"}
    F -- "Try sample client" --> G["Pick A (stops at Stage 2)<br/>or B (reaches statements)"]
    F -- "Download sample files" --> H["See expected layouts"] --> F
    F -- "Upload own package" --> I["Select files"]
    I --> J{"Package reader:<br/>files present, layouts OK?"}
    J -- no --> K["Message naming the file<br/>and the problem"] --> I
    J -- yes --> L

    G --> L["Enter settings<br/>PM · clearly trivial · year-end"]
    L --> M["Run examination"]
    M --> N["Results page"]

    N --> O{"Unconfirmed AI<br/>classifications?"}
    O -- yes --> P["Confirm or change each one"] --> M
    O -- no --> Q{"Run stopped?"}
    Q -- yes --> R["Review all Stage 1–2 flags<br/>send client one list of queries"]
    R --> S["Client corrects → re-upload<br/>whole package"] --> I
    Q -- no --> T["Review ranked flags<br/>trace each to its source"]
    T --> U["Download Excel workbook<br/>for working papers"]
    U --> V(["Log out"])
```

---

## 4. v2 platform data flow

Files still go from the browser straight to the firm's Google Drive and are still examined in the browser. Supabase stores metadata only: who, what, which file version and which flags, never client figures.

```mermaid
flowchart LR
    subgraph Users["Engagement team"]
        MGR["Manager"]
        PREP["Preparer"]
        REV["Reviewer"]
    end

    subgraph Browser["Browser"]
        UP["Upload page<br/>engagement files + cycles → line items"]
        VAL["Per-slot checks<br/>columns · period · 12-month strip ·<br/>zip limits · entries balance"]
        ORCH["Orchestrator (code)<br/>Start cycle / Examine statements gating"]
        EXAM["examine() — same deep module as v1,<br/>per cycle and for statements"]
        DASH["Dashboard + workflow chart"]
    end

    subgraph Vercel["Vercel"]
        ROUTE["Cycle skill route<br/>(cached results)"]
    end

    GEM["Gemini free tier<br/>classify lines · draft<br/>fluctuation questions"]

    subgraph Drive["Firm Google Drive (drive.file)"]
        D00["00 Prior-year audited"]
        D01["01 Engagement files"]
        D02["02… cycle / line-item folders<br/>one Drive file per file version"]
        D90["90 Results<br/>Excel exports"]
    end

    subgraph Supa["Supabase Postgres (metadata only, RLS on every table)"]
        T1[("firms · memberships ·<br/>invitations · profiles")]
        T2[("engagements · teams ·<br/>thresholds")]
        T3[("file slots ·<br/>file versions")]
        T4[("runs + flags<br/>append-only")]
        T5[("dispositions ·<br/>sign-offs")]
    end

    PREVENG["Last year's engagement"] -- "copy audited files" --> D00
    MGR -- "create engagement, team,<br/>thresholds" --> T2
    T2 -- "create folder tree" --> Drive
    PREP --> UP --> VAL
    VAL -- "file bytes (direct, no 4.5 MB limit)" --> D01 & D02
    VAL -- "version + validation result" --> T3
    T3 --> ORCH
    ORCH -- "valid files" --> EXAM
    D00 & D01 & D02 -- "read file versions" --> EXAM
    EXAM <-->|judgment only| ROUTE
    ROUTE <--> GEM
    EXAM -- "run, file versions used,<br/>threshold snapshot, flags" --> T4
    EXAM -- "Excel export" --> D90
    PREP -- "dispositions" --> T5
    REV -- "sign off / send back" --> T5
    T3 & T4 & T5 --> DASH
    T3 -- "new version → reset to Ready,<br/>cancel sign-offs" --> T5
```

---

## 5. v2 engagement workflow by role

```mermaid
flowchart TD
    subgraph Admin["Firm admin"]
        A1["Create firm"] --> A2["Connect firm Google Drive<br/>(once)"] --> A3["Invite colleagues<br/>(email or firm code)"]
    end

    subgraph Manager["Engagement manager"]
        M1["Create engagement<br/>client ID · name · year-end ·<br/>framework (IFRS, locked)"]
        M2["Add team by employee ID<br/>(preparer / reviewer)"]
        M3["Set PM · clearly trivial ·<br/>fluctuation % and amount"]
        M4["Watch dashboard:<br/>which cycles block statements"]
        M1 --> M2 --> M3 --> M4
    end

    subgraph Preparer["Preparer"]
        P1["Upload engagement files<br/>TB · journal export (12 files / zip) ·<br/>client statements"]
        P2["Export-agrees-with-TB check<br/>(runs when TB + 12 months present)"]
        P3["Upload cycle line-item files<br/>or mark not applicable"]
        P4["Start cycle → run"]
        P5{"Differences found?"}
        P6["Disposition every flag and<br/>fluctuation needing explanation"]
        P7["Client sends corrected file<br/>→ new file version"]
        P8["Submit cycle for review"]
        P9{"All cycles passed<br/>or not in scope?"}
        P10["Examine statements → run"]
        P1 --> P2 --> P3 --> P4 --> P5
        P5 -- yes --> P6
        P6 -- "corrected by client" --> P7 --> P4
        P6 -- "all dispositioned" --> P8
        P5 -- no --> P6
        P8 --> P9
        P9 -- yes --> P10 --> P6
        P9 -- "no — next cycle" --> P3
    end

    subgraph Reviewer["Reviewer (not the run's preparer)"]
        R1["Review list:<br/>cycles waiting for me"]
        R2{"Sign off<br/>this run?"}
        R3["Sign off with comment"]
        R4["Send back with comment"]
        R1 --> R2
        R2 -- yes --> R3
        R2 -- no --> R4
    end

    A3 --> M1
    M2 --> P1
    P8 --> R1
    R4 --> P6
    R3 --> DONE(["Cycle / statements Reviewed"])
```

---

## 6. v2 line-item status

A cycle's status is the worst status among its line items.

```mermaid
stateDiagram-v2
    state "Awaiting files" as AwaitingFiles
    state "Not applicable" as NotApplicable
    state "File invalid" as FileInvalid
    state "Differences found" as DifferencesFound

    [*] --> AwaitingFiles
    AwaitingFiles --> NotApplicable : marked not applicable
    NotApplicable --> AwaitingFiles : unmarked
    AwaitingFiles --> FileInvalid : upload fails checks
    FileInvalid --> FileInvalid : re-upload still fails
    FileInvalid --> Ready : re-upload passes
    AwaitingFiles --> Ready : upload passes checks
    Ready --> Running : Start cycle
    Running --> DifferencesFound : flags above clearly trivial
    Running --> Passed : no stopping differences
    DifferencesFound --> Ready : new file version
    Passed --> Reviewed : reviewer signs off
    Passed --> Ready : new file version or re-run
    Reviewed --> Ready : new file version or re-run (sign-off cancelled)
```

---

## 7. v2 sign-off lifecycle

```mermaid
sequenceDiagram
    actor P as Preparer
    participant O as Orchestrator (code)
    participant DB as Supabase (RLS)
    actor R as Reviewer

    P->>O: Start cycle
    O->>O: check cycle files valid
    O->>DB: insert run (who, when, file versions, thresholds, flags)
    DB-->>P: flags + fluctuations (new / still open / resolved vs last run)
    loop every flag and fluctuation needing explanation
        P->>DB: record disposition (corrected / explained / possible misstatement)
    end
    P->>DB: submit for review
    DB-->>R: appears in review list
    alt reviewer approves
        R->>DB: sign off run (RLS blocks the run's own preparer)
    else needs work
        R->>DB: send back with comment
        DB-->>P: cycle returned
    end
    Note over P,DB: Later: a new file version or re-run
    P->>DB: new file version
    DB->>DB: affected line items → Ready, sign-off cancelled (with reason)
```
