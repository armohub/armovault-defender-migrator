# 02 - Detections, incidents, automation and APIs after onboarding Microsoft Sentinel to the Defender portal

Research date: 2026-10-19. Scope: analytics and detections, alerts and incidents, correlation, automation rules, playbooks, connectors that affect incidents, and APIs/integrations. Covers what changes when a Sentinel workspace is onboarded to the Microsoft Defender portal.

Method: every page below was fetched live from learn.microsoft.com on 2026-10-19. Dates are the page's `ms.date` metadata, with `updated_at` (last publish) in brackets. Quotes are verbatim and 25 words or fewer. "Confidence" describes how well the claim is supported by the source wording, not how likely the behaviour is in a given tenant.

Confidence scale:
- **High**: stated explicitly on a current Learn page.
- **Medium**: stated, but another Learn page contradicts it, the wording is ambiguous, or it depends on a preview feature.
- **Low**: inferred or derived, not stated directly.

---

## 0. Source register

| ID | Title | URL | ms.date [updated_at] |
|---|---|---|---|
| S1 | Microsoft Sentinel in the Microsoft Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/microsoft-sentinel-defender-portal | 2026-06-18 [2026-09-23] |
| S2 | Transition Your Microsoft Sentinel Environment to the Defender Portal | https://learn.microsoft.com/en-us/azure/sentinel/move-to-defender | 2026-09-10 [2026-09-24] |
| S3 | Connect Microsoft Sentinel to the Microsoft Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/microsoft-sentinel-onboard (the /defender-xdr/microsoft-sentinel-onboard URL redirects here) | 2026-09-10 [2026-09-23] |
| S4 | Microsoft Sentinel alert schema differences between standalone and XDR connectors | https://learn.microsoft.com/en-us/azure/sentinel/security-alert-schema-differences | 2026-06-17 [2026-06-24] |
| S5 | Migrate Microsoft Sentinel incident creation rules to alert grouping in Microsoft Defender | https://learn.microsoft.com/en-us/azure/sentinel/migrate-sentinel-incident-creation-rules-alert-grouping (a /unified-secops/ copy has the same canonical URL) | 2026-06-11 [2026-09-10] |
| S6 | Microsoft Defender XDR integration with Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/microsoft-365-defender-sentinel-integration | 2026-06-17 [2026-09-24] |
| S7 | Stream data from Microsoft Defender XDR to Microsoft Sentinel in the Azure portal | https://learn.microsoft.com/en-us/azure/sentinel/connect-microsoft-365-defender | 2026-07-02 [2026-09-10] |
| S8 | Automation in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/automation/automation | 2025-07-16 [2026-06-28] |
| S9 | Automate threat response in Microsoft Sentinel with automation rules | https://learn.microsoft.com/en-us/azure/sentinel/automate-incident-handling-with-automation-rules | 2024-10-16 [2026-06-30] |
| S10 | Microsoft Sentinel automation rules reference | https://learn.microsoft.com/en-us/azure/sentinel/automation-rule-reference (the suggested /automation/automation-rule-reference URL returned 404) | 2024-09-02 [2026-06-28] |
| S11 | Automate Threat Response with Playbooks in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/automation/automate-responses-with-playbooks | 2026-06-12 [2026-06-23] |
| S12 | Automate and run Microsoft Sentinel playbooks | https://learn.microsoft.com/en-us/azure/sentinel/automation/run-playbooks | 2026-07-01 [2026-08-19] |
| S13 | Alert correlation and incident merging in the Microsoft Defender portal | https://learn.microsoft.com/en-us/defender-xdr/alerts-incidents-correlation | 2026-10-04 [2026-10-13] |
| S14 | Incidents and alerts in the Microsoft Defender portal | https://learn.microsoft.com/en-us/defender-xdr/incidents-overview | 2025-12-22 [2026-09-23] |
| S15 | Manage detection rule correlation settings in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/exclude-analytics-rules-correlation | 2026-10-04 [2026-10-13] |
| S16 | Investigate alerts in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/investigate-alerts | 2026-09-10 [2026-10-19] |
| S17 | Overview of custom detections in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/custom-detections-overview | 2026-05-19 [2026-07-06] |
| S18 | Use Microsoft Sentinel custom functions in advanced hunting in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-defender-use-custom-rules | 2026-07-02 [2026-08-11] |
| S19 | Manage custom detection rules in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/custom-detection-manage | 2026-10-04 [2026-10-13] |
| S20 | Create custom detection rules in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/custom-detection-rules | 2026-09-02 [2026-10-04] |
| S21 | Alerts and incidents in Microsoft Defender XDR for Microsoft Defender for Cloud | https://learn.microsoft.com/en-us/azure/defender-for-cloud/concept-integration-365 (the /defender-xdr/microsoft-365-security-center-defender-cloud URL redirects here) | 2026-01-28 [2026-09-24] |
| S22 | Ingest Microsoft Defender for Cloud Incidents with Microsoft Defender XDR Integration | https://learn.microsoft.com/en-us/azure/sentinel/ingest-defender-for-cloud-incidents | 2026-07-02 [2026-09-24] |
| S23 | Ingest Microsoft Defender for Cloud alerts into Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/connect-defender-for-cloud | 2026-07-02 [2026-08-08] |
| S24 | incident resource type - Microsoft Graph v1.0 | https://learn.microsoft.com/en-us/graph/api/resources/security-incident?view=graph-rest-1.0 | 2024-07-05 [2026-08-28] |
| S25 | List incidents - Microsoft Graph v1.0 | https://learn.microsoft.com/en-us/graph/api/security-list-incidents?view=graph-rest-1.0 | 2026-03-03 [2026-03-19] |
| S26 | Incidents - Get - REST API (Azure Sentinel), api-version 2025-09-01 | https://learn.microsoft.com/en-us/rest/api/securityinsights/incidents/get | 2024-05-07 [2026-07-14] |
| S27 | List alerts_v2 - Microsoft Graph v1.0 | https://learn.microsoft.com/en-us/graph/api/security-list-alerts_v2?view=graph-rest-1.0 | 2024-09-23 [2026-05-19] |
| S28 | security: runHuntingQuery - Microsoft Graph v1.0 | https://learn.microsoft.com/en-us/graph/api/security-security-runhuntingquery?view=graph-rest-1.0 | 2026-07-02 [2026-08-18] |
| S29 | Monitor the Health of your Microsoft Sentinel Automation Rules and Playbooks | https://learn.microsoft.com/en-us/azure/sentinel/monitor-automation-health | 2026-07-01 [2026-08-12] |
| S30 | Monitor the health and audit the integrity of your Microsoft Sentinel analytics rules | https://learn.microsoft.com/en-us/azure/sentinel/monitor-analytics-rule-integrity | 2026-07-02 [2026-08-08] |
| S31 | Turn on auditing and health monitoring in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/enable-monitoring | 2026-07-02 [2026-08-08] |
| S32 | Microsoft Sentinel health tables reference | https://learn.microsoft.com/en-us/azure/sentinel/health-table-reference | 2025-08-20 [2026-05-14] |
| S33 | Azure Monitor Logs reference - SecurityIncident | https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/securityincident | 2026-08-27 [2026-08-28] |
| S34 | Multiple workspaces - Microsoft Sentinel in Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/workspaces-defender-portal | 2026-06-08 [2026-09-23] |
| S35 | Use Tasks to Manage Incidents in Microsoft Sentinel in the Azure Portal | https://learn.microsoft.com/en-us/azure/sentinel/incident-tasks | 2026-07-02 [2026-08-12] |
| S36 | Create your own incidents manually in Microsoft Sentinel in the Azure portal | https://learn.microsoft.com/en-us/azure/sentinel/create-incident-manually | 2026-07-02 [2026-08-11] |
| S37 | Streamline incident response using tasks in the Microsoft Defender portal (Legacy) | https://learn.microsoft.com/en-us/defender-xdr/split-incidents-into-tasks | 2026-06-15 [2026-09-23] |
| S38 | Generate playbooks using AI in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/automation/generate-playbook | 2026-08-07 [2026-08-08] |
| S39 | Advanced multistage attack detection in Microsoft Sentinel (Fusion) | https://learn.microsoft.com/en-us/azure/sentinel/fusion | 2024-11-26 [2026-05-14] |
| S40 | Create incidents from alerts in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/create-incidents-from-alerts | 2026-07-02 [2026-08-11] |
| S41 | Advanced hunting with Microsoft Sentinel data in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-microsoft-defender | 2026-06-09 [2026-09-23] |
| S42 | Create scheduled analytics rules in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/create-analytics-rules | 2026-07-02 [2026-08-11] |
| S43 | Work with near-real-time (NRT) detection analytics rules in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/create-nrt-rules | 2026-07-02 [2026-08-11] |
| S44 | Supported triggers and actions in Microsoft Sentinel playbooks | https://learn.microsoft.com/en-us/azure/sentinel/automation/playbook-triggers-actions | 2025-08-21 [2026-06-28] |
| S45 | What's new in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/whats-new | 2026-08-24 [2026-09-23] |
| S46 | alert resource type - Microsoft Graph v1.0 | https://learn.microsoft.com/en-us/graph/api/resources/security-alert?view=graph-rest-1.0 | 2026-01-08 [2026-08-28] |
| S47 | detectionSource enum type - Microsoft Graph v1.0 | https://learn.microsoft.com/en-us/graph/api/resources/security-detectionsource?view=graph-rest-1.0 | 2026-01-08 [2026-01-08] |
| S48 | Security enum values - Microsoft Graph v1.0 | https://learn.microsoft.com/en-us/graph/api/resources/enums-security?view=graph-rest-1.0 | 2026-01-08 [2026-06-24] |
| S49 | Microsoft Sentinel security alert schema reference | https://learn.microsoft.com/en-us/azure/sentinel/security-alert-schema | 2022-01-11 [2026-04-22] |
| S50 | Compare Microsoft Sentinel analytics rules and Microsoft Defender custom detections | https://learn.microsoft.com/en-us/azure/sentinel/compare-analytics-rules-custom-detections | 2026-10-04 [2026-10-13] |
| S51 | Automation Rules - List - REST API (Azure Sentinel), api-version 2025-09-01 | https://learn.microsoft.com/en-us/rest/api/securityinsights/automation-rules/list | 2024-05-07 [2026-07-14] |
| S52 | Alert Rules - List - REST API (Azure Sentinel), api-version 2025-09-01 | https://learn.microsoft.com/en-us/rest/api/securityinsights/alert-rules/list | 2024-05-07 [2026-07-14] |

