# 03 - Hunting, data, content, UEBA, threat intelligence and environment inventory for the Sentinel move to the Defender portal

Research date: 2026-10-19. Scope:
- Advanced hunting with Sentinel data in the Defender portal.
- Content: workbooks, watchlists, hunting queries, bookmarks, livestream, notebooks, content hub, repositories.
- UEBA and entity pages.
- Threat intelligence and the MDTI changes.
- SOC optimization and the data connectors page.
- Data tiers.
- Read-only tooling to inventory an existing Sentinel environment before the move.

Method:
- Every page below was fetched live on 2026-10-19.
- Dates are the page's `ms.date` metadata, with `updated_at` (last publish) in brackets.
- Quotes are verbatim and 25 words or fewer.
- "Confidence" describes how well the source wording supports the claim. It doesn't say how likely the behaviour is in a given tenant.

Confidence scale:
- **High**: stated explicitly on a current Learn page.
- **Medium**: stated, but another current page contradicts it, the wording is ambiguous, or the feature is in preview.
- **Low**: inferred, composed from documented parts, or supported only by a non-Microsoft source.

Important: none of the inventory snippets in section 8 were run against a live tenant during this research. Their syntax, tables and columns were checked against the cited reference pages. Each snippet says whether it is a **verbatim Microsoft sample** or **composed** from documented syntax and schema.

---

## 0. Source register

| ID | Title | URL | ms.date [updated_at] |
|---|---|---|---|
| S1 | Microsoft Sentinel in the Microsoft Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/microsoft-sentinel-defender-portal | 2026-06-18 [2026-09-23] |
| S2 | Transition Your Microsoft Sentinel Environment to the Defender Portal | https://learn.microsoft.com/en-us/azure/sentinel/move-to-defender | 2026-09-10 [2026-09-24] |
| S3 | Advanced hunting with Microsoft Sentinel data in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-microsoft-defender | 2026-06-09 [2026-09-23] |
| S4 | Microsoft Sentinel User and Entity Behavior Analytics (UEBA) reference | https://learn.microsoft.com/en-us/azure/sentinel/ueba-reference | 2025-08-28 [2026-08-05] |
| S5 | Microsoft Sentinel alert schema differences between standalone and XDR connectors | https://learn.microsoft.com/en-us/azure/sentinel/security-alert-schema-differences | 2026-06-17 [2026-06-24] |
| S6 | Data tables in the Microsoft Defender XDR advanced hunting schema | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-schema-tables | 2026-07-27 [2026-10-13] |
| S7 | Conduct End-to-end Threat Hunting with Hunts | https://learn.microsoft.com/en-us/azure/sentinel/hunts | 2026-07-01 [2026-08-08] |
| S8 | Hunting Capabilities in Microsoft Sentinel (the old `/azure/sentinel/livestream` URL now returns this page) | https://learn.microsoft.com/en-us/azure/sentinel/hunting | 2026-07-01 [2026-08-08] |
| S9 | Jupyter notebooks with Microsoft Sentinel hunting capabilities | https://learn.microsoft.com/en-us/azure/sentinel/notebooks | 2024-03-07 [2026-04-22] |
| S10 | Visualize your Data by using Workbooks in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/monitor-your-data | 2026-07-01 [2026-08-12] |
| S11 | Threat intelligence - Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/understand-threat-intelligence | 2025-08-18 [2026-10-06] |
| S12 | Threat intelligence in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/defender-threat-intelligence | 2026-08-31 [2026-09-23] |
| S13 | Use Intel explorer in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/threat-intelligence-explorer | 2026-09-02 [2026-09-23] |
| S14 | Transition to the new Threat intelligence experience in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/threat-intelligence-transition | 2026-08-31 [2026-09-23] |
| S15 | July 2026 announcements - Partner Center announcements ("MDTI reaches end of life August 1, 2026") | https://learn.microsoft.com/en-us/partner-center/announcements/2026-july | 2026-07-29 [2026-07-31] |
| S16 | What's new in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/whats-new | 2026-08-24 [2026-09-23] |
| S17 | Multiple workspaces - Microsoft Sentinel in Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/workspaces-defender-portal | 2026-06-08 [2026-09-23] |
| S18 | Use the advanced hunting query resource report | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-limits | 2026-07-02 [2026-08-11] |
| S19 | Advanced hunting overview in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-overview | 2026-08-07 [2026-09-10] |
| S20 | Create custom detection rules in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/custom-detection-rules | 2026-09-02 [2026-10-04] |
| S21 | Use Microsoft Sentinel custom functions in advanced hunting in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-defender-use-custom-rules | 2026-07-02 [2026-08-11] |
| S22 | Entity pages in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/entity-pages | 2024-10-16 [2026-05-14] |
| S23 | Enable entity behavior analytics to detect advanced threats | https://learn.microsoft.com/en-us/azure/sentinel/enable-entity-behavior-analytics | 2026-08-07 [2026-08-11] |
| S24 | Advanced threat detection with UEBA in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/identify-threats-with-entity-behavior-analytics | 2025-12-15 [2026-07-17] |
| S25 | Add entities to threat intelligence - Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/add-entity-to-threat-intelligence | 2026-07-01 [2026-09-23] |
| S26 | Optimize security operations (SOC optimization) | https://learn.microsoft.com/en-us/azure/sentinel/soc-optimization/soc-optimization-access | 2026-07-01 [2026-09-10] |
| S27 | Build queries or rules with watchlists | https://learn.microsoft.com/en-us/azure/sentinel/watchlists-queries | 2026-07-01 [2026-08-08] |
| S28 | Azure Monitor Logs reference - Watchlist | https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/watchlist | 2026-08-27 [2026-08-28] |
| S29 | Azure Monitor Logs reference - Usage | https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/usage | 2026-07-27 [2026-07-28] |
| S30 | Analyze usage in a Log Analytics workspace | https://learn.microsoft.com/en-us/azure/azure-monitor/logs/analyze-usage | 2026-05-08 [2026-08-25] |
| S31 | union operator (Kusto) | https://learn.microsoft.com/en-us/kusto/query/union-operator?view=microsoft-sentinel | 2024-08-11 [2024-08-20] |
| S32 | Auditing and health monitoring in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/health-audit | 2025-08-24 [2026-05-14] |
| S33 | Turn on auditing and health monitoring in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/enable-monitoring | 2026-07-02 [2026-08-08] |
| S34 | Microsoft Sentinel health tables reference | https://learn.microsoft.com/en-us/azure/sentinel/health-table-reference | 2025-08-20 [2026-05-14] |
| S35 | Microsoft Sentinel audit tables reference | https://learn.microsoft.com/en-us/azure/sentinel/audit-table-reference | 2023-01-17 [2026-05-14] |
| S36 | Monitor the health and audit the integrity of your analytics rules | https://learn.microsoft.com/en-us/azure/sentinel/monitor-analytics-rule-integrity | 2026-07-02 [2026-08-08] |
| S37 | Monitor the health of your Microsoft Sentinel data connectors | https://learn.microsoft.com/en-us/azure/sentinel/monitor-data-connector-health | 2026-07-02 [2026-08-08] |
| S38 | Monitor the Health of your Microsoft Sentinel Automation Rules and Playbooks | https://learn.microsoft.com/en-us/azure/sentinel/monitor-automation-health | 2026-07-01 [2026-08-12] |
| S39 | API versions of Microsoft Sentinel REST APIs | https://learn.microsoft.com/en-us/rest/api/securityinsights/api-versions | 2021-12-09 [2026-02-19] |
| S40 | Alert Rules - List (api-version 2025-09-01; also viewed with `?view=rest-securityinsights-2025-07-01-preview`) | https://learn.microsoft.com/en-us/rest/api/securityinsights/alert-rules/list | 2024-05-07 [2026-07-14; preview view 2026-06-18] |
| S41 | Automation Rules - List (2025-09-01) | https://learn.microsoft.com/en-us/rest/api/securityinsights/automation-rules/list | 2024-05-07 [2026-07-14] |
| S42 | Watchlists - List (2025-09-01) | https://learn.microsoft.com/en-us/rest/api/securityinsights/watchlists/list | 2024-05-07 [2026-07-14] |
| S43 | Data Connectors - List (2025-09-01; also viewed with the 2025-07-01-preview view) | https://learn.microsoft.com/en-us/rest/api/securityinsights/data-connectors/list | 2024-05-07 [2026-07-14] |
| S44 | Az.SecurityInsights Module (azps-16.4.0) | https://learn.microsoft.com/en-us/powershell/module/az.securityinsights/ | 2026-10-01 [2026-10-06] |
| S45 | Get-AzSentinelAlertRule | https://learn.microsoft.com/en-us/powershell/module/az.securityinsights/get-azsentinelalertrule | 2026-10-01 [2026-10-06] |
| S46 | Get-AzSentinelAutomationRule | https://learn.microsoft.com/en-us/powershell/module/az.securityinsights/get-azsentinelautomationrule | 2026-10-01 [2026-10-06] |
| S47 | Get-AzSentinelDataConnector | https://learn.microsoft.com/en-us/powershell/module/az.securityinsights/get-azsentineldataconnector | 2026-10-01 [2026-10-06] |
| S48 | az sentinel (Azure CLI extension) | https://learn.microsoft.com/en-us/cli/azure/sentinel | 2026-09-01 [2025-07-14] |
| S49 | az sentinel alert-rule | https://learn.microsoft.com/en-us/cli/azure/sentinel/alert-rule | 2026-09-01 [2026-04-07] |
| S50 | az (reference index, `az rest` section) | https://learn.microsoft.com/en-us/cli/azure/reference-index?view=azure-cli-latest#az-rest | 2026-09-01 [2026-10-02] |
| S51 | Import and export Microsoft Sentinel analytics rules | https://learn.microsoft.com/en-us/azure/sentinel/import-export-analytics-rules | 2026-07-02 [2026-08-08] |
| S52 | Import and export Microsoft Sentinel automation rules | https://learn.microsoft.com/en-us/azure/sentinel/import-export-automation-rules | 2026-07-02 [2026-08-08] |
| S53 | Supported Azure Resource Manager resource types - Azure Resource Graph | https://learn.microsoft.com/en-us/azure/governance/resource-graph/reference/supported-tables-resources | 2021-12-20 [2025-10-06] |
| S54 | Starter query samples - Azure Resource Graph | https://learn.microsoft.com/en-us/azure/governance/resource-graph/samples/starter | 2023-08-31 [2026-10-09] |
| S55 | Azure Monitor Logs reference - ThreatIntelIndicators | https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/threatintelindicators | 2026-07-27 [2026-07-28] |
| S56 | Work with STIX objects and indicators (Preview) | https://learn.microsoft.com/en-us/azure/sentinel/work-with-stix-objects-indicators | 2026-07-02 [2026-08-08] |
| S57 | Azure Monitor Logs reference - SecurityAlert | https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/securityalert | 2026-07-27 [2026-07-28] |
| S58 | Azure Monitor Logs reference - SecurityIncident | https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/securityincident | 2026-08-27 [2026-08-28] |
| S59 | Manage data tiers and retention in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/manage-data-overview | 2026-07-02 [2026-08-08] |
| S60 | Discover and deploy Microsoft Sentinel out-of-the-box content from Content hub | https://learn.microsoft.com/en-us/azure/sentinel/sentinel-solutions-deploy | 2026-07-01 [2026-08-08] |
| S61 | Deploy Custom Content from your Repository | https://learn.microsoft.com/en-us/azure/sentinel/ci-cd | 2026-07-01 [2026-08-08] |
| S62 | Start an Investigation by Searching Large Datasets (search jobs, restore) | https://learn.microsoft.com/en-us/azure/sentinel/investigate-large-datasets | 2026-07-02 [2026-08-12] |
| S63 | Microsoft Sentinel data lake overview | https://learn.microsoft.com/en-us/azure/sentinel/datalake/sentinel-lake-overview | 2025-08-11 [2026-05-14] |
| S64 | Roles and permissions in the Microsoft Sentinel platform | https://learn.microsoft.com/en-us/azure/sentinel/roles | 2026-01-07 [2026-09-10] |
| S65 | Workbooks - Get (Application Insights REST, 2021-08-01) | https://learn.microsoft.com/en-us/rest/api/application-insights/workbooks/get | 2024-05-07 [2026-02-17] |
| S66 | Workbooks - List By Resource Group (2021-08-01) | https://learn.microsoft.com/en-us/rest/api/application-insights/workbooks/list-by-resource-group | 2024-05-07 [2026-02-17] |
| S67 | Saved Searches - List By Workspace (Log Analytics REST, 2026-03-01) | https://learn.microsoft.com/en-us/rest/api/loganalytics/saved-searches/list-by-workspace | 2024-05-07 [2026-08-10] |
| S68 | Invoke-AzRestMethod (Az.Accounts, azps-16.4.0) | https://learn.microsoft.com/en-us/powershell/module/az.accounts/invoke-azrestmethod | 2026-10-01 [2026-10-06] |
| N1 | (Non-Microsoft) "Defender XDR VS Microsoft Sentinel table changes", Robbe Van den Daele, Hybrid Brothers | https://hybridbrothers.com/posts/defender-xdr-vs-sentinel-table-changes/ | 2025-10-11 (article date) |

