# Product direction discussion — November 6, 2026

## Session status

The user is still thinking and is not ready to answer the product-direction questions. They requested that this session be recorded in Markdown. **No audience pivot, first-workflow choice, or new implementation scope has been approved.** Resume from the unanswered questions below when the user is ready; do not interpret the recommendations as decisions.

## What the user wants

The initial request was to develop Google Form/interview questions based on the repository's design, research competing audit software and customer feedback, and identify possible differentiation.

The user then clarified:

> “I am not constrainted to small external audit firms, but this can be initial goal. I want to serve eventually all auditors”

This clarification was recorded in `PLAN.md`: small external audit firms are a possible initial segment, not the permanent audience boundary.

The user subsequently reopened the first-customer decision:

> “I am not sure whether I should build software helping accountants within companies, or auditors who perform inspections on those companies.”

They requested market research and questions to help make the product more robust. Their latest response was:

> “i cannot answer your questions yet, I am still thinking. Record this session into md”

## Existing product context

The repository currently contains a proposal and planning/research documents, not an implemented audit application. The proposed Audit Workbench starts with Revenue and Accounts Receivable (AR):

- Journal exports, supporting schedules, prior-year closing trial balance, and client-prepared trial balance as inputs.
- Fixed spreadsheet templates and confirmed account mapping.
- Lead schedule, AR rollforward, comparisons and unreconciled differences.
- Rule-computed flags, with AI suggesting mappings and narrating computed results.
- Excel workpapers and links to relevant procedures.
- Synthetic companies with planted misstatements for initial evaluation.

The current plan assumes IFRS + ISA and excludes several complexities, including FX, consolidation and arbitrary input layouts. Those assumptions have not been validated for a newly chosen customer segment.

## Main distinction surfaced

The current idea combines preparing reconciled information with examining it. These can share calculations but have different users, outcomes and review requirements.

| Dimension | Company accounting team | External audit team |
|---|---|---|
| Desired outcome | Prepare accurate books and explain balances | Examine financial information and document conclusions |
| Example task | Reconcile AR to the ledger and resolve differences | Verify the client's AR reconciliation and investigate selected differences |
| Workflow emphasis | Recurring close, corrections, preparer/reviewer approval | Source evidence, testing rationale, reproducible workpapers |
| Plausible initial user | Accountant or accounting manager | Audit associate, senior or manager |
| Candidate success measure | Time to complete and approve a reconciliation | Time to perform and review a procedure |

Internal audit is a separate potential segment. Being employed inside a company does not make an internal auditor a preparer of its financial records.

A reconciliation agreeing does not itself establish that underlying transactions are valid or that the input population is complete. A flag is an item to investigate, not proof of a misstatement.

## Research conclusions

Both directions face established competition. No evidence established that either audience is commercially superior, broadly underserved, or easier to acquire.

### Company accountants