Pages that returned no content (only the title came back), so nothing from them is used as evidence:
- Tech Community, "Microsoft Sentinel and Defender: ITSM Integrations Explained": https://techcommunity.microsoft.com/blog/microsoftsentinelblog/microsoft-sentinel-and-defender-itsm-integrations-explained/4457282
- Tech Community, "Microsoft Sentinel: Public preview of Microsoft Defender for Cloud to Defender XDR integration": https://techcommunity.microsoft.com/blog/microsoftsentinelblog/microsoft-sentinel-public-preview-of-microsoft-defender-for-cloud-to-defender-xd/3992792

Context: Sentinel in the Azure portal is supported until 2027-03-31. After that it is available only in the Defender portal (S1, S2).

---

## Q1. Analytics rules after onboarding

### 1.1 Fusion (Advanced multistage attack detection)
- **Claim:** onboarding disables the Fusion rule, and the Defender XDR correlation engine takes over its function.
- **Sources:** S2 (Configure analytics rules table): "This rule is disabled when you onboard Microsoft Sentinel to the Defender portal." S39: "For Microsoft Sentinel workspaces that are onboarded to the Microsoft Defender portal, Fusion is disabled."
- **Confidence:** High.
- **Caveat:** in the SecurityInsights API the rule has `kind: "Fusion"` (S52). No page says whether Fusion is re-enabled automatically after offboarding (not found).

### 1.2 Microsoft incident creation rules (kind `MicrosoftSecurityIncidentCreation`)
- **Claim:** onboarding deactivates these rules, and the Defender portal does not support them.
- **Sources:**
  - S2 (incidents table): "Any active Microsoft security incident creation rules are deactivated to avoid creating duplicate incidents."
  - S2 and S8 (automation table): "Microsoft incident creation rules aren't supported in the Defender portal."
  - S6: "Microsoft incident creation rules aren't supported in the Defender portal because the Defender portal has its own incident creation engine."
- **Confidence:** High.
- **Impacts and replacements (S6):**
  - Alert filtering: replace with alert tuning in the Defender portal, or with automation rules that suppress or close incidents.
  - Incident titles: "you can no longer predetermine the titles of incidents". Use tags as automation conditions instead.
  - Products not integrated into Defender XDR (for example Microsoft Purview Insider Risk Management): replace incident creation rules with scheduled analytics rules (S6, S40).
- **New onboarding option (S5):** the onboarding dialog has a checkbox, **Retain Sentinel incident creation behavior for XDR alerts**. It creates equivalent Defender **alert grouping** rules. Quote: "This option applies migration behavior during onboarding. Later changes to Sentinel rule grouping aren't continuously synced to Defender."
  - Validation UI path: **Settings > Microsoft Defender XDR > Alert grouping**.
  - Confidence: High (the page exists), but no other page describes the alert grouping rule UI in detail (see Gaps).

### 1.3 Scheduled and NRT analytics rules
- **Claim:** analytics rules keep working and are managed in the Defender portal.
  - S2: "Analytics rule functionality remains the same, including creation, updating, and management through the wizard, repositories, and the Microsoft Sentinel API."
  - UI path (S1, S42): **Microsoft Sentinel > Configuration > Analytics**.
  - Analytics rules also appear in **Investigation & response > Hunting > Custom detection rules**. S19: "the custom detection rules list includes analytics rules."
  - Confidence: High.
- **NRT:** supported in the Defender portal. S43 path: **Microsoft Sentinel > Configuration > Analytics > +Create > NRT query rule**. Confidence: High.
- **Incident creation setting.** S42: "If you onboarded Microsoft Sentinel to the Microsoft Defender portal, leave this setting Enabled." Defender XDR then creates the incidents, and in the Azure portal they show "Microsoft XDR" as the incident provider name. Confidence: High.
- **Description field restriction.** S42: in the Defender portal the rule Description field "supports plain text only".
- **Re-open closed matching incidents is not available.** S42: "The Re-open closed matching incidents option isn't available when Microsoft Sentinel is onboarded to the Microsoft Defender portal." Confidence: High.

### 1.4 Alert-only rules (incident creation disabled)
- **Claim:** these alerts are not visible in the Defender portal.
  - S2 (Alert visibility): "If you have Microsoft Sentinel analytics rules configured to trigger alerts only ... with incident creation turned off, these alerts aren't visible in the Defender portal."
  - Confidence: High.
- **Advanced hunting.** S2: "All Microsoft Sentinel alerts that are tied to incidents are ingested into the AlertInfo table". By implication, alert-only alerts are not in `AlertInfo`. No page states explicitly where alert-only alerts can be found after onboarding. The workspace `SecurityAlert` table is the obvious candidate, but that is an inference (Low).
- **Automation still applies.** S9 says alert-trigger automation is the main option for rules that don't create incidents, and that this "is especially relevant when your Microsoft Sentinel workspace is onboarded to the Defender portal." Confidence: High.
- **Note:** S50 lists "Create alerts without incidents" as Supported for analytics rules and Not supported for custom detections.

### 1.5 Alert grouping vs Defender XDR correlation (documents conflict; see Gaps G1)
- **S2 (2026-09-10):** "the Defender XDR correlation engine fully controls alert grouping and incident merging when necessary in the Defender portal."
- **S42:** "the alert grouping settings take effect only at the moment that the incident is created." Defender "might make decisions about alert correlation that don't take these settings into account."
- **S15 (newer, 2026-10-04):** "By default, all analytics rules are excluded at the tenant level when you first onboard to Microsoft Defender." Also: "The Incident correlation default setting is turned off by default."
  - An excluded rule's alerts "group into incidents exactly as they did in Microsoft Sentinel, based only on the grouping configuration of the analytics rule."
