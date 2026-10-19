# 01 - Transition, onboarding, prerequisites, RBAC, data governance, multi-workspace / multi-tenant

Research date: 2026-10-19. All pages were fetched on that date.

How to read this file:

- Every claim cites a source ID like [S1]. The source register below gives the title, final URL, and page dates for each ID.
- Page dates: `ms.date` is the article date in the page metadata. `updated` is the page's `updated_at` metadata timestamp. Both are recorded.
- Confidence levels:
  - **High**: stated explicitly in a current official Microsoft Learn page.
  - **Medium**: implied by official docs, or from a single non-official or community source.
  - **Low**: uncertain or contradictory.
- Verbatim quotes are kept to 25 words or fewer and appear in quotation marks.
- UI labels are in **bold** exactly as the docs write them. Portal paths use `>`.

---

## Source register

| ID | Title (as fetched) | Final URL | ms.date | updated |
|---|---|---|---|---|
| S1 | Transition Your Microsoft Sentinel Environment to the Defender Portal | https://learn.microsoft.com/en-us/azure/sentinel/move-to-defender | 2026-09-10 | 2026-09-24 |
| S2 | Microsoft Sentinel in the Microsoft Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/microsoft-sentinel-defender-portal | 2026-06-18 | 2026-09-23 |
| S3 | Connect Microsoft Sentinel to the Microsoft Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/microsoft-sentinel-onboard (no redirect; `/en-us/unified-secops-platform/microsoft-sentinel-onboard` also resolves to this page) | 2026-09-10 | 2026-09-23 |
| S4 | What is Microsoft Sentinel SIEM? (section "Microsoft Sentinel in the Azure portal retirement timeline") | https://learn.microsoft.com/en-us/azure/sentinel/overview | 2026-01-28 | 2026-05-14 |
| S5 | Onboard to Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/quickstart-onboard | 2026-07-02 | 2026-09-23 |
| S6 | Integrated Security Operations Center (ISOC) in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/isoc-overview. Also the redirect target of `/en-us/unified-secops/overview-plan`, `/en-us/unified-secops/overview-deploy` and `/en-us/unified-secops/`. | 2026-09-14 | 2026-09-23 |
| S7 | Multiple workspaces - Microsoft Sentinel in Defender portal | https://learn.microsoft.com/en-us/azure/sentinel/workspaces-defender-portal | 2026-06-08 | 2026-09-23 |
| S8 | Microsoft Defender portal implementation guide for Managed Security Service Providers (MSSPs) | https://learn.microsoft.com/en-us/defender-xdr/playbook-managed-security (redirected from `/unified-secops/playbook-managed-security`) | 2026-08-03 | 2026-09-23 |
| S9 | What's new in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/whats-new (redirected from `/unified-secops/whats-new`) | 2026-09-08 | 2026-10-13 |
| S10 | What's new in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/whats-new | 2026-08-24 | 2026-09-23 |
| S11 | Roles and permissions in the Microsoft Sentinel platform | https://learn.microsoft.com/en-us/azure/sentinel/roles | 2026-01-07 | 2026-09-10 |
| S12 | Data retention and data security in Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-xdr/data-privacy | 2025-08-24 | 2026-06-24 |
| S13 | Microsoft Defender unified role-based access control (RBAC) | https://learn.microsoft.com/en-us/defender-xdr/manage-rbac | 2026-08-07 | 2026-10-15 |
| S14 | Map Microsoft Defender unified role-based access control (RBAC) permissions | https://learn.microsoft.com/en-us/defender-xdr/compare-rbac-roles | 2026-07-30 | 2026-09-08 |
| S15 | Activate Microsoft Defender unified role-based access control (URBAC) | https://learn.microsoft.com/en-us/defender-xdr/activate-defender-rbac | 2026-07-10 | 2026-08-11 |
| S16 | Configure Microsoft Sentinel scoping (row-level RBAC) | https://learn.microsoft.com/en-us/defender-xdr/scoping | 2026-08-05 | 2026-08-11 |
| S17 | What's new in Microsoft Defender unified role-based access control (RBAC) | https://learn.microsoft.com/en-us/defender-xdr/whats-new-in-microsoft-defender-urbac | 2025-07-06 | 2026-04-13 |
| S18 | Set up Customer-managed Keys in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/customer-managed-keys | 2026-07-12 | 2026-08-16 |
| S19 | Geographical availability and data residency in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/geographical-availability-data-residency | 2026-08-18 | 2026-09-08 |
| S20 | Microsoft Defender XDR integration with Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/microsoft-365-defender-sentinel-integration | 2026-06-17 | 2026-09-24 |
| S21 | Set up Microsoft Defender multitenant management | https://learn.microsoft.com/en-us/defender-xdr/mto-requirements | 2026-07-02 | 2026-09-10 |
| S22 | Manage multiple Microsoft Sentinel workspaces with workspace manager | https://learn.microsoft.com/en-us/azure/sentinel/workspace-manager | 2026-07-01 | 2026-08-08 |
| S23 | Microsoft Sentinel data lake overview | https://learn.microsoft.com/en-us/azure/sentinel/datalake/sentinel-lake-overview | 2025-08-11 | 2026-05-14 |
| S24 | Plan costs and understand pricing and billing - Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/billing | 2026-04-01 | 2026-06-03 |
| S25 | Onboard to Microsoft Sentinel Data Lake and Graph | https://learn.microsoft.com/en-us/azure/sentinel/datalake/sentinel-lake-onboarding | 2026-07-01 | 2026-09-10 |
| S26 | Manage access to Microsoft Sentinel data by resource | https://learn.microsoft.com/en-us/azure/sentinel/resource-context-rbac | 2026-07-02 | 2026-08-08 |
| S27 | Advanced hunting with Microsoft Sentinel data in Microsoft Defender | https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-microsoft-defender | 2026-06-09 | 2026-09-23 |
| S28 | Remove Microsoft Sentinel from your workspace | https://learn.microsoft.com/en-us/azure/sentinel/offboard | 2026-07-01 | 2026-09-10 |
| S29 | Automate threat response in Microsoft Sentinel with automation rules | https://learn.microsoft.com/en-us/azure/sentinel/automate-incident-handling-with-automation-rules | 2024-10-16 | 2026-06-30 |
| S30 | Best practices for Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/best-practices | 2025-07-16 | 2026-09-10 |
| S31 | Extend Microsoft Sentinel across workspaces and tenants | https://learn.microsoft.com/en-us/azure/sentinel/extend-sentinel-across-workspaces-tenants | 2025-06-10 | 2026-05-14 |
| S32 | Prerequisites for deploying Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/prerequisites | 2026-03-06 | 2026-05-28 |
| S33 | Configure delegated access with governance relationships for multitenant organizations | https://learn.microsoft.com/en-us/defender-xdr/governance-relationships (redirected from `/unified-secops/governance-relationships`) | 2026-08-07 | 2026-10-15 |
| S34 | Microsoft Defender multitenant management | https://learn.microsoft.com/en-us/defender-xdr/mto-overview | 2026-05-27 | 2026-09-23 |

Non-official and community sources (Medium or Low confidence only):

| ID | Title | URL | Date |
|---|---|---|---|
| N1 | Microsoft Extends Unified RBAC to Sentinel With Row-Level Access Controls (Petri, Rabia Noureen) | https://petri.com/microsoft-sentinel-unified-rbac-row-level-access/ | 2026-03-23 |
| N2 | Unified RBAC becomes the default in Microsoft Defender (Topedia, Tobias Asböck) | https://blog.topedia.com/2026/08/unified-rbac-becomes-the-default-in-microsoft-defender/ | 2026-08-21 |
| N3 | Microsoft Q&A: "Unable to onboard Sentinel workspace from Lighthouse to Defender" (accepted answer is from a community member, not Microsoft) | https://learn.microsoft.com/en-us/answers/questions/5973992/unable-to-onboard-sentinel-workspace-from-lighthou | asked 2026-08-13 |
| N4 | Microsoft Q&A: "Unable to connect Microsoft Sentinel workspace to Defender portal as Primary workspace" (unresolved) | https://learn.microsoft.com/en-in/answers/questions/5894185/unable-to-connect-microsoft-sentinel-workspace-to | asked 2026-05-18 |

These pages could not be read:

