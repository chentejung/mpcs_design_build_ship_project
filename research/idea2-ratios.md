# Idea 2 — Auditor's-lens financial ratios app: background research
Researched 2026-11-03. **[V]** = verified (primary source, or I ran the call myself). **[3P]** = third-party review or blog only. **[U]** = unverified or from my own knowledge; check before you rely on it.

## TL;DR
- **Ratios and the standard scores are commodity features.** Stock Analysis shows Piotroski F and Altman Z free [V]. GuruFocus shows Beneish M, Altman Z and Piotroski on public pages, but its "Warning Signs" breakdown is Premium (~$549/yr) [V/3P]. Free do-it-yourself red-flag calculators also exist (LeadAfrik). On its own, "we compute M-Score" does not set the app apart.
- **The restatement detector is the most uncommon feature among consumer tools.** I found no retail platform that flags "as originally reported vs. later restated". GeminIQ only supports the comparison manually. Tradevo Data sells a restated flag as a paid dataset, not as an explained UI [V]. Academics know the idea well: Tan & Young (2015) used XBRL to study "little r" revisions, and revisions are about 80% of restatements (Audit Analytics, 2019).
- **SEC data is free and keyless and supports restatement detection, but you need a server proxy.** There is no CORS header [V]. A request without a User-Agent returns 403 [V]. The limit is 10 req/s. Each companyfacts fact carries `accn, fy, fp, form, filed, frame` [V].
- **The XBRL traps are real and they show up in Apple's own data.** Apple uses three different revenue tags over time. Its 10-Qs mix 3-month and YTD values. `fy`/`fp` describe the *filing*, not the period. Stock splits make EPS look "restated" (FY2019 EPS 11.97 became 2.99) [V].
- **Fit for a 3-week build:** core = ratios + red flags + restatement detector + cited AI summary on a curated tag map. Leave 10-K text diffing and SIC peer benchmarking for v2. Use Gemini or Groq free tiers for the LLM. Their limits are fluid, so plan to cache.

## Feature × competitor matrix
Key: **F** = free, **P** = paid only, **~** = partial or adjacent, **–** = not found. Unlabelled cells are [U] (my own knowledge) unless the notes below cite them.

| Competitor | 1 Red-flag scores | 2 Restatement detect | 3 DuPont / bridge | 4 Cited AI summary | 5 10-K text YoY diff | 6 Peer by industry | 7 Filing alerts |
|---|---|---|---|---|---|---|---|
| Yahoo Finance | – | – | – | ~ (AI summaries, uncited) [U] | – | ~ F | ~ (price/news) |
| Stock Analysis | F: Piotroski, Altman (no Beneish) [V] | – | – | – | – | ~ F | ~ P [U] |
| Finviz | – (screens on ratios, not scores) [U] | – | – | – | – | F (screener by industry) | P (Elite) [U] |
| Koyfin | – [U] | – | ~ | – | – | F/P | P (alerts on filings; tier unclear) [3P] |
| Simply Wall St | ~ F/P (pass/fail "checks", 5 reports/mo free) [3P] | – | – | ~ | – | F | F/P |
| Macrotrends | – (search found nothing) [U] | – | – | – | – | – | – |
| Morningstar | – (moat/uncertainty, not forensic) [U] | – | – | ~ P | – | P | P |
| GuruFocus | F (score value) / P (Warning Signs) [V/3P] | – | ~ P [U] | ~ P [U] | – | P | P |
| Seeking Alpha | ~ P (Quant grades, not forensic) [U] | – | – | ~ P | – | P | P |
| Fiscal.ai (FinChat) | – | – | ~ (KPI/segments) | P (cited copilot; free plan disputed) [3P] | – | P | P |
| AlphaSense | ~ P | – | – | P | P (Blackline 10-K/10-Q vs prior period) [V help ctr] | P | P |
| Quartr | – | – | – | F mobile / P desktop (source-traced chat) [3P] | – | – | F/P |
| Hudson Labs | P (text-based forensic risk score, institutional tier) [3P] | – | – | P | ~ P | – | P |
| GeminIQ | ~ | ~ (keeps all filing versions; comparison is manual) [V] | ? | ? | – | ? | P (watchlists) |
| Tradevo Data (API) | – | P (dataset `restated` flag, >0.5% rule) [V] | – | – | – | – | – |
| LeadAfrik red-flag scanner | F (Beneish, Altman Z'', Piotroski, accruals, CFO/NI, DSO/inventory trends; **manual input**) [V] | – | – | – | – | – | – |
| ChatGPT/Claude + uploaded 10-K | ~ (ad hoc) | – | ~ | ~ (cites when given the doc) | ~ | – | – |

