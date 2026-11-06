# Caseware and CCH: configured workpaper-to-financial-statement automation

Research checked 2026-11-06. Primary-source documentation only. This is product/workflow research, not an assurance that a particular installed version or regional licence includes every feature. Some Caseware `latest` links now redirect into the new 2026 documentation site; older versioned pages are identified below. Desktop CCH evidence is materially older than the current Axcess evidence.

## Finding

The established workflow is real: carry forward a configured engagement, import the new trial balance (TB), retain/review classifications, post adjustments, and propagate balances into linked schedules and statement documents. Caseware Working Papers plus an appropriate Financials template and/or Connector is strong evidence for this pattern. It does **not** establish that software can ingest an arbitrary prior-year Excel workbook, infer all its accounting logic, and autonomously produce a complete reviewed set of financial statements. That distinction is an inference from the documented explicit mapping, link creation, cash-flow analysis, and disclosure-content procedures below.

## Product boundaries and availability

- **Caseware Working Papers** is the desktop engagement/TB/workpaper platform. **Connector** is a separately licensed Office add-in connecting Working Papers data to Word and Excel. Its installation guide requires an active Connector licence and recommends connecting documents through Document Manager. This is different from the separately documented **Cloud Connector**. [Connector installation and FAQ](https://documentation.caseware.com/2024/WorkingPapers/en/Content/Practice/Calculations-Linkages/CaseWare-Connector/CNTR-Getting-Started-Guide.htm)
- **Desktop Financials** is a statement/template/library layer. Its documentation lists Financials IFRS, Financials ASPE Canada, and Financials GAAP US. The system-requirements page is visibly legacy (Working Papers 2017/Windows 7 references), so it establishes product names, not current supported operating systems or present commercial availability. Confirm exact current regional template, content release, framework, and licence with the vendor. [Financials product variants](https://documentation.caseware.com/latest/Financials/en/Content/Getting_Started/Installation/r_Installation_System_Requirements.htm)
- Financials help repeatedly warns that features differ by product. The template contains financial-statement documents and supporting worksheets; the available worksheets depend on the product. [Financial statements and worksheets](https://documentation.caseware.com/latest/Financials/en/Content/Firm_Topics/Financial_Statements_and_Worksheets/k_Financial_Statements_and_Worksheets.htm)
- The current Caseware documentation catalogue separately lists desktop products and cloud products, including **Caseware Financials ASPE + ASNPO**, **Cloud Connector**, and **Global Statutory Reporting**. Do not transfer desktop behaviour to those products without checking their own documentation. [Current product documentation catalogue](https://www.caseware.com/docs)
- UK/ROI products also have explicit app compatibility boundaries: the April 2025 UK cloud update documented cross-app TB transfer only where a mapping relationship is configured, initially Audit Mercia UK Company with Financials UK FRS 102. Other combinations were then planned; that historical plan is not proof that they subsequently shipped. [UK Cloud April 2025 update, p. 6](https://downloads.caseware.com/assets/PDF%20Help%20Site/%40Cloud%20Platform/2025-04-Cloud-Engagement-Update.pdf)

## Caseware: the practical annual workflow

### 1. Roll forward the existing engagement

Working Papers year-end close creates a new file with closing balances becoming prior-year balances. Documents/issues selected for rollover, closing/custom balances, budgets, and forecasts can carry forward. The 2023 instructions require the relevant permission for protected files, recommend cleanup, and require synchronizing/deleting child copies beforehand. [Year-end close, Working Papers 2023](https://docu.caseware.net/WorkingPapers/2023/CaseWare/en/Content/Practice/Maintenance/Year-End-Close/Perform-Year-End-Close.htm)

Rollover is configurable, not a universal copy/reset rule. Options include prior-year balances, next-year balance-sheet opening balances with income closed to retained earnings, spreadsheet-analysis data, program/checklist completion, commentary, and annotations. CaseView input-cell rollover uses its own setting; retaining checklist completion does not by itself roll forward CaseView input cells. [Current year-end close options](https://www.caseware.com/docs/en/desktop/working-papers/practice/year-end-close/year-end-close-options)

**Implication:** a well-configured prior-year engagement is a reusable starting point, but users choose what survives and must distinguish comparative amounts from current-year inputs. A hard-coded Excel date or unrelated standalone workbook is not shown by these instructions to transform itself.

### 2. Import the current-year TB and validate the import

The Excel/ASCII wizard imports chart of accounts and GL balances, GL detail, or adjusting entries. The operator chooses a worksheet and period, defines columns (including a required account-number column), handles debit/credit conventions, and confirms accounts to add. Layout settings can be saved for reuse. Reimport behaviour depends on advanced settings such as clearing period balances, accumulating repeated account rows, and whether balances include existing adjustments. [Current import documentation](https://www.caseware.com/docs/en/desktop/working-papers/engagements/imports/import-ascii-excel); [fully indexed Working Papers 2023 procedure](https://documentation.caseware.com/2023/WorkingPapers/nl/Content/Engagements/File-Preparation/Imports/Import-ASCII-Excel.htm)

The 2023 article documents character/record limits and automatic changes to invalid/duplicate account numbers; these deserve checking against the installed version rather than assuming every spreadsheet is accepted unchanged. The import is a configured data transfer. It is not evidence of general-purpose interpretation of arbitrary workpaper layouts.

### 3. Map accounts to a standard presentation structure

Map numbers function like a standard chart of accounts with properties such as leadsheet grouping, class, and tax linkage. Assigning a client account to a map number fills those properties, while retaining the client's own chart. The Audit 24/Working Papers instructions explicitly tell the user to select unmapped accounts and corresponding map numbers until the TB is assigned. [Assigning mapping numbers, Audit 24](https://documentation.caseware.com/2022/Audit/24_00/en/Content/User_Client_File_Setup/c_Assigning_mapping_numbers.htm)

Accounts can also be assigned to leadsheets, group numbers, US M3 codes, or Canadian GIFI codes. Assignments can be changed or removed. [Working Papers mapping/group assignment procedure](https://documentation.caseware.com/2021/WorkingPapers/en/Content/Engagements/Trial-Balance/Mapping-Grouping/Assign-Accounts-Map-Group-Numbers.htm)

Automap exists, but its documented basis is class/type, tax/GIFI codes, and word matching against the engagement's mapping structure. It should not be described as guaranteed understanding of any chart or workbook. Autofill settings also control whether account properties are overwritten or filled only when blank. [Working Papers mapping options](https://documentation.caseware.com/2022/WorkingPapers/zh/Content/Setup/Environments-Configuration/Interface/Options.htm)

### 4. Adjust the central TB and propagate into configured outputs

Financials provides direct access to the working TB, mapping/grouping dialogs, and adjusting journal entries. These are part of its statement-preparation workflow. [Financials access to Working Papers](https://documentation.caseware.com/latest/Financials/en/Content/User_Topics/Financial_Statements/Navigate/r_Navigate_Accessing_Working_Papers.htm)

A concrete template-specific example is Jazzit: its documentation says applying map assignments updates the financial-statement balance, and the mapping determines both account properties and statement placement. This is direct evidence of the propagation model, but **Jazzit is its own template ecosystem**, not proof that every Financials product uses identical mapping numbers or presentation. [Jazzit mapping procedure](https://documentation.caseware.com/latest/Jazzit/en/Content/jazzit_fundamentals/implementing_the_jazzit_templates/assign_map_numbers_to_the_trial_balance.htm)

### 5. Reuse firm Excel/Word workpapers through Connector

Connector's overview explicitly supports linked Word/Excel financial statements, schedules, and calculations and describes updating linked data when Working Papers data changes. [Connector overview](https://documentation.caseware.com/latest/WorkingPapers/en/Content/Practice/Calculations-Linkages/CaseWare-Connector.htm)

The linkage procedure is explicit: connect the source file, choose a cell/position, choose a data category, period/fiscal year/balance type and formatting, select the value, and accept the generated formula. UDF functions or manual formulas are alternatives. Users can combine links arithmetically. The documentation asks users to verify results and save changes. [Create a linkage, 2024](https://documentation.caseware.com/2024/WorkingPapers/en/Content/Practice/Calculations-Linkages/CaseWare-Connector/Create-Linkage.htm)

After source changes, Caseware recommends recalculating Word/Excel documents to retrieve current values. Automatic recalculation can be disabled; Excel manual calculation also affects DDE behaviour. Accordingly, “linked” should not be equated with “every saved document is always current.” [Recalculate linkages](https://documentation.caseware.com/latest/WorkingPapers/en/Content/Practice/Calculations-Linkages/CaseWare-Connector/Recalculate-Linkages.htm)

Unlinking replaces links with static values; those documents no longer update. Relinking has restrictions: renamed worksheets and deleted rows/columns can break restoration or restore formulas to old addresses. [Unlink/relink limitations](https://documentation.caseware.com/2023/WorkingPapers/es/Content/Practice/Calculations-Linkages/CaseWare-Connector/Unlink-Connector-Linkages.htm)

**Practical distinction:** existing firm Excel templates can be valuable reusable assets once linked and maintained. Uploading arbitrary prior-year Excel does not, on the evidence, automatically create the necessary formulas, identify every hard-coded figure, repair workbook structure, or map every disclosure.

### 6. Generate and maintain the statement and notes package

Financials supports statement areas, schedules, note content, and knowledge-library content. Its rebuild/modify operation can add recommended notes based on entity type, industry, region, assurance type, period, and custom conditions. It can replace old note content with newer versions; that can discard local customization. Some stale disclosure content requires the user to assess and delete it manually. Replacing a statement area also discards its customizations. [Current Financials content-management procedure](https://www.caseware.com/docs/en/desktop/financials/user-help/first-time-setup/financial-statements-content-management/t-content-management-rebuilding-financial-statements)

Notes are not uniformly automatic. Library authors can configure automatic map-linked notes, manually linked notes, or notes that cannot link to a map number. They can restrict applicability by reporting framework. [Managing note content](https://documentation.caseware.com/latest/Financials/en/Content/Firm_Topics/Content_Creation_and_Editing/Notes/t_Notes_Managing_note_content.htm)

Users can link note totals/subtotals to statements, schedules, or other notes to address rounding consistency. Custom DIY note layouts require linkage configuration. Notes can be sorted, deleted, or skipped, with remaining note numbers updated. [Managing notes and custom linkages](https://documentation.caseware.com/latest/Financials/en/Content/User_Topics/Financial_Statements/Note_Tools/t_Financial_Statements_Note_Tools_Managing_notes.htm)

### 7. Complete cash-flow analysis and human review

Financials cash-flow worksheet calculations feed a summary, but the preparer must choose the reporting method, determine analysis items, perform and name the analyses, define cash/cash equivalents, and ensure the worksheet balances. Users can choose mapped accounts or enter data manually. This is direct evidence against claiming a complete cash-flow statement necessarily follows from an ending TB alone. [Cash-flow worksheet workflow](https://documentation.caseware.com/latest/Financials/en/Content/User_Topics/Cash_Flow_Worksheet/c_Cash_Flow_Worksheet_Overview.htm)

The worksheet can drill down into the calculation explorer or filtered TB to inspect the formula/accounts behind a value. Some settings differ by product; for example the documented custom balance-source option excludes IFRS. [Cash-flow worksheet settings](https://documentation.caseware.com/latest/Financials/en/Content/User_Topics/Cash_Flow_Worksheet/t_Cash_Flow_Worksheet_Specifying_settings.htm)

**Research conclusion:** the documented review work includes checking account mappings, import conventions and retained adjustments, refreshing/verifying Office links, resolving disclosure applicability and local customizations, and completing cash-flow analysis. An evaluation should also test changed accounts, new disclosures, comparative restatements, rounding, and stale links. Those test suggestions are our inference, not a vendor guarantee.

## CCH: comparable architecture, distinct products

### CCH ProSystem fx Engagement (desktop; US-oriented evidence)

The vendor-hosted **2018.1.3** user guide explicitly describes Word/Excel TB links used for workpapers and drafted financial statements. Changes in the TB update links; freeze/unfreeze controls update behaviour; users create links with Copy/Paste TB Link or Insert TB Link. This is strong historical documentation of the mechanism, but not verification of every detail of the 2026 release. [2018.1.3 Workpaper Management User Guide, Linking Workpapers](https://support.cch.com/updates/Engagement/pdf/guides_tab/2018/CCH%20ProSystem%20Fx%20Engagement%202018.1.3%20Workpaper%20Management%20User%20Guide.pdf)

The older vendor-hosted **6.5** guide describes a central TB containing account balances/journal entries, imports from spreadsheets, account groupings, reports, and links into Word/Excel. It explicitly says rolled-forward binders use those links to update subsequent-period workpapers/reports from newly imported TB data. Treat this as established architecture, not a current specification or licence claim. [Engagement 6.5 guide, Using the Trial Balance](https://support-qa.cch.com/updates/Engagement/pdf/guides_tab/version6/65/Engagement%206.5%20User%20Guide.pdf)

A vendor training catalogue indexed in 2025 still teaches creating/customizing grouping lists and linking statement/supporting-schedule documents through TB data and Microsoft Office functions. This corroborates continued relevance of the configured-link workflow, but is training material rather than a current release manual. [CCH Engagement training catalogue, Financial Statements course](https://support.cch.com/apioss/Knowledge/GetAttachement?AttachementId=0684R00000QcHxmQAF&AttachementName=CCH+ProSystem+fx+Engagement+Training+and+Consulting+Courses.pdf)

### CCH Axcess Engagement (separate current cloud product)

Current help documents roll-forward of balances to prior period, preservation of group assignments, selection of workpapers and associated notes, and optional journal-entry rollover (with amounts, without amounts, or reversed). These are **Axcess** behaviours; do not label them ProSystem fx features. [Axcess roll-forward procedure](https://help-engagement.cchaxcess.com/Engagement/Content/Engagements/Rolling%20Forward%20Engagements.htm)

Axcess accepts Excel/CSV through a data-import wizard, and QuickBooks Online/Xero or preformatted import through another path. The wizard can import groupings; if groupings are not supplied, automatic financial grouping depends on use of the system grouping structure. [Axcess TB import](https://help-engagement.cchaxcess.com/Engagement/Content/Trial-Balances/Uploading%20Trial%20Balance%20Data.htm)

The reimport page, revised **2026-08-18**, documents that mapped balance columns are zeroed before importing new values, existing journal entries stay intact, and mapped groupings can replace prior assignments. Without imported grouping fields, existing assignments remain; new accounts may remain unassigned if no match is found. The alternative legacy import path preserves prior-period balances. Reimport is described as irreversible. [Axcess reimport rules](https://help-engagement.cchaxcess.com/Engagement/Content/Trial-Balances/Re-import%20the%20Trial%20Balance%20data.htm)

Axcess Word/Excel links require selecting the insertion location and building a TB-link formula with parameters such as account grouping. Its help warns that an installed ProSystem fx Engagement ribbon is a different ribbon. This neatly illustrates why similarly named CCH products must not be conflated. [Axcess TB-link creation](https://help-engagement.cchaxcess.com/Engagement/Content/Workpaper-Links/Insert-TB-Links.htm)

### CCH Accounts Production / CCH iFirm Accounts Production (UK)

The UK **CCH Accounts Production** product is an accounts-production offering associated with CCH Central, not the US Engagement binder product. The UK vendor page also describes transaction-history connectivity through CCH Open Integration/OneClick. [UK Accounts Production product scope](https://www.wolterskluwer.com/en-gb/solutions/cch-central/cch-accounts-production)

A UK support article updated **2025-09-26** says changing entity type during rollover is not automatic because chart-of-accounts and statutory-database structures differ. Its workaround requires exporting a TB, creating a new client/entity, importing, checking certain accounts/journals, and entering statutory data. This is a useful concrete boundary on annual automation. [Changing entity types on rollover](https://help.wolterskluwer.co.uk/Customers/s/article/10157)

The separate **CCH iFirm Accounts Production** community release entry dated **2026-04-07**, version 8.8, announces rollover of customized accounts pages and page/note configuration enhancements. A version-specific release note is evidence that these capabilities exist there; it does not establish identical behaviour in desktop Accounts Production or ProSystem fx. [Official iFirm Accounts Production release discussion](https://wktaaeu.my.site.com/ukcommunity/s/group/0F907000000LJ0ACAW/cch-ifirm-accounts-production)

## What to claim and what to verify in a demonstration

Defensible claim: **“These products automate substantial annual accounting production once the TB, mappings, template content, and document links are configured; they retain an accountant-led preparation and review process.”**

Do not claim: **“Give it any prior-year Excel working-paper file and this year's TB, and it automatically completes every schedule, cash-flow statement, disclosure, and final financial statement.”** None of the reviewed primary sources establishes that capability.

A useful demonstration should use the firm's actual prior-year file and current-year TB, ask the vendor to show configuration effort and exception handling, and explicitly distinguish (1) automatic TB-linked updates, (2) manual inputs/schedules, (3) newly unmapped accounts, (4) statement/notes library content versus custom text, (5) cash-flow adjustments and reconciliation, and (6) the review trail. Require the exact jurisdiction/framework/template version, Office and platform prerequisites, and included licences. This evaluation checklist is analytical advice derived from the documented product boundaries, not a statement that every vendor provides each control.