- `https://learn.microsoft.com/en-us/defender-xdr/overview-plan` returned 404.
- These Tech Community blogs are client-rendered, so only their titles were retrievable, not their content:
  - "Managing Microsoft Sentinel and Microsoft Defender XDR permissions in Microsoft Defender portal" (`.../microsoftsentinelblog/managing-microsoft-sentinel-and-microsoft-defender-xdr-permissions-in-microsoft-/4480583`)
  - "Planning your move to Microsoft Defender portal for all Microsoft Sentinel customers" (`.../microsoft-security-blog/planning-your-move-to-microsoft-defender-portal-for-all-microsoft-sentinel-custo/4428613`)
  - "Microsoft Sentinel is now supported in Unified RBAC with row-level access" (`.../microsoftsentinelblog/microsoft-sentinel-is-now-supported-in-unified-rbac-with-row-level-access/4503121`)

**Status of the "Plan" and "Deploy" pages:** The pages "Plan for unified security operations in the Defender portal" (`/en-us/unified-secops/overview-plan`) and "Deploy for unified security operations" (`/en-us/unified-secops/overview-deploy`) now redirect to the ISOC preview overview [S6]. Search indexes still list them under titles such as "Planning Guidance for Unified Security Operations in the Microsoft Defender Portal". [S1] links both "Plan..." and "Deploy..." to `/en-us/defender-xdr/isoc-overview`. As of 2026-10-19, no live standalone planning or deployment guide could be found at a different URL. Confidence: High that the redirects exist; the content of the old guides could not be verified.

---

## Q1. Azure portal retirement: wording, scope, redirection, auto-onboarding

- **Claim:** The Microsoft Sentinel *Azure portal experience* is being retired, not Microsoft Sentinel itself. Verbatim: "After **March 31, 2027**, Microsoft Sentinel will no longer be supported in the Azure portal and will be available only in the Microsoft Defender portal."
  - Source: [S2], [S4], [S10] (January 2026 entry "Updated date: Microsoft Sentinel in the Azure portal to be retired March 2027"). The same sentence appears in banners on [S11], [S24], [S27], [S29] and [S30].
  - Confidence: High.
- **Claim:** Customers still on the Azure portal will be redirected. Verbatim (from the Important note): customers "using Microsoft Sentinel in the Azure portal will be redirected to the Defender portal and will use Microsoft Sentinel in the Defender portal only."
  - Source: [S2], [S11], [S24], [S29], [S30].
  - Confidence: High.
  - Caveat: No page gives the redirect mechanism or a date for when forced redirection starts for existing customers. No page says whether workspaces that were never onboarded get onboarded automatically at retirement. See Gaps.
- **Claim (history):** The date changed. The July 2025 entry in [S10] said "Starting in **July 2026**, Microsoft Sentinel will be supported in the Defender portal only, and any remaining customers using the Azure portal will be automatically redirected." The January 2026 entry moved the date to March 31, 2027.
  - Source: [S10].
  - Confidence: High.
  - Caveat: [S30] still contains the outdated bullet "By July 2026, all Microsoft Sentinel customers using the Azure portal will be redirected to the Defender portal." The same page's banner says March 31, 2027.
- **Claim:** Sentinel in the Defender portal is generally available and does not need Defender XDR or E5. Verbatim: "Microsoft Sentinel is generally available in the Microsoft Defender portal, including for customers without Microsoft Defender XDR or an E5 license."
  - Source: [S2], [S4]; [S3] says "You don't need Microsoft Defender XDR or an E5 license."
  - Confidence: High.
- **Claim (auto-onboarding of new customers):** "New customers" means customers "onboarding the first workspace in their tenant to Microsoft Sentinel". The rule applies starting **July 2025** ([S4]) or on or after **July 1, 2025** ([S10]). Such new customers "who also have the permissions of a subscription Owner or a User access administrator, and are not Azure Lighthouse-delegated users" have their workspaces automatically onboarded to the Defender portal when they onboard to Sentinel.
  - Source: [S4], [S10], [S5], [S20].
  - Confidence: High.
  - Experience matrix [S4]:
    - **Existing customers** creating new workspaces in a tenant that already has a Sentinel workspace: "Workspaces are not automatically onboarded, and users don't see redirection links".
    - **Azure Lighthouse-delegated users**: not auto-onboarded, and no redirection links.
    - **New customers without the required permissions**: not auto-onboarded. They see redirection links, and a user with the required permissions must onboard the workspace.
  - Caveat: [S3] softens this to "In many cases, customers onboarding to Microsoft Sentinel after **July 1, 2025** are automatically onboarded".
- **Claim:** Users of auto-onboarded workspaces see links in the Azure portal that redirect to the Defender portal, and "Such users use Microsoft Sentinel in the Defender portal only."
  - Source: [S4].
  - Confidence: High.
- **Related regional retirement (Sentinel itself):** "Microsoft Sentinel was retired in Azure operated by 21Vianet on August 18, 2026".
  - Source: [S19].
  - Confidence: High.
- **Government clouds:** In the May 2025 entry, all GA Sentinel use cases, including multitenant and multi-workspace, "and support for all government and commercial clouds" became GA in the Defender portal.
  - Source: [S10].
  - Confidence: High.

## Q2. What connecting a workspace does and does not do; offboarding

What does NOT change:

- **Claim:** Log data stays in Log Analytics. Verbatim: "Microsoft Sentinel's integration into Microsoft Defender doesn't change how Microsoft Sentinel stores log data in Log Analytics."
  - Source: [S1].
  - Confidence: High.
- **Claim:** The raw data storage location doesn't change. Processing may move: "the service might process data in the destination regions specified during onboarding, or in the existing Microsoft Defender XDR regions if applicable. The raw data storage location, however, remains unchanged."
  - Source: [S19].
  - Confidence: High.
- **Claim:** Non-Microsoft data connectors are unaffected: they "continue operating without interruption".
  - Source: [S1].
  - Confidence: High.
- **Claim:** Analytics rule functionality is unchanged. This covers creation, update and management through the wizard, repositories and the Sentinel API.
  - Source: [S1].
  - Confidence: High.
- **Claim:** Azure RBAC keeps working. Existing Azure RBAC permissions apply in the Defender portal. Verbatim: "Continue to manage roles and permissions for your Microsoft Sentinel users from the Azure portal".
  - Source: [S3].
  - Confidence: High.
  - Caveat: this changes if Unified RBAC is activated for the workspace (see Q6).
- **Claim:** The Sentinel API "continues to support actions against Microsoft Sentinel resources". For unified incidents and alerts, Microsoft recommends the Microsoft Graph API.
  - Source: [S1].
  - Confidence: High.
- **Claim:** Workbooks keep working. Azure workbooks "continue to be the primary tool for data visualization" and function as they did in the Azure portal.
  - Source: [S1].
  - Confidence: High.

What DOES change on connect (as documented):

- **Microsoft Defender XDR connector.** If you onboard and are licensed for Defender XDR, "Microsoft Sentinel is automatically connected to Defender XDR. The data connector for Defender XDR is automatically set up for you."
  - Source: [S20].
  - Confidence: High.
  - With multiple workspaces, the XDR connector connects to the primary workspace only [S1], [S7].
- **Standalone Microsoft alert connectors.** These are automatically disconnected in secondary workspaces during onboarding: Microsoft Defender for Office 365, Microsoft Entra ID Protection, Microsoft Defender for Cloud Apps, Microsoft Defender for Endpoint, and Microsoft Defender for Identity.
  - Source: [S1], [S7].
  - Confidence: High.
  - Caveat: [S20] says connectors for alert providers included in the XDR connector "are disconnected" without restricting this to secondaries. It lists "Microsoft Defender for Cloud Apps (alerts)". [S7] adds: "If you have other, standalone Microsoft data connectors with alerts in your workspaces, make sure to disconnect them before onboarding".
- **Microsoft security incident creation rules.** "Any active Microsoft security incident creation rules are deactivated to avoid creating duplicate incidents."
  - Source: [S1]; also [S20].
  - Confidence: High.
  - Microsoft incident creation rules "aren't supported in the Defender portal" [S1].
- **Fusion analytics rule.** "This rule is disabled when you onboard Microsoft Sentinel to the Defender portal." Defender XDR correlation replaces it.
  - Source: [S1].
  - Confidence: High.
- **Role assignment to Microsoft apps.** "the Microsoft Sentinel Contributor role is assigned to the Microsoft Threat Protection and WindowsDefenderATP apps in your subscription."
  - Source: [S1].
  - Confidence: High. See Q5.