**Which features are genuinely uncommon (among free or retail tools):**
- **#2 Restatement detection:** none found in retail UIs.
- **#4 Claim-level citations to the XBRL fact (accn) with automated number-checking evals:** citations to documents exist (Fiscal.ai, Quartr), but citations to the fact itself, plus numeric verification, are rare.
- **#5 Risk-factor and accounting-policy diff:** exists only in institutional tools (AlphaSense, $$).
- **#1 scores explained in auditor language:** the scores themselves are common. Combining them with an auditor's explanation (CFO/NI divergence, DSO/DIO/DPO jumps, accruals) is less so. The best free version, LeadAfrik, needs manual input.
- **#3, #6, #7** are common.

## Most differentiating features (ranked)
1. **Restatement / reclassification detector (#2).** It is rare in retail tools, fits an auditor's background, and is computable from companyfacts alone.
2. **Cited, eval-checked AI summary (#4).** It is novel because every number links to `accn` + concept + period, and an eval checks each number against source. This is also the strongest "AI focus" story.
3. **Earnings-quality scanner with an auditor's narrative (#1).** It is commodity math, but the framing sets it apart: "what an auditor would ask management next".
4. **10-K risk-factor / policy-note diff (#5).** It is differentiated, but it needs HTML parsing to find the right sections, which is fragile. Make it a v2 stretch goal.
5. **Filing alerts when flags change (#7).** Alerts are common, but tying them to *flag changes* and new restatements is a nice v2 feature.
6. **DuPont / margin bridge (#3)** and **SIC peers (#6)** are low differentiation. Add #3 cheaply as context. #6 needs the frames API plus SIC lookups, so it costs more than it seems.

## Data sources & limits
**SEC EDGAR (data.sec.gov)** ([SEC API page](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [Accessing EDGAR data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data))
- **Auth:** none, no API key [V].
- **User-Agent:** must name you and give an email. Without it I got **403** [V].
- **Rate limit:** 10 requests/second per user. The SEC may block IPs that exceed it [V SEC]. A roughly 10-minute block is reported [3P].
- **CORS:** not supported, per the SEC page [V]. My test response had no `Access-Control-Allow-Origin` header [V]. Browsers also cannot set User-Agent. **You need a server-side proxy** (Vercel function or Supabase Edge Function), and you should cache results in Supabase.
- **Endpoints:**
  - `submissions/CIK##########.json`: filing list with form, filing date, accession number, SIC, tickers. Apple's file is 164 KB [V].
  - `api/xbrl/companyfacts/CIK##########.json`: every concept, every fact. Apple's is **3.9 MB raw, about 277 KB gzipped** [V].
  - `companyconcept/...`: one concept.
  - `frames/{tax}/{tag}/{unit}/CY2023[Q1][I].json`: one fact per company per calendar period, using the *last-filed* value [V]. Useful for peers (#6).
  - Ticker→CIK map: `https://www.sec.gov/files/company_tickers.json` [V].
- **Bulk data:** nightly `companyfacts.zip` and `submissions.zip` [V]. Good for seeding peers. Too big for the free Supabase tier (500 MB) if loaded whole [U on size].
- **Fields per fact:** `start` (durations only), `end`, `val`, `accn`, `fy`, `fp`, `form`, `filed`, `frame` (optional) [V]. That is sufficient for restatement detection: group by (concept, unit, start, end) and compare `val` across `accn`/`filed`.
- **Gaps in companyfacts:** no dimensional facts (segments, axes) and no text blocks [V: no dimension fields present]. Footnote text needs the filing HTML from `Archives/edgar/data/...`.

**EDGAR full-text search (efts.sec.gov/LATEST/search-index)** [3P: [guide](https://tldrfiling.com/blog/sec-edgar-full-text-search-api)]
- Keyless, but needs a User-Agent.
- Parameters: `q`, `forms`, `ciks` (zero-padded to 10 digits), `startdt`/`enddt`.
- Covers filings since 2001. Result window is capped at 10k. Undocumented, so not a stable contract.
- Useful for finding "restated", "revision" or Item 4.02 8-Ks to corroborate detector hits.

**Free alternatives**
- **Financial Modeling Prep:** free Basic plan, 250 calls/day, end-of-day data only [3P, [FMP FAQ](https://site.financialmodelingprep.com/faqs)]. Gives normalized statements (easy), but **no original-vs-restated history**.
- **Alpha Vantage:** 25 requests/day free, ~5/min [V [support](https://www.alphavantage.co/support/)]. Too low for multi-user use. Only use it for share price (needed for Altman Z's market cap and P/E).
- **Fiscal.ai API:** reported free plan of 100 companies and 250 calls/day [3P].
- **Recommendation:** EDGAR only for fundamentals. Use one free price API for market cap. Some Altman Z variants (Z'') avoid needing a price.

## XBRL pitfalls (seen in Apple's companyfacts unless noted)
- **Tag inconsistency over time:** revenue moves from `SalesRevenueNet` (→FY2018) to `Revenues` to `RevenueFromContractWithCustomerExcludingAssessedTax` (ASC 606) [V]. You need a fallback chain per line item, and other companies use other tags (e.g. `RevenueFromContractWithCustomerIncludingAssessedTax`, banks' `InterestAndDividendIncomeOperating`) [U]. COGS, SG&A and CFO tags vary similarly.
- **Custom extensions:** company-specific tags live under their own prefix and do not appear in `us-gaap` facts. Key lines can go missing, so show "n/a" and never silently treat a missing line as zero.
- **Quarterly vs YTD mixing:** a Q2 10-Q reports both a 3-month and a 6-month NetIncome [V]. Pick by duration (`end − start` of about 90 days vs about 180 or 270).
- **No Q4 in 10-Qs:** derive Q4 as FY minus 9-month YTD. Q4 is not derivable for balance-sheet *instants*; use the 10-K value directly. Q4 EPS is not additive.
- **`fy`/`fp` describe the filing, not the period:** e.g. a 2022-12-31 quarter tagged `fy:2024, fp:Q1` because it was a comparative in the FY2024 10-Q [V]. Always key on `start`/`end`.
- **Duplicates:** the same value repeats in every later filing that shows it as a comparative. `frame` is set on only one canonical fact [V].
- **Fiscal years:** non-calendar year-ends (Apple's ends in late September, on 52/53-week years) → match `end` dates with tolerance.
- **Units and scale:** `USD`, `USD/shares`, `shares`, and occasionally non-USD for foreign filers. Values are already scaled (no "in millions").
- **Sector applicability:** Altman Z, Beneish and DSO/DIO are not meaningful for banks, insurers or REITs. Detect them by SIC (60xx–67xx) and suppress or warn [3P].

## Restatement detector feasibility
- **Method:** for each (concept, unit, start, end), sort facts by `filed`. Flag when |Δ| / |original| exceeds a threshold. Tradevo uses 0.5% and treats original = 0 as a special case [V].
- **Show the evidence:** the original accession (with `form` 10-K/A or 10-Q/A) and the later one, both linked to EDGAR.
- **It works on real data [V].** Apple's FY2009 total assets were **$53.851B in the 10-K filed 2009-10-27** and **$47.501B in the 10-K/A filed 2010-01-25**. That 10-K/A was a retrospective change in accounting principle (new revenue-recognition guidance) [U on the cause]. My naive same-period/different-value scan found 431 concept-periods with differing values for Apple alone, so classification matters more than detection.
- **Prior art:**
  - Academic: Tan & Young (2015), "An Analysis of 'Little r' Restatements", *Accounting Horizons*, which used 2009–12 XBRL data ([AAA](https://publications.aaahq.org/accounting-horizons/article/29/3/667/2222/An-Analysis-of-Little-r-Restatements)).
  - Audit Analytics: classifies Big R vs little r; revisions were about 80% of restatements in 2019 ([AA](https://blog.auditanalytics.com/2019-financial-restatements-review/)).
  - Commercial datasets: Tradevo (paid flag) [V], [GeminIQ](https://www.geminiq.com/blog/how-to-find-restatements-in-filings) (manual).
  - Hobbyist repos ([edgar-project issue](https://github.com/ss9077/edgar-project/issues/60), [restatement-risk](https://github.com/tlevin1/restatement-risk)).
  - The idea is known, but **I found no free consumer UI that explains it**.
- **False-positive sources to classify, not just flag:**
  - **Stock splits:** Apple FY2019 basic EPS went 11.97 → 2.99 (4:1 in 2020) and FY2013 went 40.03 → 5.72 (7:1 in 2014) [V]. Detect via ratios that are whole numbers, or via a `StockholdersEquityNoteStockSplitConversionRatio` fact.
  - **Reclassifications** (e.g. ASU 2015-17 deferred taxes; Apple FY2015 assets 290,345 → 290,479 [V]).
  - **Retrospective adoption of a new standard** (ASC 606, ASC 842).
  - **Discontinued operations** (the income statement is re-cast).
  - **Common-control mergers or pooling.**
  - **Segment recasts:** not in companyfacts anyway.
  - **Rounding, or a tag switch** (the value "disappears" from one tag and appears in another, so same-tag matching misses it).
- **Auditor-lens triage:**
  1. 10-K/A or 10-Q/A plus an Item 4.02 8-K → Big R.
  2. Change shows up in the next periodic filing's comparative column → possible little r or reclass.
  3. Corroborate with full-text search for "restated", "revision" or "reclassified" in that filing.
  4. Let the LLM classify only with a cited passage. Otherwise label it "unexplained change".

## Free-tier LLM options (limits change often; check each dashboard)
- **Google Gemini API (AI Studio):** free tier exists. Limits are per project and shown only in AI Studio; Google publishes no numbers [V [docs](https://ai.google.dev/gemini-api/docs/rate-limits)]. Third parties report about 10–15 RPM and up to about 1,500 RPD for Flash models [3P]. Pro preview models are not on the free tier [3P]. Free-tier prompts may be used to improve Google's products [3P]. Long context is good for 10-K passages.
- **Groq:** free, no card, about 30 RPM, 1k–14.4k RPD depending on model. The free model roster changed in 2026 [3P; [docs](https://console.groq.com/docs/rate-limits)]. Fast, and good for structured JSON with citations.
- **OpenRouter `:free` models:** free, with roughly 50 requests/day without credits [U, not verified this session].
- **Others not checked this session [U]:** Mistral (free "Experiment" tier), Cloudflare Workers AI (daily free allocation), GitHub Models (free, low limits).
- **Design implication:** pass the LLM a precomputed facts table of numbers plus their accn IDs, and require it to cite fact IDs. Run a deterministic eval that checks every number in the output against that table. This keeps token usage small and makes the free tiers workable.

## Risks for a 3-week build
- **Normalization takes longer than expected:** tag fallback chains, YTD→quarter logic and fiscal-year alignment. Mitigation: start with annual 10-K data only and about 15 line items, and add quarterly data in v2.
- **The restatement detector will be noisy:** hundreds of hits per company. Without split and reclass classification it looks broken. Budget time for triage rules and for UI design ("only show material lines").
- **Sector exceptions** (banks, REITs): ratios become nonsense. Gate by SIC.
- **SEC fair-access rules:** the server must send a User-Agent, cache companyfacts (it is large), and throttle. Vercel Hobby function limits on timeouts and payload size [U: check current limits] mean you should fetch gzipped and store parsed rows in Supabase.
- **LLM free-tier volatility:** limits and models changed several times in 2026 [3P]. Keep the provider swappable, and cache summaries per (company, latest accn).
- **Section extraction for #5 (10-K text diff):** parsing Item 1A and the policy notes out of filing HTML is brittle. Defer it.
- **Liability and over-claiming:** red flags are not fraud findings. Label everything "screen, not conclusion" (every competitor and source stresses this).
- **Demo risk:** pick 3–5 showcase companies with known restatements or splits (e.g. Apple, plus a known Item 4.02 restater found via full-text search) and test them end to end before Nov 17.

## Sources
- SEC: [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [Accessing EDGAR data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [Developer resources](https://www.sec.gov/about/developer-resources). I made live calls to data.sec.gov companyfacts, submissions and frames for CIK 320193 on 2026-11-03.
- Competitors:
  - GuruFocus: [GuruFocus M-Score](https://www.gurufocus.com/term/mscore/AAPL), [GuruFocus Warning Signs tutorial](https://www.gurufocus.com/tutorial/article/97/what-are-warning-signs), [GuruFocus review](https://stocksimplifier.com/reviews/gurufocus)
  - Stock Analysis: [Stock Analysis AAPL statistics](https://stockanalysis.com/stocks/aapl/statistics/)
  - Simply Wall St: [Simply Wall St reviews](https://www.dollarscout.net/research/reviews/simply-wall-st/)
  - Koyfin: [Koyfin plans](https://www.koyfin.com/pricing/plans-comparison/), [Koyfin LLM info](https://www.koyfin.com/llm-info/)
  - Fiscal.ai: [Fiscal.ai pricing](https://fiscal.ai/pricing/), [Fiscal.ai review](https://stocksimplifier.com/reviews/fiscal-ai)
  - AlphaSense: [AlphaSense Blackline](https://help.alpha-sense.com/hc/en-us/articles/41877819090579-Track-Changes-Between-Major-Filings-with-Blacklining)
  - Quartr: [Quartr features](https://quartr.com/features)
  - Hudson Labs: [Hudson Labs](https://www.hudson-labs.com/)
  - GeminIQ: [GeminIQ](https://www.geminiq.com/blog/how-to-find-restatements-in-filings)
  - Tradevo Data: [Tradevo Data](https://tradevodata.com/blog/how-to-find-restatements-in-sec-filings)
  - LeadAfrik: [LeadAfrik scanner](https://leadafrik.com/red-flags)
- Restatement literature: [Tan & Young 2015](https://publications.aaahq.org/accounting-horizons/article/29/3/667/2222/An-Analysis-of-Little-r-Restatements), [Audit Analytics 2019](https://blog.auditanalytics.com/2019-financial-restatements-review/)
- Data and LLM providers: [FMP FAQ](https://site.financialmodelingprep.com/faqs), [Alpha Vantage support](https://www.alphavantage.co/support/), [EFTS guide](https://tldrfiling.com/blog/sec-edgar-full-text-search-api), [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [Groq rate limits](https://console.groq.com/docs/rate-limits)
