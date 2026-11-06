# Audit Workbench: user discovery and Google Form draft

Prepared 2026-11-06. Draft for review, not a published form or a settled product decision.

## Context and research goal

The user's confirmed ambition is to serve **all auditors**. Small external audit firms are a possible starting segment. The repo's proposed first workflow remains Revenue/Accounts Receivable (AR): journals and supporting schedules → account mapping → lead schedule and rollforward → unreconciled differences and flags → Excel workpapers. The current repo contains a proposal, not a working audit application.

Find a repeated, costly task for which auditors can demonstrate a better outcome and obtain adoption approval. Do not assume Revenue/AR is the top priority, that everyone uses IFRS/ISA, or that internal, external and specialist auditors have interchangeable workflows.

## Google Form setup

Title: **What would make your audit work easier?**

Description: “I'm researching software to reduce repetitive audit work. Please answer based on your recent experience, including things your current tools already do well. There are no right answers. Please do not include client names, confidential figures, or documents. Contact details are optional and will only be used for the follow-up you select.”

Pilot with two people and measure completion time before advertising a duration. Use sections and single-choice routing; do not collect email automatically or require document uploads. Keep optional questions optional. If recruiting non-auditor accountants or students, route them to a separate exploratory section and analyze their answers separately.

### Section 1: context (required)

1. **Which best describes the work you currently do most often?** Multiple choice: external financial statement audit; internal audit; IT/SOC/technology assurance; compliance or other specialist audit; accounting/financial reporting without auditing; student/not currently practicing; other. For mixed roles, choose the main one and describe the others optionally. Route practitioners to Section 2, non-auditors to the alternate section below.
2. **What is your main responsibility?** Multiple choice: prepare/perform testing; supervise/review; lead engagements or the audit function; partner/owner; other.
3. **Approximately how many people work in your audit team or practice?** Multiple choice: 1; 2–10; 11–50; 51–200; 201+; unsure. Use team/practice size, not total employees at the audited company.
4. **In which country or countries do you mainly work?** Short answer. Optional linked question: which reporting/auditing/control frameworks apply? Checkboxes: IFRS; local GAAP; US GAAP; ISA; US GAAS; PCAOB; IIA; SOC/ISAE; other; unsure/not applicable. These are different kinds of frameworks; do not treat them as substitutes in analysis.

### Section 2: what actually happens (required except where marked)

5. **Thinking about your most recent audit or review assignment, which task caused the most avoidable effort?** Multiple choice: obtaining information; cleaning/importing data; reconciling balances/schedules; selecting/testing items; investigating unusual items; documenting evidence; clearing reviewer comments; reporting findings; tracking remediation; no substantial friction; other.
6. **Describe one recent example of that task. What did you start with, what did you do, and where did you get stuck?** Paragraph. Allow a brief response; no identifying client details.
7. **About how much hands-on time did that task take on that assignment?** Multiple choice: under 1 hour; 1–3; 4–8; 9–20; over 20; unsure/not applicable. Count active work, not waiting time. Separate optional question: how many working days did you wait for information or approval?
8. **How often do you encounter this problem?** Multiple choice: most assignments; about half; occasionally; this was unusual; unsure/not applicable.
9. **What was the main consequence?** Multiple choice: extra staff time; deadline delay; reviewer rework; delayed investigation of important items; little impact; other. This captures perceived consequences, not proven audit quality effects.
10. **Which tools did you use for that task?** Checkboxes: Excel/Google Sheets; Caseware (specify module optionally); DataSnipper; MindBridge; Inflo; Fieldguide; AuditBoard/Optro; TeamMate; firm-built tools; other; none. Ask about actual use, not brand familiarity.
11. **What does your current approach do well, and what still requires manual work?** Paragraph. This is the critical competitor question; satisfaction and friction can coexist.

### Section 3: priorities and adoption

12. **If you could improve only ONE part of your audit work, which would you choose?** Reuse Q5 options, adding “another task” and “no change needed.” Ask before showing the concept.
13. **What would you need to check before relying on a software-generated result?** Checkboxes, maximum three: underlying source rows/documents; calculation or rule; completeness of input data; assumptions/thresholds; ability to correct and rerun; reviewer approval/history; relevant methodology/standards; other; unsure. “Flag” means an item to investigate, not proof of a misstatement.
14. **What is the biggest barrier to trying a new tool in your work?** Multiple choice: data/confidentiality approval; integration with existing tools; setup/training effort; price; firm methodology/reviewer acceptance; no unmet need; other; unsure.
15. **Who would need to approve a trial?** Checkboxes: me; manager/partner/audit head; IT/security; procurement; client/data owner; other; unsure. Optional buyer question: “What did your organization last buy or renew for this work, and what drove that choice?” Do not require respondents to know budgets they do not control.
16. **What measurable improvement would make a trial worthwhile?** Short answer. Prompt: time saved after setup and review, fewer corrections, faster access to evidence, or another outcome. Avoid suggesting a target percentage.

