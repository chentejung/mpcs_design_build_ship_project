# Project Proposal Plan — Design, Build, Ship (MPCS 51238)

> Working plan for the proposal page. Due **Tue Nov 3, 5:30 PM**. One static HTML page on Vercel, **two tabs**: Audit Workbench and Filing Analyzer.
> Research behind this plan: `research/idea1-audit.md`, `research/idea2-ratios.md`, `research/ifrs-isa-sources.md`. Vocabulary: `GLOSSARY-MAP.md`.

---

## Page structure

- Header: name, one sentence framing ("Two ways to make financial reporting easier to verify — I'll pick one after user interviews, before Nov 10").
- **Tab 1 — Audit Workbench**
- **Tab 2 — Filing Analyzer**
- Each tab covers everything on the checklist: one-liner, users and what they said, focus and why, roadmap (v1 / v2 / out), tech stack + MCP + CLIs.
- Static HTML, no framework. Tabs = a few lines of vanilla JS (or CSS `:target`).

---

## Tab 1 — Audit Workbench

### One-liner
Auditors at small firms spend days hand-building rollforwards and lead schedules from client journals before they can even start testing; Audit Workbench turns raw journals into reconciled workpapers and a flagged list of what to look into.

### Who it's for
Auditors at **small external audit firms and sole practitioners** using **IFRS + ISA**. Large vendors (MindBridge, Caseware, Fieldguide, Inflo, DataSnipper) are enterprise-priced (~$20K–$150K/yr for some), and Big 4 have in-house platforms.

### The problem (in my words, as a former auditor)
Every line item has its own movements, its own supporting schedules and its own column layouts. Inventory = opening + purchases − cost of sales ± adjustments − write-downs; cash, AR, inventory all come from completely different source sheets. Reconciling each one and spotting what doesn't make sense is slow, manual and repetitive.

### Ideal version (the ambition)
Upload all of a client's journals and supporting schedules → the tool maps accounts to line items, rebuilds every statement and rollforward, compares against the client-prepared statements, runs fluctuation analysis, journal entry tests and plausibility checks on every line item, and produces a full Excel workpaper set plus a summary of where the auditor should look deeper — each flag linked to the procedure (ISA paragraph) and policy (IFRS paragraph) it relates to.

### How it works (v1 scope: Revenue + AR)
1. **Input**: journal entry export + supporting schedules for Revenue/AR in **fixed schedule templates** (sales register, cash receipts register, credit note register, write-off listing, aged AR listing), prior-year closing TB, and the **client-prepared TB**.
2. **Account mapping**: AI suggests which client accounts belong to Revenue and AR; auditor confirms.
3. **Rebuild**: lead schedule + AR rollforward (opening AR + credit sales − cash receipts − credit notes/returns − write-offs = closing AR). One currency; no FX in v1.
4. **Compare**: rebuilt balances vs client-prepared TB, and each movement vs its supporting schedule → **unreconciled differences**.
5. **Flags**:
   - Fluctuation: monthly revenue/AR vs prior year beyond a performance-materiality threshold.
   - Journal entry tests (ISA 240): revenue credited against accounts other than AR/cash; manual entries in last 5 days of the year; round amounts; weekend postings.
   - Plausibility: returns % of sales vs prior year; DSO trend; cutoff (last-2-weeks sales vs shipping dates); subsequent receipts vs closing AR.