- **Incident engine.** All incidents, including those from Sentinel analytics rules, are generated by the Defender XDR engine. Existing incident names might change if correlation is applied. "Incident provider name" is always **Microsoft XDR**. The **Incident provider** condition is removed from automation rules.
  - Source: [S1].
  - Confidence: High.
- **SecurityIncident Description field.** After onboarding, the **SecurityIncident** table "no longer includes a **Description** field". This affects automation conditions and ticketing integrations such as ServiceNow.
  - Source: [S1].
  - Confidence: High.
- **Updated by field.** In existing automation rules, *Microsoft 365 Defender* is replaced by *Other*.
  - Source: [S1].
  - Confidence: High.
- **Alert promotion (preview).** Supported third-party alerts are automatically promoted to Defender XDR alerts after onboarding. Review rules for duplicates.
  - Source: [S1], [S3].
  - Confidence: High (feature is in preview).
- **IdentityInfo table.** It becomes a native Defender table in Advanced hunting, with schema differences. It "doesn't support table-level role-based access control (RBAC)".
  - Source: [S1].
  - Confidence: High.
- **Post-connect UI.** "**Microsoft Sentinel** appears in the left-side navigation pane", and the **Home** page banner shows the environment is ready.
  - Source: [S3].
  - Confidence: High.

Reversibility (offboarding):

- **Claim:** A workspace can be disconnected from the Defender portal. Steps:
  1. Go to **System** > **Settings** > **Microsoft Sentinel**.
  2. On the **Workspaces** page, select the connected workspace, then **Disconnect workspace**.
  3. Provide a reason.
  4. Confirm.
  - Source: [S3].
  - Confidence: High.
- **Consequences (documented):**
  - Disconnecting "also disconnects the Microsoft Defender XDR connector". You must reconnect it to receive XDR incidents in Sentinel again.
  - The **Microsoft Sentinel** section is removed from the Defender portal navigation.
  - Sentinel data is no longer included on **Home**.
  - Source: [S3]; also [S1].
  - Confidence: High.
- **Not documented:** Whether these changes are reversed on offboarding: the deactivated Microsoft incident creation rules, the disabled Fusion rule, the auto-disconnected standalone connectors, and the role assignments to the MTP and WindowsDefenderATP apps. See Gaps.
- **Do not confuse with removal.** **Remove Microsoft Sentinel** is on the same settings area (**System** > **Settings** > **Microsoft Sentinel**). It removes Sentinel from the workspace entirely, which is a different and destructive action.
  - Source: [S28].
  - Confidence: High.
- **Data lake is not self-service reversible.** "You can't offboard individual workspaces or disable the data lake on your own." This requires a Defender support request.
  - Source: [S25].
  - Confidence: High.
- **One primary must always remain.** "One primary workspace must always be connected to the Defender portal."
  - Source: [S7].
  - Confidence: High.

## Q3. Prerequisites: roles, licensing, workspace, region, XDR connector

Roles to onboard (single workspace) [S3]:

- **Claim:** The onboarding row in the roles table lists:
  - "At least a Security Administrator in Microsoft Entra ID", plus
  - either "Owner (unconditional role assignment)" OR "User Access Administrator and Microsoft Sentinel Contributor".
  - The scope column reads "Tenant - Subscription for Owner role".
  - Confidence: High.
- **Claim:** "For onboarding, the Owner role assignment must be unconditional at the subscription scope." The screenshot shows Owner set to "Allow user to assign all roles (highly privileged)".
  - Source: [S3], [S7].
  - Confidence: High.
- **Claim (footnote 1):** For a tenant with exactly one Sentinel workspace, "use the permissions listed in the table". If "your tenant has more than one workspace with Microsoft Sentinel enabled, you must also be at least a Security administrator in Microsoft Entra ID."
  - Source: [S3].
  - Confidence: Medium. The footnote and the table conflict (see Gaps).
- **Claim:** "You won't see workspaces in the Defender portal to onboard where you don't have the required permissions."
  - Source: [S3].
  - Confidence: High.

Roles for multi-workspace tasks [S7] (Confidence: High):

| Task | Entra role | Azure role | Scope |
|---|---|---|---|
| Onboard a *primary* workspace | At least Security Administrator | Owner (unconditional) OR User Access Administrator + Microsoft Sentinel Contributor | Tenant; Subscription for Owner |
| Connect or disconnect a *secondary* workspace only | (none listed) | Owner OR User Access Administrator + Microsoft Sentinel Contributor | Subscription for Owner or UAA; Subscription, RG or workspace for Sentinel Contributor |
| Change the primary workspace | At least Security Administrator | Owner OR UAA + Sentinel Contributor | Tenant; Subscription for Owner or UAA; Subscription, RG or workspace for Sentinel Contributor |
| Activate or deactivate a Sentinel workspace in Unified RBAC | At least Security Administrator | Owner OR UAA + Sentinel Contributor | same as above |

[S14] gives sample mappings for the "Security Architect" persona. It lists User Access Administrator on the Sentinel resource group as "needed to onboard Microsoft Sentinel SIEM to Microsoft Defender portal". It lists Security Administrator (Entra, tenant level) as needed "to onboard... offboard the workspace, or change primary/secondary workspace". Confidence: High (but note that it says resource group scope, while [S3] says subscription scope for Owner).

Other roles [S3] (Confidence: High):

- **View Sentinel in the Defender portal:** **Microsoft Sentinel Reader** (subscription, resource group, or workspace).
- **Query tables or view incidents:** Microsoft Sentinel Reader, or a role with the listed `Microsoft.OperationalInsights/...read` and `Microsoft.SecurityInsights/...read` actions.
- **Take investigative actions on incidents:** Microsoft Sentinel Contributor, or the listed read/write actions.
- **Create a support request:** Owner, Contributor, Support request contributor, or a custom role with `Microsoft.Support/*` (subscription).
- **Unified advanced hunting:** querying across Sentinel and Defender data needs "at least the Microsoft Sentinel Reader role" [S27].

Licensing:

- **Sentinel only:** No Defender XDR or E5 license is needed [S2], [S3], [S4]. Confidence: High.
- **Sentinel unified with Defender XDR:** "Licensing for Defender XDR". The Defender XDR account must be in the same Entra tenant as Sentinel, with access to Defender XDR in the portal.
  - Source: [S3].
  - Confidence: High.
- **Limited without Defender services:** Microsoft Security Exposure Management, Custom detection rules ("provided by Microsoft Defender"), and the Action center are "limited or unavailable" when onboarding Sentinel without Defender capabilities.
  - Source: [S2].
  - Confidence: High.
  - Caveat: [S1] recommends custom detection rules for some cases. That advice assumes Defender XDR.
- **Cost of transition:** none (see Q7) [S1].
- **Extra step without Defender XDR:** "If you plan to use Microsoft Sentinel without Defender XDR, you need to take an extra step to trigger the connection".
  - Source: [S1].
  - Confidence: Medium.
  - Caveat: [S1] points to [S3] for this step, but the current [S3] (2026-09-10) describes no such step. The onboarding procedure in [S3] is the same with or without XDR. [S27] says the **Connect a workspace** button "appears if you're eligible to onboard". See Gaps.

Workspace requirements:

- "A Log Analytics workspace that has Microsoft Sentinel enabled" [S3]. Confidence: High.
- **Prerequisites for enabling Sentinel on a workspace** (not for the Defender connection) [S32]:
  - The workspace must not have a resource lock.
  - The pricing tier must be pay-as-you-go or a commitment tier; legacy tiers are not supported.
  - Network security perimeters are not supported.
  - Once Sentinel is deployed, moving the workspace to another resource group or subscription isn't supported [S5].
  - Confidence: High.
- **Service-specific prerequisites** [S3] (Confidence: High):
  - **Insider Risk Management:** enable the **Microsoft 365 Insider Risk Management** connector on the primary workspace and disable it on secondaries before onboarding.
  - **Microsoft Defender for Cloud:** for tenant-correlated incidents, connect **Tenant-based Microsoft Defender for Cloud (Preview)** in the primary workspace. Disconnect **Subscription-based Microsoft Defender for Cloud (Legacy)** from all workspaces, or keep the legacy connector if you don't want tenant-correlated data.

Region requirements:

- The onboarding page [S3] states no region requirement. The Defender service runs in a fixed set of geographies, and "Once created, the Microsoft Defender tenant can't be moved to a different region" [S12]. Processing may happen in Defender XDR regions [S19]. Confidence: High for the statements; whether a region restriction exists for onboarding is not documented.
- **Data lake (optional):** "Microsoft Sentinel data lake must be deployed in the same Azure region as the associated primary Sentinel workspace." Only some regions support the data lake (table in [S19]). Confidence: High.

Defender XDR connector:

- It is auto-configured on onboarding when you are licensed for Defender XDR [S20]. It connects to the primary workspace only [S7].
- When the primary changes, "the Defender XDR connector is connected to the new primary and disconnected from the former one automatically" [S3], [S7].
- Make sure "incidents and alerts from this connector" are turned on [S1].
- Confidence: High.

## Q4. Onboarding procedure, primary/secondary, limits, multi-tenant, Lighthouse, GDAP, Workspace manager

Onboarding steps [S3] (Confidence: High):

1. Go to `https://security.microsoft.com/` and sign in.
2. Select **System** > **Settings** > **Microsoft Sentinel** > **Connect a workspace**.
3. Select the workspaces you want to connect and select **Next**.
4. Select the **Primary workspace**.
5. Read and understand the product changes.
6. Select **Connect**.

Alternative entry point: a **Connect a workspace** button "in the top banner" appears if you're eligible [S27]. Confidence: High.

Viewing workspaces: **Settings > Microsoft Sentinel > Workspaces** [S5]. Sentinel settings are at **System** > **Settings** > **Microsoft Sentinel** [S3]. Confidence: High.

Changing the primary workspace [S3] (Confidence: High):

1. Go to **System** > **Settings** > **Microsoft Sentinel** > **Workspaces**.
2. Select the workspace name.
3. Select **Set as primary**.
4. Read the product changes.
5. Select **Confirm and proceed**.

Primary vs secondary [S7] (Confidence: High):

- If there is only one workspace at onboarding, it becomes primary [S3].
- Verbatim limit: "The Defender portal supports one primary workspace and an unlimited number of secondary workspaces per tenant for Microsoft Sentinel." [S10] July 2025: "no longer any limit to the number of workspaces you can onboard".
- Only the primary workspace's alerts are correlated with Defender XDR data. All Defender XDR alerts and incidents sync to the primary only.
- Secondaries can still ingest Defender table data. Configure this in the XDR connector in the Azure portal, or under **Microsoft Sentinel** > **Configuration** > **Tables** in the Defender portal.
- "Incidents in secondary workspaces don't include data from any other workspace, or from Defender XDR."
- Workspaces previously connected to the XDR connector are disconnected and become secondaries. Their analytics rules and automation based on XDR data "no longer function until you configure table ingestion".
- Recommendation: "consider using the primary workspace for your global security operations center."
- Automation: "Transfer automation rules to the relevant workspace to keep them running" where XDR data was ingested into more than one workspace [S1].

Scope of data in views [S7] (Confidence: High):

- **Incidents** and **Alerts** queues can be unified or filtered by workspace.
- **Advanced hunting:** select a workspace at the top right, or use `workspace()`. Results don't show the workspace name or ID. Creating custom detections and querying via API are limited to the primary workspace.
- **Microsoft Sentinel** pages show one workspace at a time (**Select a workspace**). The **Workbooks** page shows only primary-workspace data.

Bi-directional sync [S7] (Confidence: High):

- **Primary:** XDR incidents appear in the Azure portal with provider **Microsoft XDR**. Status, closing reason and assignment sync both ways.
- **Secondary:** alerts and incidents sync between that workspace's Azure and Defender views.

Multi-tenant:

- **Portal and limits:** Microsoft Defender multitenant management (`https://mto.security.microsoft.com`) supports one primary and multiple secondary workspaces per tenant. "Each workspace must be onboarded to the Defender portal for each of your tenants separately" [S34], [S1]. Setup: sign in to MTO, select **Add tenants**, choose tenants, select **Add**. Limit: "a limit of 100 target tenants" [S21]. Confidence: High.
- **Access to Sentinel data in MTO** is via Microsoft Entra B2B. "Microsoft Sentinel doesn't support granular delegated admin privileges (GDAP) at this time." "GDAP is not supported for Microsoft Sentinel data, and provides access to Defender data only." [S21]. Confidence: High for [S21]'s text; overall GDAP status is Low because sources conflict (see Gaps).
- **GDAP: other statements, which conflict:**
  - [S3]: "granular delegated admin privileges (GDAP) with Azure Lighthouse isn't supported for Microsoft Sentinel data in the Defender portal". Use Entra B2B instead.
  - [S1]: "Granular Delegated Admin Privileges (GDAP) for Microsoft Sentinel is in preview."
  - [S13] (updated 2026-10-15): "Assigning permissions to a GDAP user group in Microsoft Sentinel is supported in unified RBAC."
  - [S15] (updated 2026-08-11): "Assigning permissions to a service principal or to a GDAP user group in Microsoft Sentinel isn't supported in unified RBAC."
  - Confidence: Low. The status is in flux.
- **Azure Lighthouse** remains relevant:
  - "To run cross-tenant queries on Microsoft Sentinel data, you must set up Azure Lighthouse", for example `workspace()` in advanced hunting and analytics rules [S21].
  - Without Lighthouse, MTO can query multiple tenants' *primary* workspaces. Lighthouse "is required when you want to query a secondary workspace in a different tenant" [S34].
  - Some advanced automation and playbook scenarios "might still require using Azure Lighthouse" [S8], [S29].
  - Lighthouse-delegated users are excluded from auto-onboarding [S4].
  - Confidence: High.
- **Community report:** onboarding a customer workspace via Lighthouse delegation failed. The community answer says to onboard in the customer tenant and use B2B with MTO [N3]. The asker reports that governance relationships also worked. Confidence: Medium (community answer, not Microsoft).
- **Governance relationships** are a delegated-access model in the Defender portal. It uses **System** > **Permissions** > **Delegated Access**, and its groups appear as "remote tenant groups" that can be assigned Sentinel Azure roles.
  - Licensing: Entra ID P1 in both tenants, plus "at least one Microsoft 365 E5 license or Microsoft Sentinel enabled in Microsoft Defender".
  - Source: [S33].
  - Confidence: High.
  - Caveat: [S33] shows no preview or GA label.
- **MTO content distribution:** analytics rules, automation rules and workbooks became GA (February 2026) [S9]. Confidence: High.

Workspace manager:

- "While Microsoft Sentinel's Workspace Manager isn't available in the Defender portal, use one of the following alternative capabilities" [S1]. The alternatives are:
  - **Deploy content as code from your repository** (Public preview).
  - **Multitenant portal** content distribution.
- The quick reference [S2] says **Workspace manager** in the Defender portal is "Not available".
- Workspace manager itself is still "in PREVIEW" [S22].
- Confidence: High.

## Q5. Service principals and apps granted roles automatically

- **On onboarding:** "the Microsoft Sentinel Contributor role is assigned to the Microsoft Threat Protection and WindowsDefenderATP apps in your subscription."
  - Source: [S1].
  - Confidence: High.
  - Caveat: the scope is described only as "in your subscription". The docs don't say whether this is subscription, resource group or workspace scope.
- **On Unified RBAC activation for a Sentinel workspace:** "the User Access Administrator role is assigned to the MTP Unified RBAC app within the enabled workspace."
  - Source: [S13].
  - Confidence: High.
- **On data lake onboarding (optional):** a managed identity is created with prefix `msg-resources-` plus a GUID. It gets **Azure Reader** over the onboarded subscriptions. "Don't delete or remove required permissions from this managed identity."
  - Source: [S25].
  - Confidence: High.
- **Existing playbook service account (not new on onboarding):** Sentinel uses "a special Microsoft Sentinel service account" to run playbooks. For MSSP cross-tenant playbooks, the docs reference the **Azure Security Insights** app with **Microsoft Sentinel Automation Contributor** via Lighthouse.
  - Source: [S29], [S11].
  - Confidence: High.

## Q6. Permissions model after onboarding