### Section 4: concept test (only after the neutral questions)

Description: “One proposed first workflow focuses on Revenue and Accounts Receivable. It would use journals and supporting schedules to build reconciliations, identify differences and unusual items for human review, and export Excel workpapers with references to the input data. The first prototype would require specified spreadsheet templates and use synthetic data for demonstrations. It would not provide an audit opinion or establish that every misstatement has been detected.”

17. **How does this proposed workflow fit your actual work?** Multiple choice: addresses my highest-priority problem; relevant but another problem matters more; current tools already handle it well; outside my responsibilities; unsure. Optional: “What is missing or unnecessary?”
18. **What would you be willing to do next?** Multiple choice: a 20-minute interview; try a synthetic-data prototype; both; receive an update only; nothing for now. Optional contact field, shown to those choosing a follow-up. Interest is a recruitment signal, not proof of adoption or purchase.

### Alternate section: accountants and non-practitioners

Ask their role, one recent accounting/coursework task, tools used, the hardest step, and willingness to discuss it. End there rather than forcing practitioner questions. Accounting workflow needs may identify a separate opportunity but should not be counted as auditor validation.

## Follow-up interview guide (about 20 minutes)

Do not read every question mechanically. Start with their Q6 example and follow the evidence.

1. Walk me through that task from receiving the information to getting the work accepted. Which steps did you personally perform?
2. Split the time between waiting, formatting, reconciliation/testing, investigating, and reviewer rework. What can you estimate reliably?
3. Which formats, systems and data volumes were involved? Were the required schedules actually available? What happens when information is missing?
4. Tell me about the last difference or unusual item you investigated. How did you decide whether it mattered? What evidence resolved it?
5. What did your reviewer send back, and why? What would a result need to contain for another auditor to reproduce and accept it?
6. Which part of your existing software would you refuse to lose? When did you last work around it or stop using a feature?
7. For the Revenue/AR concept, how much work would converting your files to the required templates take? Who would do that work? If it takes longer than the current method, what would you do?
8. What data could your organization permit in a pilot, where could it be processed, and who could confirm that? Synthetic-demo willingness does not imply real-data approval.
9. Which AI suggestions would you review, and which decisions must stay entirely with you? Show a sample flag and ask them to explain its rule and source; do not ask only whether they “trust AI.”
10. Describe the last tool purchase, trial, rejection or renewal you were involved in. What evidence, budget unit (seat, engagement, firm) and approvals mattered? Ask for amounts only if known and comfortable sharing.
11. Choose one task for a possible pilot: what is today's baseline, what improvement would be meaningful, and what would make you reject the tool?

For internal/specialist auditors, probe evidence requests, control testing, reviewer handoffs and remediation instead of assuming balance reconciliation is relevant. For external auditors, probe the actual cycle before proposing Revenue/AR.

## Turning answers into a product decision

- Keep a respondent matrix: audit type, role, team size, country/framework, recent task, frequency, hours, consequence, existing tool, approval barrier, concrete follow-up commitment.
- Recruit across preparers, reviewers and buyers. An initial exploratory set could include 4–6 external auditors across firm sizes, 3–4 internal/specialist auditors, and 2–3 reviewers/buyers, with overlapping roles. This is discovery, not a statistically representative market survey.
- Compare patterns within segments before pooling them. Report small samples as counts, not impressive-looking percentages. Quote anonymized examples with permission.
- Prioritize repeated recent pain, measurable net benefit, access to permitted data, reviewer acceptance and feasible adoption. Popular feature votes alone should not determine scope.
- Prototype measure: existing-method time versus tool-assisted time **including preparation, corrections and review**, on comparable cases; also check accuracy, unexplained differences, unnecessary flags and whether reviewers can reproduce outputs. Counterbalance task order where possible to reduce practice effects.
- Synthetic cases establish controlled correctness and usability, not real-world detection performance or readiness for confidential client data.
- Reconsider Revenue/AR if another workflow repeatedly matters more. Reconsider fixed templates if data conversion consumes the savings. Reconsider differentiation if respondents already solve the task comfortably with existing tools.

## Open design frontier

- Confirmed: long-term audience is all auditors; small firms can be an initial segment.
- Pending: first geography/framework and form-only versus form-plus-interviews. The current draft supports mixed frameworks and optional follow-ups; those are draft recommendations, not accepted decisions.
- Downstream: first workflow, import flexibility, pilot acceptance threshold and commercial model should follow interview evidence.

No new ADR is needed: this is reversible discovery planning. Existing glossary terms are retained; a flag, an unreconciled difference and a confirmed misstatement are distinct concepts.