- **Tenant default UI path (S15):** **System > Settings > Microsoft Defender XDR > Rules > Incident correlation**, toggle **Incident correlation default setting**.
- **Per-rule override (S15):**
  - Analytics rule wizard, **Incident settings** tab, **Incident correlation** dropdown: **Tenant default** / **Enabled** / **Disabled**.
  - Equivalently, put a tag at the start of the rule Description: `#INC_CORR#` (include) or `#DONT_CORR#` (exclude). Tags are not case sensitive and must be at the beginning.
  - Changing the setting does not affect alerts created earlier.
- **Precedence (S15):** "Incident alert-grouping rules remain the final authority."
- **Custom detections (S15):** correlation is per rule (public preview) and included by default.
- **Confidence:** Medium. S15 is the newest page and the most specific, but it contradicts S2's framing. The tool should read the actual tenant setting and not assume either behaviour.

### 1.6 Incident naming and title changes
- **Existing incident names may change.** S8 and S2: "When onboarding your workspace to the Defender portal, existing incident names might be changed if the correlation is applied."
- **The engine names incidents.** S13 says the correlation logic "is also responsible for giving an appropriate name to the new incident."
- **Excluded rules can still get a different title.** S15: "the incident title in the Defender portal might be different from the title in Microsoft Sentinel." This applies to rules with dynamic titles. Sentinel uses the first alert's title, while Defender "falls back to the common MITRE tactic of all alerts".
- **Confidence:** High.

### 1.7 Custom detection rules on Sentinel tables
- **Claim:** custom detections can query Sentinel tables and Defender XDR tables together.
  - S2: "Creating custom detection rules that query both sources is supported without needing to ingest Defender XDR data into Microsoft Sentinel."
  - S18: "Custom detection rules - to generate detections from rules that query data from Defender or from both Microsoft Sentinel and Defender".
  - Confidence: High.
- **Constraints:**
  - Only analytics-tier data (not basic or auxiliary logs) (S18).
  - The `workspace()` and `adx()` operators are not supported in custom detections (S18).
  - Creating custom detections is limited to the primary workspace (S34). Multi-workspace custom detections are "Planned" (S50).
  - Custom frequency (5 minutes to 14 days) only when the rule uses Sentinel data only (S20).
  - Continuous (NRT) frequency is supported for listed Sentinel tables (`SecurityEvent`, `SigninLogs`, `CommonSecurityLog`, `SecurityAlert`, `AuditLogs`, `AzureActivity`, `OfficeActivity` and others) (S20). S41 contradicts this (Gap G6).
  - If Sentinel scoping is configured, the query must project `SentinelScope_CF` or the alerts are hidden from scoped users (S20).
  - Without Defender XDR, custom detection rules are listed as "limited or unavailable" (S1).
  - S50: "Sentinel automation rules with incident trigger" and "with alert trigger" are **Planned** (not yet supported) for custom detections. Confidence: Medium, ambiguous (Gap G11).

### 1.8 Unified detection rules management
- Defender portal **Investigation & response > Hunting > Custom detection rules** lists both custom detections and analytics rules. There are Workspace ID and Workspace name filters for multi-workspace tenants (S19, S18).
- From a rule's details you can: **Edit**, **Modify query**, **Turn on / Turn off**, **Delete**, **Include or exclude from correlation**.
- **Run** and **Last run status** apply to custom detections only (S19).
- Confidence: High.

### 1.9 Alert tuning for Sentinel alerts
- **Claim:** alert tuning in the Defender portal can be applied to Sentinel alerts after onboarding.
  - S2: "the alert tuning capabilities in the Defender portal, previously available only for Defender XDR alerts, can now be applied to alerts from Microsoft Sentinel."
  - UI path (S16): **Settings > Microsoft Defender XDR > Alert tuning**. Built-in rules are at https://security.microsoft.com/securitysettings/defender/alert_suppression.
  - Confidence: High for the S2 statement. Medium for the mechanics: S16's tuning section doesn't name Microsoft Sentinel as a service source.
- **Actions and limits (S16):**
  - **Hide alert** works only for Defender for Endpoint alerts.
  - **Resolve alert**.
  - **Set as behavior** is not supported for Defender for Cloud or Defender for Office 365 alerts.
  - Up to 200 conditions per rule.
  - Built-in tuning rules don't apply to custom detection alerts.
  - Detection-source selection (preview) takes effect on 2026-11-08. Rules that aren't updated keep applying to all detection sources, "including custom detections".

### 1.10 Alert promotion (preview)
- **Claim:** supported third-party alerts are promoted to Defender XDR alerts automatically. Currently the only listed source is CrowdStrike, through the CrowdStrike API Data Connector (CCF).
- **Duplicates.** S16: "If you already use analytics rules to create alerts from the same data, you might see duplicate alerts." Use alert tuning to manage them (S2, S3, S16).
- **Confidence:** High (preview).

---

## Q2. Incidents

### 2.1 Incident provider value
- **Claim:** after onboarding, the incident provider is always Microsoft XDR.
  - S2: "In the Defender portal, the Incident provider name is always Microsoft XDR."
  - S8: all incidents have "*Microsoft XDR* as the incident provider (the value in the *ProviderName* field)."
  - API values (S2): `providerName` = "Azure Sentinel" in the Azure portal, "Microsoft XDR" in the Defender portal.
  - Confidence: High.

### 2.2 Fields that change or disappear
- **Description:**
  - S2 and S8: "after onboarding to the Defender portal, the SecurityIncident table no longer includes a Description field."
  - S8: ServiceNow-type integrations: "the incident description will be missing."
  - Confidence: Medium. The generated `SecurityIncident` schema (S33) still lists a `Description` column, and the Graph incident has a `description` property (S24). Most likely the column exists but isn't populated (Gap G3).
- **Incident URL.** `incidentUrl` still points to the Sentinel (Azure) portal. The added `providerIncidentUrl` links to the Defender portal (S2). In the SecurityInsights API it is `properties.additionalData.providerIncidentUrl` (S26). Confidence: High.
- **Size difference.** Sentinel incidents hold at most 150 alerts. A larger Defender incident shows "150+" and links to Defender (S6). Confidence: High.

### 2.3 Incident tasks
- **Tasks exist in the Defender portal.** S37 (Legacy experience): **Incidents & alerts > Incidents > [incident] > Tasks**.
- **Sentinel tasks sync one way.** S37: "When you onboard Microsoft Sentinel to the Defender portal, the Defender portal automatically synchronizes tasks you create in Sentinel using the Azure portal." Also: "Synchronization is one-way - tasks you create in the Defender portal aren't synchronized back to Microsoft Sentinel."
- **Automatic task creation.** S37 says the Defender portal "doesn't yet support automatic task creation". Sentinel task automation rules, playbooks and the Incident Tasks REST API can still create tasks, and those tasks sync.
- **Permissions (S37):** viewing needs **Read-only** or **Security data basics (read)**. Creating needs **Response (manage)** in the Security operations group.
- **Incident cases (preview)** use a separate task experience (manage-incident-case-tasks, not fetched).
- **Confidence:** High.

### 2.4 Similar incidents
- S2: the feature "isn't supported in the Defender portal ... the Similar incidents tab isn't available on an incident details page." Confidence: High.

### 2.5 Comments
- S2: "editing existing comments isn't supported in the Defender portal. Edits made to comments in the Azure portal aren't synchronized". Comments can still be added in either portal.
- S6 (Azure-portal integration): only "Comments (new only)" sync.
- Confidence: High.

### 2.6 Manually or API-created incidents
- **Not synced to the Defender portal.** S2: "Incidents created in Microsoft Sentinel through the API, by a Logic App playbook, or manually from the Azure portal, aren't synchronized to the Defender portal." S36 says the same.
- **Still usable on the Azure side.** They remain supported in the Azure portal and the API (S2, S36).
- **Identification.** Manually created incidents have no alerts or entities and show no Product name (S36).
- **Graph API.** The Graph incident API has no create method. Its methods are list, get, update, create comment and merge (S24).
- **Confidence:** High.