Pages that couldn't be read:
- The Tech Community post "MDTI is Converging into Microsoft Sentinel and Defender XDR" (https://techcommunity.microsoft.com/blog/defenderthreatintelligence/mdti-is-converging-into-microsoft-sentinel-and-defender-xdr/4427991) is rendered client-side, so only its title came back. It is linked from S15. Nothing in these notes depends on its body text.

---

## 1. Advanced hunting with Sentinel data

### 1.1 How Sentinel workspace tables appear

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 1.1.1 | In the Defender portal, **Logs** is replaced by **Investigation & response > Hunting > Advanced hunting**. | S1 (Quick reference > General) | High | Navigation table: "Logs" → "Investigation & response > Hunting > Advanced hunting". |
| 1.1.2 | The workspace's tables are listed **by solution**, after the Defender tables, on the **Schema** tab. | S3 | High | "you can find many of that workspace's tables organized by solution after the Microsoft Defender tables under the Schema tab." Note the word **many**, not "all" (see section 9, G1). |
| 1.1.3 | Sentinel functions are on the **Functions** tab. Shared and sample Sentinel queries are on the **Queries** tab, in folders marked **Sentinel**. | S3, S21 | High | "your shared and sample queries from Microsoft Sentinel can be found in the Queries tab inside folders marked Sentinel." Sentinel query folder names can't be edited (S21). |
| 1.1.4 | The schema pane shows the schema type (advanced or basic), the data retention period and tags for Sentinel tables. | S3 | High | Lake-tier tables may show the wrong schema type ("might instead display Advanced table"), a known issue. |
| 1.1.5 | Most Sentinel KQL works in advanced hunting, including `adx()`. IntelliSense may warn even when the query runs. | S3 | High | "In general, queries from Microsoft Sentinel work in advanced hunting, including queries that use the adx() operator." |
| 1.1.6 | Access needs at least **Microsoft Sentinel Reader** to query Sentinel and Defender data together. | S3 | High | "you need at least the Microsoft Sentinel Reader role." |
| 1.1.7 | Sentinel alerts tied to incidents are also written to `AlertInfo`. | S2 | High | "All Microsoft Sentinel alerts that are tied to incidents are ingested into the AlertInfo table". |
| 1.1.8 | **SecurityAlert in the schema browser.** No current Microsoft page says whether `SecurityAlert` is listed in the Schema tab. Microsoft pages do treat it as a queryable Sentinel table: it is listed under Continuous (NRT) tables for custom detections (S20), and as a "Microsoft Sentinel" table type in Table management (S59). One practitioner reports it isn't listed but can still be queried (N1). | S20, S59, N1 | Low (visibility) / Medium (queryable) | N1: "there is no recognition for the SecurityAlert table in Advanced Hunting, while you can still query the table." Verify in the tenant (check C-03). |
| 1.1.9 | The XDR native table list (S6) has no Sentinel tables. Sentinel workspace tables come from the connected workspace. | S6 | High | S6 lists Defender XDR tables only, plus a pointer to streaming into Sentinel. |

### 1.2 Which workspaces can be queried (primary vs secondary)

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 1.2.1 | One primary workspace and an unlimited number of secondary workspaces per tenant. | S17 | High | "The Defender portal supports one primary workspace and an unlimited number of secondary workspaces per tenant". |
| 1.2.2 | In advanced hunting you pick a workspace (top right), or query several workspaces with `workspace()`. Results don't say which workspace a row came from. | S17 | High | "The query results don't show a workspace name or ID." |
| 1.2.3 | Custom detections and API queries work against the **primary** workspace only. | S17 | High | "Some capabilities are limited to the primary workspace: Creating custom detections, Queries via API". |
| 1.2.4 | `workspace()`, `adx()` and `arg()` have limits: `workspace()` and `adx()` aren't supported in custom detections; `arg()` and `workspace()` work only with Sentinel tables. | S21 | High | "The workspace() operator isn't supported for custom detections." / "The arg() operator only works with Microsoft Sentinel tables." |
| 1.2.5 | Defender XDR alerts and incidents sync to the primary workspace only. Secondary workspaces can still ingest Defender table data. | S17, S5 | High | "All Defender XDR alerts and incidents are synced to your primary workspace only." |
| 1.2.6 | GCC-M: queries that reference both Sentinel and Defender tables aren't supported. | S3 | High | "Queries that reference both Microsoft Sentinel and Defender tables aren't supported." Avoid `search *` and `union *` in GCC-M. |

### 1.3 Retention and query limits

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 1.3.1 | Native Defender XDR data covers 30 days. Sentinel tables follow the workspace's analytics-tier retention. | S19 | High | "Each query can look up native Defender XDR data from up to the past 30 days." |
| 1.3.2 | If Defender tables are streamed to Sentinel with retention over 30 days, advanced hunting can query the longer period. | S3 | High | "set a data retention period longer than 30 days for those tables, you can query for the longer period in advanced hunting." |
| 1.3.3 | Use the time picker rather than an in-query time filter for streamed and filtered Defender tables, to avoid incomplete results. | S3 | High | "Use the time filter dropdown instead of setting the time span in the query". |
| 1.3.4 | Prefer `Timestamp` over `TimeGenerated` for streamed Defender tables. Data arriving more than 48 hours late gets `TimeGenerated = now()`. | S3 | High | Known issue. |
| 1.3.5 | Quotas: 100,000 rows, a 10-minute timeout, a 64 MB result limit, and CPU quota per tenant on a 15-minute cycle. Log Analytics workspace limits also apply to Sentinel tables. | S19 | High | Quotas table. The query resources report shows 30 days of CPU usage (S18). |
| 1.3.6 | **Data lake access conflicts between pages.** S19 says: "Data stored exclusively in the Microsoft Sentinel data lake isn't available in advanced hunting." S3's known issues say new customers can query Analytics and Lake tier tables, but interactive queries "can access only data within the Analytics retention period." S16 (September 2026) says interactive KQL on the data lake is "now available using Advanced Hunting" for customers onboarding after 2026-09-23. | S19, S3, S16 | Medium | Treat lake access from advanced hunting as dependent on onboarding date and configuration. Verify in the tenant (section 9, G2). |
| 1.3.7 | Data held only in the lake (beyond analytics retention) should be reached with search jobs, KQL jobs or data lake exploration. | S3, S19, S59 | High | S3: use "search jobs" for data beyond analytics retention. |

### 1.4 IdentityInfo differences

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 1.4.1 | After onboarding, `IdentityInfo` exists both in advanced hunting and in the Log Analytics workspace. The advanced hunting version has unified fields, with some renamed or unsupported. | S2 | High | "Some fields available in the Microsoft Sentinel Log Analytics version are renamed or aren't supported in Advanced hunting." |
| 1.4.2 | **Only queries that run in Defender** (advanced hunting, custom detections) need review. Sentinel analytics rules and **workbooks** keep using the Log Analytics table. | S2 | High | "Microsoft Sentinel analytic rules, workbooks, and other Sentinel queries continue to use the IdentityInfo table in the Log Analytics workspace and aren't affected." |
| 1.4.3 | Unified (advanced hunting) release: "As of May 2025", for Defender-portal Sentinel customers **with UEBA enabled**. Without UEBA you get the prior advanced hunting version, without UEBA fields. | S4, S16 | High | "As of May 2025, customers of Microsoft Sentinel in the Microsoft Defender portal with UEBA enabled begin using a new release". |
| 1.4.4 | Renamed fields (Log Analytics → unified): AccountCloudSID→CloudSid; AccountCreationTime→CreatedDateTime; AccountSID→OnPremSid; AccountTenantId→TenantId; AccountUPN→AccountUpn; AdditionalMailAddresses→OtherMailAddresses; MailAddress→EmailAddress; OnPremisesAccountObjectId→OnPremObjectId; OnPremisesDistinguishedName→DistinguishedName; RiskState→RiskStatus; SAMAccountName→AccountName; SourceSystem→IdentityEnvironment; StreetAddress→Address; Type→IdentityType; UserType→TenantMembershipType. | S4 ("Compare to unified schema" tab) | High | Full table in S4. |
| 1.4.5 | Removed in the unified version: `TenantID` (not the same as the new `TenantId`), `UserState`, `UserStateChangedOn`. Fields that exist but aren't used in either version: Applications, EntityRiskScore, ExtensionProperty, InvestigationPriority, InvestigationPriorityPercentile, IsMFARegistered, IsServiceAccount, LastSeenDate, OnPremisesExtensionAttributes, RelatedAccounts, ServicePrincipals, Tags, UACFlags. | S4 | High |, |
| 1.4.6 | After the move, `IdentityInfo` is a native Defender table **without table-level RBAC**. | S2, S4 | High | "the IdentityInfo table becomes a native Defender table that doesn't support table-level role-based access control (RBAC)." |
| 1.4.7 | In Defender **Table management**, `IdentityInfo` is an "XDR" table type: you can view it, but you can't manage it there. | S59 | High | "You can view these tables, but you can't manage them from the Defender portal." Example given: `IdentityInfo`. |
| 1.4.8 | Log Analytics `IdentityInfo` defaults to 30 days retention, with a full resync every 14 days. | S4 | High | "Default retention time in the IdentityInfo table is 30 days." |

### 1.5 Functions, saved queries, hunting queries, bookmarks, custom detections

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 1.5.1 | Bookmarks aren't supported in advanced hunting. They stay under **Microsoft Sentinel > Threat management > Hunting**. Alternatives: Link to incident, incident tags, saved queries, custom hunting tables. | S3, S2, S8 | High | "Bookmarks aren't supported in the advanced hunting experience. They're supported in the Microsoft Sentinel > Threat management > Hunting feature." |
| 1.5.2 | Bookmark data stays in the `HuntingBookmark` table in the workspace. | S8 | High | "View your bookmarked data directly in the HuntingBookmark table in your Log Analytics workspace." |
| 1.5.3 | Hunting queries and hunts (preview): **Microsoft Sentinel > Threat management > Hunting** (Queries tab, Hunts tab). **View results** opens the Log Analytics search experience. | S7, S8 | High | S7 step 1 gives both portal paths. |
| 1.5.4 | Custom hunting queries and parsers are deployed as Log Analytics **saved searches**. | S61 | High | "Both parsers and hunting queries use the Saved Searches API to deploy content to Microsoft Sentinel." |
| 1.5.5 | Custom detection limits for Sentinel data: Sentinel custom functions aren't supported; analytics-tier data only (no Basic or Auxiliary); lookback of 5 minutes to 30 days. | S3, S21, S20 | High | "Custom functions that you create and save in Microsoft Sentinel aren't supported." / "The lookback period of your custom detections can range from five minutes to 30 days". |
| 1.5.6 | The pages disagree on NRT: S3's known issues say NRT isn't available for detections that include Sentinel data, but S20 lists Sentinel tables (including `SecurityAlert`, `SigninLogs`, `CommonSecurityLog`) as supporting Continuous (NRT). | S3, S20 | Medium | Treat S20 (newer, 2026-09-02) as current, and verify. |
| 1.5.7 | Guided hunting mode and "take actions" support Defender XDR data only. | S3 | High | "Guided hunting mode and take actions capabilities support Defender XDR data only." |

### 1.6 Livestream and notebooks

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 1.6.1 | **Livestream is gone.** The old livestream URL now returns the Hunting page, which says livestreams are no longer available. Replacements: KQL jobs, analytics rules, playbooks. | S8 | High | Verbatim (Microsoft's typo): "Microsoft Sentinel livestreams are longer be available." No retirement date is given. |
| 1.6.2 | Notebooks: **Microsoft Sentinel > Threat management > Notebooks**. They run on Azure Machine Learning, and need a Sentinel role plus Azure ML workspace access. | S1, S9 | High | S9: "notebooks are run on an Azure Machine Learning platform." S9 was last updated in 2024 and doesn't describe the Defender portal; navigation comes from S1. |
| 1.6.3 | Data lake notebooks (VS Code) and Microsoft Fabric notebooks are the newer analytics path. | S16, S63 | Medium | S16, September 2026: for customers onboarding after 2026-09-23, Fabric is used for notebooks and custom analytics. |

---

## 2. Content and configuration in the Defender portal

### 2.1 Navigation map (Azure portal → Defender portal)

Source: S1 Quick reference (High confidence unless noted).

| Azure portal (Sentinel) | Defender portal |
|---|---|
| Overview | Overview |
| Logs | Investigation & response > Hunting > Advanced hunting |
| News & guides | **Not available** |
| Search | Microsoft Sentinel > Search |
| Incidents | Investigation & response > Incidents & alerts > Incidents |
| Workbooks | Microsoft Sentinel > Threat management > Workbooks |
| Hunting | Microsoft Sentinel > Threat management > Hunting |
| Notebooks | Microsoft Sentinel > Threat management > Notebooks |
| Entity behavior | Assets > Identities > {user} > **Sentinel events**; Assets > Devices > {device} > **Sentinel events**; also entity pages opened from incidents and alerts |
| Threat intelligence | Threat intelligence > Intel management (**S1 wording**; S13 and S14 now describe **Threat intelligence > Overview / Intel explorer**, see 4.1) |
| MITRE ATT&CK | Microsoft Sentinel > Threat management > MITRE ATT&CK |
| Content hub | Microsoft Sentinel > Content management > Content hub |
| Repositories | Microsoft Sentinel > Content management > Repositories |
| Community | Microsoft Sentinel > Content management > Community |
| Workspace manager | **Not available** (alternatives: repositories / CI-CD, multitenant portal; S2) |
| Data connectors | Microsoft Sentinel > Configuration > Data connectors |
| Analytics | Microsoft Sentinel > Configuration > Analytics **and** Investigation and response > Hunting > Custom detection rules |
| Watchlists | Microsoft Sentinel > Configuration > Watchlists |
| Automation | Microsoft Sentinel > Configuration > Automation |
| Settings | System > Settings > Microsoft Sentinel |
| SOC optimization | **SOC optimization** (left navigation; S26) |
| Table management | Microsoft Sentinel > Configuration > **Tables** (S17), with "Table insights" (S59) |
| Primary workspace change | System > Settings > Microsoft Sentinel > **Workspaces** (S17) |
| UEBA settings | System > Settings > Microsoft Sentinel > **UEBA** tab (S23) |
| Auditing and health monitoring | System > Settings > Microsoft Sentinel > **Auditing and health monitoring** (S33) |

### 2.2 Workbooks

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 2.2.1 | Workbooks keep working as they did in the Azure portal. | S2 | High | "Azure workbooks continue to be the primary tool for data visualization and interaction in the Defender portal, functioning as they did in the Azure portal." |
| 2.2.2 | **Exceptions:** some visualizations only render in the Azure portal ("Open in Azure"), and print / Save as PDF is Azure-portal only. | S10 | High | "When working in the Defender portal, some visualizations can only be viewed in the Azure portal." / "The print and Save as PDF options are available only in the Azure portal." |
| 2.2.3 | **Multi-workspace:** the Workbooks page shows only the primary workspace's data. | S17 | High | "The Workbooks page only shows data associated with the primary workspace." |
| 2.2.4 | To visualize Defender data in workbooks, ingest those logs into Sentinel. Workbooks don't read advanced hunting's 30-day native store. | S2 | High | "To use workbooks with data from Advanced hunting, make sure that you ingest logs into Microsoft Sentinel." |
| 2.2.5 | Workbooks are Azure resources (`Microsoft.Insights/workbooks`), saved in the workspace resource group and tagged with the workspace. Access needs Workbook Reader or Workbook Contributor on the resource group. | S10, S64, S65 | High | "You must have at least Workbook reader or Workbook contributor permissions on the resource group". |
| 2.2.6 | An Azure Data Explorer data source has to be configured and authenticated from the Defender portal. | S10 | High | Prerequisites. |
| 2.2.7 | Creating and editing workbooks in the Defender portal was announced as preview in August 2025. S10 now documents Add workbook and Edit there without a preview label. | S16, S10 | Medium | Current status of the preview label is unclear. |
| 2.2.8 | Workbooks that query `ThreatIntelligenceIndicator` (legacy) need updating, because ingestion stopped on 2025-07-31. | S11, S56 | High | See 4.2. |

### 2.3 Watchlists, content hub, repositories, SOC optimization, data connectors

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 2.3.1 | Watchlists: **Microsoft Sentinel > Configuration > Watchlist(s)**. Query them with `_GetWatchlist('alias')`. List aliases with `_GetWatchlistAlias` in advanced hunting. | S27 | High | S27 step 1 gives both portal paths. |
| 2.3.2 | Watchlists refresh every 12 days, which updates `TimeGenerated`. | S27 | High | "Watchlists are refreshed in your workspace every 12 days, updating the TimeGenerated field." |
| 2.3.3 | Content hub: **Microsoft Sentinel > Content management > Content hub**. Install, update and delete need Microsoft Sentinel Contributor at resource group level. Search returns at most 50 items. | S60 | High | "Results are limited to 50 items". |
| 2.3.4 | Repositories: **Microsoft Sentinel > Content management > Repositories** (GA, March 2026). Content types include analytics rules, automation rules, custom detection rules (preview), hunting queries, parsers, playbooks and workbooks. Creating a connection needs **Owner** on the resource group. | S61, S16 | High | "You have an Owner role in the resource group that contains your Microsoft Sentinel workspace." |
| 2.3.5 | Repositories API versions: older versions retired in June 2026. Use **2025-09-01**, **2025-06-01** or **2025-07-01-preview**. | S16 | High | The dates are inconsistent inside S16: the heading says "before June 15, 2026", the body says "retired on June 1, 2026". |
| 2.3.6 | Workspace Manager isn't available in the Defender portal. Use repositories or CI-CD, or the multitenant portal, instead. | S2, S1 | High | "Microsoft Sentinel's Workspace Manager isn't available in the Defender portal". |
| 2.3.7 | SOC optimization: in the Defender portal, select **SOC optimization**. Recommendations are recalculated every 24 hours and aggregated across workspaces. The Defender portal shows more metrics (for example threat-based coverage). | S26, S17 | High | "SOC optimization recommendations are calculated every 24 hours." / S17: "Data and recommendations are aggregated from multiple workspaces." |
| 2.3.8 | Data connectors page: these connectors **aren't shown** after onboarding: Defender for Cloud Apps, Defender for Endpoint, Defender for Identity, Defender for Office 365 (Preview), Defender XDR, subscription-based MDC (Legacy), tenant-based MDC (Preview). They still show in the Azure portal. | S2 | High | "aren't shown in the Data connectors page in the Defender portal". |
| 2.3.9 | In multi-workspace setups, standalone Microsoft-product alert connectors (MDO, Entra ID Protection, MDA, MDE, MDI) are auto-disconnected in **secondary** workspaces during onboarding. | S2, S5, S17 | High | Queries, rules and workbooks that rely on those alerts in secondary workspaces "no longer function as expected" (S5). |
| 2.3.10 | After the switch to the XDR connector, the alert schema changes: CompromisedEntity, `ExtendedProperties` mappings, MDI `resourceAccessEvents`. MDC informational alerts and Entra ID alerts below High aren't ingested by default. | S5 | High | Review workbooks and queries over `SecurityAlert`. |

### 2.4 Data tiers, search jobs, restore, summary rules

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 2.4.1 | Two tiers: Analytics, and Data Lake (up to 12 years). XDR default tier is 30 days. Supported XDR tables can be extended in the analytics tier to 90 days with no extra storage cost. | S59 | High | Tier comparison table in S59. |
| 2.4.2 | Lake-tier limits: no restore, and limited analytics rules, hunting queries, parsers, watchlists, workbooks and playbooks. Search jobs and summary rules work on both tiers. | S59 | High | "Limitations on some features, including analytics rules, hunting queries, parsers, watchlists, workbooks, and playbooks." |
| 2.4.3 | Search jobs and restore run from **Microsoft Sentinel > Search**. Results land in `_SRCH` and `_RST` tables. | S1, S62 | High |, |
| 2.4.4 | Existing customers who haven't onboarded to the lake move from archive-based to lake-based total retention when they onboard to Sentinel. | S16 | Medium | Wording from the September 2026 entry. |
| 2.4.5 | Basic Logs tables can be viewed in Defender Table management, but managed only in Log Analytics. | S59 | High |, |
| 2.4.6 | Table insights (Defender portal) shows "Last data received" per table. It is a visualization surface, not a billing-grade or alerting source. | S59 | High | "Table insights is a visualization surface for investigation. It isn't a billing-grade or alerting surface." |

---

## 3. UEBA and entity pages in the Defender portal

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 3.1 | Most UEBA features stay the same. Two exceptions: adding entities to TI (Azure portal only) and the `IdentityInfo` schema. | S2 | High | "Most functionalities of User and Entity Behavior Analytics (UEBA) remain the same in the Defender portal". |
| 3.2 | User, device and IP entity pages are consolidated, with Sentinel and Defender XDR data in one view. Sentinel timeline and insights appear on the **Sentinel events** tab. | S2, S22, S1 | High | S22: "the timeline and insights panels appear in the Sentinel events tab of the Defender entity page." S1: "Entity pages combine Sentinel and Defender data". |
| 3.3 | In multi-workspace setups, entity pages aggregate alerts, incidents and timeline events across workspaces, with a workspace filter. | S17 | High |, |
| 3.4 | Entity insight links open **Advanced hunting** in the Defender portal, and **Logs** in the Azure portal. | S22 | High |, |
| 3.5 | IoT device entity pages are still Azure-portal only. | S22 | High | "IoT device (Preview), only in Microsoft Sentinel in the Azure portal for now." |
| 3.6 | UEBA settings: **System > Settings > Microsoft Sentinel > UEBA** tab. Anomalies: **Settings > Microsoft Sentinel > SIEM workspaces > {workspace} > Anomalies**. | S23 | High | S23 steps. |
| 3.7 | Some UEBA data sources can be enabled **only from the Defender portal**: AAD managed identity and service principal sign-ins, AWS CloudTrail, GuardDuty, CommonSecurityLog (Check Point, Fortinet, Zscaler), Device Logon Events, Okta, GCP Audit Logs. | S23 | High | "You can enable these data sources from the Defender portal only". |
| 3.8 | UEBA experiences in the Defender portal: home page widget, "Top UEBA anomalies" on user pages, "Go hunt" from incident graphs, and an advanced hunting prompt to join `Anomalies`. | S24, S16 | High |, |
| 3.9 | UEBA tables: `IdentityInfo`, `BehaviorAnalytics`, `UserPeerAnalytics`, `Anomalies`. The behaviors layer adds `SentinelBehaviorInfo` and `SentinelBehaviorEntities` when enabled. The advanced hunting schema also lists `BehaviorInfo` and `BehaviorEntities` (preview). | S24, S6, S16 | Medium | Two naming pairs exist (Sentinel* in Log Analytics, and the advanced hunting names). Confirm in the tenant. |
| 3.10 | Enabling UEBA needs Entra Security Administrator plus an Azure role (Owner, Contributor, or Sentinel Contributor with Log Analytics Contributor), and no resource locks. UEBA has no license cost, but storage is charged. | S23, S24 | High |, |

---

## 4. Threat intelligence

### 4.1 Where TI management is in the Defender portal

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 4.1.1 | The Sentinel transition pages still say TI is under **Threat intelligence > Intel management**. | S1, S2 | High (as stated) | S2: "the familiar threat intelligence features are retained in the Defender portal under Intel management". |
| 4.1.2 | **Newer Defender XDR pages (August and September 2026)** say Threat intelligence now has **Overview** and **Intel explorer**. Creating STIX objects, ingestion rules, relationships, tags, edits and TAXII export are all done in **Threat intelligence > Intel explorer**. | S14, S13, S12 | High | S14: "brings threat intelligence capabilities into two primary pages: Overview and Intel explorer." S14 addresses users who "previously used Threat Analytics, Intel management". |
| 4.1.3 | The legacy standalone MDTI portal and the legacy Intel Explorer were retired on **2026-08-01**. | S13 | High | "The legacy standalone Microsoft Threat Intelligence portal and legacy Intel Explorer experience were retired on August 1, 2026." |
| 4.1.4 | Intel projects are deprecated. Link indicators to a case instead. | S2 | High | "Deprecated. To organize and investigate threat indicators, link indicators to a case." |
| 4.1.5 | Adding an entity to TI from incidents is **Azure portal only**. In the Defender portal, analysts can still create indicators manually in Intel explorer. | S2, S13 | High | S2: "Adding entities to threat intelligence from incidents is supported only in the Azure portal." What happens after 2027-03-31 isn't documented (section 9, G6). |
| 4.1.6 | Managing Sentinel TI in Intel explorer needs Microsoft Sentinel Contributor or higher. | S13 | High |, |

### 4.2 TI tables

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 4.2.1 | `ThreatIntelIndicators` and `ThreatIntelObjects` (STIX) were previewed on 2025-04-03. Ingestion to the legacy `ThreatIntelligenceIndicator` **stopped after 2025-07-31**. | S11, S56, S16 | High | "After this date, Microsoft Sentinel will stop ingesting data to the legacy ThreatIntelligenceIndicator table." |
| 4.2.2 | `ThreatIntelIndicators` can be queried from Logs (Azure portal) or Advanced hunting (Defender portal), under the Sentinel schema. | S11 | High | "the ThreatIntelIndicators table under the Microsoft Sentinel schema stores all your Microsoft Sentinel threat indicators." |
| 4.2.3 | In the Defender portal, use `ThreatIntelObjects` and `ThreatIntelIndicators` for hunting, incident response, Copilot and reporting. | S2 | High |, |
| 4.2.4 | All TI is republished every 7-10 days (`LastUpdateMethod == "LogARepublisher"`). Deduplicate on `Id` with `arg_max(TimeGenerated, *)`. Republishing is billed as ingestion. | S56, S11 | High | "Now, all data is republished every 7-10 days." |
| 4.2.5 | `ThreatIntelIndicators` key columns: Id, IsActive, IsDeleted, ObservableKey, ObservableValue, Pattern, Confidence, ValidFrom, ValidUntil, Data, Tags, LastUpdateMethod, Revoked. The table supports Basic plan; it doesn't support Auxiliary/Lake. | S55 | High | Table attributes in S55. |
| 4.2.6 | Microsoft gives a legacy-to-new migration query (rebuilding legacy columns from ObservableKey/Value). | S56 | High | Use it for rewrites; it's referenced in section 8. |
| 4.2.7 | The TI Platform (tiIndicators) connector is being deprecated in favour of the upload API. | S11 | High | "This data connector is being deprecated." |

### 4.3 MDTI licensing and convergence

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 4.3.1 | MDTI reached end of life on **2026-08-01**. The standalone SKU is retired, and all MDTI capabilities are available at no extra cost to Defender or Sentinel customers. | S15 | High | "All MDTI capabilities are now available at no extra cost through the Microsoft Defender portal to any customer with Microsoft Defender or Microsoft Sentinel." |
| 4.3.2 | Public Microsoft TI data is free for Defender XDR customers (Intel explorer prerequisites). | S13 | High | "Publicly available Microsoft Threat Intelligence data is available to Microsoft Defender XDR customers at no additional cost." |
| 4.3.3 | **Outdated wording still on the Sentinel transition page:** Intel Profiles and Intel Explorer are listed as "Supported for Microsoft Defender Threat Intelligence customers". | S2 (2026-09-10) | Medium | Conflicts with S15 and S13 (section 9, G5). |
| 4.3.4 | S11 still describes standard and premium Defender TI data connectors, plus a premium licence link. The REST API still has `MicrosoftThreatIntelligence` and `PremiumMicrosoftDefenderForThreatIntelligence` connector kinds. | S11, S43 | Medium | How the premium connector is licensed after 2026-08-01 isn't stated on a fetched page. |
| 4.3.5 | Security Copilot features (incident summaries, agents) are part of the Defender portal. S1 links "Included capacity for E5/E7 customers". | S1, S12 | High | Licensing detail is outside this note's scope. |

---

## 5. SOC optimization, Security Copilot and other platform items

| # | Claim | Source | Confidence | Quote / detail |
|---|---|---|---|---|
| 5.1 | SOC optimization is in the Defender portal, with an API and a recommendation reference. | S1, S26 | High | S1 row "SOC optimization". |
| 5.2 | Native Security Copilot in the Defender portal: incident summary, guided response, script and file analysis, incident reports, agents, and KQL generation in advanced hunting. | S1 | High | S1 row "AI-assisted SOC (Security Copilot)". Some Sentinel tables aren't yet supported by Copilot in advanced hunting (S3). |
| 5.3 | In the Defender portal, Defender XDR policies govern data storage, processing, retention and sharing, even for Sentinel data. | S2 | High |, |
| 5.4 | Sentinel in the Azure portal is supported until 2027-03-31. | S1, S16 | High | Dates moved from "July 2026" (S16, July 2025 entry) to "March 31, 2027" (S16, January 2026 entry). |

---

## 6. Other content and data changes relevant to the move

- Analytics rule incident creation must stay enabled: alerts from alert-only rules aren't visible in the Defender portal (S2). This affects how complete any SecurityAlert-based inventory is.
- After onboarding, `SecurityIncident` no longer has the `Description` field, and `ProviderName` is "Microsoft XDR" for all incidents (S2).
- CMK: alerts and incidents are no longer CMK-encrypted after onboarding. Data lake data uses Microsoft-managed keys (S2).
- "Similar incidents (Preview)" isn't supported in the Defender portal (S2).

---

## 7. Inventory approach: what to use for what

| Inventory object | Best source | Why |
|---|---|---|
| Tables and ingestion volume | `Usage` table (KQL), plus Defender **Table insights** (UI) | Hourly per-table usage. `union *` is expensive (S30, S31). |
| Last data per table | `Usage` (cheap, hour granularity) or `union withsource` (expensive, exact) |, |
| Analytics rules | SecurityInsights REST `alertRules` (stable 2025-09-01; preview for full `kind` coverage) or the UI export (preview) | ARG doesn't list `microsoft.securityinsights` types (S53). |
| Automation rules | REST `automationRules`, or the UI export |, |
| Watchlists | REST `watchlists`, `_GetWatchlistAlias`, `Watchlist` table | **No `Get-AzSentinelWatchlist` cmdlet** exists in Az.SecurityInsights (S44). |
| Data connectors | REST `dataConnectors` (incomplete; see caveats) plus `Usage` plus `SentinelHealth` | The stable API enumerates only 11 kinds (S43). |
| Playbooks | ARG `microsoft.logic/workflows`, plus `microsoft.web/connections` | Both are listed in ARG `resources` (S53). |
| Workbooks | ARG `microsoft.insights/workbooks`; REST Workbooks with `canFetchContent=true` to scan content |, |
| Hunting queries, parsers, functions | Log Analytics REST `savedSearches` (2026-03-01) | Hunting queries and parsers are saved searches (S61, S67). |
| Health and audit | `_SentinelHealth()` and `_SentinelAudit()` (needs health monitoring enabled) |, |
| TI | `ThreatIntelIndicators`, `ThreatIntelObjects`, legacy `ThreatIntelligenceIndicator` |, |

---

## 8. Validated inventory snippets

Conventions:
- **Status: Verbatim** means copied exactly from the cited Microsoft page.
- **Status: Composed** means written for this project using only documented syntax, tables and columns. Not published by Microsoft, and not run in a tenant.
- "LA Logs" means the Log Analytics **Logs** blade of the Sentinel workspace (Azure portal > Log Analytics workspace > Logs). After 2027-03-31 the Sentinel blade in the Azure portal goes away, but the Log Analytics workspace Logs blade isn't covered by that retirement notice. This is an inference, not a stated fact.
- "AH" means Defender portal **Investigation & response > Hunting > Advanced hunting**, with the right workspace selected (S17).
- All KQL below is read-only. KQL queries never change data, though queries over billable tables can incur query cost on lake or basic tiers (S59).

### 8.1 KQL: ingestion and table inventory

#### INV-K01: billable volume by table, last N days

Status: Composed, from the S30 Usage pattern and S29 columns.

```kusto
// Billable ingestion per table over the last N full days.
// Usage.Quantity is in MB (S29); divide by 1000 for GB as Microsoft's samples do (S30).
let lookbackDays = 30;
Usage
| where TimeGenerated > ago(1d * (lookbackDays + 1))
| where StartTime >= startofday(ago(1d * lookbackDays)) and EndTime < startofday(now())
| where IsBillable == true
| summarize BillableGB = round(sum(Quantity) / 1000., 3),
            LastHourWithData = max(EndTime),
            Solutions = make_set(Solution),
            Plans = make_set(Plan)
          by DataType
| order by BillableGB desc
```

- **Run in:** LA Logs (preferred), or AH with the workspace selected. Whether `Usage` shows in AH isn't documented (G1).
- **Permissions:** Log Analytics Reader or Microsoft Sentinel Reader on the workspace (S64).
- **Read-only:** yes.
- **Cost and performance:** cheap. `Usage` is an hourly aggregate. Microsoft recommends it over `find` and `union` scans (S30).
- **Output:** DataType, BillableGB, LastHourWithData, Solutions, Plans.
- **Caveats:**
  - `Plan` was added "in mid-May 2026"; earlier rows have it empty (S30).
  - Tables with no ingestion in the window don't appear.
  - The retention of `Usage` itself limits how far back you can look. Check the table's retention.
  - The `TimeGenerated` clause is there because "StartTime and EndTime represent the time buckets" (S30).

#### INV-K01b: billable volume by solution and type over the past month

Status: Verbatim (S30).

```kusto
Usage 
| where TimeGenerated > ago(32d)
| where StartTime >= startofday(ago(31d)) and EndTime < startofday(now())
| where IsBillable == true
| summarize BillableDataGB = sum(Quantity) / 1000 by Solution, DataType
| sort by Solution asc, DataType asc
```

#### INV-K02: every table with any ingestion, and when it last received data (cheap)

Status: Composed (S29 columns).

```kusto
Usage
| where TimeGenerated > ago(90d)
| summarize TotalGB = round(sum(Quantity) / 1000., 3),
            BillableGB = round(sumif(Quantity, IsBillable == true) / 1000., 3),
            LastHourWithData = max(EndTime)
          by DataType
| extend DaysSinceLastData = datetime_diff('day', now(), LastHourWithData)
| order by DaysSinceLastData desc
```

- **Run in / permissions / read-only:** same as INV-K01.
- **Output:** DataType, TotalGB, BillableGB, LastHourWithData, DaysSinceLastData.
- **Caveats:**
  - Hour granularity only.
  - Non-billable tables appear with BillableGB = 0.
  - "Stale" thresholds are the tool's choice.

#### INV-K03: exact last record per table (expensive)

Status: Composed from the documented `union withsource` syntax (S31). Microsoft's sample workbook body (S65/S66 sample response) uses `union withsource=TableName * | summarize Count=count() by TableName`.

```kusto
union withsource = TableName *
| where TimeGenerated > ago(7d)
| summarize LastRecord = max(TimeGenerated), Rows = count() by TableName
| order by LastRecord desc
```

- **Run in:** **LA Logs only.** In AH, `*` also pulls in Defender XDR tables; in GCC-M, mixed Sentinel and Defender queries "aren't supported" (S3).
- **Permissions:** Log Analytics Reader or Microsoft Sentinel Reader.
- **Read-only:** yes.
- **Cost and performance:** high.
  - S31: "Whenever the list of tables is known, refrain from using wildcards."
  - S30 warns cross-table scans are "resource intensive".
  - Keep the window short (1-7 days). For larger workspaces, run it per table list taken from INV-K02.
- **Output:** TableName, LastRecord, Rows.
- **Caveats:**
  - `union` doesn't include functions (S31).
  - Behaviour against Basic, Auxiliary and Lake tables isn't documented here. Don't rely on this for non-analytics tiers.
  - Use the Defender **Table insights** "Last data received" signal as a cross-check (S59).

### 8.2 KQL: alerts and incidents

#### INV-K04: SecurityAlert by product and provider

Status: Composed (S57 columns).

```kusto
SecurityAlert
| where TimeGenerated > ago(90d)
| summarize Rows = count(),
            UniqueAlerts = dcount(SystemAlertId),
            DistinctAlertNames = dcount(AlertName),
            FirstSeen = min(TimeGenerated),
            LastSeen = max(TimeGenerated)
          by ProductName, ProviderName, VendorName
| order by UniqueAlerts desc
```

- **Run in:** LA Logs, or AH (queryable per S20 and S59; schema-pane visibility unverified, see 1.1.8).
- **Permissions:** Microsoft Sentinel Reader.
- **Read-only:** yes. **Cost:** moderate. Narrow the window for large tenants.
- **Output:** ProductName, ProviderName, VendorName, Rows, UniqueAlerts, DistinctAlertNames, FirstSeen, LastSeen.
- **Caveats:**
  - `UniqueAlerts` uses `dcount(SystemAlertId)` because a `SecurityAlert` row count may include more than one record per alert. This is a cautious assumption, not a documented fact.
  - Product and provider values change when alerts move to the XDR connector (S5). Capture this before onboarding to get a baseline.
  - Alerts from rules with incident creation off won't be visible in the Defender UI after onboarding (S2).

#### INV-K05: SecurityIncident by provider

Status: Composed (S58 columns; status values from S41 `IncidentStatus`: New, Active, Closed).

```kusto
SecurityIncident
| where TimeGenerated > ago(90d)
| summarize arg_max(TimeGenerated, *) by IncidentName
| summarize Incidents = count(),
            NotClosed = countif(Status != "Closed"),
            LastCreated = max(CreatedTime)
          by ProviderName
| order by Incidents desc
```

- **Run in:** LA Logs or AH. **Permissions:** Microsoft Sentinel Reader. **Read-only:** yes.
- **Output:** ProviderName, Incidents, NotClosed, LastCreated.
- **Caveats:**
  - `arg_max` keeps the latest record per incident. This assumes several rows per incident (one per update), which is common but not stated on S58.
  - After onboarding, "all incidents have Microsoft XDR as the incident provider" (S2), so a pre-onboarding baseline is more informative.
  - `Description` isn't populated after onboarding (S2).

#### INV-K06: analytics rules that actually produced incidents

Status: Composed (S58 `RelatedAnalyticRuleIds`).

```kusto
SecurityIncident
| where TimeGenerated > ago(90d)
| summarize arg_max(TimeGenerated, *) by IncidentName
| mv-expand RuleId = RelatedAnalyticRuleIds to typeof(string)
| summarize Incidents = count(), LastIncident = max(CreatedTime) by RuleId
| order by Incidents desc
```

- **Use:** join (outside KQL) with the REST `alertRules` `id` (INV-R01) to find enabled rules that never fire, and rules that fire most.
- **Caveat:** Microsoft-product incident-creation rules are deactivated at onboarding (S2), so their IDs disappear afterwards.

### 8.3 KQL: health and audit

Prerequisite: health and audit monitoring must be on. Enable it at **System > Settings > Microsoft Sentinel > Auditing and health monitoring > Enable** (Defender portal), or **Configuration > Settings > Settings** (Azure portal) (S33).
- "The SentinelHealth and SentinelAudit data tables are created at the first event generated for the selected resources." (S33)
- `SentinelHealth` isn't billable. `SentinelAudit` is billable (S32).
- Health covers analytics rules, data connectors, automation rules and playbooks (S33).
- Audit covers only analytics rules: "Only the analytics rule resource type is currently supported for auditing." (S33)
- Data connector health covers only some connectors (S37): AWS (CloudTrail and S3), Dynamics 365, Office 365, MDE, TI-TAXII, TI Platforms, and CCF-based connectors.

#### INV-K07: verify the tables are populated

Status: Verbatim (S33).

```kusto
_SentinelHealth()
 | take 20
```

```kusto
_SentinelAudit()
 | take 20
```

#### INV-K08: health overview across resource types

Status: Composed (S34 columns).

```kusto
// First check the exact SentinelResourceType values in your tenant (documentation casing differs; see caveat)
_SentinelHealth()
| where TimeGenerated > ago(14d)
| distinct SentinelResourceType, OperationName
```

```kusto
_SentinelHealth()
| where TimeGenerated > ago(14d)
| summarize Events = count(),
            Failures = countif(Status == "Failure"),
            PartialSuccess = countif(Status == "Partial success"),
            LastEvent = max(TimeGenerated)
          by SentinelResourceType, SentinelResourceKind, SentinelResourceName
| order by Failures desc, SentinelResourceType asc
```

- **Run in:** LA Logs or AH (S33 lists both). **Permissions:** Microsoft Sentinel Reader. **Read-only:** yes. **Cost:** low.
- **Caveat on casing:**
  - The schema page lists `SentinelResourceType` values as `Analytics rule`, `Automation rule`, `Playbook`, `Data connector` (S34).
  - Microsoft's sample queries filter on `"Analytics Rule"` for SentinelHealth (S36) and `"Analytic Rule"` for SentinelAudit (S36).
  - KQL `==` is case-sensitive. Use `=~` or the `distinct` query first.
- Statuses: Success, Partial success, Failure, Informational (S34, S38).

#### INV-K09: analytics rule health samples

Status: Verbatim (S36).

```kusto
_SentinelHealth()
| where SentinelResourceType == "Analytics Rule"
| where Reason == "The analytics rule is disabled and was not executed."
```

```kusto
_SentinelHealth()
| where SentinelResourceType == "Analytics Rule"
| summarize Occurrence=count(), Unique_rule=dcount(SentinelResourceId) by Status, Reason
```

#### INV-K10: data connector latest failures

Status: Verbatim (S37).

```kusto
SentinelHealth
| where TimeGenerated > ago(3d)
| where OperationName == 'Data fetch status change'
| where Status in ('Success', 'Failure')
| summarize TimeGenerated = arg_max(TimeGenerated,*) by SentinelResourceName, SentinelResourceId
| where Status == 'Failure'
```

#### INV-K11: automation rule runs, and automation rule to playbook correlation

Status: Verbatim (S38).

```kusto
SentinelHealth
| where OperationName == "Automation rule run"
```

```kusto
SentinelHealth 
| where SentinelResourceType == "Automation rule"
| mv-expand TriggeredPlaybooks = ExtendedProperties.TriggeredPlaybooks
| extend runId = tostring(TriggeredPlaybooks.RunId)
| join (AzureDiagnostics 
    | where OperationName == "Microsoft.Logic/workflows/workflowRunCompleted"
    | project
        resource_runId_s,
        playbookName = resource_workflowName_s,
        playbookRunStatus = status_s)
    on $left.runId == $right.resource_runId_s
| project
    RecordId,
    TimeGenerated,
    AutomationRuleName= SentinelResourceName,
    AutomationRuleStatus = Status,
    Description,
    workflowRunId = runId,
    playbookName,
    playbookRunStatus
```

- **Caveat:** the second query needs Logic Apps diagnostics sent to the workspace (S38).

#### INV-K12: analytics rule change audit

Status: Verbatim (S36).

```kusto
_SentinelAudit()
| where SentinelResourceType =="Analytic Rule"
| summarize Count= count() by RuleName=SentinelResourceName, Activity=Description
```

```kusto
_SentinelAudit()
| where SentinelResourceType =="Analytic Rule"
| extend Caller= tostring(ExtendedProperties.CallerName)
| summarize Count = count() by Caller, Activity=Description
```

### 8.4 KQL: watchlists

#### INV-K13: list aliases, and read one watchlist

Status: Verbatim (S27).

```kusto
_GetWatchlistAlias
```

```kusto
_GetWatchlist('mywatchlist')
```

- **Run in:** LA Logs or AH (S27 gives AH as the Defender-portal location). **Permissions:** Microsoft Sentinel Reader.

#### INV-K14: Watchlist table summary

Status: Composed (S28 columns).

```kusto
// Watchlists refresh every 12 days (S27), so use a lookback of at least 12 days.
Watchlist
| where TimeGenerated > ago(14d)
| summarize Rows = count(), LastRefresh = max(TimeGenerated)
          by WatchlistAlias, WatchlistName, _DTItemType
| order by WatchlistAlias asc
```

- **Output:** WatchlistAlias, WatchlistName, _DTItemType, Rows, LastRefresh.
- **Caveats:**
  - The exact `_DTItemType` values aren't listed on S28. Inspect them.
  - Deleted items are signalled by `_DTItemStatus`.
  - Treat the REST list (INV-R03) as authoritative for which watchlists exist.

### 8.5 KQL: threat intelligence

#### INV-K15: current TI objects (deduplicated)

Status: Composed (S55 columns; dedupe pattern from S56 samples).

```kusto
let window = 14d;  // all TI is republished every 7-10 days (S56)
let indicators = ThreatIntelIndicators
    | where TimeGenerated > ago(window)
    | summarize arg_max(TimeGenerated, *) by Id
    | where IsDeleted == false
    | summarize Objects = count(), Active = countif(IsActive == true), LastIngest = max(TimeGenerated)
    | extend Table = "ThreatIntelIndicators", StixType = "indicator";
let objects = ThreatIntelObjects
    | where TimeGenerated > ago(window)
    | summarize arg_max(TimeGenerated, *) by Id
    | where IsDeleted == false
    | summarize Objects = count(), LastIngest = max(TimeGenerated) by StixType
    | extend Table = "ThreatIntelObjects";
union indicators, objects
| project Table, StixType, Objects, Active, LastIngest
```

- **Run in:** LA Logs or AH. **Permissions:** Microsoft Sentinel Reader. **Read-only:** yes. **Cost:** moderate (scans 14 days of TI).
- **Caveats:**
  - The 14-day window relies on the republishing cadence in S56. Expired indicators may stop being republished, which is the desired effect.
  - `ThreatIntelObjects` columns are used here as in Microsoft's own sample: `Id`, `StixType`, `IsDeleted`, `Data` (S56). Its schema page wasn't fetched.

#### INV-K16: indicators by feed source

Status: Composed. The feed-source decode is verbatim from S56.

```kusto
ThreatIntelIndicators
| where TimeGenerated > ago(14d)
| summarize arg_max(TimeGenerated, *) by Id
| where IsDeleted == false
| extend FeedSource = base64_decode_tostring(tostring(split(Id, '---')[0]))
| summarize Indicators = count(), Active = countif(IsActive == true) by FeedSource, ObservableKey
| order by Indicators desc
```

#### INV-K17: legacy TI table freshness

Status: Composed.

```kusto
ThreatIntelligenceIndicator
| summarize Rows = count(), LastIngest = max(TimeGenerated)
```

- **Expected:** `LastIngest` no later than about 2025-07-31 (S11). The query fails if the table never existed in the workspace.
- **Real check:** scan rule, workbook and saved-search content for the string `ThreatIntelligenceIndicator` (C-07).

### 8.6 KQL: UEBA presence

#### INV-K18: UEBA tables with ingestion

Status: Composed.

```kusto
Usage
| where TimeGenerated > ago(30d)
| where DataType in ("IdentityInfo", "BehaviorAnalytics", "UserPeerAnalytics", "Anomalies", "SentinelBehaviorInfo", "SentinelBehaviorEntities")
| summarize GB = round(sum(Quantity) / 1000., 3), LastHourWithData = max(EndTime) by DataType
```

- **Interpretation:**
  - `IdentityInfo` and `BehaviorAnalytics` ingestion suggests UEBA is on.
  - The `SentinelBehavior*` tables exist only if the behaviors layer is on (S24).
- **Caveat:** run in LA Logs to see the Log Analytics `IdentityInfo`. In AH, `IdentityInfo` is the Defender (unified or prior) version (S4).

### 8.7 REST API (read-only GET) with `az rest` and `Invoke-AzRestMethod`

**API version.**
- `2025-09-01` is "the current generally available (GA) release". `2025-07-01-preview` is "the current Preview release" (S39).
- In **2025-09-01**, `AlertRuleKind` lists only `Scheduled`, `MicrosoftSecurityIncidentCreation` and `Fusion` (S40).
- The **2025-07-01-preview** enum adds `MLBehaviorAnalytics`, `ThreatIntelligence` and `NRT` (S40, preview view).
- Whether the stable version returns NRT rules isn't documented (G8). The tool should run the list with **both** versions and compare counts.

**Permissions.**
- Microsoft Sentinel Reader at the resource group (recommended scope, S64) is enough to read rules, automation rules, watchlists and connectors.
- If roles are assigned at workspace scope instead, they must also be assigned on the SecurityInsights solution resource (S64).

**Where to run.** Azure Cloud Shell or a local CLI or PowerShell session signed in to the tenant. `az rest` authenticates automatically for ARM URLs (S50).

**Paging.**
- List responses carry `nextLink` (S40-S42).
- `Invoke-AzRestMethod -Paginate` follows `nextLink` (S68).
- No auto-paging switch is documented for `az rest`, so follow `nextLink` manually.

#### INV-R01 to R04: Bash (Azure CLI)

Status: Composed. URL templates are verbatim from S40-S43. `az rest` syntax is from S50.

```bash
SUB="<subscriptionId>"; RG="<resourceGroupName>"; WS="<workspaceName>"
API="2025-09-01"            # stable (S39); repeat R01 with API="2025-07-01-preview" to capture NRT/ML/TI kinds
BASE="https://management.azure.com/subscriptions/$SUB/resourceGroups/$RG/providers/Microsoft.OperationalInsights/workspaces/$WS/providers/Microsoft.SecurityInsights"

# R01 analytics rules
az rest --method get --url "$BASE/alertRules?api-version=$API" \
  --query "value[].{name:name, kind:kind, displayName:properties.displayName, enabled:properties.enabled, severity:properties.severity, template:properties.alertRuleTemplateName, modified:properties.lastModifiedUtc}" -o table

# R02 automation rules
az rest --method get --url "$BASE/automationRules?api-version=$API" \
  --query "value[].{name:name, displayName:properties.displayName, order:properties.order, enabled:properties.triggeringLogic.isEnabled, triggersOn:properties.triggeringLogic.triggersOn, triggersWhen:properties.triggeringLogic.triggersWhen}" -o table

# R03 watchlists (metadata only, no items)
az rest --method get --url "$BASE/watchlists?api-version=$API" \
  --query "value[].{alias:properties.watchlistAlias, displayName:properties.displayName, provider:properties.provider, source:properties.source, searchKey:properties.itemsSearchKey, updated:properties.updated}" -o table

# R04 data connectors
az rest --method get --url "$BASE/dataConnectors?api-version=$API" \
  --query "value[].{name:name, kind:kind}" -o table
```

- **Read-only:** yes (GET only). **Cost:** none, but subject to ARM read throttling.
- **Output columns:** taken from the documented response properties (S40-S43): `properties.displayName`, `enabled`, `severity`, `alertRuleTemplateName`, `lastModifiedUtc`; automation `order`, `triggeringLogic.*`; watchlist `watchlistAlias`, `itemsSearchKey`, `provider`, `source`, `updated`; connector `kind`.
- **Caveats:**
  - For full fidelity, store the raw JSON (drop `--query` and `-o table`). For example, `properties.query` is needed for content scans.
  - Data connectors: the stable `DataConnectorKind` enum has 11 values (AzureActiveDirectory, AzureSecurityCenter, MicrosoftCloudAppSecurity, ThreatIntelligence, Office365, AmazonWebServicesCloudTrail, AzureAdvancedThreatProtection, MicrosoftDefenderAdvancedThreatProtection, MicrosoftThreatIntelligence, PremiumMicrosoftDefenderForThreatIntelligence, RestApiPoller) (S43).
  - The preview sample also shows kinds such as `GenericUI`, `APIPolling`, `OfficeATP`, `Dynamics365` and `PurviewAudit` (S43, preview view).
  - Don't treat this list as a complete connector inventory. Cross-check it with `Usage` (INV-K02), SentinelHealth (INV-K10), and DCRs in ARG (INV-G03). That AMA/DCR-based connectors are missing from this API is likely but **not documented** (G9).
  - In PowerShell, quoting for `--query` differs (S50 links quoting guidance).

#### INV-R05: hunting queries, parsers and functions (Log Analytics saved searches)

Status: Composed (URL template from S67).

```bash
az rest --method get \
  --url "https://management.azure.com/subscriptions/$SUB/resourceGroups/$RG/providers/Microsoft.OperationalInsights/workspaces/$WS/savedSearches?api-version=2026-03-01" \
  --query "value[].{name:name, category:properties.category, displayName:properties.displayName, functionAlias:properties.functionAlias}" -o table
```

- **Caveat:** the category value Sentinel uses for hunting queries isn't documented on S67. Group by `category` and inspect.

#### INV-R06: PowerShell equivalent with paging

Status: Composed (Invoke-AzRestMethod `-Path`, `-Method`, `-Paginate` from S68).

```powershell
$sub = '<subscriptionId>'; $rg = '<resourceGroupName>'; $ws = '<workspaceName>'; $api = '2025-09-01'
$base = "/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.OperationalInsights/workspaces/$ws/providers/Microsoft.SecurityInsights"
foreach ($t in 'alertRules','automationRules','watchlists','dataConnectors') {
    $r = Invoke-AzRestMethod -Path "$base/$($t)?api-version=$api" -Method GET -Paginate
    "$t : HTTP $($r.StatusCode)"
    ($r.Content | ConvertFrom-Json).value | Select-Object name, kind, @{n='displayName';e={$_.properties.displayName}}
}
```

- **Caveat:** with `-Paginate`, check whether `Content` contains the merged `value` array, as in S68 Example 7, before parsing.

### 8.8 PowerShell Az.SecurityInsights

Source: S44-S47, module docs for **azps-16.4.0**, dated 2026-10-01.

Relevant read cmdlets that exist:
- `Get-AzSentinelAlertRule`
- `Get-AzSentinelAlertRuleTemplate`
- `Get-AzSentinelAutomationRule`
- `Get-AzSentinelBookmark`
- `Get-AzSentinelDataConnector`
- `Get-AzSentinelIncident`
- `Get-AzSentinelMetadata`
- `Get-AzSentinelOnboardingState`
- `Get-AzSentinelSetting`
- `Get-AzSentinelThreatIntelligenceIndicator`
- `Get-AzSentinelThreatIntelligenceIndicatorMetric`
- `Invoke-AzSentinelThreatIntelligenceIndicatorQuery`

The module has **no watchlist, hunt, source-control or workspace-manager cmdlets** (S44). Use REST for those (INV-R03, INV-R06).

Status: Verbatim parameter usage (S45-S47 examples).

```powershell
Get-AzSentinelAlertRule -ResourceGroupName "myResourceGroupName" -workspaceName "myWorkspaceName"
Get-AzSentinelAutomationRule -ResourceGroupName "myResourceGroupName" -workspaceName "myWorkspaceName"
Get-AzSentinelDataConnector -ResourceGroupName "myResourceGroupName" -workspaceName "myWorkspaceName"
```

- **Parameters:** List set = `-ResourceGroupName`, `-WorkspaceName`, optional `-SubscriptionId` (defaults to the current context). Get set adds `-RuleId` (alert rules) or `-Id` (automation rules, data connectors) (S45-S47).
- **Output types:** `IAlertRule`, `IAutomationRule`, `IDataConnector`.
- **Caveats:**
  - The documented example output for `Get-AzSentinelAlertRule` shows alert-like fields (`Kind : SecurityAlert`, `ProductName`, `Status`) rather than rule fields. Don't build parsers from the doc samples. Inspect real objects.
  - Which API version the module uses internally isn't stated on the fetched pages. Compare its results with REST, especially for NRT rules (G8).

### 8.9 Azure CLI `az sentinel` extension

Source: S48, S49.

- The "sentinel" extension needs Azure CLI 2.37.0 or higher, and installs automatically on first use.
- Command groups are "GA", but **every list and show command is labelled "Experimental"**: "This command is experimental and under development." (S49)
- Read commands that exist:
  - `az sentinel alert-rule list`
  - `az sentinel alert-rule template list`
  - `az sentinel automation-rule list`
  - `az sentinel data-connector list`
  - `az sentinel watchlist list`
  - `az sentinel bookmark list`
  - `az sentinel incident list`
  - `az sentinel metadata list`
  - `az sentinel onboarding-state list`
  - `az sentinel setting list`
  - `az sentinel source-control list`
  - `az sentinel threat-indicator list`
  - `az sentinel threat-indicator metric list` (labelled GA)

Status: Verbatim syntax (S49).

```azurecli
az sentinel alert-rule list --resource-group
                            --workspace-name
```

- **Recommendation:** prefer `az rest` against the documented REST endpoints (INV-R01 to R04), because the extension's list commands are experimental. Use the extension only as a convenience cross-check.

### 8.10 Azure Resource Graph (ARG)

Supported types in the ARG `resources` table (S53):
- `microsoft.Logic/workflows (Logic apps)`
- `microsoft.Web/connections (API Connections)`
- `microsoft.insights/workbooks`
- `microsoft.insights/datacollectionrules`
- `microsoft.OperationalInsights/workspaces`
- `microsoft.OperationsManagement/solutions`

No `microsoft.securityinsights` type was found in the supported-types list (S53). Analytics rules, automation rules and watchlists aren't available through ARG; use REST.

Query style and the CLI and PowerShell invocation forms follow S54: `Resources | where type =~ '...'`; `az graph query -q "..."` (resource-graph CLI extension); `Search-AzGraph -Query "..."` (Az.ResourceGraph module).

#### INV-G01: Logic Apps (playbook candidates)

Status: Composed.

```kusto
Resources
| where type =~ 'microsoft.logic/workflows'
| project name, resourceGroup, subscriptionId, location, state = tostring(properties.state), id
| order by subscriptionId asc, resourceGroup asc, name asc
```

#### INV-G02: workbooks

Status: Composed.

```kusto
Resources
| where type =~ 'microsoft.insights/workbooks'
| project name, resourceGroup, subscriptionId, displayName = tostring(properties.displayName), category = tostring(properties.category), sourceId = tostring(properties.sourceId), id
| order by resourceGroup asc, displayName asc
```

#### INV-G03: DCRs and API connections (connector and playbook context)

Status: Composed.

```kusto
Resources
| where type in~ ('microsoft.insights/datacollectionrules', 'microsoft.web/connections')
| project type, name, resourceGroup, subscriptionId, location, id
| order by type asc, name asc
```

Common notes for INV-G01 to G03:
- **Run in:** Azure Resource Graph Explorer, `az graph query -q "<query>"`, or `Search-AzGraph -Query "<query>"` (S54).
- **Permissions:** read access on the subscriptions. ARG returns only resources the caller can see (S54: "subscriptions that you have access to").
- **Read-only:** yes. **Cost:** none.
- **Caveats:**
  - Property paths are case-sensitive even when `=~` is used for `type` (S54 note).
  - `properties.state` for Logic Apps and `properties.category`/`sourceId` for workbooks come from the resource models (workbooks: S65). ARG may scrub or omit some properties (S53 notes PII scrubbing for `securityresources`).
  - Not every Logic App is a Sentinel playbook. ARG can't tell by type alone (G10).
  - To scan workbook **content** (for example for `IdentityInfo` or `ThreatIntelligenceIndicator`), call REST Workbooks - Get with `canFetchContent=true` (S65, S66).
  - The `category` filter required by Workbooks - List By Resource Group only enumerates `workbook`, `TSG`, `performance` and `retention` (S66). The category Sentinel stores isn't documented. Use ARG to enumerate, then Get each workbook by name.

### 8.11 Portal export (ARM templates), for a human-run backup

- **Analytics rules:** **Microsoft Sentinel > Configuration > Analytics** (Defender) or **Analytics** (Azure), select rules, then **Export** (S51).
  - Preview: "Exporting and importing rules is in PREVIEW."
  - Single-page limit: "You can't export more than one page's worth of rules at a time, though."
  - Output file: `Azure_Sentinel_analytic_rule.json`, or `Azure_Sentinel_analytic_rules.json` for several rules.
  - Import: up to 50 rules per file.
  - "Any type of analytics rule - not just Scheduled - can be exported".
- **Automation rules:** **Microsoft Sentinel > Configuration > Automation**, select rules, then **Export** (S52).
  - Same single-page limit. Multiple rules go to `Azure_Sentinel_automation_rules.json`. Import: up to 50 rules.
  - Imported rules can end up disabled if referenced analytics rules or custom detail keys are missing, or playbooks are inaccessible (S52 troubleshooting).
- **Navigation note:** S51 and S52 give the navigation generically ("From the Microsoft Sentinel navigation menu, select Analytics/Automation"). The Defender paths come from S1.
- **Read-only:** export doesn't modify the workspace. **Permissions:** Microsoft Sentinel Reader is enough to view rules (S64). Whether export specifically needs more isn't stated (G11).

---

## 9. Gaps and ambiguities

| ID | Gap / ambiguity | Evidence | Impact | Suggested handling |
|---|---|---|---|---|
| G1 | Whether specific workspace tables (`SecurityAlert`, `Usage`, `SentinelHealth`) **appear in the advanced hunting Schema tab** isn't documented. S3 says "many" tables appear. | S3, N1 | UI guidance may be wrong if the tool says "find X in the schema". | Tell users to query by name. Record what the schema pane shows in a test tenant (C-03). |
| G2 | Lake-tier access from advanced hunting: three pages say three different things. | S19 vs S3 vs S16 | Retention guidance for hunting. | Treat it as dependent on onboarding date. Run a dated query in AH beyond analytics retention (C-05). |
| G3 | NRT custom detections with Sentinel data: S3 says unavailable, S20 lists supported Sentinel tables. | S3, S20 | Rule conversion guidance. | Prefer S20 (newer). Verify in the wizard. |
| G4 | **TI navigation naming:** S1 and S2 say "Intel management". S13 and S14 (newer) say Overview / Intel explorer. | S1, S2, S13, S14 | UI path in the tool. | Show both, with the newer pages first. Re-check before release. |
| G5 | **MDTI licensing:** S2 still says Intel Profiles and Intel Explorer are "Supported for Microsoft Defender Threat Intelligence customers". S15 says all MDTI capabilities are at no extra cost from 2026-08-01. The premium TI data connector's licence status after retirement isn't stated. | S2, S11, S15, S13 | Licensing statements. | Quote S15, and flag the S2 text as likely stale. |
| G6 | "Add entity to TI" from incidents is Azure-portal only, with no stated replacement in the Defender incident UI or plan for after 2027-03-31. | S2, S25 | Analyst workflow. | Suggest Intel explorer manual creation, or playbooks (inference). |
| G7 | `SentinelResourceType` casing differs between schema reference and samples ("Analytics rule" / "Analytics Rule" / "Analytic Rule"). | S34, S36 | Health queries may silently return nothing. | Use `=~`, and run a `distinct` first. |
| G8 | Stable REST API 2025-09-01 enumerates only 3 alert rule kinds. Whether NRT, ML Behavior Analytics and TI rules come back with that version isn't documented. The same is unknown for the API version Az.SecurityInsights uses internally. | S40, S44 | Incomplete rule inventory. | Run the list with stable and preview versions and compare counts (C-10). |
| G9 | Data connectors API completeness (AMA/DCR, Azure Functions, content-hub UI connectors) isn't documented. | S43 | Connector inventory. | Treat ingestion (Usage) as ground truth, and the API as supporting evidence. |
| G10 | No documented ARG-only way to tell Sentinel playbooks from other Logic Apps. | S53 | Playbook inventory noise. | Cross-reference with automation rule `RunPlaybook` actions (`logicAppResourceId`, S41) and SentinelHealth `TriggeredPlaybooks`. |
| G11 | Permissions needed for **portal export** of rules aren't stated. | S51, S52 | Least-privilege guidance. | Test with Microsoft Sentinel Reader. |
| G12 | Whether SecurityAlert and SecurityIncident hold several rows per alert or incident isn't stated on the table pages. | S57, S58 | Counting accuracy. | Use `dcount(SystemAlertId)` and `arg_max(...) by IncidentName`, as in INV-K04 and INV-K05. |
| G13 | The livestream retirement date isn't given. The page only says livestreams are no longer available. | S8 | Messaging. | State "no longer available". Don't quote a date. |
| G14 | Workbook editing in the Defender portal was "Preview" in August 2025. Current status isn't stated. | S16, S10 | Messaging. | Re-check before release. |
| G15 | Repositories API retirement date inside S16: "June 15, 2026" (heading) vs "June 1, 2026" (body). | S16 | Date accuracy. | Quote both, or say "June 2026". |
| G16 | What happens to "Open in Azure" (workbook visualizations, print/PDF) after the Azure portal retirement on 2027-03-31 isn't documented. | S10, S1 | Workbook continuity. | Flag workbooks with Azure-only visuals as a risk item. |

---

## 10. Candidate checks for the tool

Each check is read-only.

| ID | What | Why | Where | How | Expected result | Evidence to record | Source |
|---|---|---|---|---|---|---|---|
| C-01 | Table and ingestion inventory | Baseline cost and coverage; find stale tables | LA Logs (or AH) | INV-K01, INV-K02 | List of DataType with GB and last hour; stale tables flagged | Query text, run time (UTC), workspace ID, result CSV | S29, S30 |
| C-02 | Exact last record for key tables | Confirm connectors are actually sending data | LA Logs | INV-K03 with an explicit table list from C-01, or the Table insights UI | LastRecord per table within the expected freshness | Result CSV; Table insights screenshot | S31, S59 |
| C-03 | SecurityAlert and Usage visibility in AH | Validate UI guidance (G1) | AH | Look for the table in the Schema tab; run `SecurityAlert \| take 5` | Query succeeds. Schema listing recorded either way | Screenshot of schema pane; query result | S3, S20, N1 |
| C-04 | IdentityInfo legacy field usage in Defender-side queries | Renamed or removed fields break AH queries and custom detections | REST savedSearches (INV-R05), custom detection rules (outside this note's scope), plus AH shared queries | Text scan of query bodies that reference `IdentityInfo` for the S4 legacy names (AccountUPN, AccountSID, AccountCloudSID, AccountCreationTime, AccountTenantId, AdditionalMailAddresses, MailAddress, OnPremisesDistinguishedName, RiskState, SAMAccountName, StreetAddress, UserType, UserState, UserStateChangedOn, TenantID) | List of affected queries. Workbooks and analytics rules are reported as **not affected** (S2) | Query IDs, matched tokens | S2, S4 |
| C-05 | Lake-tier reachability from AH | Resolve G2 for this tenant | AH | Query a table with analytics retention shorter than total retention, using a time range beyond analytics retention | Rows returned, or not | Query, time range, row count | S3, S16, S19 |
| C-06 | UEBA status | UEBA drives the unified IdentityInfo and entity page content | LA Logs; Defender UEBA tab | INV-K18; check **System > Settings > Microsoft Sentinel > UEBA** | Tables present with recent data, or not | Result table; settings screenshot | S4, S23, S24 |
| C-07 | Legacy TI table dependencies | Ingestion to `ThreatIntelligenceIndicator` stopped after 2025-07-31 | REST alertRules (`properties.query`), saved searches, workbooks (`serializedData` via REST Get with `canFetchContent=true`) | Text scan for `ThreatIntelligenceIndicator`; INV-K17 | Zero references, ideally | Object IDs with matches; INV-K17 output | S11, S56, S65 |
| C-08 | Current TI inventory | Plan the TI and Intel explorer transition | LA Logs or AH | INV-K15, INV-K16 | Counts by table, StixType and feed | Result CSVs | S55, S56 |
| C-09 | Health monitoring enabled | `SentinelHealth` and `SentinelAudit` are needed for health and audit checks | Defender: System > Settings > Microsoft Sentinel > Auditing and health monitoring; LA Logs | INV-K07, INV-K08 | Rows present. If not, record "not enabled" (enabling is a write action, so out of scope) | Query result; settings screenshot | S33, S34 |
| C-10 | Analytics rule inventory completeness | Stable API enum gap (G8) | Cloud Shell | INV-R01 with 2025-09-01 and with 2025-07-01-preview; compare counts and kinds | Equal counts, or a recorded difference | Raw JSON for both versions | S39, S40 |
| C-11 | Automation rules and playbook links | Provider and condition changes; playbook dependencies | Cloud Shell; ARG | INV-R02 (store `actions[].actionConfiguration.logicAppResourceId`), INV-G01, INV-K11 | Every RunPlaybook target exists in ARG | Raw JSON; ARG CSV | S41, S38, S53 |
| C-12 | Watchlist inventory | Watchlists move with the workspace; queries depend on aliases | Cloud Shell; LA Logs or AH | INV-R03 plus INV-K13 | REST aliases match `_GetWatchlistAlias` | Both outputs | S27, S42 |
| C-13 | Connector inventory, and connectors hidden in Defender | Some connectors disappear from the Defender Data connectors page; secondary workspaces lose standalone MS alert connectors | Cloud Shell; LA Logs | INV-R04, INV-K04 (ProductName per workspace), INV-K10 | Inventory with the Defender-hidden ones marked (S2 list) | Raw JSON; alert product counts per workspace | S2, S5, S43 |
| C-14 | Workbook inventory and multi-workspace risk | The Workbooks page shows only the primary workspace's data; some visuals are Azure-only | ARG; REST Workbooks Get | INV-G02; flag workbooks whose `sourceId` points to a secondary workspace (inference) | List of workbooks per workspace | ARG CSV | S10, S17, S65 |
| C-15 | Primary vs secondary workspace map | Drives AH, custom detection, workbook and XDR-alert behaviour | Defender: System > Settings > Microsoft Sentinel > Workspaces | Manual read, or onboarding state (`Get-AzSentinelOnboardingState`; its semantics weren't researched here) | Primary identified | Screenshot | S17, S44 |
| C-16 | Alert and incident baseline before onboarding | ProviderName and Description change after onboarding | LA Logs | INV-K04, INV-K05, INV-K06 | Baseline captured with a date | CSVs with run timestamp | S2, S58 |
| C-17 | Hunting content and bookmarks | Bookmarks aren't in AH; hunting queries are saved searches | Cloud Shell; LA Logs | INV-R05; `HuntingBookmark \| summarize count()` (composed) | Counts recorded | Outputs | S3, S8, S61, S67 |
| C-18 | Rule and automation backup | Rollback and reference | Portal (human) | Section 8.11 export | JSON files saved | File names, hashes, date | S51, S52 |