- **Default (no Unified RBAC activation):** Azure RBAC continues to govern Sentinel access in the Defender portal. Azure RBAC changes are reflected in the Defender portal [S3]. Primary-workspace access lets you read and manage workspace data and Defender XDR data. Secondary-workspace access covers that workspace's data only [S7]. Confidence: High.
- **Unified RBAC (URBAC) for Sentinel** [S13] (Confidence: High):
  - It "Supports unified access management for all Microsoft Sentinel workspaces onboarded to the Defender portal".
  - Role assignments sync to Azure RBAC, but "unified RBAC becomes the source of permissions once enabled."
  - "Sentinel experiences in the Defender portal continue to respect ARM roles and permissions in addition to URBAC." Users with more ARM permissions may see more data.
  - Service principal assignments aren't supported in URBAC. "If you need this capability, keep using Azure RBAC for Microsoft Sentinel."
  - "Microsoft Sentinel must be activated on a per-workspace basis."
  - "being a Global Administrator does not grant you automatic permissions over workspaces."
- **Prerequisites to activate a Sentinel workspace in URBAC:** Security Administrator (Entra) AND (Subscription Owner OR User Access Administrator + Sentinel Contributor on the workspace).
  - Source: [S13], [S7].
  - Confidence: High.
- **Activation steps** [S15] (Confidence: High):
  - Path A: **System** > **Permissions** > under **Microsoft Defender XDR** select **Roles** > **Activate workloads** (banner) or **Workload settings** > toggle > (Sentinel) **View Workspaces** and select workspaces > **Activate**.
  - Path B: **System** > **Settings** > **Microsoft Defender XDR** > **General** > **Permissions and roles** > toggle > **View Workspaces** > **Activate**.
  - Deactivation reverts to the previous model.
  - Warning: "Making permission changes in the Azure portal after unified RBAC is active for a workspace might lead to sync errors."
- **Role mapping** [S14] (Confidence: High):
  - Sentinel Reader maps to "Defender Unified RBAC Reader": Security data basics (read).
  - Sentinel Responder maps to "Defender Unified RBAC Responder": basics read + Alerts (manage) + Response (manage).
  - Sentinel Contributor maps to "Defender Unified RBAC Contributor and Responder": the above + Detection tuning (manage).
  - New roles: "Defender Unified RBAC Scoped Reader" and "Defender Unified RBAC Data Manager" (Data operations \ Data management \ Data (manage)).
  - Not available in URBAC: "Microsoft Sentinel Playbook Operator, Automation Contributor, and Workbook Contributor" (manage these in Azure).
- **Status of URBAC for Sentinel:**
  - [S13] lists Sentinel without a "(Preview)" label, while it does label Defender for Cloud Apps "(Preview)".
  - [S11] still has a note that says "If you are running the Microsoft Defender XDR preview program, you can now experience the new... URBAC model".
  - [S17] has no Sentinel-URBAC GA entry. Its only Sentinel item is July 2025 "Sentinel data lake permissions integrated with... unified RBAC (Preview)".
  - The Petri article dated 2026-03-23 says Sentinel URBAC is "available April 1st" [N1].
  - Confidence: Medium. No official page explicitly says "GA".
- **Possible automatic URBAC enablement:** A third-party blog [N2] reports Message Center **MC1457836** (sent only to affected tenants). It says Unified RBAC "will be enabled between late September and December 2026" for selected tenants still on legacy RBAC, and that Sentinel Reader, Responder and Contributor permissions are "auto-enabled". Confidence: Medium (not verifiable without Message Center access).
- **Row-level RBAC ("Sentinel scoping")** [S16], [S10] (Confidence: High):
  - It is configured in the Defender portal only: "Sentinel in the Azure portal (Ibiza) doesn't support scoping."
  - It needs Sentinel enabled in URBAC. It is listed as "(Preview)" in [S10] (April 2026).
  - Limits: 100 scopes per tenant. Scopes can only be assigned to Defender URBAC roles. They apply only to tables supporting ingestion-time transformations. XDR tables aren't supported. Only newly ingested data is tagged.
  - `SecurityAlerts` and `SecurityIncidents` tables don't inherit scope. "Playbooks and integrations don't yet support Sentinel scoping."
- **IdentityInfo table-level RBAC:** "When you transition to the Defender portal, the IdentityInfo table becomes a native Defender table that doesn't support table-level role-based access control (RBAC)." If you restrict `IdentityInfo` with table-level RBAC in the Azure portal, "this access control will no longer be available".
  - Source: [S1].
  - Confidence: High.
  - Caveat: the Log Analytics `IdentityInfo` still exists in the workspace for Sentinel rules and workbooks [S1].
- **Table-level and resource-context RBAC in general:** No fetched official page states how general table-level RBAC or resource-context RBAC behaves for other tables in the Defender portal. [S26] describes resource-context access via the resource itself or Azure Monitor in the Azure portal. [S14] mentions Log Analytics "Granular RBAC" for raw data, which "will not scope access to Microsoft Sentinel incidents, alerts, watchlists, UEBA, TI". Confidence: Low (gap).
- **Data lake permissions:**
  - Entra roles (Global reader, Security reader, Security operator, Security administrator, Global administrator) give lake read access across all workspaces.
  - Write access and jobs need Security operator, Security administrator or Global administrator.
  - Workspace-specific access uses Azure RBAC roles, or URBAC custom roles for system tables.
  - The workspace must be onboarded to the Defender portal and the data lake.
  - Source: [S11].
  - Confidence: High.

## Q7. Data governance: retention, privacy, residency, CMK, BCDR, billing

Policies:

- **Claim:** "When you use the Defender portal, the Microsoft Defender XDR policies apply instead, even when you work with Microsoft Sentinel data." This covers storage, processing, retention and sharing.
  - Source: [S1].
  - Confidence: High.
  - Caveat: Raw log data stays in the workspace region [S19]. Workspace retention is still set per workspace or table.

Defender XDR policies [S12] (Confidence: High):

- **Storage geographies:** EU (North and West Europe), UK, US (East US 2, Central US), Australia, Switzerland, India, UAE.
- **Region display:** shown under **Settings > Microsoft Defender XDR > Account**.
- **Retention:** "Microsoft Defender data is retained for 180 days". In Advanced hunting, data is available for 30 days unless streamed through Sentinel. Data is deleted no later than 180 days after contract end.

Sentinel policies [S19] (Confidence: High):

- Processing: Europe for European workspaces, Israel for Israeli workspaces, US for all others.
- Retention: until Sentinel is removed or per the customer's retention policy. Data is erased no later than 90 days after contract end.

CMK:

- **Claim (transition doc):** If CMK was enabled before onboarding, all workspace log data remains CMK-encrypted. "Analytic rules and other Sentinel content, such as automation rules, also continue to be CMK-encrypted." "However, alerts and incidents will no longer be CMK-encrypted after onboarding."
  - Source: [S1].
  - Confidence: High.
- **Claim (CMK doc, inconsistent with [S1]):** CMK protects Log Analytics tables plus analytics rules, threat intelligence, summary rules and watchlists. Microsoft-managed keys cover "Operational data within Microsoft Sentinel such as alerts, incidents, and behaviors and the data included in them". Workbooks and playbooks also use MMK. UEBA-derived data stored outside the workspace can't be CMK-protected. CMK onboarding of a workspace is supported only via REST API or Azure CLI.
  - Source: [S18].
  - Confidence: High for the text. Medium for reconciling it with [S1] (see Gaps).
- **Data lake:** "CMK isn't supported for data stored in the Microsoft Sentinel data lake". "Sentinel workspaces applying CMK aren't accessible via data lake experiences."
  - Source: [S25]; also [S1].
  - Confidence: High.

BCDR:

- Azure portal: "Customers are responsible for replicating their data".
- Defender portal: "Microsoft Defender uses automation for BCDR on control planes."
- Source: [S1].
- Confidence: High.
- Caveat: This covers control planes only. The docs say nothing about data-plane (Log Analytics) BCDR changing.

Billing:

- **Claim:** "Transitioning to the Defender portal, even for non-E5 customers, has no extra cost. The customer continues to be billed as usual for their consumption on Sentinel only."
  - Source: [S1].
  - Confidence: High.
- **Free XDR alerts and incidents:** These, including `SecurityAlert` and `SecurityIncident`, are ingested and synced at no charge. Raw advanced hunting tables are charged.
  - Source: [S20], [S24].
  - Confidence: High.
- **Advanced hunting raw logs:** "free for 30 days without ingestion" (comparison table).
  - Source: [S2].
  - Confidence: High.