### 2.7 Closed incidents and new alerts
- S2: "Closed incidents aren't reopened in this case, and new alerts trigger new incidents."
- S13 (merge exclusions): "One of the incidents has a status of "Closed". Incidents that are resolved don't get reopened."
- Confidence: High.

### 2.8 Sync between portals and latency
- **Primary workspace (S34).** Defender XDR incidents appear in the Azure portal with provider **Microsoft XDR**. Status, closing reason and assignment changes sync in both directions.
- **Secondary workspaces (S34).** Incidents sync between the same workspace's Azure and Defender views only.
- **Merges (S13):**
  - The source incident is closed and tagged **`Redirected`**. It stays accessible in Sentinel in the Azure portal.
  - Merge activities are attributed to "Microsoft Defender XDR - alert correlation".
  - Migration of comments and audits is in preview.
- **Graph status.** A merged incident has `status: redirected` and `redirectIncidentId` (S24).
- **Latency (all High, but the numbers differ by scenario):**
  - S2: "It may take up to 5 minutes for Microsoft Defender incidents to fully integrate with Microsoft Sentinel."
  - S8: "It might take up to 10 minutes from the time that an alert is triggered and an incident is created or updated..." before an automation rule runs.
  - S8: "If multiple changes are made to the same incident within 5-10 minutes, a single update is sent to Microsoft Sentinel". Intermediate updates are lost.
  - S6 (Azure-portal connector scenario): incidents "typically appear in the Microsoft Sentinel UI and API within five minutes". `SecurityIncident` ingestion "might take a few more minutes".
  - S6: field sync "takes place in both portals immediately after the change". The status and classification mappings are listed in S6.
- **Customer-managed keys (S2).** "alerts and incidents will no longer be CMK-encrypted after onboarding." Rules and log data stay CMK-encrypted.

### 2.9 Adding and removing alerts (documents conflict; Gap G2)
- S2 (incidents table): "Adding or removing Microsoft Sentinel alerts to or from incidents is supported only in the Defender portal." To remove an alert, move it to another incident.
- S2 and S8 (automation table): "Since adding or removing alerts from incidents isn't supported after onboarding ... these actions are also not supported from within playbooks."
- Graph has a **Move alerts** method on the alert resource (S46).
- **Confidence:** Medium on interpretation. Moving alerts in the Defender UI is supported. Adding or removing alerts through the Sentinel playbook connector or API is not.

---

## Q3. Automation rules: changes in the Defender portal

Where to manage them: **Microsoft Sentinel > Configuration > Automation** (S1). From S8 and S2, verbatim headings with condensed content:

