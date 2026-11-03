# Idea 1 — Audit software: background research

Compiled 2026-11-03. Sources are linked inline. Where a claim comes only from a vendor, a third-party review or affiliate site, or my prior knowledge, it is tagged **[vendor]**, **[3rd-party est.]** or **[unverified]**.

## TL;DR

1. **The productivity market (B) is crowded and well funded, and its products are priced for enterprises.** Fieldguide raised a $75M Series C in Feb 2026 at a $700M valuation. Cortea, Auditstage and Audrey AI all raised in 2026. AuditBoard, MindBridge and TeamMate run roughly $20K–$150K a year. A 3-week student tool cannot compete on features. Its only credible angle is a narrow, free tool for sole practitioners or small firms, and even that has to be demoed on synthetic data, because real client data brings confidentiality and SOC 2 expectations.
2. **The training market (A) has a real gap.** CPA review task-based simulations (TBS) are fixed, single-screen items. Textbook cases (Arens "Pinnacle") and Deloitte Trueblood cases are static PDF and Excel files with answer keys held back. Web simulators such as audit-gaming.nl and EY/Forage are licensed or fixed scenarios. Academic AI sims exist, such as BYU's 3D inventory sim, but they are one-off and not public. I found no public product that **randomizes a fresh company with planted misstatements and grades which procedures detect them**.
3. **Synthetic ledgers are a solved problem if you use code. They are not solved if you use only an LLM.** Open generators exist (Rust/Python, Apache or MIT), and so does a 2026 academic synthetic journal-entry dataset. Benchmarks show LLMs are unreliable on journal entries and financial statements, and their errors compound over time. **Architecture: a deterministic double-entry engine is the source of truth. The LLM only writes narrative, documents and tutor feedback.**
4. **Standards are freely citable.** PCAOB AS 1105, 2301, 2305, 2310, 2401, 2501 and the rest are free HTML on pcaobus.org. The AICPA publishes the full clarified AU-C codification as a free PDF of about 2,000 pages, with usage limits. AICPA Audit Data Standards give a ready-made GL schema.
5. **Recommendation leaning: (A).** It fits "real people can sign up" by Nov 17 (students and CPA candidates are easy to recruit on campus). It handles no real financial data, and it naturally spans Systems (the generator and engine) and AI (the tutor and document generation). The student's auditor background is the moat: the procedure-to-assertion mapping and the grading rubric.

## Competitors (framing B)

