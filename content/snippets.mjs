// Technical snippets referenced by knowledge objects.
// status: 'verbatim' = copied exactly from the cited Microsoft Learn page;
//         'composed' = written for this project from documented syntax, tables and columns.
// No snippet has been executed against a live customer tenant by the authors. All are read-only unless marked otherwise.
// Text fields (title, purpose, notDo, expected, caveats, runIn, permissions, cost) follow docs/content-style-guide.md.
// `code` is shown and copied exactly as written.
import { INVENTORY_SCRIPT } from './generated/inventory-script.mjs';

const LA = 'Azure portal > Log Analytics workspace (your Sentinel workspace) > Logs. Or Defender portal > Investigation & response > Hunting > Advanced hunting, with the workspace selected';
const LA_ONLY = 'Azure portal > Log Analytics workspace (your Sentinel workspace) > Logs';
const SHELL = 'Azure Cloud Shell, or a local PowerShell or Azure CLI session signed in to the customer tenant';
const ARG = 'Azure portal > Resource Graph Explorer, or the command line with `az graph query -q "<query>"` or `Search-AzGraph -Query "<query>"`';
const READER = 'Microsoft Sentinel Reader or Log Analytics Reader on the workspace';

export const SNIPPETS = {
  PS_INVENTORY_SCRIPT: {
    title: 'Read-only inventory script to import into the assistant (Get-ArMoSentinelInventory.ps1)', language: 'powershell', status: 'composed', runIn: SHELL + ' (Windows PowerShell 5.1 or PowerShell 7 with Az.Accounts, after Connect-AzAccount)', permissions: 'Microsoft Sentinel Reader at resource-group scope', readOnly: true,
    cost: 'None. It makes a handful of Azure Resource Manager GET requests.',
    purpose: 'Collects the names and transition-relevant flags of your analytics rules (both API versions), automation rules, data connectors and watchlists. It writes them to a JSON file that you import with "Import inventory results". It writes no rule queries, incident data or credentials.',
    notDo: 'Sends GET requests only, so it changes nothing. It does not read Defender portal settings, and it does not sign you in.',
    code: INVENTORY_SCRIPT,
    expected: 'A JSON file per workspace (schema armohub.dma.inventory) and a summary line with counts. Review the files before you import or share them.',
    caveats: ['Written for this project and tested against a mocked API only. It is not yet validated against a live tenant, so review it before you run it.', 'Rule and watchlist names can be sensitive. Handle the output under your data policy.', 'To find your workspaces for you, pass -Discover: it lists the subscriptions you can read, their Log Analytics workspaces, and keeps those with a Microsoft Sentinel onboarding state. It writes workspaces.json and one file per workspace.', 'For a list you choose, put the workspaces in a JSON file and pass -WorkspacesFile (see the examples at the top of the script). A workspace that fails does not stop the others.'],
    sources: ['sialertrules', 'siautomation', 'siconnectors', 'siwatchlists', 'siversions', 'invokerest', 'sisubscriptions', 'laworkspaces', 'sionboarding'],
  },
  K_USAGE_BY_TABLE: {
    title: 'Billable ingestion per table (last 30 full days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true,
    cost: 'Low. The Usage table is an hourly aggregate, and Microsoft recommends it over scanning tables.',
    purpose: 'Lists which tables receive billable data, how much, and the last hour with data. Use it as your ingestion baseline.',
    notDo: 'Does not show tables with no ingestion in the window, and does not prove data quality.',
    code: `// Billable ingestion per table over the last N full days.
// Usage.Quantity is in MB; divide by 1000 for GB as Microsoft's samples do.
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
| order by BillableGB desc`,
    expected: 'One row per table (DataType) with BillableGB, LastHourWithData, Solutions and Plans.',
    caveats: ['The Plan column was added in mid-May 2026, so older rows have it empty.', 'Results are to the hour only.'],
    sources: ['usage'],
  },
  K_DEFENDER_TABLE_INGESTION: {
    title: 'Billable volume of Defender XDR tables streamed into this workspace (last 30 full days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true,
    cost: 'Low. The Usage table is an hourly aggregate.',
    purpose: 'Shows which raw Defender XDR tables this workspace receives through the Defender XDR connector, and how much billable data each one adds.',
    notDo: 'Does not show whether a rule, workbook or hunting query uses a table, and does not change anything.',
    code: `// Billable volume of the Defender XDR advanced hunting tables streamed into this workspace.
// Table list: the "Connect events" tables of the Defender XDR connector. Usage.Quantity is in MB.
let lookbackDays = 30;
let defenderTables = dynamic(['DeviceInfo', 'DeviceNetworkInfo', 'DeviceProcessEvents', 'DeviceNetworkEvents',
  'DeviceFileEvents', 'DeviceRegistryEvents', 'DeviceLogonEvents', 'DeviceImageLoadEvents', 'DeviceEvents',
  'DeviceFileCertificateInfo', 'EmailAttachmentInfo', 'EmailEvents', 'EmailPostDeliveryEvents', 'EmailUrlInfo',
  'UrlClickEvents', 'IdentityDirectoryEvents', 'IdentityLogonEvents', 'IdentityQueryEvents', 'CloudAppEvents',
  'AlertInfo', 'AlertEvidence']);
Usage
| where TimeGenerated > ago(1d * (lookbackDays + 1))
| where StartTime >= startofday(ago(1d * lookbackDays)) and EndTime < startofday(now())
| where IsBillable == true and DataType in (defenderTables)
| summarize BillableGB = round(sum(Quantity) / 1000., 3), LastHourWithData = max(EndTime) by DataType
| order by BillableGB desc`,
    expected: 'One row per streamed Defender table with BillableGB and LastHourWithData. No rows means no Defender tables are streamed.',
    caveats: ['Results are to the hour only.', 'Defender Vulnerability Management (TVM) tables are never ingested into Sentinel, so they never appear here.'],
    sources: ['usage', 'xdrconnector'],
  },
  K_USAGE_LASTSEEN: {
    title: 'Every table with ingestion, and the days since its last data (last 90 days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true,
    cost: 'Low.', purpose: 'Gives you a quick freshness baseline across all tables, including non-billable ones.', notDo: 'Works to the hour, so it does not show the exact time of the last record.',
    code: `Usage
| where TimeGenerated > ago(90d)
| summarize TotalGB = round(sum(Quantity) / 1000., 3),
            BillableGB = round(sumif(Quantity, IsBillable == true) / 1000., 3),
            LastHourWithData = max(EndTime)
          by DataType
| extend DaysSinceLastData = datetime_diff('day', now(), LastHourWithData)
| order by DaysSinceLastData desc`,
    expected: 'Columns DataType, TotalGB, BillableGB, LastHourWithData and DaysSinceLastData. Tables with a large DaysSinceLastData are stale.',
    caveats: ['You decide what counts as "stale". Record the threshold you use.'], sources: ['usage'],
  },
  K_UNION_LASTRECORD: {
    title: 'Exact last record per table (expensive, so use a short window)', language: 'kql', status: 'composed', runIn: `${LA_ONLY} only. In advanced hunting, * also pulls in Defender tables.`, permissions: READER, readOnly: true,
    cost: 'High, because it scans every table. Microsoft advises avoiding wildcards when the table list is known. Keep the window to 1 to 7 days, or replace * with an explicit table list.',
    purpose: 'Confirms exactly when each table last received a record.', notDo: 'Does not cover functions. Its behaviour on the Basic, Auxiliary and lake tiers is not documented here.',
    code: `union withsource = TableName *
| where TimeGenerated > ago(7d)
| summarize LastRecord = max(TimeGenerated), Rows = count() by TableName
| order by LastRecord desc`,
    expected: 'Columns TableName, LastRecord and Rows.', caveats: ['For large workspaces, prefer an explicit table list from the Usage query.'], sources: ['union', 'usage'],
  },
  K_ALERTS_BY_PRODUCT: {
    title: 'SecurityAlert volume by product and provider (last 90 days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true,
    cost: 'Moderate. Narrow the window for large tenants.', purpose: 'Records which products generate alerts in each workspace, as a baseline before alerts move to the Defender XDR connector.',
    notDo: 'Does not show alert quality. Product and provider values change after the connector switch.',
    code: `SecurityAlert
| where TimeGenerated > ago(90d)
| summarize Rows = count(),
            UniqueAlerts = dcount(SystemAlertId),
            DistinctAlertNames = dcount(AlertName),
            FirstSeen = min(TimeGenerated),
            LastSeen = max(TimeGenerated)
          by ProductName, ProviderName, VendorName
| order by UniqueAlerts desc`,
    expected: 'One row per combination of ProductName, ProviderName and VendorName, with counts and the first and last time seen.',
    caveats: ['UniqueAlerts uses dcount(SystemAlertId) as a cautious way to count alerts that may have several rows.', 'Run it in every workspace, primary and secondary.'],
    sources: ['securityalerttable', 'schemadiff'],
  },
  K_INCIDENTS_BY_PROVIDER: {
    title: 'Incidents by provider (last 90 days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true, cost: 'Low to moderate.',
    purpose: 'Gives you an incident baseline. Before connection, providers include Azure Sentinel and others. After connection, all incidents show Microsoft XDR.', notDo: 'Does not show incident quality.',
    code: `SecurityIncident
| where TimeGenerated > ago(90d)
| summarize arg_max(TimeGenerated, *) by IncidentName
| summarize Incidents = count(),
            NotClosed = countif(Status != "Closed"),
            LastCreated = max(CreatedTime)
          by ProviderName
| order by Incidents desc`,
    expected: 'Columns ProviderName, Incidents, NotClosed and LastCreated.', caveats: ['arg_max keeps the latest record per incident, because SecurityIncident usually holds one row per update.'],
    sources: ['securityincidenttable', 'move'],
  },
  K_INCIDENTS_BY_RULE: {
    title: 'Analytics rules that produced incidents (last 90 days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true, cost: 'Low to moderate.',
    purpose: 'Shows which analytics rules create incidents, to compare before and after the transition.', notDo: 'Does not include alert-only rules.',
    code: `SecurityIncident
| where TimeGenerated > ago(90d)
| summarize arg_max(TimeGenerated, *) by IncidentName
| mv-expand RuleId = RelatedAnalyticRuleIds to typeof(string)
| summarize Incidents = count(), LastIncident = max(CreatedTime) by RuleId
| order by Incidents desc`,
    expected: 'Columns RuleId, Incidents and LastIncident. Join the result with your analytics rule export to find rules that never fire.',
    caveats: ['Microsoft incident creation rules are deactivated on connection, so their IDs disappear afterwards.'], sources: ['securityincidenttable'],
  },
  K_HEALTH_TAKE: {
    title: 'Check that the health and audit tables are populated', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Very low.',
    purpose: 'Confirms that auditing and health monitoring are enabled and producing data.', notDo: 'An empty result does not prove a fault, because the tables are created at the first event.',
    code: `_SentinelHealth()
 | take 20

_SentinelAudit()
 | take 20`,
    expected: 'Each function returns rows. Run them one at a time.', caveats: ['SentinelHealth is not billable. SentinelAudit is billable.'], sources: ['enablehealth', 'healthaudit'],
  },
  K_HEALTH_OVERVIEW: {
    title: 'Health overview across Sentinel resource types (last 14 days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Summarises failures and partial successes for analytics rules, data connectors, automation rules and playbooks.', notDo: 'Covers only resources that write health events.',
    code: `// First check the exact SentinelResourceType values in your tenant (documentation casing differs)
_SentinelHealth()
| where TimeGenerated > ago(14d)
| distinct SentinelResourceType, OperationName

// Then summarise
_SentinelHealth()
| where TimeGenerated > ago(14d)
| summarize Events = count(),
            Failures = countif(Status == "Failure"),
            PartialSuccess = countif(Status == "Partial success"),
            LastEvent = max(TimeGenerated)
          by SentinelResourceType, SentinelResourceKind, SentinelResourceName
| order by Failures desc, SentinelResourceType asc`,
    expected: 'Investigate every resource with Failures > 0.', caveats: ['Run the two queries separately.', 'KQL == is case-sensitive, and Microsoft pages use different casings for SentinelResourceType. If you filter on it, use =~.'],
    sources: ['healthtables', 'rulehealth'],
  },
  K_RULE_HEALTH: {
    title: 'Analytics rule health (Microsoft samples)', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Shows analytics rule execution status and reasons, including auto-disabled rules.', notDo: 'Works only when health monitoring is enabled.',
    code: `_SentinelHealth()
| where SentinelResourceType == "Analytics Rule"
| summarize Occurrence=count(), Unique_rule=dcount(SentinelResourceId) by Status, Reason`,
    expected: 'Each combination of Status and Reason, with counts. Investigate failures and "disabled" reasons.',
    caveats: ['If it returns nothing, retry with SentinelResourceType =~ "Analytics rule". The documentation uses different casings.'], sources: ['rulehealth', 'healthtables'],
  },
  K_CONNECTOR_FAILURES: {
    title: 'Data connectors whose latest fetch status is Failure (last 3 days)', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Finds the connectors that are failing now.', notDo: 'Connector health covers only some connector types, for example AWS, Office 365, MDE, TI and CCF-based connectors.',
    code: `SentinelHealth
| where TimeGenerated > ago(3d)
| where OperationName == 'Data fetch status change'
| where Status in ('Success', 'Failure')
| summarize TimeGenerated = arg_max(TimeGenerated,*) by SentinelResourceName, SentinelResourceId
| where Status == 'Failure'`,
    expected: 'Ideally no rows.', caveats: ['For connectors that health monitoring does not cover, use ingestion (Usage) as the ground truth.'], sources: ['connectorhealth'],
  },
  K_AUTOMATION_FAILURES: {
    title: 'Automation rule runs that did not succeed (last 7 days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Finds broken automation conditions, actions or permissions.', notDo: 'Does not show Enhanced Alert Trigger runs, because they are not written to SentinelHealth.',
    code: `SentinelHealth
| where TimeGenerated > ago(7d)
| where OperationName == "Automation rule run"
| where Status != "Success"
| project TimeGenerated, SentinelResourceName, Status, Description, Reason
| order by TimeGenerated desc`,
    expected: 'Few or no rows. Investigate each failure using the error descriptions on the automation health page.',
    caveats: ['Based on the Microsoft sample `SentinelHealth | where OperationName == "Automation rule run"`.'], sources: ['autohealth', 'healthtables'],
  },
  K_AUTOMATION_PLAYBOOK_JOIN: {
    title: 'Match automation rule runs to the playbook runs they triggered (Microsoft sample)', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Moderate.',
    purpose: 'Connects automation rule runs to the Logic Apps runs they triggered, with the status of each playbook run.',
    notDo: 'Works only if Logic Apps diagnostic settings send workflow runtime logs to the Sentinel workspace (AzureDiagnostics).',
    code: `SentinelHealth
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
    playbookRunStatus`,
    expected: 'One row per triggered playbook run, with its final status.', caveats: ['If the SentinelResourceType casing differs in your tenant, use =~.'], sources: ['autohealth'],
  },
  K_PLAYBOOK_TRIGGERED: {
    title: 'Manual and automated playbook trigger events', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Shows the playbook trigger events recorded in SentinelHealth.', notDo: 'Does not show alert-trigger playbooks, which appear only under automation rule events.',
    code: `SentinelHealth
| where OperationName == "Playbook was triggered"`,
    expected: 'Rows with Status Success or Failure.', caveats: [], sources: ['autohealth', 'healthtables'],
  },
  K_XDR_INCIDENTS: {
    title: 'Incidents created by the Defender XDR engine', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Confirms that incidents flow in with the provider Microsoft XDR.', notDo: 'Does not prove that every rule creates incidents.',
    code: `SecurityIncident
| where ProviderName == "Microsoft XDR"`,
    expected: 'Rows appear after connection. Allow a few minutes for SecurityIncident ingestion.', caveats: [], sources: ['xdrconnector', 'move'],
  },
  K_XDR_TREND: {
    title: 'Daily trend of Microsoft XDR incidents over 14 days (Microsoft sample)', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Gives you a visual check that incidents flow in continuously.', notDo: '',
    code: `let Now = now();
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
| render timechart`,
    expected: 'A continuous daily series without unexplained gaps.', caveats: [], sources: ['xdrconnector'],
  },
  K_MDC_ALERTS: {
    title: 'Microsoft Defender for Cloud alerts in the workspace', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Low to moderate. Add a time filter for large workspaces.',
    purpose: 'Shows whether Defender for Cloud alerts arrive in this workspace.', notDo: 'On its own, it does not tell tenant-based and legacy connectors apart.',
    code: `SecurityAlert
| where ProductName == "Azure Security Center"`,
    expected: 'Rows appear if a Defender for Cloud connector is active.', caveats: ['Add `| where TimeGenerated > ago(30d)` to limit the scan.'], sources: ['mdcalerts'],
  },
  K_WATCHLISTS: {
    title: 'List watchlist aliases and read one watchlist', language: 'kql', status: 'verbatim', runIn: LA, permissions: READER, readOnly: true, cost: 'Very low.',
    purpose: 'Lists the watchlists that your queries can use.', notDo: '',
    code: `_GetWatchlistAlias

_GetWatchlist('mywatchlist')`,
    expected: 'A list of aliases, then the items of the named watchlist.', caveats: ["Run the two queries separately, and replace 'mywatchlist' with a real alias.", 'Watchlists refresh every 12 days, which updates TimeGenerated.'], sources: ['watchlists'],
  },
  K_TI_CURRENT: {
    title: 'Current threat intelligence objects (deduplicated, last 14 days)', language: 'kql', status: 'composed', runIn: LA, permissions: READER, readOnly: true, cost: 'Moderate. It scans 14 days of TI.',
    purpose: 'Counts the current indicators and STIX objects in the new TI tables.', notDo: 'Does not cover the legacy ThreatIntelligenceIndicator table.',
    code: `let window = 14d;  // all TI is republished every 7-10 days
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
| project Table, StixType, Objects, Active, LastIngest`,
    expected: 'Counts per table and STIX type, with the last ingest time.', caveats: ['Republishing is billed as ingestion.'], sources: ['stix', 'ti'],
  },
  K_TI_LEGACY: {
    title: 'Freshness of the legacy TI table', language: 'kql', status: 'composed', runIn: LA_ONLY, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Confirms that the legacy ThreatIntelligenceIndicator table no longer receives data.', notDo: 'Does not find content that still queries the legacy table. To find it, scan rules, workbooks and saved searches for the table name.',
    code: `ThreatIntelligenceIndicator
| summarize Rows = count(), LastIngest = max(TimeGenerated)`,
    expected: 'LastIngest is no later than about 31 July 2025. If the table never existed in the workspace, the query fails.', caveats: [], sources: ['ti'],
  },
  K_UEBA_TABLES: {
    title: 'UEBA tables with ingestion (last 30 days)', language: 'kql', status: 'composed', runIn: LA_ONLY, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Shows whether UEBA is on and which UEBA layers produce data.', notDo: '',
    code: `Usage
| where TimeGenerated > ago(30d)
| where DataType in ("IdentityInfo", "BehaviorAnalytics", "UserPeerAnalytics", "Anomalies", "SentinelBehaviorInfo", "SentinelBehaviorEntities")
| summarize GB = round(sum(Quantity) / 1000., 3), LastHourWithData = max(EndTime) by DataType`,
    expected: 'Recent data in IdentityInfo and BehaviorAnalytics suggests that UEBA is on.', caveats: ['SentinelBehavior* tables exist only if the behaviors layer is enabled.'], sources: ['ueba', 'usage'],
  },
  K_BOOKMARKS: {
    title: 'Hunting bookmarks in the workspace (approximate)', language: 'kql', status: 'composed', runIn: LA_ONLY, permissions: READER, readOnly: true, cost: 'Low.',
    purpose: 'Shows whether bookmarks are in use.', notDo: 'Counts rows, which may include updates to the same bookmark.',
    code: `HuntingBookmark
| summarize Rows = count(), Latest = max(TimeGenerated)`,
    expected: 'Rows > 0 means that bookmarks exist.', caveats: [], sources: ['hunting'],
  },
  K_MANUAL_INCIDENTS: {
    title: 'Heuristic: incidents without alerts (possibly created manually or by API)', language: 'kql', status: 'composed', runIn: LA_ONLY, permissions: READER, readOnly: true, cost: 'Low to moderate.',
    purpose: 'Helps you find incidents that were created manually, by API or by playbooks. These incidents have no alerts.', notDo: 'A heuristic only, with low confidence. Confirm the results with the SOC.',
    code: `SecurityIncident
| where TimeGenerated > ago(90d)
| summarize arg_max(TimeGenerated, *) by IncidentNumber
| where array_length(AlertIds) == 0
| summarize Incidents = count(), Latest = max(CreatedTime)`,
    expected: 'A count of incidents with no alerts.', caveats: ['Confidence: low. Manually created incidents have no alerts or entities and no product name.'], sources: ['manualincidents', 'securityincidenttable'],
  },
  ARG_SENTINEL_WORKSPACES: {
    title: 'Sentinel-enabled workspaces (SecurityInsights solutions)', language: 'kql', status: 'composed', runIn: ARG, permissions: 'Read access on the subscriptions in scope. Resource Graph returns only the resources you can see.', readOnly: true, cost: 'None.',
    purpose: 'Finds the Log Analytics workspaces that have the SecurityInsights (Microsoft Sentinel) solution.', notDo: 'Does not show whether a workspace is connected to the Defender portal.',
    code: `Resources
| where type =~ 'microsoft.operationsmanagement/solutions'
| where name startswith 'SecurityInsights('
| project solution = name, resourceGroup, subscriptionId, location,
          workspaceResourceId = tostring(properties.workspaceResourceId)
| order by subscriptionId asc, resourceGroup asc`,
    expected: 'One row per Sentinel-enabled workspace.',
    caveats: ['Confidence: medium. The solution naming and the workspaceResourceId property were not verified against a live tenant. Cross-check with Get-AzSentinelOnboardingState or the portal.', 'Resource Graph property paths are case-sensitive.'],
    sources: ['argtypes', 'roles', 'azps'],
  },
  ARG_LOGIC_APPS: {
    title: 'Logic Apps (playbook candidates)', language: 'kql', status: 'composed', runIn: ARG, permissions: 'Read access on the subscriptions in scope', readOnly: true, cost: 'None.',
    purpose: 'Lists the Logic Apps that may be Sentinel playbooks.', notDo: 'Not every Logic App is a Sentinel playbook. Cross-check the list against the RunPlaybook actions in your automation rules.',
    code: `Resources
| where type =~ 'microsoft.logic/workflows'
| project name, resourceGroup, subscriptionId, location, state = tostring(properties.state), id
| order by subscriptionId asc, resourceGroup asc, name asc`,
    expected: 'Logic Apps with their state.', caveats: [], sources: ['argtypes', 'argstarter'],
  },
  ARG_WORKBOOKS: {
    title: 'Workbook resources', language: 'kql', status: 'composed', runIn: ARG, permissions: 'Read access on the subscriptions in scope', readOnly: true, cost: 'None.',
    purpose: 'Lists workbook resources and the workspace each one is linked to (sourceId).', notDo: 'Does not scan workbook content.',
    code: `Resources
| where type =~ 'microsoft.insights/workbooks'
| project name, resourceGroup, subscriptionId, displayName = tostring(properties.displayName), category = tostring(properties.category), sourceId = tostring(properties.sourceId), id
| order by resourceGroup asc, displayName asc`,
    expected: 'Workbooks per resource group, with their display names.', caveats: ['To scan content, for example for IdentityInfo or ThreatIntelligenceIndicator, use the Workbooks REST API with canFetchContent=true.'], sources: ['argtypes', 'workbooks'],
  },
  REST_INVENTORY_CLI: {
    title: 'Inventory analytics rules, automation rules, watchlists and data connectors (Azure CLI, read-only GET)', language: 'bash', status: 'composed', runIn: SHELL + ' (Bash)', permissions: 'Microsoft Sentinel Reader at resource-group scope (recommended)', readOnly: true,
    cost: 'None, though Azure Resource Manager read throttling applies.', purpose: 'Captures a configuration inventory. Store the raw JSON as evidence and as part of your backup.',
    notDo: 'Table output does not include full rule definitions. To keep the raw JSON, drop --query and -o table.',
    code: `SUB="<subscriptionId>"; RG="<resourceGroupName>"; WS="<workspaceName>"
API="2025-09-01"            # stable; repeat the alertRules call with API="2025-07-01-preview" to capture NRT/ML/TI rule kinds
BASE="https://management.azure.com/subscriptions/$SUB/resourceGroups/$RG/providers/Microsoft.OperationalInsights/workspaces/$WS/providers/Microsoft.SecurityInsights"

# Analytics rules
az rest --method get --url "$BASE/alertRules?api-version=$API" \\
  --query "value[].{name:name, kind:kind, displayName:properties.displayName, enabled:properties.enabled, severity:properties.severity, template:properties.alertRuleTemplateName, modified:properties.lastModifiedUtc}" -o table

# Automation rules
az rest --method get --url "$BASE/automationRules?api-version=$API" \\
  --query "value[].{name:name, displayName:properties.displayName, order:properties.order, enabled:properties.triggeringLogic.isEnabled, triggersOn:properties.triggeringLogic.triggersOn, triggersWhen:properties.triggeringLogic.triggersWhen}" -o table

# Watchlists (metadata only)
az rest --method get --url "$BASE/watchlists?api-version=$API" \\
  --query "value[].{alias:properties.watchlistAlias, displayName:properties.displayName, provider:properties.provider, source:properties.source, updated:properties.updated}" -o table

# Data connectors
az rest --method get --url "$BASE/dataConnectors?api-version=$API" \\
  --query "value[].{name:name, kind:kind}" -o table`,
    expected: 'Tables of analytics rules, automation rules, watchlists and connectors.',
    caveats: ['The stable 2025-09-01 API lists only the Scheduled, MicrosoftSecurityIncidentCreation and Fusion rule kinds. Compare the counts with 2025-07-01-preview.', 'The data connectors API is not a complete connector inventory. Cross-check it with ingestion (Usage).', 'List responses can include nextLink for further pages.'],
    sources: ['sialertrules', 'siautomation', 'siwatchlists', 'siconnectors', 'siversions'],
  },
  PS_ANALYTICS_SCAN: {
    title: 'Scan analytics rules for transition-relevant settings (PowerShell, read-only GET)', language: 'powershell', status: 'composed', runIn: SHELL + ' (PowerShell with Az.Accounts, after Connect-AzAccount)', permissions: 'Microsoft Sentinel Reader at resource-group scope', readOnly: true, cost: 'None.',
    purpose: 'Flags Fusion and Microsoft incident creation rules, alert-only rules, "re-open closed incidents", alert grouping, correlation tags, and queries that reference IdentityInfo or the legacy TI table.',
    notDo: 'Changes nothing, and does not judge whether a rule is still needed.',
    code: `$sub = '<subscriptionId>'; $rg = '<resourceGroupName>'; $ws = '<workspaceName>'
$base = "/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.OperationalInsights/workspaces/$ws/providers/Microsoft.SecurityInsights"
$rows = foreach ($api in '2025-09-01', '2025-07-01-preview') {
  $path = "$base/alertRules?api-version=$api"
  while ($path) {
    $resp = Invoke-AzRestMethod -Path $path -Method GET
    if ($resp.StatusCode -ne 200) { Write-Warning "HTTP $($resp.StatusCode) for $api"; break }
    $body = $resp.Content | ConvertFrom-Json
    foreach ($r in $body.value) {
      $p = $r.properties
      [pscustomobject]@{
        ApiVersion       = $api
        Rule             = $p.displayName
        Kind             = $r.kind
        Enabled          = $p.enabled
        CreateIncident   = $p.incidentConfiguration.createIncident
        GroupingEnabled  = $p.incidentConfiguration.groupingConfiguration.enabled
        ReopenClosed     = $p.incidentConfiguration.groupingConfiguration.reopenClosedIncident
        CorrelationTag   = if ($p.description -match '^\\s*#(INC|DONT)_CORR#') { $Matches[0].Trim() } else { '' }
        UsesIdentityInfo = [bool]($p.query -match 'IdentityInfo')
        UsesLegacyTI     = [bool]($p.query -match 'ThreatIntelligenceIndicator')
        ProductFilter    = $p.productFilter
      }
    }
    $path = if ($body.nextLink) { ([uri]$body.nextLink).PathAndQuery } else { $null }
  }
}
$rows | Sort-Object Rule -Unique | Format-Table -AutoSize
$rows | Export-Csv -Path .\\analytics-rules-scan.csv -NoTypeInformation   # attach this CSV as evidence`,
    expected: 'One row per rule. Rows with Kind = Fusion or MicrosoftSecurityIncidentCreation, CreateIncident = False, ReopenClosed = True, or UsesLegacyTI = True all need a decision.',
    caveats: ['Written for this project and not run against a live tenant. Review it before use.', 'Property paths come from the SecurityInsights alert rule model. Rule kinds without incidentConfiguration show empty values.', 'Running both API versions can list a rule twice. The final Sort-Object -Unique keeps one row per name.'],
    sources: ['sialertrules', 'siversions', 'invokerest', 'corrsettings', 'createrules'],
  },
  PS_AUTOMATION_SCAN: {
    title: 'Scan automation rules for conditions that change after connection (PowerShell, read-only GET)', language: 'powershell', status: 'composed', runIn: SHELL + ' (PowerShell with Az.Accounts, after Connect-AzAccount)', permissions: 'Microsoft Sentinel Reader at resource-group scope', readOnly: true, cost: 'None.',
    purpose: 'Finds automation rules whose conditions use the Incident provider, title, description or "Updated by", plus alert-trigger rules and playbook actions.',
    notDo: 'Changes nothing. String matching on the condition JSON is only a screening aid, so review each flagged rule.',
    code: `$sub = '<subscriptionId>'; $rg = '<resourceGroupName>'; $ws = '<workspaceName>'
$path = "/subscriptions/$sub/resourceGroups/$rg/providers/Microsoft.OperationalInsights/workspaces/$ws/providers/Microsoft.SecurityInsights/automationRules?api-version=2025-09-01"
$risky = 'IncidentProviderName', 'IncidentTitle', 'IncidentDescription', 'IncidentUpdatedBySource'
$rows = while ($path) {
  $resp = Invoke-AzRestMethod -Path $path -Method GET
  if ($resp.StatusCode -ne 200) { Write-Warning "HTTP $($resp.StatusCode)"; break }
  $body = $resp.Content | ConvertFrom-Json
  foreach ($r in $body.value) {
    $logic = $r.properties.triggeringLogic
    $json  = $logic | ConvertTo-Json -Depth 30
    [pscustomobject]@{
      Rule            = $r.properties.displayName
      Enabled         = $logic.isEnabled
      TriggersOn      = $logic.triggersOn
      TriggersWhen    = $logic.triggersWhen
      RiskyConditions = ($risky | Where-Object { $json -match [regex]::Escape($_) }) -join ', '
      PlaybookActions = @($r.properties.actions | Where-Object { $_.actionType -eq 'RunPlaybook' }).Count
      TaskActions     = @($r.properties.actions | Where-Object { $_.actionType -eq 'AddIncidentTask' }).Count
    }
  }
  $path = if ($body.nextLink) { ([uri]$body.nextLink).PathAndQuery } else { $null }
}
$rows | Format-Table -AutoSize
$rows | Export-Csv -Path .\\automation-rules-scan.csv -NoTypeInformation   # attach this CSV as evidence`,
    expected: 'Rules with a non-empty RiskyConditions need redesign. A rule with TriggersOn = Alerts acts only on Sentinel alerts in the Defender portal.',
    caveats: ['Written for this project and not run against a live tenant. Review it before use.', 'The documentation does not list the string values used for IncidentUpdatedBySource. Review those conditions by hand.'],
    sources: ['siautomation', 'automation', 'invokerest'],
  },
  REST_SAVED_SEARCHES: {
    title: 'Hunting queries, parsers and functions (Log Analytics saved searches)', language: 'bash', status: 'composed', runIn: SHELL + ' (Bash)', permissions: 'Log Analytics Reader or Microsoft Sentinel Reader', readOnly: true, cost: 'None.',
    purpose: 'Lists custom hunting queries, parsers and functions, which are stored as saved searches.', notDo: '',
    code: `az rest --method get \\
  --url "https://management.azure.com/subscriptions/$SUB/resourceGroups/$RG/providers/Microsoft.OperationalInsights/workspaces/$WS/savedSearches?api-version=2026-03-01" \\
  --query "value[].{name:name, category:properties.category, displayName:properties.displayName, functionAlias:properties.functionAlias}" -o table`,
    expected: 'Saved searches with their category and function alias.', caveats: ['Set SUB, RG and WS first, as in the inventory snippet.', 'The category that Sentinel uses for hunting queries is not documented. Group by category and inspect the results.'], sources: ['cicd'],
  },
  PS_ONBOARDING_STATE: {
    title: 'Sentinel onboarding state of a workspace (PowerShell)', language: 'powershell', status: 'composed', runIn: SHELL + ' (PowerShell with Az.SecurityInsights)', permissions: 'Microsoft Sentinel Reader', readOnly: true, cost: 'None.',
    purpose: 'Cross-checks that Sentinel is enabled on a workspace.', notDo: 'Does not show the Defender portal connection. It only tells you whether Sentinel is enabled on the workspace.',
    code: `Get-AzSentinelOnboardingState -ResourceGroupName "<resourceGroupName>" -WorkspaceName "<workspaceName>"`,
    expected: 'An onboarding state object for Sentinel-enabled workspaces.', caveats: ['The cmdlet is listed in Az.SecurityInsights, but its exact output was not researched.'], sources: ['azps'],
  },
  HTTP_GRAPH_INCIDENTS: {
    title: 'Microsoft Graph: unified incidents and Sentinel alerts (read-only)', language: 'http', status: 'verbatim', runIn: 'Your integration code or a tool such as Graph Explorer, authenticated with the least-privileged permission', permissions: 'SecurityIncident.Read.All (incidents), SecurityAlert.Read.All (alerts)', readOnly: true, cost: 'None.',
    purpose: 'Shows the recommended API for unified incidents and alerts after the transition.', notDo: 'Graph incidents have no providerName or alertProductNames. Use the serviceSource, detectionSource and productName of the alerts instead.',
    code: `GET https://graph.microsoft.com/v1.0/security/incidents?$expand=alerts

GET https://graph.microsoft.com/v1.0/security/alerts_v2?$filter=serviceSource eq 'microsoftSentinel'`,
    expected: 'Incidents with their alerts, and Sentinel alerts filtered by service source.', caveats: ['Sentinel alerts and incidents are visible in Graph only after Sentinel is connected to the Defender portal.', 'Some detectionSource values need the header Prefer: include-unknown-enum-members.'],
    sources: ['graphlistincidents', 'graphalerts', 'graphalert'],
  },
};