6. **Output**: downloadable Excel (lead schedule, rollforward, flags tab linking to entries) + an AI-written bullet summary that only narrates rule-computed flags — never computes numbers.
7. **Procedure library**: ~15 Revenue/AR procedures **I write**, tagged by line item, movement, assertion, ISA paragraph and IFRS paragraph (paraphrased + cited — IFRS/ISA text can't be reproduced in software without permission). Each flag links to the relevant procedures.

### Test data: synthetic companies
Firms won't upload confidential data to a student app, so the tool is built and evaluated on **synthetic companies** from a deterministic double-entry engine: it posts balanced transactions, derives every supporting schedule from the same ledger (so they all tie), then injects **planted misstatements** recorded in an **answer key**. The LLM never touches numbers — only narrative (company backstory, descriptions).

### Focus: AI — why
The hard, valuable parts are judgment calls an LLM can help with and that can be measured against the answer key:
- **Account mapping accuracy** vs the synthetic company's true mapping.
- **Detection**: of N planted misstatements, how many are flagged; how many false flags.
- **Summary faithfulness**: every number and claim in the summary traces to a computed flag; citations only from my procedure library.

### How I'll know it works
- Evals: mapping accuracy, detection rate and false-flag count across a set of synthetic companies.
- 3 auditors run a synthetic case and tell me which flags they'd actually follow up on, and how long the same work takes them by hand.

### Roadmap
| Week | Build |
|---|---|
| Nov 10–17 → **v1** | Sign-up. Synthetic company engine for Revenue/AR (journals, 5 schedules, client TB, planted misstatements, answer key). Upload with fixed templates, parsed in the browser. Manual account mapping. Lead schedule + AR rollforward + client-TB comparison → unreconciled differences. Excel export. |
| Nov 17–24 | All flags (fluctuation, JE tests, plausibility). AI account-mapping suggestions. Eval harness against answer keys. |
| Nov 24–Dec 1 → **v2 (fair)** | AI summary. Procedure library linked from flags. A polished demo company for the fair. |

**Out**: other line items (cash, inventory, …), bank statement matching, flexible column mapping for arbitrary client exports, IFRS 9 ECL allowance rollforward, FX, multi-entity/consolidation.

### Tech stack
- **Next.js on Vercel** — one deploy for UI and server routes.
- **Browser-side parsing (SheetJS)** — client files are read in the browser and never stored on a server.
- **Supabase** — auth, synthetic companies, procedure library, saved mappings (no client data).
- **Gemini free tier** — mapping suggestions and summary, **synthetic data only** (free-tier inputs may be used by Google; real client data must not be sent).
- Excel output: SheetJS / ExcelJS.
- MCP/CLIs: Supabase MCP, Vercel CLI, GitHub CLI.

### Risks
- Scope: one line item end to end is already a lot — Revenue/AR only.
- Real client exports vary wildly; v1 sidesteps with fixed templates.
- Privacy: no real client data reaches the LLM or the database in v1.

---

## Tab 2 — Filing Analyzer

### One-liner
People researching a stock see ratios everywhere but never see when a company quietly changed its past numbers; Filing Analyzer explains a company's financial health and surfaces every revised value in its SEC filings, classified and explained the way an auditor would.

### Who it's for
People investing their own money researching a US public company before buying; finance/accounting students second. Professionals already pay for Bloomberg/Koyfin.

### Differentiator
Ratios and red-flag scores are commodity (Stock Analysis shows Piotroski/Altman Z free; GuruFocus shows Beneish M). **No retail tool flags "originally reported vs later revised."** SEC XBRL `companyfacts` records each value per filing, so the same period can be compared across filings (e.g. Apple FY2009 total assets: $53.85B in the original 10-K vs $47.50B in the 10-K/A). ~80% of restatements are quiet "little r" revisions.

### How it works
1. Enter a ticker (US SEC filers only).
2. Health overview: key ratios + red-flag scores, explained in auditor terms.
3. **Revised values timeline**: every value that changed between filings, with its **revision cause** — split adjustment, reclassification, standard adoption, or correction — and a citation to both filings.
4. AI summary citing the underlying facts.
5. Watchlist.

**Classification**: deterministic rules first (split adjustment = change equals split ratio; standard adoption = coincides with an effective date), then the LLM classifies what's left as reclassification vs correction.

### Focus: AI — why
Classifying revised values is a real judgment task with a checkable answer. Eval: ~50 real revised values I label by hand; measure classifier accuracy. Summary eval: every number cited matches the XBRL fact.

### How I'll know it works
- Classifier accuracy on my labeled set.
- Users find a revised value in a company they follow that they didn't know about, and understand why it changed.

### Roadmap
| Week | Build |
|---|---|
| Nov 10–17 → **v1** | Sign-up, ticker search, annual data for ~15 line items, ratios, revised-values list with rule-based classification. |
| Nov 17–24 | LLM classification of remaining revised values + ~50 hand-labeled eval set. |
| Nov 24–Dec 1 → **v2 (fair)** | Cited AI summary, watchlist, auditor-explained red-flag scores. |

**Out**: quarterly data (YTD/Q4 derivation pitfalls), peer benchmarking, 10-K text diff, filing alerts by email.

### Tech stack
- **Next.js on Vercel** — server routes double as the SEC proxy (SEC has no CORS; requires a User-Agent; 10 req/s).
- **Supabase** — auth, watchlists, cache of SEC facts to stay under rate limits.
- **Gemini free tier** — classification and summaries (public data, no privacy issue).
- MCP/CLIs: Supabase MCP, Vercel CLI, GitHub CLI.

### Risks
- XBRL tag inconsistency (revenue appears under 3 different tags across Apple's history) — normalize ~15 concepts by hand.
- Noise: naive diffing finds 431 changed values for Apple alone, mostly splits/reclassifications — classification is the product.
- Free LLM tier limits change often — cache results.

---

## User interviews (both tabs) — to fill in

At least 3 per idea, before the page is final. Record their words.

**Audit Workbench — ask auditors:**
1. Tell me about the last time you built a rollforward or lead schedule for a client. What did you start from?
2. What took the longest on that engagement before you could start actual testing?
3. When the numbers didn't tie, how did you find out why?
4. How do you decide which fluctuations or entries to look deeper into?
5. What tools or spreadsheets do you use for this today, and what do you wish they did?

**Filing Analyzer — ask people who invest their own money:**
1. Tell me about the last time you researched a company before buying its stock.
2. Where did you look, and what numbers did you check?
3. Have you ever found out a company's numbers weren't what you thought? How?
4. What do you do when a ratio looks off?
5. What would make you trust or distrust a company's financials?

---

## Decisions log
- Two tabs on one page; pick which to build after interviews, before Nov 10.
- Idea 1 = auditor productivity tool (not a training simulator).
- Idea 1 frameworks: IFRS + ISA; v1 = Revenue + AR only; synthetic companies via deterministic engine; fixed schedule templates in v1.
- Idea 1 compares against client-prepared statements (rebuilding from the same journals alone always ties).
- Idea 2 centred on the revised-values detector; US SEC filers only; annual data in v1.
- Both: AI focus; IFRS/ISA paraphrased + cited, never reproduced.

## Still to do before 5:30
- [ ] Interviews (≥3) and paste quotes into each tab.
- [ ] Review and rewrite every line in your own words.
- [ ] Build the static HTML page, push to GitHub, deploy to Vercel from your account.