- **Data lake cost caveat:** On data lake onboarding, billing for search jobs, auxiliary logs and long-term retention (archive) switches "to Microsoft Sentinel data lake-based billing meters, potentially increasing your costs".
  - Source: [S25], [S24].
  - Confidence: High.
  - [S10] (September 2026) says that for existing customers who haven't onboarded the data lake, "your total retention experience evolves from archive-based retention to data lake retention after Sentinel onboarding". It is ambiguous which "onboarding" this refers to (see Gaps).

## Q8. Feature differences (exact names as published)

### Quick reference: Azure portal location to Defender portal location [S2] (Confidence: High)

General:

| Azure portal | Defender portal |
|---|---|
| **Overview** | **Overview** |
| **Logs** | **Investigation & response** > **Hunting** > **Advanced hunting** |
| **News & guides** | Not available |
| **Search** | **Microsoft Sentinel** > **Search** |

Threat management:

| Azure portal | Defender portal |
|---|---|
| **Incidents** | **Investigation & response** > **Incidents & alerts** > **Incidents** |
| **Workbooks** | **Microsoft Sentinel** > **Threat management** > **Workbooks** |
| **Hunting** | **Microsoft Sentinel** > **Threat management** > **Hunting** |
| **Notebooks** | **Microsoft Sentinel** > **Threat management** > **Notebooks** |
| **Entity behavior** | User: **Assets** > **Identities** > {user} > **Sentinel events**. Device: **Assets** > **Devices** > {device} > **Sentinel events** |
| **Threat intelligence** | **Threat intelligence** > **Intel management** |
| **MITRE ATT&CK** | **Microsoft Sentinel** > **Threat management** > **MITRE ATT&CK** |

Content management:

| Azure portal | Defender portal |
|---|---|
| **Content hub** | **Microsoft Sentinel** > **Content management** > **Content hub** |
| **Repositories** | **Microsoft Sentinel** > **Content management** > **Repositories** |
| **Community** | **Microsoft Sentinel** > **Content management** > **Community** |

Configuration:

| Azure portal | Defender portal |
|---|---|
| **Workspace manager** | Not available |
| **Data connectors** | **Microsoft Sentinel** > **Configuration** > **Data connectors** |
| **Analytics** | **Microsoft Sentinel** > **Configuration** > **Analytics** AND **Investigation and response** > **Hunting** > **Custom detection rules** |
| **Watchlists** | **Microsoft Sentinel** > **Configuration** > **Watchlists** |
| **Automation** | **Microsoft Sentinel** > **Configuration** > **Automation** |
| **Settings** | **System** > **Settings** > **Microsoft Sentinel** |

### Only in the Azure portal, unsupported, or removed in the Defender portal [S1] unless noted (Confidence: High)

- Workspace manager: not available (alternatives: repositories (Public preview) and the multitenant portal).
- News & guides: not available [S2].
- Creating automation rules directly from an incident: "supported only in the Azure portal".
- Adding entities to threat intelligence from incidents: Azure portal only.
- Running a playbook manually on an alert, and on an entity: "aren't currently supported in the Defender portal".
- Microsoft incident creation rules: not supported. Active ones are deactivated on onboarding.
- Fusion analytics rule: disabled on onboarding. Defender XDR correlation replaces it.
- Editing existing incident comments: not supported in the Defender portal. Azure-portal edits aren't synced.
- Incidents created via API, Logic App playbook, or manually in the Azure portal: "aren't synchronized to the Defender portal".
- Reopening closed incidents via alert grouping: not possible. New alerts create new incidents.
- Adding or removing alerts in incidents from playbooks: not supported.
- Alerts from analytics rules with incident creation turned off: "aren't visible in the Defender portal".
- Bookmarks: not available in Advanced hunting, but still available in **Microsoft Sentinel** > **Threat management** > **Hunting**.
- Similar incidents (Preview): "isn't supported in the Defender portal". The **Similar incidents** tab isn't available.
- Intel projects: "Deprecated".
- `SecurityIncident` **Description** field: no longer included after onboarding.
- **Incident provider** automation condition: removed.
- XDR-related connectors hidden from the Defender **Data connectors** page: Microsoft Defender for Cloud Apps, Microsoft Defender for Endpoint, Microsoft Defender for Identity, Microsoft Defender for Office 365 (Preview), Microsoft Defender XDR, Subscription-based Microsoft Defender for Cloud (Legacy), and Tenant-based Microsoft Defender for Cloud (Preview). These are still listed in the Azure portal.
- Advanced hunting known issues [S27]:
  - Guided mode and take actions work on XDR data only.
  - Custom detections can't use Sentinel custom functions.
  - Advanced hunting can query only the Analytics-tier retention period of a table with extended Lake retention. Use search jobs for older data.
  - GCC-M can't run queries that mix Sentinel and Defender tables.

### Behavior changes [S1] (Confidence: High)

- **Alert correlation:** done by the Defender XDR engine. Alert grouping configuration remains visible, but the "Defender XDR correlation engine fully controls alert grouping and incident merging".
- **Alert tuning:** now applies to Sentinel alerts.
- **Alert promotion (preview).**
- **Latency:**
  - "up to 5 minutes" for Defender incidents to appear in Sentinel, which delays playbooks.
  - "up to 10 minutes" before an automation rule runs.
  - Updates made within 5-10 minutes are batched into one, and intermediate updates are lost [S1], [S29].
- **Automation rules with alert triggers** act only on Sentinel alerts. Use the **Enhanced Alert Trigger** for XDR alerts.
- **Active playbooks** tab: filtered by default to the onboarded workspace's subscription.
- **API fields:**
  - `providerName` changes from "Azure Sentinel" to "Microsoft XDR".
  - New field `providerIncidentUrl`; `incidentUrl` still points to the Sentinel portal.
  - New fields `serviceSource`, `detectionSource`, `productName`.
  - `alertProductNames` needs `?$expand=alerts` in Graph.
- **Workbooks:** "only shows data associated with the primary workspace" on the Workbooks page [S7].

### New in the Defender portal (comparison tables in [S2]; Confidence: High)

- Unified incident queue with Security Copilot.
- Cross-domain correlation.
- Attack story and incident graph, unified entity pages, and blast radius analysis.
- Unified advanced hunting (SIEM, Defender, data lake), with Security Copilot KQL generation.
- Native Security Copilot features and agents. "Included capacity for E5/E7 customers".
- Post-incident recommendations via Exposure Management.
- AI-assisted playbook generator, and automatic attack disruption.
- Case management.
- SOC optimization (also via API).
- Centralized data lake with tiered retention.
- Native multi-tenant operations (MTO).
- Unified Defender RBAC with row-level RBAC.
- [S2] support timeline row: Azure portal "Supported until March 31, 2027". Defender portal: "Long-term home for Sentinel". Also: "all new Sentinel experiences land here first".

## Q9. Microsoft Sentinel data lake

- **What it is:** a "purpose-built, cloud-native security data lake". It has two tiers. The Analytics tier is the existing tier. The Data lake tier offers long-term storage for up to 12 years. Analytics-tier data "is mirrored to the lake tier".
  - Source: [S23].
  - Confidence: High.
- **GA:** "Microsoft Sentinel data lake is now generally available (GA)" (September 2025).
  - Source: [S10].
  - Confidence: High.
- **Requires Defender portal onboarding:**
  - Verbatim: "A Microsoft Sentinel primary workspace connected to Microsoft Defender portal." "You must connect your Microsoft Sentinel primary workspace to the Defender portal to onboard to the data lake." [S25]
  - [S11]: "your workspace must be onboarded to the Defender portal".
  - Confidence: High.
  - So the data lake depends on the transition. The transition does not depend on the data lake.
- **Optional for the transition?** No fetched page says the data lake is required to transition. It is described as an onboarding with its own prerequisites [S25]. Confidence: Medium (inferred from absence of a requirement).
- **September 2026 change:** "Customers onboarding after September 23rd, 2026" don't need "a separate data lake onboarding and billing setup". They complete Sentinel onboarding and connection to Defender, then "enable the lake tier by using **Table management**".
  - Source: [S10].
  - Confidence: High.
  - Caveat: it's unclear whether this applies to existing Sentinel workspaces that connect to Defender after that date (see Gaps).