| Vendor | Target customer | Core features | Pricing (public?) |
|---|---|---|---|
| **MindBridge** | External audit firms plus corporate finance and internal audit. Reviewers call it a poor fit for teams of 1–5 auditors [3rd-party] | Risk-scores 100% of GL transactions (ML plus rules). No workpaper or engagement objects, so it sits beside an audit platform ([review](https://internalauditguide.com/2026/09/mindbridge-review/)) | Quote only. Estimates of about $15K–$49K a year; one median cited at about $42K [3rd-party est.] ([TrustRadius](https://www.trustradius.com/products/mindbridge-ai-auditor/pricing)). Has a **University Alliance Program** (free in 2018, now described as paid) ([MindBridge](https://www.mindbridge.ai/initiatives/university-alliance-program/)) |
| **DataSnipper** | External auditors and finance teams; Excel-native | Excel add-in: document extraction, vouching and matching evidence to workpapers, form extraction, AI "agentic" features | Tiers Start / Accelerate / Elevate, no prices shown ([pricing](https://www.datasnipper.com/pricing)). Estimates of about $64/user/mo or EUR 350–850/user/yr [3rd-party est.] ([Software Finder](https://softwarefinder.com/resources/how-much-does-datasnipper-cost)) |
| **Caseware** (Working Papers, Cloud, IDEA, AiDA → **Verity**, May 2026) | Small-to-large external audit and accounting firms; the long-time standard | Workpapers, engagement templates, financial statement production, IDEA analytics. AI agents for disclosure checklists, risk suggestions and Excel workpapers | Quote, per active user. Modules priced separately. About $1K–$5K/user/yr [3rd-party est.] ([aistatements](https://aistatements.com/blog/caseware-pricing), [aiproduct.reviews](https://www.aiproduct.reviews/reviews/caseware-ai)) |
| **Fieldguide** | Mid-market to Top-100 CPA firms (financial audit, SOC, advisory). Says it serves half of the US Top 100 [vendor] | AI-native engagement platform: requests, workpapers, agentic testing | Quote. $75M Series C Feb 2026, $125M total ([GlobeNewswire](https://www.globenewswire.com/news-release/2026/02/02/3230326/0/en/fieldguide-raises-75m-series-c-from-goldman-sachs-to-help-audit-and-advisory-firms-grow-with-agentic-ai.html), [Fortune](https://fortune.com/2026/02/02/goldman-sachs-fieldguide-accounting-cpa-ai-software-platform-venture-capital/)) |
| **AuditBoard** (possible rebrand "Optro", unconfirmed) | **Internal audit**, SOX and GRC teams at mid-to-large enterprises, not external auditors | Audit management, SOX controls, risk, compliance | Quote. About $30K–$150K a year, median about $46K [3rd-party est.] ([Vendr](https://www.vendr.com/marketplace/auditboard)) |
| **TeamMate+** (Wolters Kluwer) | **Internal audit** functions, including large and public-sector ones | Audit management, workpapers, analytics | Quote ([WK](https://www.wolterskluwer.com/en/solutions/teammate/pricing)). About $19K–$45K a year [3rd-party est.]. A public-sector data point: about $6.2K a year for 2 users ([review](https://internalauditguide.com/2026/09/teammate-review/)) |
| **Inflo** | Mid-size external audit firms (UK origin) | Client ledger ingestion, full-population testing, engagement delivery | Quote, usage- or module-based ([Toolradar](https://toolradar.com/tools/inflo), [inflo.com](https://inflo.com/)) |
| **Validis** | Data layer for audit firms and lenders. Claims 3 of the Big 4 and 18 of the Top 25 [vendor] | Extracts and standardizes TB, GL and subledgers from any accounting system. Powers Thomson Reuters Audit Intelligence Analyze, and Caseware partners with it ([TR](https://www.thomsonreuters.com/en/press-releases/2024/september/thomson-reuters-unveils-ai-powered-audit-intelligence-solutions-to-reimagine-auditing-practices), [Validis](https://www.validis.com/blog/announcements/validis-strengthens-audit-ecosystem-as-thomson-reuters-chosen-data-partner/)) | Bundled into partner products; no public price |
| **Thomson Reuters Audit Intelligence** | External audit firms | Risk-segmented sampling (claims sample sizes cut by half [vendor]), TB and GL import | Quote |
| **AuditFile** | Small and mid firms doing audits, reviews and compilations | Cloud workpapers; cited as the cheapest entry point for small firms [3rd-party] ([Finlens](https://www.finlens.app/blogs/best-audit-workpaper-software-cpa-firms-2026)) | Not found |
| **2025–26 AI startups** | Cortea (Berlin, €12M seed): AI review of financial statements, disclosures and workpapers before sign-off ([Cortea](https://www.cortea.ai/blog/cortea-raises-12-mil-to-improve-audit-quality-with-ai)). Auditstage (Brussels, €2M seed, Jul 2026), agentic audit ([Smartfin](https://smartfinvc.com/news/auditstage-raises-e2m-seed-round-to-build-agentic-auditing-software/)). Audrey AI (Dublin, about €1.5M/$1.8M pre-seed, Apr 2026): data requests, evidence gathering, transaction testing ([Tech.eu](https://tech.eu/2026/04/16/audrey-ai-secures-18m-to-develop-ai-platform-for-financial-auditors/)). "Modus Audit $85M" [unverified, single weak source]. Basis ($100M Series B, $1.15B valuation) is adjacent: accounting and tax, not audit. Cheap Excel add-ins such as Blast Audit (€45/user/mo) undercut DataSnipper [vendor] ([Blast](https://blast-audit.com/blog/datasnipper-price-increase-options/)) | | |

**Pattern.** No major vendor publishes prices. Entry cost is usually more than $10K a year or per-seat licences that pay off only at scale. Internal audit tools (AuditBoard, TeamMate) are a different market from external financial statement audit tools.

## Training-product landscape (framing A)

| Product | What it is | Interactivity | Randomization | Feedback |
|---|---|---|---|---|
| CPA review TBS (Becker, UWorld/Roger, Gleim) | Exam-style task-based simulations. AUD is 78 MCQ plus 7 TBS, scored 50/50 ([Becker](https://www.becker.com/blog/cpa/the-complete-guide-to-the-aud-cpa-exam), [UWorld](https://accounting.uworld.com/cpa-review/cpa-exam/aud/)). Gleim costs about $2.5K–$3.5K | Single-screen, fill-in or dropdown, document exhibits | Fixed item bank [unverified, but standard] | Answer explanations after submission; no exploration of a whole engagement |
| Arens "Pinnacle Manufacturing" integrated case | Multi-part textbook case with an Excel financials file: analytical procedures, risk and so on ([LoC TOC](https://catdir.loc.gov/catdir/toc/ecip0715/2007015945.html)) | Spreadsheet homework | None (same company for everyone, so answers leak to Chegg and Course Hero) | Instructor-graded |
| Deloitte Trueblood cases | Free case PDFs for educators; solutions only by request on school letterhead ([Deloitte](https://www.deloitte.com/us/en/about/deloitte-foundation/trueblood-case-studies-deloitte-foundation.html)) | Discussion and judgment | None | Instructor |
| audit-gaming.nl | Web simulator of fictional companies (laptop trader, furniture) for BSc/MSc students ([site](https://www.auditgaming.nl/?lang=en)) | Team or individual audit assignments | Data sets refreshed per fiscal year; no per-student randomization stated | Not described; priced by contacting the company |
| EY Audit job simulation (Forage) | Free, 3–4 hrs, fictional client FoodCo ([Forage](https://www.theforage.com/simulations/ey/audit-k5kl)) | Guided tasks | Fixed | Model answers |
| UGA Terry fraud sims | Fictional baseball team and fashion company "Tindy"; interview animated suspects ([UGA](https://www.terry.uga.edu/terry-accounting-professor-shows-shes-got-game/)) | High (forensic) | Fixed | In-course |
| BYU 3D inventory audit sim (D. Wood) | Students open boxes, talk to AI characters, request documents ([JofA Mar 2026](https://www.journalofaccountancy.com/issues/2026/mar/how-will-accountants-learn-new-skills-when-ai-does-the-work/)) | High; LLM-driven characters | Unknown | Unknown; not public |
| MindBridge University / DataSnipper Academy | Vendor tool training, not audit judgment ([MindBridge](https://www.mindbridge.ai/initiatives/university-alliance-program/), [DS Academy](https://www.datasnipper.com/resources/datasnipper-academy)) | Tool walkthroughs | No | Badges |
| Generic AI CPA tutors (CPAtutor.ai, Jenova, AccountingIQ, etc.) | Chat Q&A and MCQ drilling ([CPAtutor](https://cpatutor.ai/)) | Chat | Generated questions | Chat explanations, no ledger to audit [3rd-party marketing] |
| GitHub "Audit-Simulator" (curtisoden) | Kit for building a GenAI audit-interview persona ([repo](https://github.com/curtisoden/Audit-Simulator)) | Interview role-play | — | Rubric |

**What they lack:**
- **Per-user randomized companies.** Every case is the same company for every student, so answer keys leak.
- **A full GL behind the statements.** You cannot trace a balance down to the journal entries and the source documents.
- **Grading on detection.** Did the trainee's chosen procedures actually catch the planted misstatement, and did they over-audit?
- **Feedback mapped explicitly to an assertion and a standard.**
- **Free, self-serve access.** Most products are institution-licensed.

## Gaps and opportunities (ranked for a 3-week build)

1. **(A) Randomized "audit a fake company" simulator with a planted-misstatement answer key.** Highest fit: a clear gap, no real data, users are easy to reach, and it demos well at a project fair. Scope v1 to 2–3 accounts, for example AR/Revenue (confirmation, cutoff, vouching), Cash (bank rec, confirmation) and Inventory or AP (search for unrecorded liabilities). Use 5–8 procedures and about 10 misstatement types.
2. **(A+AI) LLM tutor and "client" persona over the deterministic case.** The trainee requests documents or asks management questions. The LLM role-plays using only engine-provided facts, and the debrief cites AS/AU-C paragraphs. This differentiates the project against static TBS.
3. **(B-lite) Free small-firm utility on synthetic or uploaded TB/GL.** Examples: an analytical-procedures and journal-entry-testing report (Benford's law, round numbers, weekend postings, duplicates, entries after period end), or an assertion-driven audit-program generator for an uploaded trial balance. This gap is real for sole practitioners priced out of MindBridge and Caseware IDEA. Risks: firms won't upload client data to a student app, and validation needs practicing CPAs.
4. **(B) Anything workpaper, engagement or evidence-matching.** Not recommended. It is the core of DataSnipper, Fieldguide and Caseware, and a student build would be a weak clone.

## Pseudo-company generation feasibility

**Existing generators and datasets:**
- `WaguyMz/SyntheticData`: Rust, Apache-2.0. Generates GL journal entries, chart of accounts, subledgers and document flows, and claims fraud labels and Benford compliance ([GitHub](https://github.com/WaguyMz/SyntheticData)). A search snippet attributed a similar repo to `mivertowski/SyntheticData`, but that URL returns 404, so the provenance is unclear. Probably too heavy to embed; good as a reference.
- Gronewald, Stephan, Rombach & Fettke (2026), "Generating Synthetic Journal Entries for Audit Analytics: Method and Dataset" ([SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7211804), [Data in Brief](https://www.sciencedirect.com/science/article/pii/S2352340926008048), data at [GitHub](https://github.com/JGro2026/General-Ledger-Data) and on Zenodo). Entries are grouped by `posting_id`. The GitHub repo shows no license, so check Zenodo before reuse.
- Small seeded Python generators with planted anomalies and a ground-truth answer key, close to exactly the (A) pattern: [gl-journal-entry-analytics](https://github.com/mmanzanares7/gl-journal-entry-analytics), [Synthetic-General-Ledger-Fuzzer](https://github.com/Atiqul-Akash/Synthetic-General-Ledger-Fuzzer) (MIT).
- Older academic work: Schreyer et al. (KPMG/DFKI, about 2017–19) on autoencoder anomaly detection over journal entries. Those datasets were mostly real ERP data or synthetic attribute data [unverified from memory].
- Schema: the AICPA Audit Data Standards GL Standard is a ready-made field list for journal-entry and TB tables, with order-to-cash, procure-to-pay and inventory subledger standards too ([AICPA](https://www.aicpa-cima.com/resources/download/general-ledger-standard-audit-data-standards)).
- Plain-text accounting engines (hledger, Beancount) enforce balancing and can validate output ([hledger](https://hledger.org/EXAMPLES.html)). The [accounting-bench](https://github.com/mariozupan/accounting-bench) project uses an hledger validator to score LLM output.

**Can an LLM do it alone? No.**
- An education study found LLMs strong on theory, less consistent on journal entries, and less reliable on financial statement preparation ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0748575126000357)).
- Penrose AccountingBench found models roughly within 1% after the first month's close, but errors compound over months ([Penrose](https://accounting.penrose.com/)).
- DualEntry's vendor benchmark had the best model at about 66% on accounting tasks ([DualEntry](https://www.dualentry.com/blog/ai-still-fails-one-third-of-real-accounting-tasks)) [vendor].

**Recommended architecture (brief):**
1. **Company profile.** A seeded RNG, plus an optional LLM call that returns *structured JSON only*: industry, chart of accounts, customers and vendors, monthly volume parameters, narrative.
2. **Deterministic event simulator** in TypeScript or Python. Business events (sale on credit, cash receipt, purchase, payroll, depreciation, accruals, inventory movements) map to journal-entry templates, so every posting is balanced by construction. Assert that Σdebits = Σcredits for each entry. Keep subledgers (AR aging, AP, inventory, fixed-asset register) and source documents (invoice, shipping doc, bank statement lines) as structured records linked by ID.
3. **Close and report.** Roll up the TB, then produce the balance sheet, income statement and cash flow statement (indirect method from TB deltas). Invariant checks: A = L + E, net income ties to retained earnings, cash flow ties to the cash change, subledgers tie to GL control accounts.
4. **Misstatement injector.** Apply typed mutations *after* the clean books are built. Examples: a fictitious sale, a cutoff shift across year-end, an unrecorded liability, an inventory count difference, a duplicate payment, wrong depreciation. Record each in a hidden answer key with the account, assertion, amount, and the procedures that would detect it. Re-run the tie-outs so the books still "balance" while being wrong.
5. **Procedure engine.** Each procedure is a deterministic function over the data: confirmation response generator, cutoff test window, recalculation, analytical expectation vs actual, vouching and tracing samples. It returns evidence. Grading = misstatements detected ∩ planted, plus efficiency.
6. **LLM layer (optional for v1, central for v2).** It renders documents and PDFs from structured records, role-plays the client or controller restricted to engine facts, and writes debrief feedback citing the standards library. The LLM never edits numbers.

Storage fits the Supabase free tier easily: one company-year is about 2–10K journal-entry lines. Generation can run in a Vercel function or client-side.

## Standards sources (free)

- **PCAOB auditing standards** (free HTML index): [pcaobus.org auditing standards](https://pcaobus.org/oversight/standards/auditing-standards), plus a consolidated PDF for fiscal years beginning on or after 2024-12-15 ([PDF](https://pcaobus.org/standards/auditing/documents/auditing_standards_audits_fybeginning_on_or_after_december_15_2024.pdf)). Key standards for the procedure library:
  - AS 1105 Audit Evidence: assertions and evidence relevance and reliability ([link](https://pcaobus.org/oversight/standards/auditing-standards/details/AS1105))
  - AS 2110 risk assessment
  - AS 2301 responses to risk
  - AS 2305 substantive analytical procedures
  - AS 2315 audit sampling
  - AS 2401 fraud (journal-entry testing)
  - AS 2501 estimates
  - AS 2510 inventory observation
  - AS 2310 Confirmation, amended. Effective for fiscal years ending on or after 2025-06-15. Requires confirming cash held by third parties (or equivalent direct external evidence) and retains AR confirmation with alternatives ([AS 2310](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2310), [Baker Tilly](https://www.bakertilly.com/insights/pcaob-introduces-enhanced-confirmation-process-standards)).
  - Standard numbers other than 1105 and 2310 are from my knowledge; titles match the PCAOB reorganized numbering, but confirm the paragraph cites.
- **AICPA clarified SASs (AU-C)**, which apply to private companies and are more relevant to small firms. The full codification is a free PDF (about 2,000 pages, use restricted to professional purposes) ([AICPA AU-C PDF](https://us.aicpa.org/content/dam/aicpa/research/standards/auditattest/downloadabledocuments/au-c-00315.pdf)). Key sections:
  - AU-C 315 risk and assertions
  - AU-C 330 responses
  - AU-C 500 evidence
  - AU-C 501 specific items: inventory, litigation
  - AU-C 505 confirmations
  - AU-C 520 analytical procedures
  - AU-C 530 sampling
  - AU-C 540 estimates
  - AU-C 560 subsequent events (cutoff and unrecorded liabilities)
  - AU-C 240 fraud
  - Section numbers are standard; verify current text in the PDF. Deloitte DART also mirrors AU-C 315 ([DART](https://dart.deloitte.com/USDART/home/auditing/aicpa/professional-standards/aicpa-professional-standards/us-auditing-standards-aicpa-clarified/au-c-sections-300-499/au-c-section-315-understanding-entity)).
- **Copyright note.** Cite paragraph numbers and paraphrase. Don't bulk-copy AICPA text into the app. PCAOB standards are public, but quoting them in an app is still best kept short [unverified legal nuance].
- **Assertions taxonomy.** PCAOB AS 1105 uses existence or occurrence, completeness, valuation or allocation, rights and obligations, and presentation and disclosure. AU-C 315 uses a more granular split between classes of transactions and account balances (occurrence, completeness, accuracy, cutoff, classification, existence, rights and obligations, valuation). Pick one taxonomy and map to the other.

## Risks for a 3-week build

- **Domain depth vs time.** Encoding procedures for every line item is months of work. Limit v1 to 2–3 cycles; breadth is the trap.
- **Tie-out correctness.** Cash flow statement generation and misstatement propagation (for example, a cutoff error hitting AR, revenue, COGS, inventory and tax) are the hardest engine parts. Build invariant tests first.
- **Grading validity.** Many procedures can detect a given misstatement, and "over-auditing" is subjective. You need an explicit rubric (assertion coverage, detection, efficiency) and ideally review by a CPA or instructor.
- **LLM hallucinating numbers or standards.** Constrain it to engine facts and a curated citations table. Free-tier rate limits on model APIs are a further constraint for a live demo.
- **Real-user sign-ups by Nov 17.** (A) needs students or CPA candidates. Reachable through UChicago accounting or finance clubs and r/CPA, but recruit now. (B) needs practitioners, who are hard to recruit, and data confidentiality blocks real use.
- **Competitive optics for (B).** Reviewers will ask "why not DataSnipper or MindBridge?" The answer has to be "free, sole-practitioner-sized, synthetic demo." That is weak.
- **Unverified items in this doc.** Third-party pricing, the Modus Audit raise, the provenance of the SyntheticData repo, the Gronewald dataset license, and the Becker/Gleim TBS internals.