- **FloQast:** reconciliation and variance analysis overlap the proposed functionality. Reviewers praise visibility and organization; some report setup, customization and upload friction. [Product](https://www.floqast.com/integrated-record-to-report/products/variance-analysis), [reviews](https://www.g2.com/products/floqast/reviews?page=1).
- **BlackLine:** transaction matching and exception handling are existing capabilities. Reviewers value matching and stakeholder visibility; some report substantial setup or implementation effort. [Product](https://www.blackline.com/products/financial-close/transaction-matching/), [reviews](https://www.g2.com/products/blackline-blackline-financial-close-management/reviews?page=9&qs=pros-and-cons).
- **Numeric:** close, reconciliation and variance-analysis capabilities overlap. Reviews praise integration and analysis, while requesting improvements to revenue detail, source links and review interactions. Indexed documentation also describes an Excel audit-evidence export, although direct access redirected to login. [Reviews](https://www.g2.com/products/numeric/reviews), [export documentation](https://help.numeric.io/articles/5443771195-audit-evidence-export).

### Auditors

- **DataSnipper:** established Excel evidence matching and source references. Reviews praise time savings; some report loading and extraction/formatting friction. [Documentation](https://knowledge.datasnipper.com/en/articles/676042-how-to-automate-your-test-with-document-matching), [reviews](https://www.g2.com/products/datasnipper/reviews?page=2&qs=pros-and-cons).
- **Caseware:** linked trial balances, lead schedules and reporting already exist. Customer feedback includes both appreciation of established workflows and complaints about learning effort and interaction. The reviewed Caseware listing mixes products. [Reviews](https://www.capterra.com/p/129838/IDEA/reviews/).
- **MindBridge:** financial risk analysis overlaps anomaly flagging; some reviewers describe data preparation and re-upload friction. [Reviews](https://www.g2.com/products/mindbridge/reviews?page=4&qs=pros-and-cons).
- **Inflo:** indexed Revenue Cascade material directly overlaps revenue analysis. Public review evidence was sparse; the product URL later returned 404 on direct opening. Treat current accessibility and scope cautiously. [Indexed product URL](https://inflo.com/revenue-cascade/), [reviews](https://www.g2.com/products/inflo/reviews).
- **Fieldguide:** documents trial-balance mapping, adjustments, linked sheets and reporting. [Documentation](https://help.fieldguide.io/en/articles/10330326-financial-audit-getting-started).
- **Optro, formerly AuditBoard:** relevant to eventual internal-audit/controls expansion, with a broader audit/risk/compliance workflow. [Vendor](https://optro.ai/), [reviews](https://www.g2.com/products/optro/reviews?page=10&qs=pros-and-cons).

These are desk-research findings, not hands-on benchmarks. Customer reviews are self-selected, sometimes incentivized, and may concern older versions or different audit disciplines. Complaints motivate investigation; they do not establish persistent product defects or an unserved market. Comparable current pricing was not verified.

## Recommendations discussed — not accepted decisions

1. Provisionally explore auditors first because the existing plan and the user's former-auditor experience fit that direction. This is a project-fit inference, not a claim about market attractiveness.
2. Prefer company accountants if there is stronger access to practitioners, a specific unresolved recurring task and better opportunities for realistic validation.
3. Choose one primary user and one completed task for version one. Preserve the broader ambition without building both workflows immediately.
4. Investigate the manual work remaining despite existing software, including residual spreadsheets and handoffs.
5. Measure net time savings including input preparation, corrections and reviewer checks.
6. Treat fixed-template input conversion as a major uncertainty. A workflow that takes an hour of preparation to save twenty minutes is not beneficial.
7. Use synthetic cases for controlled correctness and usability testing. They do not establish real-world reliability, adoption approval or willingness to pay.
8. Interview based on recent incidents before introducing the proposed product. Desired-feature lists alone are weak evidence.

Potential differentiation hypotheses were easier data preparation, results reviewers can reproduce, useful Excel outputs that fit existing engagement files, and one complete workflow with measurable benefit. None is a proven market gap.

## Unanswered questions — first discussion round

### Q1 — Near-term objective

Should the first version be optimized for a convincing, practitioner-tested project by the December 1 date in the current plan, or has the priority shifted toward a commercial product even if that takes longer?

**Recommendation:** use the project deadline as the first milestone while collecting commercial evidence. Confirm whether the deadline remains current.

### Q2 — Access to users

Can access to real users be a major factor in choosing the initial audience? Who could the user interview and bring back for a second prototype session: company accountants/controllers, external auditors, or both? Rough counts and countries would help.

**Recommendation:** favor repeat access to a preparer and reviewer over choosing a market from competitor websites alone.

### Q3 — Personally understood problem

Can the product be anchored in one painful incident from the user's audit experience? What files arrived, what work was manual, why was it difficult, and who ultimately resolved it?

In particular, was the work building a schedule the client should have supplied, or investigating a supplied schedule that did not make sense?

**Recommendation:** start with the incident before selecting features; it may reveal whether the problem belongs to preparation, examination or the handoff.

### Q4 — First workflow

Is the user willing to choose one primary user and one completed task for version one while retaining the broader ambition? Does Revenue/AR reflect their strongest experience or mainly a convenient initial scope?

Candidate outcomes to compare:

- Accountant: prepare an AR reconciliation, explain unresolved differences and submit it for review.
- Auditor: verify the client's AR reconciliation, investigate selected differences and produce reviewable workpapers.

**Recommendation:** accept this level of focus, but defer choosing the outcome until the preceding evidence is available.

### Q5 — Data and adoption

Can access to realistic, permitted inputs be a requirement for validating the product? Could contacts show blank templates, demonstrate their workflows, or supply approved anonymized exports beyond synthetic data?

**Recommendation:** build with synthetic cases, then test input assumptions with practitioners. Do not equate demo interest with approval for actual client data.

### Q6 — Willingness to change direction

Should observed pain, net time savings, reviewer acceptance and willingness to pilot determine the initial audience, even if that points away from the auditor plan?

**Recommendation:** yes. If access is comparable, interview three company accountants and three external auditors about their most recent relevant task using the same evidence criteria. This would guide the next experiment, not prove market demand.

**All six questions remain unanswered.**

## How to resume

Let the user reflect and answer whichever questions they can. Resolve objective, user access and concrete pain before choosing the first audience and task. After that, discuss input/output boundaries, reviewer requirements, integrations, AI's role and pilot success criteria. Do not restart research or repeat all questions unless useful.

## Related repository documents

- [Current plan](../PLAN.md)
- [Google Form and follow-up interview draft](audit-user-discovery.md)
- [Audit competitor assessment and positioning](audit-competitors-and-positioning.md)
- [Additional Inflo and Fieldguide evidence](audit-competitor-supplement.md)
- [Company-accountant market research](accountant-market-comparison.md)
- [Open product decision tree](accountant-vs-auditor-decisions.md)

The earlier form is auditor-oriented. If company accountants become an equal discovery audience, revise its branching and questions rather than treating their answers as secondary. No Google Form has been published.