- **Prerequisites** [S25] (Confidence: High):
  - Direct subscription owner for billing setup. "Management-group-level subscription owner isn't sufficient".
  - Entra Global Administrator or Security Administrator for ingestion authorization.
  - Read access to workspaces.
  - Same region as the primary workspace.
  - "A Microsoft Defender XDR license isn't required".
- **Effects** [S25] (Confidence: High):
  - All Defender-connected workspaces in the primary's region are attached automatically: "You can't choose which workspaces to onboard to the data lake."
  - Entra, Microsoft 365 and Azure Resource Graph asset data are ingested into System tables. This implies consent for cross-region storage.
  - Auxiliary log tables are "no longer available in Microsoft Defender Advanced hunting".
  - A managed identity `msg-resources-<GUID>` is created.
  - Azure Policy may block deployment (error DL103). Exempt `Microsoft.SentinelPlatformServices/sentinelplatformservices`.
- **Pricing** [S24] (Confidence: High):
  - Meters: Data lake ingestion, Data processing, Data lake storage (6:1 compression), Data lake query, and Advanced data insights (per compute hour).
  - "Once onboarded, usage... begins to be billed through the previously described meters rather than existing long-term retention (formerly known as Archive), search, or auxiliary logs ingestion meters."
  - Analytics-tier data is available in the lake tier "without extra charge" [S25].

## Q10. Official guidance on planning, sequencing, testing, change management, training, validation

- **Sequencing by audience** [S1] (Confidence: High):
  1. "Plan and set up your transition environment" (Audience: Security architects).
  2. "Configure and review your settings and content" (Security engineers).
  3. "Run operations in the Defender portal" (Security analysts).
- **Do the prerequisites first:** "Review all planning guidance and finish all prerequisites before you onboard your workspace to the Defender portal."
  - Source: [S1].
  - Confidence: High.
  - Caveat: the linked planning and deployment guides now redirect to the ISOC preview page [S6].
- **Training and process change:**
  - "While you might need to update SOC processes and retrain your analysts". Unified triage may "combine the roles of tier 1 and tier 2 analysts" but "can also require broader and deeper analyst knowledge".
  - "We recommend training on the new portal interface to ensure a smooth transition."
  - A video playlist is linked.
  - Source: [S1].
  - Confidence: High.
- **Validation hints:**
  - Review automation rules "to ensure you're seeing the expected results" (correlation engine).
  - Review analytics rules for duplicates (alert promotion).
  - Avoid incident titles as automation conditions; use analytics rule names and tags.
  - Make sure incidents and alerts from the XDR connector are turned on.
  - Source: [S1].
  - Confidence: High.
- **MSSP guidance:**
  - "Establish clear timelines and expectations with customers before beginning the transition".
  - "Determine the optimal workspace configuration (primary vs. secondary)".
  - Review multitenant access requirements.
  - Source: [S8].
  - Confidence: High.
- **Per-tenant onboarding:** "Onboard each workspace to the Defender portal separately for each tenant, just like onboarding for a single tenant."
  - Source: [S1], [S34].
  - Confidence: High.
  - Note: the onboarding wizard lets you select several workspaces in one pass [S3].
- **Test or non-production first:** No official statement recommending onboarding a non-production or test workspace first was found in the fetched pages. Confidence: High that it is absent from these pages.
  - Inference: the first workspace connected in a tenant becomes primary, and choosing or changing the primary moves the XDR connector. A "test first in the same tenant" approach has side effects on the production XDR connector. This is not stated as guidance in any doc.
- **ISOC preview:** "Don't disconnect a production Microsoft Sentinel workspace only to qualify for the ISOC preview."
  - Source: [S6].
  - Confidence: High.
- **Sentinel deployment (not transition):** "Before deploying Microsoft Sentinel to a production environment, review the predeployment activities".
  - Source: [S5].
  - Confidence: High.

---

## Gaps and ambiguities in official docs

1. **Planning and deployment guides are gone.** `/unified-secops/overview-plan` and `/unified-secops/overview-deploy` redirect to the ISOC preview page [S6]. ISOC targets E5/E7 customers *without* an active Sentinel workspace. [S1] still tells existing customers to "Review all planning guidance", but the referenced guidance is not reachable.
2. **Role table vs footnote** [S3]. The onboarding row lists "At least a Security Administrator" in all cases. Footnote 1 implies Security Administrator is needed only if the tenant has more than one Sentinel workspace. [S14] uses User Access Administrator at *resource group* scope, while [S3] says *subscription* scope for Owner.
3. **"Extra step" without Defender XDR** [S1] is not described anywhere in the current onboarding article [S3].
4. **GDAP status conflicts:** "not supported" ([S3], [S21]); "in preview" ([S1]); "supported in unified RBAC" ([S13], 2026-10-15); "isn't supported in unified RBAC" ([S15], 2026-08-11).
5. **CMK statements are inconsistent.** [S1] implies alerts and incidents were CMK-encrypted before onboarding and that automation rules stay CMK-encrypted. [S18] says alerts and incidents always use MMK and lists the CMK-protected content without automation rules.
6. **Status of Unified RBAC for Sentinel** is not explicitly labeled GA or Preview. [S11] still mentions a "preview program". Scoping is labeled Preview in [S10]. Possible automatic enablement (MC1457836) is reported only by a third party [N2].
7. **Outdated date in [S30]:** the bullet "By July 2026, all Microsoft Sentinel customers using the Azure portal will be redirected" contradicts the banner on the same page (March 31, 2027).
8. **Retirement mechanics are not documented.** Nothing says what happens on or after March 31, 2027 to workspaces that were never onboarded, whether existing customers will be force-onboarded, or how redirection works. Nothing says what remains in the Azure portal (for example Azure RBAC, Logic Apps, DCRs). [S3] still tells you to manage Sentinel Azure RBAC "from the Azure portal".
9. **Offboarding reversal** isn't documented for the Fusion rule, Microsoft incident creation rules, auto-disconnected standalone connectors, or the MTP and WindowsDefenderATP role assignments.
10. **Scope of the MTP and WindowsDefenderATP role assignment** is described only as "in your subscription" [S1].
11. **Standalone connector disconnection scope:** [S1] and [S7] say secondary workspaces. [S20] lists disconnections without a primary/secondary qualifier.
12. **Region rules for onboarding.** [S19] mentions "destination regions specified during onboarding", but the onboarding steps in [S3] show no region selection.
13. **Retention when using the Defender portal.** [S1] says Defender XDR policies apply (180 days, 30 days in Advanced hunting). Sentinel log retention is still set per workspace or table. The docs don't reconcile the two for Sentinel incidents and alerts. Deletion after contract end is 90 days in [S19] vs 180 days in [S12].
14. **General table-level and resource-context RBAC in the Defender portal** are not described. Only `IdentityInfo` is called out [S1].
15. **No documented API** was found in the fetched pages for reading or setting the *Defender portal connection state* of a workspace. The SecurityInsights "onboardingStates" API [S5], [S18] is about enabling Sentinel on a workspace, not the Defender connection. Not verified either way.
16. **September 2026 data lake integration** [S10]: "after Sentinel onboarding" is ambiguous for existing customers who connect to Defender later. It is unclear whether archive retention automatically becomes data lake retention, with the billing-meter switch that [S25] says may increase costs.
17. **Lighthouse-delegated onboarding:** the only documented restriction is the auto-onboarding exclusion [S4] and the GDAP-with-Lighthouse statement [S3]. A community thread reports failures [N3], but there is no official statement.
18. **Tech Community blogs** referenced by [S1] and [S2] (permissions blog 4480583, planning blog 4428613) could not be read programmatically.

---

## Candidate checks for the tool

Each check lists: What, Why, Where, How, Expected result, and Source. "Manual" means no documented API was verified. Do not automate a manual check without first verifying an API.

1. **Retirement awareness banner**
   - What: Show the retirement date.
   - Why: hard deadline.
   - Where: tool UI.
   - How: static text with a link.
   - Expected: shows "After March 31, 2027 ... no longer supported in the Azure portal".
   - Source: [S2], [S4].
2. **Workspace inventory and Defender connection state**
   - What: List Sentinel-enabled workspaces and whether each is connected (primary or secondary).
   - Why: decide the primary; find unconnected workspaces.
   - Where: Azure (workspaces with the SecurityInsights solution); Defender **System > Settings > Microsoft Sentinel > Workspaces**.
   - How: Azure Resource Graph or ARM for the inventory; manual check in Defender for connection state.
   - Expected: every production workspace accounted for; exactly one primary.
   - Source: [S3], [S7].