| Area | What changes | Quote / note | Confidence |
|---|---|---|---|
| Incident provider condition | Removed from the UI. Existing rules with **Incident provider** = *Microsoft Sentinel* or *Microsoft 365 Defender* then run on **both** Sentinel and Defender XDR incidents. Use **Analytic rule name** to scope to Sentinel. | "the Incident provider condition property is removed, as all incidents have Microsoft XDR as the incident provider" (S8). S12: **If Incident provider equals** "is displayed only if an incident trigger is selected and your workspace isn't onboarded". | High |
| Description condition | Automation rules that use **Description** as a condition with the incident creation trigger "won't work after onboarding". | S8 | High |
| Title condition | Avoid incident titles as conditions. Use the analytics rule name, plus tags. | "we therefore recommend that you avoid using incident titles as condition criteria in your automation rules" (S8). S6 recommends tags. | High |
| Updated by | The value *Microsoft 365 Defender* is removed. Existing rules are rewritten to *Other*. | "In existing automation rules, Microsoft 365 Defender is replaced by a value of Other after onboarding your workspace." (S8) | High |
| Updated by values (onboarded) | Application (both portals), User (both portals), **AIR**, Alert grouping (analytics rules and Defender XDR correlation), Playbook, Automation rule, **Other**. | S9 ("Onboarded workspaces" tab) | High |
| Alert created trigger | Acts only on Sentinel alerts (Scheduled and NRT; also Microsoft security rules per S9's note). For Defender XDR alerts, use the **Enhanced Alert Trigger**. | "In the Defender portal, automation rules with alert triggers act only on Microsoft Sentinel alerts." (S8) | High |
| Incident created trigger | In the Defender portal it fires when "A new incident is created in the Microsoft Defender portal." | S9 trigger table | High |
| Automation rule latency | Up to 10 minutes from alert to automation rule run. | S8 | High |
| Playbook trigger latency | Up to 5 minutes for Defender incidents to appear in Sentinel, which delays playbooks too. | S8 | High |
| Batching window | 5-10 minute coalescing. Only the latest change is sent. | S8, S9 | High |
| Create automation rule from an incident | Azure portal only. In the Defender portal, create rules from scratch on the **Automation** page. | S8 | High |
| Microsoft incident creation rules | Not supported. | S8 | High |
| Multi-workspace | XDR data is ingested only into the primary workspace. "Transfer automation rules to the relevant workspace to keep them running." | S8 | High |
| Correlation engine | Merged incidents may deliver unexpected data to automation. "We recommend reviewing your automation rules to ensure you're seeing the expected results." | S8 | High |
| Simple Flows (preview) | Onboarded workspaces get **Case created** and **Case updated** triggers, and actions **Send Case Created/Updated/SLA Exceeded Email**, **Update Case**, **Add Task**, **Update Alert**. | S9 | High (preview) |
| Enhanced Alert Trigger | Tenant-level, spans workspaces. Limitations: no priority ordering or expiration dates; actions are limited to running generated (Python) playbooks and updating alerts; 500 active rules per tenant; one action per rule; run results **not** written to `SentinelHealth`. | S38 | High |

API property names (SecurityInsights automation rules, S51), useful for static analysis of rule definitions:
- `propertyName` values: `IncidentProviderName`, `IncidentTitle`, `IncidentDescription`, `IncidentUpdatedBySource`, `IncidentRelatedAnalyticRuleIds`, `IncidentLabel`, `AlertProductNames`, `AlertAnalyticRuleIds`.
- `triggersOn`: `Incidents` / `Alerts`. `triggersWhen`: `Created` / `Updated`.
- `actionType`: `ModifyProperties`, `RunPlaybook`, `AddIncidentTask`.
- The REST page does not list the string values for `IncidentUpdatedBySource` (Gap G13).

Related call to action (S45, April 2026 and November 2025). The account entity **Account Name** handling changed, with a 2026-07-01 deadline. The full UPN is now split into the UPN prefix and `UPNSuffix`. S45 recommends **Contains** or **Starts with** instead of strict equality in automation rules and Logic Apps. It also recommends `coalesce(Account.UPNprefix, Account.Name, Account.DisplayName)` in KQL. This is not specific to onboarding, but it affects the same automation conditions.

---

## Q4. Playbooks

| Item | Status in the Defender portal | Source | Confidence |
|---|---|---|---|
| Run playbook manually on an **incident** | Supported. **Incidents** page > select incident > **Run Playbook** > **Run playbook on incident** panel > **Run playbook**. Status values: **Missing permissions** (needs Microsoft Sentinel Playbook Operator) and **Grant permission** (Sentinel lacks Microsoft Sentinel Automation Contributor). | S12 | High |
| Run on an incident before sync | The message *"Can't access data related to this action. Refresh the screen in a few minutes."* means the incident isn't synced yet. | S2, S8 | High |
| Run playbook manually on an **alert** | Not supported. "Running a playbook manually on an alert isn't supported in the Defender portal." | S12, S2, S8 | High |
| Run playbook manually on an **entity** | Not supported, per the S2 and S8 table. S12's entity section has no Defender-specific note. | S2, S8 | High (S2 and S8 are explicit) |
| Add or remove alerts to or from an incident within playbooks | Not supported after onboarding. | S2, S8 | High |
| Active playbooks tab | Pre-filtered to the onboarded workspace's subscription. | S2, S8 | High |
| Playbooks called directly from analytics rules (classic alert automation) | Deprecated as of March 2026. Migrate to alert-trigger automation rules. | S12, S42 | High |
| Logic Apps Sentinel connector triggers | **Microsoft Sentinel incident**, **Microsoft Sentinel alert (Preview)** (can't be used for alerts from *Microsoft security* rules), **Microsoft Sentinel entity**. S44 has no Defender-portal notes. | S44 | High (no Defender-specific changes documented) |
| Logic Apps actions | **Alert - Get Incident**, **Get Incident**, **Update Incident** (status, owner, tags, severity, title, description), **Add comments to incident**, **Entities - Get &lt;type&gt;**. Create incident (preview) exists (S36), but the resulting incidents are not synced to Defender (S2). | S44, S36 | High |
| Field changes reaching playbooks | No Logic Apps field changes are documented. The incident-level changes (provider = Microsoft XDR, missing Description, possible title change, correlated multi-source alerts) apply to the incident object (S2, S8). |, | Medium (inferred) |
| Required roles | Microsoft Sentinel Contributor (attach), Responder (access incident), Playbook Operator (manual run), Automation Contributor (granted to the Sentinel service account on the playbook's resource group), Logic App Contributor (to run). In a multitenant Lighthouse setup, the Automation Contributor role GUID is `f4c81013-99ee-4d62-a7ee-b3f1f648599a`. | S11, S12 | High |
| Health logging | `SentinelHealth` logs "Playbook was triggered" for manual runs on incidents. Alert-trigger playbooks appear only under automation rule events (`TriggeredPlaybooks`). | S29, S32 | High |
| AI-generated (Python) playbooks | Defender portal only. Up to 100 per tenant, 10-minute runtime, alerts as the only input. Run through the Enhanced Alert Trigger. | S38 | High |

---

## Q5. Microsoft Defender XDR data connector

- **Automatic setup.** S6: "If you onboard Microsoft Sentinel to the Defender portal and are licensed for Defender XDR, Microsoft Sentinel is automatically connected to Defender XDR." S7: "The Defender XDR connector is automatically enabled when you onboard Microsoft Sentinel to the Defender portal." The **Microsoft Defender XDR** solution is installed automatically in the Defender portal (S7). Confidence: High.
- **Incidents and alerts must be on.** S2: "Make sure that you have incidents and alerts from this connector turned on in your workspace." Confidence: High.
- **Connector sections (S7, Azure portal):**
  - **Connect incidents & alerts**, with the checkbox **Turn off all Microsoft incident creation rules for these products. Recommended**. The checkbox disappears once the connector is connected.
  - **Connect entities** (UEBA, Active Directory through Defender for Identity).
  - **Connect events** (advanced hunting tables).
- **Standalone connectors are replaced.** When the connector is enabled, standalone Microsoft product connectors "are automatically disconnected in the background", although they may still *appear* connected (S7).
  - Onboarding disconnects connectors for Defender for Cloud Apps (alerts), Defender for Endpoint, Defender for Identity, Defender for Office 365 and Entra ID Protection (S6).
  - The routing change alters the alert schema (S4): CompromisedEntity mapping, `ExtendedProperties.Category`, MDO Status values, MDI `resourceAccessEvents`.
  - It also filters some alerts: MDC informational alerts aren't ingested, and Entra ID alerts below High aren't ingested by default.
- **Multi-workspace (S34, S4).**
  - The connector is attached to the primary workspace only.
  - Other workspaces that previously used it are disconnected and become secondary.
  - Standalone connectors are auto-disconnected in secondary workspaces.
  - Changing the primary moves the connector automatically (S3).
- **Offboarding.** S3 Warning: "offboarding the workspace from the Defender portal also disconnects the Microsoft Defender XDR connector." Reconnect it if you still want Defender XDR incidents in Sentinel.
  - Offboarding UI (S3): **System > Settings > Microsoft Sentinel > Workspaces** > select workspace > **Disconnect workspace** > provide a reason > confirm.
  - Confidence: High.
- **Duplicates.** Microsoft incident creation rules are turned off for XDR-integrated products "To avoid creating duplicate incidents for the same alerts" (S6). Alert promotion can duplicate analytics-rule alerts (S16).
- **Cost.** `SecurityAlert` and `SecurityIncident` data from Defender XDR is free. Advanced hunting raw tables are charged (S6).
- **Not ingested.** TVM tables (for example `DeviceTvmSoftwareInventory`) are never ingested into Sentinel, even though they appear in the schema (S6, S7).

---

## Q6. Defender for Cloud (MDC)

- **Current recommendation (S3, S21, S22):**
  1. Connect the **Tenant-based Microsoft Defender for Cloud (Preview)** connector in the primary workspace. It comes from the **Microsoft Defender for Cloud** solution (version 3.0.0 or later) in Content hub.
  2. Disconnect the **Subscription-based Microsoft Defender for Cloud (Legacy)** connector from all workspaces.
  3. Turn off Scheduled or Microsoft security analytics rules that create incidents from MDC alerts.
  4. Use automation rules or alert tuning to suppress noise.
  - S21: Sentinel customers who ingest XDR incidents and MDC alerts "must take the following steps to prevent duplicate alerts and incidents."
  - Confidence: High.
- **What S2 says:**
  - "If you're using the tenant-based data connector for Defender for Cloud, make sure to take action to prevent duplicate events and alerts."
  - With the legacy connector: "MDC alerts may still be forwarded to your primary Sentinel workspace using the data connector for Microsoft Defender XDR."
  - Confidence: High.
- **Keeping the legacy connector (S3).** "If you don't want to stream correlated tenant data for Defender for Cloud to the primary workspace, continue to use the ... (Legacy) connector."
- **Empty incidents risk (S22).** With XDR incident integration and only the legacy connector, "you may receive Defender for Cloud incidents that contain empty alerts" for subscriptions the connector doesn't cover.
- **Alerts without incidents (S22).** To receive MDC alerts but not incidents, "use automation rules to immediately close Defender for Cloud incidents as they arrive."
- **Connector visibility (S23).** After onboarding to the Defender portal, the tenant-based connector "isn't listed in the Data connectors page in the Defender portal". S2 says the same for both MDC connectors. Configure it from the Azure portal before or during the transition. S23 also says the procedure is still relevant for Sentinel in the Defender portal *without* Defender XDR.
- **Incident sync opt-out.** No current Learn page fetched today gives a UI path to opt out of MDC incident or alert sync into Defender XDR (Gap G9). Search snippets mention "completely opt-out of the Defender for Cloud integration in the Microsoft Defender XDR portal". That wording comes from earlier versions of these pages and is not on the current pages. Treat it as **unverified / likely outdated**.
  - S16 documents **Settings > Microsoft Defender XDR > Alert service settings**, but its fetched content shows only Entra ID Protection options.
- **Other MDC behaviour (S21):**
  - Informational MDC alerts aren't integrated.
  - MDC alert status syncs in both directions between MDC and Defender XDR.
  - MDE alerts on cloud resources don't sync status.
  - Use the **alert subscription ID** filter to scope by subscription.
- **Legacy connector details (S23).** Bi-directional sync needs Contributor or Security Admin on the subscription. KQL: `SecurityAlert | where ProductName == "Azure Security Center"`.

---

## Q7. Schema and API changes

### 7.1 Tables
- **`SecurityIncident`:**
  - `ProviderName == "Microsoft XDR"` for incidents after onboarding (S7, S2).
  - `Description` is no longer included (S2), but the schema reference still lists it (S33) (Gap G3).
  - Other columns per S33: `AdditionalData`, `AlertIds`, `IncidentUrl`, `ModifiedBy`, `ProviderIncidentId`, `RelatedAnalyticRuleIds`, `Tasks`, `Title`, `Labels`, `Comments`.
- **`SecurityAlert`:** alerts from Microsoft products now arrive through the XDR connector, with the field differences in S4. The standalone schema is in S49.
- **`AlertInfo` / `AlertEvidence` (advanced hunting):** contain Sentinel alerts that are tied to incidents (S2).
- **`IdentityInfo`:** schema differences in advanced hunting, and table-level RBAC is lost (S2). Out of scope; noted only.

### 7.2 SecurityInsights (Sentinel) REST API, api-version 2025-09-01
- **Still supported for Sentinel resources.** S2: "The Microsoft Sentinel API continues to support actions against Microsoft Sentinel resources, like analytics rules, automation rules and more."
- **Graph recommended for incidents and alerts.** S2: "For interacting with unified incidents and alerts, we recommend that you use the Microsoft Graph REST API." Callers of SecurityInsights incidents "might need to update your automation conditions and trigger criteria due to changes in the response body."
- **Incident fields (S26):**
  - `properties.providerName` (example "Azure Sentinel"), `properties.providerIncidentId`, `properties.incidentUrl` ("deep-link url to the incident in Azure portal").
  - `properties.additionalData.alertProductNames`, `properties.additionalData.providerIncidentUrl` ("The provider incident url to the incident in Microsoft 365 Defender portal").
- **S2 field comparison table:**
  - `providerIncidentUrl` is an additional field for a direct link to the incident, usable for ticketing (ServiceNow). `incidentUrl` still points to the Sentinel portal.
  - `providerName` "Azure Sentinel" becomes "Microsoft XDR".
  - `alertProductNames` "Requires adding `?$expand=alerts` to the GET", with the example `https://graph.microsoft.com/v1.0/security/incidents/368?$expand=alerts`. This mixes the two APIs (Gap G7).
  - New in Graph alerts: `serviceSource` (for example "microsoftDefenderForCloudApps"), `detectionSource` (for example "cloudAppSecurity") and `productName`.
- **Rule kinds (S52).** The `AlertRuleKind` enum in 2025-09-01 lists only `Scheduled`, `MicrosoftSecurityIncidentCreation` and `Fusion`. NRT and other kinds are not in this GA enum (Gap G12).

### 7.3 Microsoft Graph security API (v1.0)
- **Sentinel data requires onboarding.** S46: "To view Sentinel alerts and incidents you must onboard Sentinel to the Defender Portal."
- **Incidents** (`GET /security/incidents`, S25):
  - Permissions: **SecurityIncident.Read.All** (least privileged, delegated and application). Higher privileged: **SecurityIncident.ReadWrite.All**.
  - Delegated roles: Security Reader, Global Reader, Security Operator, Security Administrator.
  - OData: `$count`, `$filter` (assignedTo, classification, createdDateTime, determination, lastUpdateDateTime, severity, status), `$skip`, `$top`, `$expand` (alerts).
  - The resource has `incidentWebUrl`, `redirectIncidentId`, `description`, `summary`, `customTags`, `systemTags`, `lastModifiedBy` and `priorityScore`. It has **no** `providerName` and no `alertProductNames` (S24).
- **Alerts** (`GET /security/alerts_v2`, S27):
  - Permissions: **SecurityAlert.Read.All** / **SecurityAlert.ReadWrite.All**.
  - `$filter` supports **serviceSource**. Official example: `GET https://graph.microsoft.com/v1.0/security/alerts_v2?$filter=serviceSource eq 'microsoftSentinel'`. Sample `detectionSource` is "scheduledAlerts".
- **Enum values:**
  - `serviceSource` includes `microsoftSentinel` and `microsoftDefenderForCloud` (S48).
  - `detectionSource` includes `scheduledAlerts`, `nrtAlerts`, `microsoftSentinel`, `builtInMl` and `microsoftDefenderThreatIntelligenceAnalytics`. These need the header `Prefer: include-unknown-enum-members` (S47).
- **Hunting** (`POST /security/runHuntingQuery`, S28):
  - Permission: **ThreatHunting.Read.All** (delegated and application; no higher privilege exists).
  - Body: `Query`, optional `Timespan` (ISO 8601, default 30 days), optional `workspaceId` (GUID; defaults to the caller's primary workspace).
  - S34: queries through the API are limited to the primary workspace in some capabilities.
- **Alert "Move alerts"** to a new or existing incident (S46).
- **Detection rules permissions** (custom detections, S20): Defender **Security settings (manage)** or Security Administrator. For Sentinel data, **Microsoft Sentinel Contributor**.

### 7.4 ITSM and ServiceNow
- **Documented:**
  - Description missing for external ticketing integrations such as ServiceNow (S8).
  - Use `providerIncidentUrl` to sync a direct link to a third-party ticketing system (S2).
  - Playbook use case: "create an automation rule for all new incidents, and attach a playbook that opens a ticket in ServiceNow" (S11).
- **Not found:** no current, end-to-end official Learn guide for ServiceNow after onboarding. The Tech Community ITSM blog could not be rendered (Gap G16).

---

## Q8. Official validation steps after onboarding

1. **Validate migrated alert grouping rules (S5)**, if **Retain Sentinel incident creation behavior for XDR alerts** was selected. Go to **Settings > Microsoft Defender XDR > Alert grouping**, verify the rules are present and enabled, then open a rule and confirm its settings.
2. **Validate incident and automation outcomes (S5), verbatim list:**
   1. "Trigger representative detections."
   2. "Verify incident grouping still matches expected automation patterns."
   3. "Validate playbooks, routing, and ticketing integrations that depend on incident behavior."
   4. "Confirm incident title behavior matches your operational expectations."
   5. "If manual incident merges are used in your process, validate those workflows."
3. **Review automation rules (S8).** "We recommend reviewing your automation rules to ensure you're seeing the expected results."
4. **Review analytics rules for duplicates** caused by alert promotion (S2, S3).
5. **Verify XDR incident ingestion (S7)** with the `SecurityIncident | where ProviderName == "Microsoft XDR"` query and the 14-day trend query (section 9).
6. **Verify health and audit tables (S31)** with `_SentinelHealth() | take 20` and `_SentinelAudit() | take 20`.
7. **Review queries, rules, workbooks and automation** that depend on standalone connectors or on fields that change in the alert schema (S4).
8. **Review `IdentityInfo`-based queries** in advanced hunting and custom detections (S2).

---

## 9. Validated KQL / API snippets

All KQL below is read-only. Syntax is copied exactly from the cited page.

### K1 - XDR incidents present (S7, section "Connect incidents and alerts")
Prerequisite: Defender XDR connector with incidents and alerts. Run in Logs (Azure portal) or Advanced hunting.
```kusto
   SecurityIncident
   | where ProviderName == "Microsoft XDR"
```

### K2 - 14-day daily trend of XDR incidents (S7, section "Verify data ingestion")
```kusto
let Now = now(); 
(range TimeGenerated from ago(14d) to Now-1d step 1d 
| extend Count = 0 
| union isfuzzy=true ( 
    SecurityIncident
    | where ProviderName == "Microsoft XDR"
    | summarize Count = count() by bin_at(TimeGenerated, 1d, Now) 
) 
| summarize Count=max(Count) by bin_at(TimeGenerated, 1d, Now) 
| sort by TimeGenerated 
| project Value = iff(isnull(Count), 0, Count), Time = TimeGenerated, Legend = "Events") 
| render timechart 
```
S7 also has a version for one advanced hunting table: replace `SecurityIncident | where ProviderName == "Microsoft XDR"` with `DeviceEvents`.

### K3 - Defender for Cloud alerts (S23)
Prerequisite: an MDC connector.
```kusto
SecurityAlert 
| where ProductName == "Azure Security Center"
```

### K4 - Automation health (S29)
Prerequisite: auditing and health monitoring enabled (S31).
```kusto
SentinelHealth
| where OperationName == "Automation rule run"
```
```kusto
SentinelHealth
| where OperationName == "Playbook was triggered"
```
Statuses: Automation rule run is `Success`, `Partial success` or `Failure`. Playbook was triggered is `Success` or `Failure` (S29, S32).

### K5 - Automation rule to playbook run correlation (S29)
Prerequisite: health monitoring, plus Logic Apps diagnostic settings sending to the Sentinel workspace (`AzureDiagnostics`).
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
Caveat: Enhanced Alert Trigger runs are **not** written to `SentinelHealth` (S38).

### K6 - Analytics rule health and audit (S30)
Prerequisite: health and audit enabled. Use the `_SentinelHealth()` and `_SentinelAudit()` functions.
```kusto
_SentinelHealth()
| where SentinelResourceType == "Analytics Rule"
```
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
```kusto
_SentinelAudit()
| where SentinelResourceType =="Analytic Rule"
| where Description =="Analytics rule deleted"
```
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
Skipped windows for scheduled rules:
```kusto
_SentinelHealth()| where SentinelResourceType == @"Analytics Rule" 
| where SentinelResourceKind == "Scheduled"
| where Status != "Success"
| extend startTime = tostring(ExtendedProperties["QueryStartTimeUTC"])
| summarize failuresByStartTime = count() by startTime, SentinelResourceId
| where failuresByStartTime == 6
| summarize count() by SentinelResourceId
```
NRT delay:
```kusto
_SentinelHealth()
| where SentinelResourceKind == "NRT"
| extend startTime = todatetime(ExtendedProperties["QueryStartTimeUTC"]), endTime = todatetime(ExtendedProperties["QueryEndTimeUTC"]), alertsCreated = toint(ExtendedProperties["AlertsGeneratedAmount"])
| where alertsCreated == 0 
| extend ruleDelay = datetime_diff('minute', endTime, startTime)
| project TimeGenerated, ruleDelay, SentinelResourceId
| render timechart
```
**Casing caveat.** S32 lists `SentinelResourceType` values as `Analytics rule` (lowercase r). The S30 queries use `"Analytics Rule"`, and the audit queries use `"Analytic Rule"`. KQL `==` is case-sensitive. If the tool adapts these queries it should use `=~` and record that change; official verbatim syntax is kept above.

### K7 - Health/audit table verification (S31)
UI to enable (S31): Defender portal **System > Settings > Microsoft Sentinel > Auditing and health monitoring > Enable**. Azure portal: **Configuration > Settings > Settings**.
```kusto
_SentinelHealth()
 | take 20
```
```kusto
_SentinelAudit()
 | take 20
```

### K8 - Account naming compatibility (S45)
```kql
coalesce(Account.UPNprefix, Account.Name, Account.DisplayName)
```

### A1 - Graph (read-only GET/POST; permissions in 7.3)
```http
GET https://graph.microsoft.com/v1.0/security/incidents?$expand=alerts
```
```http
GET https://graph.microsoft.com/v1.0/security/alerts_v2?$filter=serviceSource eq 'microsoftSentinel'
```
```http
POST https://graph.microsoft.com/v1.0/security/runHuntingQuery

{
    "Query": "DeviceProcessEvents | where InitiatingProcessFileName =~ \"powershell.exe\" | project Timestamp, FileName, InitiatingProcessFileName | order by Timestamp desc | limit 2"
}
```
(S25, S27, S28. `runHuntingQuery` is a POST but is read-only. It also accepts an optional `workspaceId`.)

### A2 - SecurityInsights (read-only GET; Azure RBAC, for example Microsoft Sentinel Reader)
```http
GET https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.OperationalInsights/workspaces/{workspaceName}/providers/Microsoft.SecurityInsights/incidents/{incidentId}?api-version=2025-09-01
```
```http
GET https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.OperationalInsights/workspaces/{workspaceName}/providers/Microsoft.SecurityInsights/automationRules?api-version=2025-09-01
```
```http
GET https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.OperationalInsights/workspaces/{workspaceName}/providers/Microsoft.SecurityInsights/alertRules?api-version=2025-09-01
```
(S26, S51, S52.)

---

## 10. Gaps and ambiguities

- **G1 - Correlation default.**
  - S15 (2026-10-04) says all analytics rules are excluded from correlation by default at first onboarding, and the tenant **Incident correlation default setting** is off by default.
  - S2 (2026-09-10) says the Defender XDR engine "fully controls" grouping and merging. S42 says grouping settings are only "initial instructions".
  - It is not documented whether "default off" applies to tenants that onboarded before the setting existed.
  - The tool must read the tenant setting and the per-rule tags, not assume.
- **G2 - Add/remove alerts.** S2 says moving alerts between incidents is supported in the Defender portal. S2 and S8 say it is not supported after onboarding for playbooks. Both are on the same page.
- **G3 - Description.** S2 and S8 say `SecurityIncident` no longer includes Description. S33 (generated schema, 2026-08-27) still lists the column. S24 (Graph) has `description`. S6 lists Description as a synced field (Azure-portal integration). Interpret as "not populated" and verify empirically.
- **G4 - Incident provider condition on existing rules.** S8 says the property is removed "In both the Azure portal and the Defender portal" and rules then run on all incidents. It is not documented whether the API still stores or returns `IncidentProviderName` conditions on existing rules.
- **G5 - Latency figures differ:** 5 minutes (incident integration and playbook trigger), 10 minutes (automation rule run), and a 5-10 minute batching window.
- **G6 - NRT custom detections on Sentinel data.** S41's known issues say "Near real-time detection frequency isn't available for detections that include Microsoft Sentinel data." S20 and S50 list Continuous (NRT) support for specific Sentinel tables. S41 is probably stale.
- **G7 - `alertProductNames` and `$expand=alerts`.** S2's table mixes APIs. `alertProductNames` is a SecurityInsights `additionalData` field (S26). The Graph incident (S24) has no such property; Graph alerts expose `productName`, `serviceSource` and `detectionSource`.
- **G8 - `providerName`** exists on SecurityInsights incidents and `SecurityIncident`, but not on Graph incidents.
- **G9 - MDC opt-out.**
  - No current UI path is documented for opting out of MDC incident or alert sync.
  - S23 and S2 say the MDC connectors are hidden in the Defender portal Data connectors page.
  - S3 tells you to connect the tenant-based connector in the primary workspace, so configuration likely has to happen from the Azure portal.
- **G10 - Alert tuning scope.** S2 says it applies to Sentinel alerts, but S16 doesn't list Sentinel as a service source. Hide alert works only for MDE. The 2026-11-08 detection-source change may affect custom detections.
- **G11 - Automation rules and custom-detection incidents.** S50 marks "Sentinel automation rules with incident trigger" as **Planned** for custom detections. S14 says automation rules apply to incidents "regardless of their source". This is ambiguous.
- **G12 - API enum for rule kinds.** The 2025-09-01 `AlertRuleKind` lists only Scheduled, MicrosoftSecurityIncidentCreation and Fusion. NRT and other kinds probably need a preview `api-version` (not verified).
- **G13 - `IncidentUpdatedBySource`.** The REST docs don't list its value strings. The UI labels are in S9.
- **G14 - `SentinelResourceType` casing** varies across S30 and S32. Use `=~`.
- **G15 - Graph enum header.** S47 explicitly requires `Prefer: include-unknown-enum-members` for the `microsoftSentinel`, `scheduledAlerts` and `nrtAlerts` detectionSource values. For `serviceSource`, S27's example filter does not show the header. Test both.
- **G16 - ITSM.** No current official Learn guide was found for ServiceNow with Defender-portal incidents. The Tech Community ITSM blog couldn't be rendered.
- **G17 - Tasks.** The incident cases (preview) task experience (manage-incident-case-tasks) was not fetched. S37 is the legacy experience.
- **G18 - Alert-only alerts.** No page states where they can be queried after onboarding. `SecurityAlert` in the workspace is inferred. `AlertInfo` holds only incident-tied Sentinel alerts.
- **G19 - Fusion after offboarding.** Not documented.
- **G20 - Alert grouping rules (Defender).** Apart from S5's screenshot reference, no dedicated Learn page was found describing the fields or conditions of the alert grouping rules UI.
- **G21 - Incident cases (preview).** S13 and S14 note that cases have separate merge and split docs. Behaviour may differ from the legacy incident experience described here.
- **G22 - Sentinel-only tenants (no Defender XDR).** Custom detections are "limited or unavailable" (S1). Several items above assume Defender XDR licensing.

---

## 11. Candidate checks for the tool

Notes for all checks:
- Every check is read-only unless stated otherwise.
- "Pre" means before onboarding; "Post" means after.
- Checks marked *derived* use logic built from the documented field names but not copied from a Learn query.

| ID | What | Why | Where | How | Expected result | Evidence to record | Source |
|---|---|---|---|---|---|---|---|
| C01 | Fusion rule state | Disabled on onboarding; replaced by XDR correlation | SecurityInsights alertRules | GET alertRules (A2) and filter `kind == "Fusion"` | Post: `enabled == false` | rule name, `enabled`, `lastModifiedUtc` | S2, S39, S52 |
| C02 | Microsoft incident creation rules | Deactivated and unsupported; non-XDR products need scheduled rules | alertRules | Filter `kind == "MicrosoftSecurityIncidentCreation"`; list `enabled`, `productFilter`, `severitiesFilter`, `displayNamesFilter` | Pre: inventory of filters to recreate (alert tuning, automation rules, or alert grouping via S5). Post: none active | rule names, filters, `enabled` | S2, S6, S40, S52 |
| C03 | Alert-only analytics rules | Alerts not visible in the Defender portal; docs say leave incident creation Enabled | alertRules | Filter `incidentConfiguration.createIncident == false` | Flag each rule for review | rule id, name, kind, `createIncident` | S2, S42, S52 |
| C04 | Reopen closed incidents | Option unavailable; new alerts create new incidents | alertRules | `incidentConfiguration.groupingConfiguration.reopenClosedIncident == true` | Flag | rule id and setting | S2, S42 |
| C05 | Alert grouping reliance | Grouping is only initial instructions under correlation | alertRules | `groupingConfiguration.enabled == true`; record `matchingMethod` and `lookbackDuration` | Flag for post-onboarding grouping validation | settings snapshot | S42, S2, S15 |
| C06 | Correlation inclusion state | Default exclusion and per-rule tags decide whether XDR correlation applies | alertRules description; Defender **System > Settings > Microsoft Defender XDR > Rules > Incident correlation** | Case-insensitive regex for a leading `#DONT_CORR#` / `#INC_CORR#` in `properties.description`; record the tenant toggle manually (no API documented in sources) | Inventory: tenant default plus a per-rule state | tag found, tenant toggle (screenshot/attestation) | S15 |
| C07 | Automation rules on the provider condition | Condition removed; rules then run on all incidents | automationRules | Walk `triggeringLogic.conditions` (including nested Boolean) for `propertyName == "IncidentProviderName"` | Flag, and suggest the Analytic rule name condition | rule name, condition JSON | S8, S51 |
| C08 | Automation rules on title | Titles may change | automationRules | `propertyName == "IncidentTitle"` | Flag, and suggest analytics rule name or tags | rule, operator, values | S8, S6, S51 |
| C09 | Automation rules on description | Description condition "won't work" on incident creation | automationRules | `propertyName == "IncidentDescription"` with `triggersOn == "Incidents"` | Flag (high priority when `triggersWhen == "Created"`) | rule, trigger | S8, S51 |
| C10 | Automation rules on Updated by | *Microsoft 365 Defender* becomes *Other* | automationRules | `propertyName == "IncidentUpdatedBySource"`; capture values for manual review (value strings undocumented, G13) | Flag for manual review | rule, values | S8, S9, S51 |
| C11 | Alert-trigger automation rules | Act only on Sentinel alerts in the Defender portal | automationRules | `triggersOn == "Alerts"` | Informational; if XDR alerts were intended, point to the Enhanced Alert Trigger | rule, linked analytics rules | S8, S9, S38 |
| C12 | Playbooks used manually on alerts or entities | Not supported in the Defender portal | Process questionnaire plus Logic Apps inventory | Ask the SOC; optionally inspect workflow triggers for the Sentinel alert or entity trigger (trigger identifiers in workflow JSON not verified; manual review) | Flag affected runbooks | list of playbooks and use cases | S2, S8, S12, S44 |
| C13 | Playbooks that add or remove alerts | Not supported after onboarding | Logic Apps definitions (manual review) | Review the actions used (exact operation IDs not verified) | Flag | playbook names | S2, S8 |
| C14 | XDR connector active (post) | Required; incidents and alerts must be on | Workspace logs | K1 or K2 | Post: rows with `ProviderName == "Microsoft XDR"` when Defender XDR is licensed | count, last `TimeGenerated` | S2, S7 |
| C15 | Standalone Microsoft connector dependencies (multi-workspace) | Auto-disconnected in secondary workspaces; schema differences | Each workspace | *derived*: `SecurityAlert \| summarize count() by ProductName, ProviderName` per workspace, plus a list of analytics rules querying `SecurityAlert` by ProductName | Pre: list of dependent rules and queries | counts per workspace, rule list | S4, S34 |
| C16 | Defender for Cloud configuration | Duplicate or empty-incident risk | Azure portal Data connectors; alertRules | Record which MDC connector is connected (manual/attest); find `MicrosoftSecurityIncidentCreation` rules with `productFilter == "Azure Security Center"` and scheduled rules whose query references MDC alerts (*derived* text search) | Recommendation: tenant-based on, legacy off, MDC incident-creating rules off | connector state, rule list | S2, S3, S21, S22, S23, S52 |
| C17 | Health monitoring enabled | Needed for automation and analytics validation | Workspace logs | K7 | Rows returned | row count, latest time | S31 |
| C18 | Automation rule failures after onboarding | Detect broken conditions or permissions | Workspace logs | *derived from K4*: `SentinelHealth \| where OperationName == "Automation rule run" \| where Status != "Success"` | Few or no failures; investigate the rest using the S29 error table | failing rules, Description | S29, S32 |
| C19 | Analytics rule health | Ensure detections keep running | Workspace logs | K6 queries (use `=~` for resource type; G14) | No auto-disabled rules and no skipped windows | rule ids, reasons | S30 |
| C20 | API and ITSM consumers of SecurityInsights incidents | `providerName`, Description, URL changes | Integration inventory (questionnaire) and code search | Look for `providerName == "Azure Sentinel"`, use of `incidentUrl`, and dependence on `description` | Plan to use `additionalData.providerIncidentUrl` and/or Graph | list of integrations and fields used | S2, S8, S24, S26 |
| C21 | Graph app permissions | Least-privileged access for unified incidents and alerts | Entra app registrations | Read the app's granted permissions (out of scope here; manual attestation) | `SecurityIncident.Read.All`, `SecurityAlert.Read.All`, `ThreatHunting.Read.All` (ReadWrite only if updating) | app id, permissions | S25, S27, S28 |
| C22 | Manual or API-created incidents in use | Not synced to the Defender portal | Process questionnaire; *derived heuristic* KQL | *derived (Low)*: `SecurityIncident \| summarize arg_max(TimeGenerated,*) by IncidentNumber \| where array_length(AlertIds) == 0` | Flag workflows that create incidents | count, sample numbers | S2, S36 |
| C23 | Task automation | Tasks sync one-way; no automatic task creation in Defender | automationRules | `actions[].actionType == "AddIncidentTask"` | Informational: tasks still sync from Sentinel automation | rule names | S37, S51 |
| C24 | Comment editing and similar-incidents workflows | Not supported in the Defender portal | Process questionnaire | Ask the SOC | Flag runbooks to update | answers | S2 |
| C25 | Multi-workspace automation | XDR data only in the primary workspace | Workspace inventory | Identify automation rules in non-primary workspaces that act on XDR incidents (*derived*: rules with no analytics-rule scoping in secondary workspaces) | Flag for transfer | rule list per workspace | S8, S34 |
| C26 | Alert promotion duplicates | Possible duplicate alerts (CrowdStrike today) | alertRules and connectors | Find analytics rules over CrowdStrike CCF tables (*derived* query-text search) | Flag for dedup review | rules | S2, S16 |
| C27 | Post-onboarding alert grouping validation | One-time migration only | Defender **Settings > Microsoft Defender XDR > Alert grouping** | Manual check and screenshot | Rules present and enabled when the Retain option was chosen | screenshot, rule list | S5 |
| C28 | CMK notice | Alerts and incidents lose CMK encryption after onboarding | Workspace CMK configuration (out of scope) | Attest | Informational warning | CMK enabled yes/no | S2 |