3. **Onboarding operator permissions**
   - What: The operator has Entra Security Administrator (or higher) AND Azure Owner at subscription, or User Access Administrator + Microsoft Sentinel Contributor.
   - Why: workspaces without permissions aren't shown.
   - Where: Entra role assignments; Azure RBAC.
   - How: list role assignments for the operator at subscription, RG and workspace scope.
   - Expected: requirement met for each target workspace.
   - Source: [S3], [S7].
4. **Owner assignment is unconditional**
   - What: The Owner assignment has no ABAC condition.
   - Why: "must be unconditional at the subscription scope".
   - Where: Azure RBAC role assignment `condition` property.
   - How: inspect the role assignment object.
   - Expected: condition empty, or "Allow user to assign all roles".
   - Source: [S3].
5. **Defender XDR licensing present?**
   - What: Determine Sentinel-only vs unified mode.
   - Why: the XDR connector is auto-configured only when licensed; some features are limited without it.
   - Where: tenant licensing (manual).
   - How: manual confirmation.
   - Expected: mode recorded. Sentinel-only mode flags missing features (Exposure Management, custom detection rules, Action center) and the undocumented "extra step".
   - Source: [S2], [S1], [S20].
6. **Primary workspace selection**
   - What: Choose the global-SOC workspace as primary.
   - Why: XDR correlation and sync go to the primary only; the Workbooks page and custom detections are primary-only.
   - Where: planning.
   - How: questionnaire.
   - Expected: documented choice.
   - Source: [S7].
7. **Standalone Microsoft alert connectors in secondaries**
   - What: Find MDO, Entra ID Protection, MDCA, MDE and MDI standalone connectors, plus other Microsoft alert connectors.
   - Why: they are auto-disconnected in secondaries; others must be disconnected manually.
   - Where: data connectors per workspace (Azure).
   - How: ARM `dataConnectors` list (verify API) or manual.
   - Expected: impact list; rules and automation depending on them identified.
   - Source: [S1], [S7].
8. **Insider Risk Management connector placement**
   - What: The IRM connector is on the primary only.
   - Why: required before onboarding.
   - Where: data connectors.
   - Expected: enabled on the primary, disabled on secondaries.
   - Source: [S3], [S7].
9. **Defender for Cloud connector type**
   - What: Tenant-based (Preview) vs Subscription-based (Legacy).
   - Why: avoid duplicates.
   - Where: data connectors.
   - Expected: a documented choice per [S3] guidance.
   - Source: [S3], [S1].
10. **Microsoft security incident creation rules**
    - What: Count active rules.
    - Why: they are deactivated on onboarding.
    - Where: Analytics rules (kind MicrosoftSecurityIncidentCreation).
    - How: ARM `alertRules` list (verify).
    - Expected: replacement plan (scheduled rules, alert tuning, migration to alert grouping).
    - Source: [S1], [S20].
11. **Fusion rule enabled**
    - What: Detect the Fusion rule.
    - Why: it is disabled on onboarding.
    - Where: Analytics rules.
    - Expected: stakeholder acknowledgment.
    - Source: [S1].
12. **Automation rule conditions at risk**
    - What: Conditions on Incident provider, incident title, Description, or Updated by = Microsoft 365 Defender.
    - Why: these break or change after onboarding.
    - Where: automation rules.
    - How: export automation rules to JSON and parse conditions.
    - Expected: list of rules to fix.
    - Source: [S1], [S29].
13. **Alert-only analytics rules**
    - What: Rules with incident creation disabled.
    - Why: their alerts aren't visible in the Defender portal.
    - Where: analytics rules incident settings.
    - Expected: list; decide on alternatives.
    - Source: [S1].
14. **Integrations using the SecurityInsights incidents API or the Description field**
    - What: Ticketing and SOAR integrations.
    - Why: field changes (`providerName`, missing Description); Graph is recommended.
    - Where: Logic Apps and external tools (manual).
    - Expected: integration owners notified.
    - Source: [S1].
15. **CMK workspaces**
    - What: Workspaces linked to a CMK dedicated cluster.
    - Why: alerts and incidents not CMK after onboarding; data lake unsupported and inaccessible.
    - Where: Log Analytics cluster link and CMK settings.
    - How: ARM cluster and workspace properties.
    - Expected: compliance sign-off recorded.
    - Source: [S1], [S18], [S25].
16. **Table-level RBAC on IdentityInfo**
    - What: Custom or table-level role assignments that target `IdentityInfo`.
    - Why: no longer enforced in Defender Advanced hunting.
    - Where: Azure RBAC custom roles and table-scope assignments.
    - Expected: list; decide on mitigation.
    - Source: [S1].
17. **Resource-context and table-level RBAC users (general)**
    - What: Users with only resource-context or table-level access.
    - Why: Defender portal behavior is undocumented; consider scoping (Preview).
    - Where: Azure RBAC.
    - Expected: flagged for manual validation.
    - Source: [S26], [S16].
18. **Workspace manager usage**
    - What: Is any workspace configured as a parent?
    - Why: not available in the Defender portal.
    - Where: Sentinel Settings (workspace manager toggle); Workspace Manager Configurations API (listed in [S22]).
    - Expected: migration plan to repositories or MTO content distribution.
    - Source: [S1], [S22].
19. **Multi-tenant access model**
    - What: Lighthouse, GDAP, B2B or governance relationships.
    - Why: MTO Sentinel data access needs B2B (or governance relationships); GDAP status is conflicting; Lighthouse is needed for cross-tenant `workspace()` and secondary workspaces.
    - Where: partner setup (manual).
    - Expected: access model per tenant documented. Each customer workspace onboarded in its own tenant.
    - Source: [S21], [S34], [S33], [S3].
20. **Unified RBAC readiness**
    - What: Is URBAC active per workspace? Are service principals holding Sentinel roles? Are Playbook Operator, Automation Contributor or Workbook Contributor used?
    - Why: URBAC doesn't support service principals or those roles; Azure changes after activation can cause sync errors; possible auto-enablement.
    - Where: Defender **System > Permissions**; Azure RBAC.
    - Expected: decision recorded. Message Center checked for MC1457836.
    - Source: [S13], [S14], [S15], [N2].
21. **App role assignments after onboarding**
    - What: Microsoft Sentinel Contributor is assigned to the "Microsoft Threat Protection" and "WindowsDefenderATP" apps. After URBAC activation, User Access Administrator is assigned to the "MTP Unified RBAC" app.
    - Why: governance tooling that strips unexpected assignments could break the integration.
    - Where: Azure RBAC.
    - How: list assignments by service principal display name.
    - Expected: assignments present and excluded from cleanup policies.
    - Source: [S1], [S13].
22. **Data residency review**
    - What: Compare the Defender tenant geography with the workspace regions.
    - Why: Defender XDR policies apply and processing may move.
    - Where: Defender **Settings > Microsoft Defender XDR > Account**; workspace region.
    - Expected: compliance acknowledgment.
    - Source: [S12], [S19], [S1].
23. **Data lake plan (optional)**
    - What: Region support; CMK conflict; Azure Policy exemption; billing meter switch; whether test and prod workspaces share the primary's region.
    - Why: all Defender-connected same-region workspaces auto-attach, and you can't offboard without support.
    - Where: planning.
    - Expected: an explicit go or no-go.
    - Source: [S25], [S19], [S24].
24. **Post-onboarding validation**
    - What: The **Microsoft Sentinel** nav item appears; the Home banner shows ready; incidents arrive (allow "up to 5 minutes"); the XDR connector is on the primary; expected connectors are disconnected in secondaries; automation runs (allow up to 10 minutes).
    - Where: Defender portal.
    - Expected: all pass.
    - Source: [S3], [S1], [S7].
25. **Offboarding safety**
    - What: Warn before **Disconnect workspace** that the XDR connector will be disconnected. Never confuse it with **Remove Microsoft Sentinel**.
    - Where: **System > Settings > Microsoft Sentinel**.
    - Expected: explicit confirmation.
    - Source: [S3], [S28].
26. **Cloud environment check**
    - What: 21Vianet (Sentinel retired 2026-08-18) and GCC-M (no queries that mix Sentinel and Defender tables).
    - Where: tenant cloud.
    - Expected: flagged.
    - Source: [S19], [S27].
