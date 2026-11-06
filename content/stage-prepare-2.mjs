// Stage 1, Prepare (part 2 of 3): connectors, detections, automation, integrations.
import { k, src, q, any, all, at, outcome } from './define.mjs';

const DP = 'Defender portal';
const AP = 'Azure portal';
const ORG = 'Your organisation';

export const PREPARE_2 = [
  // ───────────────────────── Data connectors and ingestion ─────────────────────────
  k({
    id: 'PREP-CON-01', stage: 'prepare', workstream: 'connectors', order: 10, kind: 'check', criticality: 'critical', applicability: q('defender_xdr'), testable: true,
    title: 'Review the Microsoft Defender XDR connector configuration',
    objective: 'Record the current state of the Defender XDR connector, and confirm that incidents and alerts will be turned on for the primary workspace.',
    why: [
      'When you connect and are licensed for Defender XDR, Sentinel is connected to Defender XDR. The connector is set up automatically, on the primary workspace only.',
      'Microsoft asks you to make sure incidents and alerts from this connector are turned on.',
      'Switching to the connector replaces standalone Microsoft connectors and changes some alert schema details and filtering.',
    ],
    where: [at(AP, 'Microsoft Sentinel > Configuration > Data connectors > Microsoft Defender XDR > Open connector page')],
    steps: [
      'Open the Microsoft Defender XDR connector page in each workspace that uses it.',
      {
        text: 'Write down the state of each section in [[do:write-notes|this step\'s notes]]:',
        bullets: [
          '"Connect incidents & alerts"',
          '"Connect entities"',
          '"Connect events", and which event tables are streamed',
        ],
        tip: 'The option "Turn off all Microsoft incident creation rules for these products. Recommended." appears only before the connector is connected.',
      },
      'Note which workspace will host the connector after the transition (the primary).',
      {
        text: 'Note the filtering differences after the switch:',
        bullets: [
          'Informational Defender for Cloud alerts are not ingested.',
          'Entra ID Protection alerts below High are not ingested by default.',
        ],
      },
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Configuration > Data connectors** in the Azure portal, select **Microsoft Defender XDR**, then **Open connector page**. The **Configuration** section shows its three parts, and the data graph shows one line each for incidents, alerts and events. This confirms data is arriving without a query.",
    ],
    snippets: ['K_XDR_INCIDENTS'],
    expected: 'The connector state is documented for each workspace, and the plan confirms that incidents and alerts are on for the primary.',
    record: [
      'The connector state for each workspace, in [[do:write-notes|this step\'s notes]]',
      'The event tables that are streamed, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: ['A screenshot of the connector page: [[do:add-screenshot|attach a screenshot]]'],
    sources: [src('xdrint', 'Automatic connection when licensed; standalone connectors disconnected'), src('xdrconnector', 'Connector sections; automatic enablement on onboarding; checkbox behaviour; portal: connector page Configuration sections and the data graph with one line each for incidents, alerts and events'), src('move', 'Make sure incidents and alerts from this connector are turned on'), src('multiws', 'Connector attached to the primary workspace only'), src('schemadiff', 'Schema and filtering differences')],
  }),
  k({
    tool: 'mdc',
    // The decision helper restates this step and its sources only (see src/core/decision-helper.js for the rule kinds).
    helper: {
      decision: 'Defender for Cloud connector approach',
      intro: 'Answer three questions. You see what this step says for your answers, and both approaches side by side. You choose.',
      questions: [
        {
          id: 'today', text: 'Which Defender for Cloud connector do your workspaces use today?', hint: 'The connector pages in the Azure portal show it: see **No query access? Use the portal** below.',
          options: [{ id: 'legacy', label: 'The legacy subscription-based connector' }, { id: 'tenant', label: 'The tenant-based connector' }, { id: 'both', label: 'Both' }, { id: 'unknown', label: 'Not checked yet' }],
        },
        {
          id: 'correlated', text: 'Do you want tenant-correlated Defender for Cloud data in the primary workspace?',
          options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }, { id: 'unknown', label: 'Not decided yet' }],
        },
        {
          id: 'incidents', text: 'Do you want incidents from Defender for Cloud alerts, or only the alerts?',
          options: [{ id: 'incidents', label: 'Incidents and alerts' }, { id: 'alerts', label: 'Only the alerts' }, { id: 'unknown', label: 'Not decided yet' }],
        },
      ],
      choices: [
        {
          id: 'tenant', title: 'Tenant-based connector on the primary', badge: 'Microsoft recommends it',
          summary: 'Connect the tenant-based connector (preview) in the primary workspace, and disconnect the legacy subscription-based connector from all workspaces.',
          pros: ['Avoids duplicates. That is why Microsoft recommends it.', 'You get tenant-correlated Defender for Cloud data in the primary workspace.'],
          cons: ['The tenant-based connector is labelled preview.', 'You turn off the rules that create incidents from Defender for Cloud alerts, and handle noise with automation rules or alert tuning.'],
          todo: [
            'Connect the tenant-based connector in the primary workspace, in the Azure portal.',
            'Disconnect the legacy connector from all workspaces.',
            'Turn off the incident-creating rules for Defender for Cloud alerts: Microsoft incident creation rules with the product filter "Azure Security Center", and scheduled rules that query those alerts.',
            'Handle noise with automation rules or alert tuning.',
          ],
        },
        {
          id: 'legacy', title: 'Keep the legacy subscription-based connector',
          summary: 'Keep the legacy connector if you do not want tenant-correlated Defender for Cloud data in the primary workspace.',
          pros: ['No tenant-correlated Defender for Cloud data in the primary workspace, if you do not want it.'],
          cons: ['With only the legacy connector and Defender XDR incident integration, you may receive Defender for Cloud incidents with empty alerts. You accept that risk.'],
          todo: ['Keep the legacy connector configured in the Azure portal.', 'Record the empty-alert risk and who accepts it: [[do:add-risk|add a risk]].'],
        },
      ],
      rules: [
        { when: { correlated: ['yes'] }, kind: 'recommends', on: 'tenant', point: 1, say: 'You want tenant-correlated data. Microsoft recommends the tenant-based connector on the primary, with the legacy connector disconnected from all workspaces, to avoid duplicates.' },
        { when: { correlated: ['no'] }, kind: 'recommends', on: 'legacy', point: 0, say: 'You don\'t want tenant-correlated data. For that case, this step says to keep the legacy connector and accept the empty-alert risk.' },
        { when: { today: ['both'] }, kind: 'pro', on: 'tenant', point: 0, say: 'You use both connectors today. Disconnecting the legacy connector from all workspaces avoids duplicates.' },
        { when: { today: ['tenant'] }, kind: 'pro', on: 'tenant', say: 'You already use the tenant-based connector. Check that it is on the primary workspace and that the legacy connector is disconnected everywhere.' },
        { when: { today: ['unknown'] }, kind: 'note', say: 'Check the connector pages first. The legacy connector page lists your subscriptions and the status of their connection.' },
        { when: { incidents: ['alerts'] }, kind: 'note', say: 'If you want Defender for Cloud alerts but not incidents, Microsoft suggests automation rules that close those incidents as they arrive.' },
      ],
      notes: ['Both connectors are hidden from the Defender portal\'s Data connectors page, so you configure them in the Azure portal.'],
    },
    id: 'PREP-CON-02', stage: 'prepare', workstream: 'connectors', order: 20, kind: 'decision', criticality: 'high', applicability: q('mdc'), validation: 'needs-review', confidence: 'medium', testable: true,
    title: 'Choose the Defender for Cloud connector approach to avoid duplicate or empty incidents',
    objective: 'Decide between the tenant-based and the legacy subscription-based Defender for Cloud connector, and the rule changes that go with it.',
    why: [
      'Microsoft recommends connecting the tenant-based Defender for Cloud connector (preview) in the primary workspace, and disconnecting the legacy subscription-based connector from all workspaces, to avoid duplicates.',
      'With only the legacy connector and Defender XDR incident integration, you may receive Defender for Cloud incidents with empty alerts.',
      'Both connectors are hidden from the Defender portal\'s Data connectors page, so you configure them in the Azure portal.',
    ],
    where: [at(AP, 'Microsoft Sentinel > Data connectors (Tenant-based Microsoft Defender for Cloud (Preview), Subscription-based Microsoft Defender for Cloud (Legacy))'), at(AP, 'Microsoft Sentinel > Content management > Content hub > Microsoft Defender for Cloud solution (version 3.0.0 or later)')],
    steps: [
      'Note which Defender for Cloud connector or connectors each workspace uses today, in [[do:write-notes|this step\'s notes]].',
      'Run the Defender for Cloud alerts query.',
      {
        text: 'List the analytics rules that create incidents from Defender for Cloud alerts:',
        bullets: [
          'Microsoft incident creation rules with the product filter "Azure Security Center"',
          'Scheduled rules that query those alerts',
        ],
      },
      {
        text: 'Answer the questions in **Do it here** and choose one of the two approaches:',
        bullets: [
          '**Recommended:** the tenant-based connector on the primary, the legacy connector disconnected everywhere, incident-creating rules for Defender for Cloud alerts turned off, and noise handled with automation rules or alert tuning.',
          '**Keep the legacy connector** if you do not want tenant-correlated Defender for Cloud data in the primary workspace. You then accept the empty-alert risk.',
        ],
        tip: 'If you want Defender for Cloud alerts but not incidents, Microsoft suggests automation rules that close those incidents as they arrive.',
      },
      'Save your choice in **Do it here**, then record it as a decision. The assistant fills in your reasons and the implementation steps for [[go:stage:transition|Stage 2]]. You can also [[do:add-decision|add the decision to the register]] yourself.',
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Configuration > Data connectors** in the Azure portal. Open the page of **Subscription-based Microsoft Defender for Cloud (Legacy)** and of **Tenant-based Microsoft Defender for Cloud (Preview)**. Under **Configuration**, the legacy connector lists your subscriptions and the status of their connection.",
      "Find the Microsoft incident creation rules: on the **Active rules** tab of **Microsoft Sentinel > Configuration > Analytics**, filter by the **Microsoft security** rule type. Open each rule to see its **Microsoft security service**.",
      "Export the analytics rules from **Microsoft Sentinel > Configuration > Analytics**: select the rules, then **Export**. Search the file for Azure Security Center, the product name of Defender for Cloud alerts, to find scheduled rules that query them. The file includes each scheduled rule's query.",
    ],
    snippets: ['K_MDC_ALERTS', 'PS_ANALYTICS_SCAN'],
    expected: 'A recorded decision that lists the rule changes needed.',
    record: [
      'The connectors in use today, in [[do:write-notes|this step\'s notes]]',
      'The decision: choose it in **Do it here** and record it from there, or [[do:add-decision|add it to the register]]',
      'The rules to turn off, in the decision or in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: [
      'Connector screenshots: [[do:add-screenshot|attach a screenshot]]',
      'The query results: [[do:add-file|attach a file]]',
    ],
    sources: [src('onboard', 'Tenant-based connector in primary; disconnect legacy, or keep legacy if no tenant-correlated data wanted'), src('mdcxdr', 'Steps to prevent duplicate alerts and incidents'), src('mdcincidents', 'Empty alerts risk; close incidents with automation rules'), src('mdcalerts', 'Connector not listed in the Defender portal Data connectors page; KQL sample; portal: connector pages, list of subscriptions and their connection status; product name Azure Security Center'), src('move', 'Prevent duplicate events and alerts with the tenant-based connector; hidden connectors'), src('createincidents', 'Microsoft security rule type filter on the Analytics page and the Microsoft security service field'), src('fusionconfig', 'The Active rules tab can be filtered by rule type and shows each rule status'), src('exportrules', 'Export from the Analytics page; the file includes the query of scheduled rules')],
    caveats: ['No current Microsoft page fetched on 2026-10-19 documents a UI path to "opt out" of Defender for Cloud incident sync into Defender XDR. Treat older guidance that describes an opt-out as possibly outdated.', 'The tenant-based connector is labelled preview.'],
  }),
  k({
    id: 'PREP-CON-03', stage: 'prepare', workstream: 'connectors', order: 30, kind: 'task', criticality: 'high', applicability: q('irm'),
    title: 'Plan the Insider Risk Management connector placement',
    objective: 'Make sure the Microsoft 365 Insider Risk Management connector is enabled only on the primary workspace before you connect.',
    why: 'Microsoft lists this as a prerequisite: enable the Microsoft 365 Insider Risk Management connector on the primary workspace and disable it on secondary workspaces before onboarding.',
    where: [at(AP, 'Microsoft Sentinel > Data connectors > Microsoft 365 Insider Risk Management')],
    steps: [
      'Note which workspaces have the connector enabled today, in [[do:write-notes|this step\'s notes]].',
      {
        text: 'Plan the change so that the connector is enabled only on the planned primary.',
        tip: 'You make the change in [[go:stage:transition|Stage 2]]: [[TRN-06]].',
      },
      'Check which rules or workbooks in secondary workspaces use its data.',
    ],
    expected: 'A planned connector change with no unexpected dependencies.',
    record: [
      'Where the connector is enabled today, in [[do:write-notes|this step\'s notes]]',
      'The planned change: [[do:add-action|add it as an action]]',
    ],
    evidence: ['A screenshot of the connector state: [[do:add-screenshot|attach a screenshot]]'],
    sources: [src('onboard', 'Insider Risk Management prerequisite')],
  }),
  k({
    id: 'PREP-CON-04', topics: ['backups'], stage: 'prepare', workstream: 'connectors', order: 40, kind: 'task', criticality: 'critical',
    title: 'Capture an ingestion baseline',
    objective: 'Record which tables receive data, how much, and how fresh it is. After the transition, you can then prove that monitoring coverage did not change.',
    why: 'Connecting to the Defender portal is not supposed to change log ingestion for non-Microsoft connectors. But standalone Microsoft connectors are replaced or disconnected in some workspaces. A dated baseline is the only reliable way to detect gaps afterwards.',
    roles: ['Microsoft Sentinel Reader or Log Analytics Reader'],
    where: [at(AP, 'Log Analytics workspace > Logs (each workspace)')],
    steps: [
      'Run the "Billable ingestion per table" and "days since last data" queries in each workspace.',
      'Export each result to CSV and [[do:add-file|attach it to this step]], with the run time (UTC) and the [[go:environments|workspace alias]] in the evidence title.',
      'Mark the tables that matter most for detection (your "critical tables").',
      'Write down the freshness you expect for each critical table, in [[do:write-notes|this step\'s notes]].',
      'Optionally, run the exact last-record query for the critical tables only. It is expensive.',
    ],
    portalWay: [
      "Open **Log Analytics workspaces** in the Azure portal, choose the workspace, then **Monitoring > Insights** and the **Usage** tab. It shows how much data each table received in the time range you set (24 hours by default), grouped by solution, and whether it's billable. Its last update time is when usage statistics were refreshed, not when the last record arrived. You need read access to the workspace, for example **Log Analytics Reader**.",
      "Select **Usage and estimated costs** on the workspace menu. It charts billable data ingestion by solution over the past 31 days.",
      "Install the **Data collection health monitoring** workbook from the **Content hub** for freshness, then open it from the **Templates** tab of **Microsoft Sentinel > Threat management > Workbooks**. Its **Overview** tab shows volume, events per second and the time the last log was received. Workbooks show only data you have permission to read.",
    ],
    snippets: ['K_USAGE_BY_TABLE', 'K_USAGE_LASTSEEN', 'K_UNION_LASTRECORD'],
    expected: 'Dated baseline files for each workspace, and a list of critical tables with their expected freshness.',
    record: [
      'The critical tables and the freshness you expect, in [[do:write-notes|this step\'s notes]]',
      'The run time and workspace of each baseline, in the title of each [[go:evidence|evidence]] file',
    ],
    evidence: ['CSV exports of the queries: [[do:add-file|attach a file]]'],
    sources: [src('usage', 'Usage table analysis; portal: Workspace Insights Usage tab and the Usage and estimated costs page'), src('union', 'union operator cost guidance'), src('move', 'Non-Microsoft connectors continue operating without interruption'), src('wsinsights', 'Workspace menu Monitoring > Insights; Usage tab per table and solution; usage statistics refresh hourly; read permissions needed'), src('costusage', 'Usage and estimated costs on the workspace menu shows billable ingestion by solution for the past 31 days'), src('connectorhealth', 'Data collection health monitoring workbook from the Content hub; Overview tab shows volume, EPS and time last log received'), src('azworkbooks', 'Workbook permissions are based on the permissions you have for the resources the workbook uses')],
    practiceNotes: ['Name evidence files consistently, for example "baseline-ingestion-<workspace>-<yyyymmdd>.csv". You will compare them in [[go:stage:validate|Stage 3]].'],
  }),
  k({
    id: 'PREP-CON-05', topics: ['backups'], stage: 'prepare', workstream: 'connectors', order: 50, kind: 'task', criticality: 'high',
    title: 'Capture an alert and incident baseline',
    objective: 'Record alert and incident volumes by product, provider and analytics rule before the transition.',
    why: [
      'After connection, all incidents show the provider "Microsoft XDR", and alerts from Microsoft products arrive through the Defender XDR connector.',
      'Incidents may be named and grouped differently.',
      'A baseline taken before the change lets you explain these changes instead of guessing.',
    ],
    where: [at(AP, 'Log Analytics workspace > Logs (each workspace)')],
    steps: [
      'Run the three queries below in each workspace.',
      'Export the results to CSV and [[do:add-file|attach them to this step]], with the run time and the [[go:environments|workspace alias]].',
      {
        text: 'Note the top analytics rules by incident volume, in [[do:write-notes|this step\'s notes]].',
        tip: 'You will use them as representative detections in testing and validation.',
      },
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Threat management > Incidents** in the Azure portal. The top of the page shows the counts of open incidents, new or active, and of open incidents by severity. Filter the list by status, severity or product name to count each group.",
      "Select one rule on **Microsoft Sentinel > Configuration > Analytics** and open the **Insights** tab. **Alert graph** shows how many alerts the rule generated in the time frame you choose, and **Incident classification** summarises its closed incidents. This preview covers Scheduled and NRT rules and needs analytics rule health monitoring turned on.",
    ],
    snippets: ['K_ALERTS_BY_PRODUCT', 'K_INCIDENTS_BY_PROVIDER', 'K_INCIDENTS_BY_RULE'],
    expected: 'Dated baseline files for each workspace.',
    record: [
      'The top rules by incident volume, in [[do:write-notes|this step\'s notes]]',
      'The run times, in the title of each [[go:evidence|evidence]] file',
    ],
    evidence: ['CSV exports: [[do:add-file|attach a file]]'],
    sources: [src('move', 'Provider name always Microsoft XDR; incident names may change'), src('schemadiff', 'Alert schema differences'), src('securityincidenttable', 'SecurityIncident columns'), src('triageincidents', 'Incidents page shows counts of open incidents and filters by status, severity and product name'), src('ruleinsights', 'Insights tab with alert graph and incident classification per rule; preview; Scheduled and NRT rules; needs analytics rule health monitoring')],
  }),
  k({
    id: 'PREP-CON-06', stage: 'prepare', workstream: 'connectors', order: 60, kind: 'task', criticality: 'high', changesState: true,
    title: 'Turn on auditing and health monitoring',
    objective: 'Enable Sentinel health and audit monitoring, so that you can validate analytics rules, automation and connectors before and after the transition.',
    why: [
      'The SentinelHealth and SentinelAudit tables power the health checks used in the assistant. They are created at the first event after you enable monitoring.',
      'SentinelHealth is not billable. SentinelAudit is billable.',
      'Health covers analytics rules, data connectors (some types), automation rules and playbooks. Auditing currently covers analytics rules only.',
    ],
    roles: ['Microsoft Sentinel Contributor (configuration change)'],
    where: [at(DP, 'System > Settings > Microsoft Sentinel > Auditing and health monitoring > Enable'), at(AP, 'Microsoft Sentinel > Configuration > Settings > Settings tab > Auditing and health monitoring')],
    steps: [
      'Follow your change process if required. This is a configuration change (low risk).',
      'Enable auditing and health monitoring for the resource types you need.',
      'Wait for events to be generated.',
      'Run the verification query.',
    ],
    portalWay: [
      "Go back to **Auditing and health monitoring** on the settings page you used. Once it's on, the button shows **Enabled**. Select **Configure diagnostic settings** to see the diagnostic settings it added. This confirms the setting, not that events are arriving.",
      "Open the **Insights** tab of a scheduled rule on the **Analytics** page, or install the **Analytics Health & Audit** workbook from the **Content hub**, to see health events arriving. Both read the health data, which appears only after the first event.",
    ],
    snippets: ['K_HEALTH_TAKE'],
    expected: 'The verification query returns rows from _SentinelHealth() and _SentinelAudit().',
    interpret: [
      outcome('No rows yet', 'The tables are created at the first event. Wait and retry.'),
      outcome('Rows returned', 'Health monitoring works. Use the health queries for your baselines.'),
    ],
    record: [
      'The date you enabled it, in [[do:write-notes|this step\'s notes]]',
      'The resource types you enabled, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: [
      'A screenshot of the setting: [[do:add-screenshot|attach a screenshot]]',
      'The query result: [[do:add-file|attach a file]]',
    ],
    sources: [src('enablehealth', 'How to enable; table creation at first event; coverage; portal: the Enable button shows Enabled; Configure diagnostic settings link to view the settings'), src('healthaudit', 'Billing of SentinelHealth and SentinelAudit'), src('connectorhealth', 'Connector types covered by health monitoring'), src('ruleinsights', 'Rule insights are based on the health and audit data'), src('rulehealth', 'Analytics Health & Audit workbook from the Content hub; SentinelHealth is created at the first event')],
  }),
  k({
    id: 'PREP-CON-07', stage: 'prepare', workstream: 'connectors', order: 70, kind: 'check', criticality: 'medium', applicability: q('standalone_connectors'), testable: true,
    title: 'Review content affected by alert schema differences',
    objective: 'Find queries, rules and workbooks over SecurityAlert that rely on fields whose values change when alerts arrive through the Defender XDR connector.',
    why: [
      'Microsoft documents schema differences between the standalone and XDR connectors.',
      'They include CompromisedEntity mapping, ExtendedProperties values, Defender for Office 365 status values and Defender for Identity resource access events.',
    ],
    where: [at(AP, 'Analytics rules, workbooks and saved searches that query SecurityAlert')],
    steps: [
      'Read the schema differences page.',
      'Search [[PREP-DET-01|your rule export]], workbooks and saved searches for SecurityAlert queries that use the listed fields.',
      'List the affected items in [[do:write-notes|this step\'s notes]].',
      '[[do:add-action|Add an action]] for each planned update.',
    ],
    portalWay: [
      "Export the analytics rules from **Microsoft Sentinel > Configuration > Analytics**: select the rules, then **Export**. The file includes each scheduled rule's query, so you can search it for SecurityAlert and the fields on the schema differences page. Export works one page of rules at a time.",
      "Open **Microsoft Sentinel > Threat management > Hunting**, select a query on the **Queries** tab and review its query in the details pane.",
    ],
    snippets: ['PS_ANALYTICS_SCAN', 'REST_SAVED_SEARCHES'],
    expected: 'A list of affected content with planned changes.',
    record: ['The affected content, in [[do:write-notes|this step\'s notes]], with each planned update as an [[do:add-action|action]]'],
    evidence: ['The list of items: [[do:add-note|add it as a note]] or [[do:add-file|attach a file]]'],
    sources: [src('schemadiff', 'Schema differences'), src('exportrules', 'Export from the Analytics page; the file includes the query of scheduled rules; one page of rules at a time'), src('hunting', 'Queries tab lists installed and custom hunting queries; the query is shown in the details pane')],
  }),

  k({
    id: 'PREP-CON-08', stage: 'prepare', workstream: 'connectors', order: 80, kind: 'decision', criticality: 'medium', applicability: q('defender_xdr'),
    title: 'Review which Defender XDR tables you stream into Sentinel',
    objective: 'Decide, table by table, whether you still need to stream raw Defender XDR data into Sentinel, or whether advanced hunting in the Defender portal already covers it. This is an optional cost review, separate from the move.',
    why: [
      'Raw Defender advanced hunting tables ingested into Sentinel are charged, while Defender XDR alerts and incidents synced to Sentinel are free.',
      'In the Defender portal, advanced hunting queries native Defender data for 30 days without ingestion.',
      'When you stop sending data to a table, the data already in it stays in the workspace until the end of the table\'s retention period.',
      'Sentinel can only query Defender data that you ingest: workspace analytics rules, workbooks and hunting queries that use these tables need the data streamed.',
    ],
    roles: [
      'The SOC lead and the detection owner decide which tables to keep',
      'Changing the Defender XDR connector needs Security Administrator on the tenant, and read and write permissions on the workspace',
    ],
    where: [at(AP, 'Microsoft Sentinel > Configuration > Data connectors > Microsoft Defender XDR > Open connector page > Connect events'), at(DP, 'Investigation & response > Hunting > Advanced hunting')],
    steps: [
      'List the Defender tables you stream today: on the connector page under **Connect events**, or with the ingestion query below, which also shows the volume of each table.',
      { text: 'For each table, check whether you need it in the workspace:', bullets: ['for longer than 30 days, for compliance or investigations', 'in Sentinel analytics rules, workbooks or hunting queries: search [[PREP-DET-01|your rule export]] and your workbooks for the table name'] },
      { text: 'Decide per table:', bullets: ['keep streaming it', 'stop streaming it, and query it in advanced hunting or with custom detections in the Defender portal, which reach 30 days of native Defender data'], tip: 'Change nothing on the day you connect. Make any change later, as its own change, after the rules and workbooks that use the table are updated.' },
      '[[do:add-decision|Record the decision]] for each table, with its reason.',
    ],
    snippets: ['K_DEFENDER_TABLE_INGESTION'],
    expected: 'Each streamed Defender table has a recorded decision: keep it, or stop streaming it once nothing in Sentinel depends on it.',
    record: [
      'The tables you stream and their volume, in [[do:write-notes|this step\'s notes]]',
      'The decision for each table: [[do:add-decision|add it to the register]]',
    ],
    evidence: ['The query result: [[do:add-file|attach the CSV]], or a screenshot of the connector page: [[do:add-screenshot|attach it]]'],
    caveats: [
      'Custom detection rules are provided by Microsoft Defender: without Defender capabilities they are limited or unavailable.',
      'Defender Vulnerability Management (TVM) tables are never ingested into Sentinel. Query them in advanced hunting.',
    ],
    practiceNotes: ['Start with the largest tables in the query result: they decide most of the cost.'],
    sources: [src('ah', 'Advanced hunting follows the retention you set for streamed Defender tables; Sentinel needs raw ingestion to query Defender data'), src('defportal', 'Advanced hunting raw logs free for 30 days without ingestion; custom detection rules limited without Defender'), src('retention', 'When you stop sending data, it remains in the workspace until the end of the table retention period'), src('xdrconnector', 'Connect events lists the Defender tables that can be streamed; TVM tables are not ingested; connector permissions'), src('billing', 'Defender XDR alerts and incidents are free; raw Defender tables ingested into Sentinel are charged'), src('usage', 'Usage table for billable volume per table')],
  }),

  // ───────────────────────── Analytics rules, correlation and incidents ─────────────────────────
  k({
    id: 'PREP-DET-01', stage: 'prepare', workstream: 'detections', order: 10, kind: 'task', criticality: 'critical',
    tool: 'inventory',
    title: 'Inventory and export analytics rules',
    objective: 'Capture a complete, dated inventory and export of all analytics rules in each workspace.',
    why: [
      'Analytics rules keep working after connection, but some rule types are disabled or deactivated, and incident behaviour changes.',
      'You need a full export for impact analysis.',
      'The export is also your restoration reference: Microsoft does not document whether disabled rules are restored after disconnecting.',
    ],
    roles: ['Microsoft Sentinel Reader'],
    where: [at(AP, 'Microsoft Sentinel > Configuration > Analytics > select rules > Export'), at(DP, 'Microsoft Sentinel > Configuration > Analytics (after connection)')],
    steps: [
      {
        text: 'Export the rules from the Analytics page.',
        bullets: [
          'Export is in preview.',
          'It works one page of rules at a time.',
          'The file is named Azure_Sentinel_analytic_rule(s).json.',
        ],
      },
      {
        text: 'As well as the export, or instead of it, run the read-only inventory with both API versions and compare the counts:',
        bullets: [
          'The stable 2025-09-01 API enumerates only the Scheduled, MicrosoftSecurityIncidentCreation and Fusion kinds.',
          'The 2025-07-01-preview API also covers NRT and other kinds.',
        ],
      },
      'Store the exports in secure, versioned storage.',
      'Write down their location and hash in [[do:write-notes|this step\'s notes]].',
      {
        text: 'Produce a summary of the transition-relevant settings, in one of two ways:',
        bullets: [
          'Run the analytics rule scan.',
          'Or run the read-only inventory script and import its results in [[do:open-tool|Do it here]] at the top of this page. The import turns its output into evidence for this step and related steps, and suggests answers you confirm.',
          'With no parameters, the script finds every workspace you can read. It writes one file per workspace and workspaces.json: drop them all at once, in any order, and review them on one screen before anything changes.',
        ],
        tip: 'The **Import inventory results** button is also on the [[go:stage:prepare|Stage 1 page]].',
      },
    ],
    portalWay: [
      "Open the **Active rules** tab on **Microsoft Sentinel > Configuration > Analytics**. Select the check box in the header row to select the rules on the page, then **Export**, and repeat for each page. Any type of rule can be exported, not only Scheduled rules.",
    ],
    snippets: ['PS_INVENTORY_SCRIPT', 'REST_INVENTORY_CLI', 'PS_ANALYTICS_SCAN'],
    expected: 'A complete export and a scan summary for every workspace.',
    record: [
      'Rule counts per kind and workspace, in [[do:write-notes|this step\'s notes]]',
      'The export location, in [[do:write-notes|this step\'s notes]]',
      'Differences between the API versions, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: [
      'The scan CSV: [[do:add-file|attach a file]]',
      'A reference to the export file: [[do:add-note|add a note]] with its location. Do not attach large exports if your policy forbids it; record the location instead.',
    ],
    sources: [src('exportrules', 'Export UI, preview, page limit, file names; portal: header check box selects one page of rules; any rule type can be exported'), src('sialertrules', 'Alert rules list API and rule kinds per version'), src('siversions', 'Current stable and preview API versions'), src('move', 'Analytics rule functionality remains the same'), src('azcli', 'az sentinel list commands are labelled experimental; prefer az rest'), src('createrules', 'Rules are listed on the Active rules tab of the Analytics page')],
  }),
  k({
    id: 'PREP-DET-02', stage: 'prepare', workstream: 'detections', order: 20, kind: 'check', criticality: 'high', applicability: q('fusion'), validation: 'needs-review', confidence: 'medium', testable: true,
    title: 'Plan for the Fusion rule being disabled',
    objective: 'Acknowledge that Fusion will be disabled, and plan how you will achieve and validate multistage correlation.',
    why: [
      'The Fusion rule is disabled when you connect. Defender XDR correlation replaces it.',
      'However, Microsoft\'s correlation settings page states that analytics rules are excluded from correlation at the tenant level by default when you first onboard.',
      'So Sentinel analytics alerts may not be correlated unless you include them. See [[PREP-DET-05]].',
    ],
    where: [at(AP, 'Microsoft Sentinel > Analytics > Advanced multistage attack detection')],
    steps: [
      'Note whether Fusion is enabled and which scenarios your SOC relies on, in [[do:write-notes|this step\'s notes]].',
      'Brief the SOC lead that Fusion will be disabled.',
      'Link this step to the correlation decision in [[PREP-DET-05]].',
      'Plan a correlation test with representative scenarios.',
      '[[do:add-decision|Add the acknowledgement to the register as a decision]].',
    ],
    expected: 'Stakeholders acknowledge the change, and a correlation plan exists.',
    record: [
      'The Fusion state, in [[do:write-notes|this step\'s notes]]',
      'The acknowledgement: [[do:add-decision|add it as a decision]]',
      'The correlation scenarios to test, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: [
      'A screenshot of the rule state: [[do:add-screenshot|attach a screenshot]]',
      'The decision record, in the [[go:register|register]]',
    ],
    sources: [src('move', 'Fusion disabled on onboarding; replaced by Defender XDR correlation'), src('fusion', 'Fusion disabled for onboarded workspaces'), src('corrsettings', 'Analytics rules excluded from correlation by default at first onboarding')],
    caveats: ['The transition guide says the Defender XDR engine "fully controls" grouping, while the newer correlation settings page describes tenant-level exclusion by default. Read your tenant\'s actual setting after connection.'],
  }),
  k({
    id: 'PREP-DET-03', stage: 'prepare', workstream: 'detections', order: 30, kind: 'check', criticality: 'critical', applicability: q('ms_incident_rules'), testable: true,
    title: 'Replace Microsoft security incident creation rules',
    objective: 'Decide, for every Microsoft incident creation rule, how its purpose will be met after it is deactivated.',
    why: [
      'Active Microsoft security incident creation rules are deactivated on connection to avoid duplicates.',
      'They are not supported in the Defender portal, which has its own incident creation engine.',
      'Their filters (which alerts become incidents) and predetermined titles need replacements.',
    ],
    where: [at(AP, 'Microsoft Sentinel > Analytics (rules created as "Microsoft incident creation rule")')],
    steps: [
      'List all rules of kind MicrosoftSecurityIncidentCreation, with their product, severity and name filters (use the analytics rule scan).',
      'For alert filtering, plan alert tuning in the Defender portal, or automation rules that suppress or close incidents.',
      'For incident titles, use tags for automation conditions. You can no longer predetermine titles.',
      'For products not integrated into Defender XDR (for example Microsoft Purview Insider Risk Management), plan scheduled analytics rules instead.',
      {
        text: 'Decide whether to select "Retain Sentinel incident creation behavior for XDR alerts" during connection.',
        bullets: [
          'It creates equivalent Defender alert grouping rules once.',
          'Later changes to Sentinel rule grouping are not synced.',
          'You can validate the rules at Settings > Microsoft Defender XDR > Alert grouping.',
        ],
      },
      '[[do:add-decision|Add a decision]] for each rule.',
    ],
    portalWay: [
      "Open the **Active rules** tab on **Microsoft Sentinel > Configuration > Analytics** and filter by the **Microsoft security** rule type. The list shows your Microsoft incident creation rules, and the status column shows whether each one is enabled.",
      "Select a rule, then **Edit**, to read its filters: the **Microsoft security service**, **Filter by severity** and any text filters on alert names.",
    ],
    snippets: ['PS_ANALYTICS_SCAN'],
    expected: 'Each rule has a documented replacement.',
    record: [
      'The rules and their filters, in [[do:write-notes|this step\'s notes]]',
      'The replacement for each rule: [[do:add-decision|add a decision]]',
      'Your choice on the "Retain" option: [[do:add-decision|add a decision]]',
    ],
    evidence: [
      'The scan CSV: [[do:add-file|attach a file]]',
      'The decision list, in the [[go:register|register]]',
    ],
    sources: [src('move', 'Deactivated to avoid duplicates; not supported'), src('xdrint', 'Replacements: alert tuning, automation rules, tags, scheduled rules for non-XDR products'), src('migrategrouping', '"Retain Sentinel incident creation behavior for XDR alerts" option and validation'), src('createincidents', 'Scheduled rules for products not integrated; portal: Microsoft security rule type filter; service, severity and alert name filters'), src('fusionconfig', 'Active rules tab filtered by rule type; status column; Edit from the rule preview pane')],
  }),
  k({
    id: 'PREP-DET-04', stage: 'prepare', workstream: 'detections', order: 40, kind: 'check', criticality: 'high', applicability: q('alert_only_rules'), testable: true,
    title: 'Decide what to do with alert-only analytics rules',
    objective: 'Decide, for each rule with incident creation turned off, whether to enable incident creation or accept that its alerts will not be visible in the Defender portal.',
    why: [
      'Alerts from analytics rules with incident creation turned off are not visible in the Defender portal.',
      'Microsoft advises leaving incident creation enabled for onboarded workspaces.',
      'Alert-trigger automation rules remain an option for rules that do not create incidents.',
    ],
    where: [at(AP, 'Microsoft Sentinel > Analytics > rule > Incident settings')],
    steps: [
      'List the rules where CreateIncident is False (use the analytics rule scan).',
      'For each rule, ask the owner why incidents are disabled (noise, enrichment, chaining).',
      {
        text: 'Decide what happens to each rule:',
        bullets: [
          'Enable incident creation (with tuning).',
          'Keep it alert-only and rely on alert-trigger automation or queries.',
          'Retire it.',
        ],
      },
      '[[do:add-decision|Add each decision to the register]].',
      '[[do:add-action|Add an action]] for each change you need to implement.',
    ],
    portalWay: [
      "Open each scheduled rule from the **Active rules** tab on **Microsoft Sentinel > Configuration > Analytics**, select **Edit** and go to the **Incident settings** tab. **Create incidents from alerts triggered by this analytics rule** shows **Enabled** or **Disabled**.",
      "Export the rules from the **Analytics** page to review many at once. The file includes each scheduled rule's incident creation setting.",
    ],
    snippets: ['PS_ANALYTICS_SCAN'],
    expected: 'A decision for each alert-only rule.',
    record: ['The rules and their decisions: [[do:add-decision|add a decision]] for each'],
    evidence: [
      'The scan CSV: [[do:add-file|attach a file]]',
      'The decision list, in the [[go:register|register]]',
    ],
    sources: [src('move', 'Alert-only rule alerts not visible in the Defender portal'), src('createrules', 'Leave incident creation enabled when onboarded; portal: Incident settings tab and the Create incidents from alerts triggered by this analytics rule setting'), src('autorules', 'Alert-trigger automation for rules without incidents'), src('comparerules', 'Custom detections cannot create alerts without incidents'), src('fusionconfig', 'Select a rule on the Active rules tab, then Edit in the preview pane'), src('exportrules', 'The exported file includes incident creation settings of scheduled rules')],
    caveats: ['Microsoft does not state where alert-only alerts can be queried after the transition. The workspace SecurityAlert table is the likely place, but this is an inference.'],
  }),
  k({
    id: 'PREP-DET-05', stage: 'prepare', workstream: 'detections', order: 50, kind: 'decision', criticality: 'high', validation: 'needs-review', confidence: 'medium', testable: true,
    title: 'Decide on incident correlation, grouping and titles',
    objective: 'Decide whether Sentinel analytics rules should take part in Defender XDR correlation, and prepare your processes for changed incident titles and grouping.',
    why: [
      'By default, all analytics rules are excluded from correlation at the tenant level when you first onboard, and the "Incident correlation default setting" is off. Excluded rules group alerts as they did in Sentinel.',
      'Correlation can merge incidents and change titles.',
      '"Re-open closed matching incidents" is not available after connection: new alerts create new incidents.',
    ],
    where: [at(DP, 'System > Settings > Microsoft Defender XDR > Rules > Incident correlation (tenant default)'), at(DP, 'Analytics rule wizard > Incident settings > Incident correlation (per rule)')],
    steps: [
      'Identify the processes and automation that depend on incident titles, alert grouping or reopening closed incidents. In the analytics rule scan, look at GroupingEnabled and ReopenClosed.',
      {
        text: 'Decide the tenant default for incident correlation, and which rules to include or exclude. For each rule you can use:',
        bullets: [
          'The per-rule option: Tenant default, Enabled or Disabled.',
          'Or a tag at the start of the rule description: #INC_CORR# (include) or #DONT_CORR# (exclude).',
        ],
      },
      {
        text: 'Keep two points in mind:',
        bullets: [
          'Changing the setting does not affect alerts created earlier.',
          'Alert grouping rules remain the final authority.',
        ],
      },
      'Replace title-based logic with the analytics rule name and tags. See [[PREP-AUT-01]].',
      '[[do:add-decision|Add the decision to the register]].',
      '[[do:add-action|Add an action]] to read the actual tenant setting after connection.',
    ],
    portalWay: [
      "Open a rule on the **Active rules** tab of **Microsoft Sentinel > Configuration > Analytics**, select **Edit** and go to the **Incident settings** tab. The **Alert grouping** section shows whether **Group related alerts, triggered by this analytics rule, into incidents** and **Re-open closed matching incidents** are enabled.",
      "Export the rules from the **Analytics** page to review many at once. The file includes each scheduled rule's alert grouping settings.",
    ],
    snippets: ['PS_ANALYTICS_SCAN'],
    expected: 'A documented correlation decision and a list of processes to adapt.',
    record: [
      'The tenant default decision: [[do:add-decision|add a decision]]',
      'The rules to include or exclude, in the decision or in [[do:write-notes|this step\'s notes]]',
      'The affected processes, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: ['The decision record, in the [[go:register|register]]'],
    sources: [src('corrsettings', 'Default exclusion, tenant setting, per-rule options and tags, precedence'), src('move', 'Correlation engine controls grouping; closed incidents not reopened'), src('createrules', 'Re-open closed matching incidents not available; portal: Alert grouping settings, including Re-open closed matching incidents, on the Incident settings tab'), src('automation', 'Incident names might change if correlation is applied'), src('correlation', 'Correlation and merging behaviour'), src('fusionconfig', 'Select a rule on the Active rules tab, then Edit in the preview pane'), src('exportrules', 'The exported file includes event and alert grouping settings of scheduled rules')],
    caveats: ['Microsoft pages describe correlation differently. The transition guide says the engine "fully controls" grouping; the correlation settings page says analytics rules are excluded by default. Verify the setting in your tenant.'],
  }),
  k({
    id: 'PREP-DET-06', stage: 'prepare', workstream: 'detections', order: 60, kind: 'check', criticality: 'medium',
    title: 'Review sources of duplicate alerts',
    objective: 'Identify rules that could produce duplicate alerts after the transition.',
    why: [
      'Microsoft advises reviewing rules for duplicates.',
      'Alert promotion (preview) automatically promotes supported third-party alerts (currently CrowdStrike via its CCF connector) to Defender XDR alerts. These can duplicate analytics rules over the same data.',
      'Your Defender for Cloud connector choices can also create duplicates. See [[PREP-CON-02]].',
    ],
    where: [at(AP, 'Analytics rules over third-party alert data')],
    steps: [
      'List the analytics rules that create alerts from third-party security products covered by alert promotion.',
      'Plan alert tuning or rule changes to handle duplicates.',
      'Write the list in [[do:write-notes|this step\'s notes]].',
    ],
    portalWay: [
      "Export the analytics rules from **Microsoft Sentinel > Configuration > Analytics**: select the rules, then **Export**. Search the file for the tables that hold your third-party alerts, such as CrowdStrike. The file includes each scheduled rule's query.",
    ],
    snippets: ['PS_ANALYTICS_SCAN'],
    expected: 'A list of potential duplicates and how you plan to handle them.',
    record: ['The potential duplicates, in [[do:write-notes|this step\'s notes]]'],
    evidence: ['The list: [[do:add-note|add it as a note]] or [[do:add-file|attach a file]]'],
    sources: [src('move', 'Alert promotion; review rules for duplicates'), src('investigatealerts', 'Alert promotion sources and duplicates; alert tuning'), src('exportrules', 'Export from the Analytics page; the file includes the query of scheduled rules')],
  }),
  k({
    id: 'PREP-DET-07', topics: ['backups'], stage: 'prepare', workstream: 'detections', order: 70, kind: 'task', criticality: 'medium', dependsOn: ['PREP-CON-06'],
    title: 'Capture an analytics rule health baseline',
    objective: 'Record how analytics rules are running before the transition.',
    why: 'Failures that already exist should not be blamed on the transition, and new failures after the transition should be visible.',
    where: [at(AP, 'Log Analytics workspace > Logs')],
    steps: [
      'Run the analytics rule health query.',
      'Export the result and [[do:add-file|attach it to this step]].',
      'Fix existing failures, or record them in [[do:write-notes|this step\'s notes]].',
    ],
    portalWay: [
      "Install the **Analytics Health & Audit** workbook from the **Content hub**, then open it from the **Templates** tab of **Microsoft Sentinel > Threat management > Workbooks**. The **Health** tab shows successful and failed rule runs, their reasons, and each rule's latest results. Workbooks show only data you have permission to read.",
      "Select one rule on the **Analytics** page and open the **Insights** tab. **Failed executions** and **Top health issues** cover the time frame you choose. This preview covers Scheduled and NRT rules.",
    ],
    snippets: ['K_RULE_HEALTH', 'K_HEALTH_OVERVIEW'],
    expected: 'A dated health baseline.',
    record: ['Existing failures, in [[do:write-notes|this step\'s notes]]'],
    evidence: ['The CSV export: [[do:add-file|attach a file]]'],
    sources: [src('rulehealth', 'Analytics rule health queries; portal: Analytics Health & Audit workbook and its Health tab'), src('ruleinsights', 'Insights tab with failed executions and top health issues; preview; Scheduled and NRT rules'), src('azworkbooks', 'Workbook permissions are based on the permissions you have for the resources the workbook uses')],
  }),
  k({
    id: 'PREP-DET-08', stage: 'prepare', workstream: 'detections', order: 80, kind: 'decision', criticality: 'low', applicability: q('defender_xdr'),
    title: 'Decide whether to defer detection modernisation (custom detections)',
    objective: 'Keep the transition focused. Decide explicitly whether converting analytics rules to Defender custom detections is in scope now or later.',
    why: [
      'Custom detection rules can query Sentinel and Defender tables together.',
      'They have constraints: analytics-tier data only, no workspace() or adx(), primary workspace only, Sentinel custom functions not supported, and a lookback between 5 minutes and 30 days.',
      'Without Defender XDR, custom detections are limited or unavailable.',
      'Conversion is optional and not required for the transition.',
    ],
    where: [at(DP, 'Investigation & response > Hunting > Custom detection rules')],
    steps: [
      'Decide whether detection modernisation is in scope, and [[do:add-decision|add the decision to the register]].',
      'If it is, create a separate backlog. Do not mix it with the production transition change.',
    ],
    expected: 'A recorded scope decision.',
    record: ['The decision: [[do:add-decision|add it to the register]]'],
    evidence: ['The decision record, in the [[go:register|register]]'],
    sources: [src('move', 'Custom detections can query both sources'), src('customfunctions', 'Constraints for Sentinel data in custom detections'), src('customdet', 'Lookback, frequency, NRT tables'), src('multiws', 'Custom detections limited to the primary workspace'), src('defportal', 'Limited or unavailable without Defender services'), src('comparerules', 'Feature comparison')],
    caveats: ['Microsoft pages disagree on near-real-time (continuous) custom detections with Sentinel data. The newer custom detection page lists supported tables.'],
  }),

  // ───────────────────────── Automation ─────────────────────────
  k({
    id: 'PREP-AUT-01', stage: 'prepare', workstream: 'automation', order: 10, kind: 'check', criticality: 'critical', applicability: q('automation_rules'), testable: true,
    title: 'Find automation rules whose conditions change after connection',
    objective: 'Identify automation rules that use the Incident provider, title, description or "Updated by" conditions, and design replacements.',
    why: [
      'After connection, the Incident provider condition is removed. Rules filtering on Microsoft Sentinel or Microsoft 365 Defender then run on both Sentinel and Defender XDR incidents.',
      'Rules that use Description as a condition with the incident creation trigger won\'t work.',
      'Incident titles may change, so Microsoft recommends not using titles as conditions.',
      '"Microsoft 365 Defender" in Updated by is replaced by "Other".',
    ],
    roles: ['Microsoft Sentinel Reader (inventory); Microsoft Sentinel Contributor (changes)'],
    where: [at(AP, 'Microsoft Sentinel > Configuration > Automation (export)'), at('Azure Cloud Shell / PowerShell', 'Read-only automation rule scan (snippet below)')],
    steps: [
      'Export the automation rules (Automation > select rules > Export), run the read-only automation rule scan, or do both.',
      {
        text: 'For every rule with RiskyConditions, design a replacement:',
        bullets: [
          'Scope Sentinel-only rules with the "Analytic rule name" condition.',
          'Use tags instead of titles.',
          'Replace description conditions.',
          'Review "Updated by" conditions.',
        ],
      },
      'Decide which changes are safe to make before connection (for example adding analytic rule name conditions) and which must be made after.',
      '[[do:add-action|Add each change as an action]] with an owner, and link it to the Stage 2 step [[TRN-04]].',
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Configuration > Automation** and the **Automation rules** tab. Open each rule and read its conditions, looking for **Incident provider**, title, description and **Updated by** conditions.",
    ],
    snippets: ['PS_AUTOMATION_SCAN', 'PS_INVENTORY_SCRIPT'],
    expected: 'Every affected rule has a planned change.',
    interpret: [
      outcome('RiskyConditions includes IncidentProviderName', 'The rule will run on all incidents after connection. Scope it with Analytic rule name.'),
      outcome('IncidentDescription with incident creation trigger', 'The condition will not work. Replace it.'),
      outcome('IncidentTitle', 'Titles may change through correlation. Use the analytics rule name and tags.'),
    ],
    record: ['The affected rules and planned changes: [[do:add-action|add an action]] for each'],
    evidence: [
      'The scan CSV: [[do:add-file|attach a file]]',
      'A reference to the export file: [[do:add-note|add a note]] with its location',
    ],
    sources: [src('automation', 'Provider condition removed; description; titles; Updated by → Other'), src('siautomation', 'Automation rule property names'), src('autoref', 'Automation rule conditions reference'), src('exportauto', 'Export/import of automation rules'), src('xdrint', 'Use tags for automation conditions'), src('autorules', 'Automation rules tab lists the rules and lets you edit them; Updated by condition')],
  }),
  k({
    id: 'PREP-AUT-02', stage: 'prepare', workstream: 'automation', order: 20, kind: 'check', criticality: 'medium', applicability: q('automation_rules'), testable: true,
    title: 'Review alert-trigger automation and the Enhanced Alert Trigger',
    objective: 'Confirm that alert-trigger automation rules will act on the alerts you expect.',
    why: [
      'In the Defender portal, automation rules with alert triggers act only on Microsoft Sentinel alerts.',
      'For Defender XDR alerts, Microsoft points to the Enhanced Alert Trigger, which has limitations (listed in the last step).',
    ],
    where: [at(AP, 'Microsoft Sentinel > Automation (rules with "When alert is created")')],
    steps: [
      'List the automation rules where TriggersOn = Alerts.',
      'For each rule, confirm whether it is meant to act on Sentinel alerts only, or on Defender XDR alerts too.',
      {
        text: 'If Defender XDR alerts are intended, evaluate the Enhanced Alert Trigger and its limitations:',
        bullets: [
          'It works at tenant level.',
          'It has no priority ordering or expiration.',
          'Its actions are limited to running generated playbooks and updating alerts.',
          'It allows 500 active rules per tenant.',
          'Each rule has one action.',
          'Run results are not written to SentinelHealth.',
        ],
      },
    ],
    portalWay: [
      "Open each rule on the **Automation rules** tab of **Microsoft Sentinel > Configuration > Automation** and check its trigger. Rules with **When alert is created** are alert-trigger rules, and their only condition is the analytics rule that created the alert.",
    ],
    snippets: ['PS_AUTOMATION_SCAN'],
    expected: 'Each alert-trigger rule has a confirmed scope.',
    record: ['The rules and their intended scope, in [[do:write-notes|this step\'s notes]]'],
    evidence: ['The list: [[do:add-note|add it as a note]] or [[do:add-file|attach a file]]'],
    sources: [src('automation', 'Alert triggers act only on Sentinel alerts'), src('genplaybook', 'Enhanced Alert Trigger limitations'), src('autorules', 'Automation rules tab; When alert is created trigger; the analytics rule is the only alert-trigger condition')],
  }),
  k({
    id: 'PREP-AUT-03', stage: 'prepare', workstream: 'automation', order: 30, kind: 'check', criticality: 'high', applicability: q('playbooks'), testable: true,
    title: 'Inventory playbooks and find unsupported actions',
    objective: 'List the playbooks Sentinel uses, and find actions or assumptions that will not work after connection.',
    why: [
      'Adding or removing alerts from incidents is not supported from playbooks after connection.',
      'Incidents created by Logic App playbooks are not synchronised to the Defender portal.',
      'Playbooks may also rely on the incident description, provider name or title, which change.',
      'Playbooks called directly from analytics rules (classic alert automation) are deprecated as of March 2026.',
    ],
    where: [at(AP, 'Resource Graph Explorer (Logic Apps)'), at(AP, 'Logic Apps designer (each playbook)')],
    steps: [
      'Run the Logic Apps query.',
      'Cross-reference the result with the automation rules that run playbooks (automation rule scan: PlaybookActions).',
      {
        text: 'Open each playbook and check for:',
        bullets: [
          'Sentinel actions that add or remove alerts',
          'Actions that create incidents',
          'Use of the incident description, provider name or title',
          'Assumptions about one source per incident',
        ],
      },
      {
        text: 'Check the roles:',
        bullets: [
          'The Sentinel service account has Microsoft Sentinel Automation Contributor on the playbooks\' resource groups.',
          'Operators who run playbooks manually have Microsoft Sentinel Playbook Operator.',
        ],
      },
      '[[do:add-action|Add each finding as an action]], with its planned change.',
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Configuration > Automation** and the **Active playbooks** tab. It lists the playbooks you have access to in the subscriptions shown, with **Status**, **Plan** and **Trigger kind**. In the Azure portal, change the subscriptions from the **Directory + subscription** menu in the page header.",
      "Select a playbook to open its Azure Logic Apps page, where you can see its runs and, with the right permissions, open the designer to check its actions. **Logic App Operator** lets you read, enable and disable a Consumption playbook, but not edit it.",
      "Open each rule on the **Automation rules** tab to see which playbooks its **Run playbook** actions call.",
    ],
    snippets: ['ARG_LOGIC_APPS', 'PS_AUTOMATION_SCAN'],
    expected: 'A playbook inventory with findings and planned changes.',
    record: [
      'The playbooks in use, in [[do:write-notes|this step\'s notes]]',
      'The findings and planned changes: [[do:add-action|add an action]] for each',
    ],
    evidence: [
      'The query result CSV: [[do:add-file|attach a file]]',
      'The findings list: [[do:add-note|add it as a note]] or [[do:add-file|attach a file]]',
    ],
    sources: [src('move', 'Add/remove alerts not supported; Logic App-created incidents not synced'), src('automation', 'Playbook limitations after onboarding'), src('runplaybooks', 'Permissions; classic alert automation deprecated'), src('playbooks', 'Playbook roles; portal: Logic App Operator reads, enables and disables logic apps but cannot edit them'), src('createrules', 'Classic alert automation deprecation'), src('createplaybooks', 'Active playbooks tab, its columns and subscription filter; a playbook opens its Logic Apps page and designer'), src('autorules', 'Run playbook action in automation rules; rules can be opened on the Automation rules tab')],
    caveats: ['Microsoft does not document Logic Apps field-level changes. The provider, description and title changes apply to the incident object, and are inferred to affect playbooks that read them.'],
  }),
  k({
    id: 'PREP-AUT-04', stage: 'prepare', workstream: 'automation', order: 40, kind: 'check', criticality: 'medium', applicability: all(q('playbooks'), q('manual_playbooks')), testable: true,
    title: 'Plan a long-term replacement for manual playbook runs on alerts and entities',
    objective: 'Replace the analyst habit of running playbooks manually on alerts or entities.',
    why: [
      'Running a playbook manually on an alert or on an entity is not supported in the Defender portal.',
      'Running a playbook manually on an incident is supported (Incidents > select incident > Run Playbook).',
      'Azure-portal workarounds stop being an option after Azure portal support ends on 31 March 2027.',
    ],
    where: [at(DP, 'Investigation & response > Incidents & alerts > Incidents > incident > Run Playbook')],
    steps: [
      'List the playbooks analysts run manually on alerts or entities, and why.',
      'Redesign them to run on incidents (manual or automation-rule triggered) where possible.',
      'Update the runbooks.',
      'If an interim Azure-portal workaround is used, [[do:add-action|add an action]] to remove it before 31 March 2027.',
    ],
    expected: 'A redesign plan for each playbook that runs manually on alerts or entities.',
    record: ['The playbooks and their redesign decisions: [[do:add-decision|add a decision]] for each'],
    evidence: ['A reference to the updated runbook: [[do:add-link|add a link]]'],
    sources: [src('runplaybooks', 'Manual run on alert not supported; run on incident steps'), src('move', 'Manual run on alert and entity not supported'), src('defportal', 'Azure portal support ends March 31, 2027')],
    practiceNotes: ['Treat any "use the Azure portal for this" workaround as temporary. It disappears with the Azure portal experience.'],
  }),
  k({
    id: 'PREP-AUT-05', stage: 'prepare', workstream: 'automation', order: 50, kind: 'check', criticality: 'medium', applicability: any(q('automation_rules'), q('playbooks'), q('itsm')),
    title: 'Check that automation timing assumptions still hold',
    objective: 'Find SLAs and automation that depend on fast or step-by-step incident updates.',
    why: [
      'It may take up to 5 minutes for Defender incidents to fully integrate with Sentinel, which delays playbooks.',
      'It may take up to 10 minutes before an automation rule runs.',
      'Multiple changes to the same incident within 5 to 10 minutes are sent as a single update, so intermediate updates are lost.',
    ],
    where: [at(ORG, 'SOC SLAs and automation designs')],
    steps: [
      'List automations and SLAs with tight timing (for example auto-assignment, notification, containment).',
      'Identify logic that depends on every intermediate incident update.',
      'Update the SLA documentation.',
      'Redesign the logic where needed.',
    ],
    expected: 'Timing-sensitive items are identified, with mitigations.',
    record: ['The timing-sensitive items and their mitigations, in [[do:write-notes|this step\'s notes]]'],
    evidence: ['The list: [[do:add-note|add it as a note]] or [[do:add-file|attach a file]]'],
    sources: [src('automation', 'Up to 10 minutes; batching window; up to 5 minutes for Defender incidents'), src('move', 'Up to 5 minutes for Defender incidents')],
  }),
  k({
    id: 'PREP-AUT-06', topics: ['backups'], stage: 'prepare', workstream: 'automation', order: 60, kind: 'task', criticality: 'medium', applicability: any(q('automation_rules'), q('playbooks')), dependsOn: ['PREP-CON-06'],
    title: 'Capture an automation health baseline',
    objective: 'Record automation rule and playbook health before the transition.',
    why: 'Knowing the failures that exist today makes new failures after the transition stand out.',
    where: [at(AP, 'Log Analytics workspace > Logs')],
    steps: [
      'Run the automation failure and playbook trigger queries.',
      'Export the results and [[do:add-file|attach them to this step]].',
      'Fix existing failures, or record them in [[do:write-notes|this step\'s notes]].',
    ],
    portalWay: [
      "Use the **Automation health** workbook (workbooks are under **Microsoft Sentinel > Threat management > Workbooks**). It shows automation rule health, playbook trigger health and automation details per incident. Playbook run details need Logic Apps diagnostics turned on. Workbooks show only data you have permission to read.",
      "Open the playbook's logic app in the Azure portal and select **Overview > Runs history** (Consumption), or **Tools > Run history** on the workflow (Standard). Each run shows a status such as **Succeeded** or **Failed**.",
    ],
    snippets: ['K_AUTOMATION_FAILURES', 'K_PLAYBOOK_TRIGGERED', 'K_AUTOMATION_PLAYBOOK_JOIN'],
    expected: 'A dated baseline.',
    record: ['Existing failures, in [[do:write-notes|this step\'s notes]]'],
    evidence: ['CSV exports: [[do:add-file|attach a file]]'],
    sources: [src('autohealth', 'Automation health queries; portal: Automation health workbook displays; playbook run details need Logic Apps diagnostics'), src('workbooks', 'Workbooks are under Threat management > Workbooks'), src('azworkbooks', 'Workbook permissions are based on the permissions you have for the resources the workbook uses'), src('larunhistory', 'Runs history for Consumption and Run history for Standard workflows, with run statuses')],
  }),

  // ───────────────────────── Integrations and APIs ─────────────────────────
  k({
    id: 'PREP-INT-01', stage: 'prepare', workstream: 'integrations', order: 10, kind: 'check', criticality: 'high', applicability: q('itsm'), testable: true,
    title: 'Assess the impact on ticketing (ITSM) and SOAR integrations',
    objective: 'Find out exactly which incident fields each integration uses, and plan changes.',
    why: [
      'After connection, the incident description is missing for integrations such as ServiceNow, the provider name changes to Microsoft XDR, and incident titles may change.',
      'incidentUrl still points to the Sentinel (Azure) portal. Microsoft adds providerIncidentUrl for a direct Defender portal link.',
      'Microsoft does not publish an end-to-end ServiceNow guide for this change.',
    ],
    where: [at(ORG, 'Integration owner (ITSM / SOAR)')],
    steps: [
      'For each integration, note how it receives incidents (playbook, connector app, API polling) and which fields it maps.',
      'Flag the mappings that use description, provider name, title or incidentUrl.',
      {
        text: 'Plan the changes:',
        bullets: [
          'Compose a description from available fields if needed.',
          'Switch deep links to providerIncidentUrl (SecurityInsights API: properties.additionalData.providerIncidentUrl) or Graph incidentWebUrl.',
          'Make matching rules independent of titles.',
        ],
      },
      'Agree a test case with the integration owner, for the [[go:stage:test|test stage]] or [[go:stage:validate|Stage 3]].',
    ],
    expected: 'A field-level impact list and agreed changes for each integration.',
    record: [
      'The integrations and impacted fields, in [[do:write-notes|this step\'s notes]]',
      'The planned changes: [[do:add-action|add an action]] for each',
      'The owner of each integration, as the owner of its [[do:add-action|action]]',
    ],
    evidence: ['The field mapping document: [[do:add-file|attach a file]] or [[do:add-link|add a link]]'],
    sources: [src('automation', 'Incident description missing for ServiceNow-type integrations'), src('move', 'providerIncidentUrl for ticketing; incidentUrl still points to Sentinel; provider name change'), src('siincident', 'additionalData.providerIncidentUrl'), src('graphincident', 'Graph incidentWebUrl')],
    practiceNotes: ['If the ticket needs a description, a common approach is to compose one from the title, severity and entities in the playbook that creates the ticket. Test the result with the integration owner.'],
  }),
  k({
    id: 'PREP-INT-02', stage: 'prepare', workstream: 'integrations', order: 20, kind: 'check', criticality: 'high', applicability: q('api_consumers'), testable: true, validation: 'needs-review', confidence: 'medium',
    title: 'Assess scripts and tools that read incidents and alerts',
    objective: 'Update consumers of the Sentinel incidents API and the SecurityIncident table for the changed fields. Plan the move to Microsoft Graph where appropriate.',
    why: [
      'Microsoft recommends Microsoft Graph for unified incidents and alerts.',
      'Callers of the Sentinel incidents API may need to update conditions, because the response body changes (providerName "Azure Sentinel" becomes "Microsoft XDR").',
      'The SecurityIncident table no longer includes a Description value.',
      'The Sentinel API remains supported for Sentinel resources such as analytics and automation rules.',
    ],
    where: [at(ORG, 'Code repositories, reports and dashboards')],
    steps: [
      {
        text: 'Search code and reports for:',
        bullets: [
          'SecurityInsights incident calls',
          'providerName filters ("Azure Sentinel")',
          'Use of incidentUrl and description',
          'SecurityIncident queries that use Description',
        ],
      },
      {
        text: 'Decide for each consumer: adapt to the new values, or move to Microsoft Graph. The Graph calls and their permissions are:',
        bullets: [
          'GET /security/incidents with SecurityIncident.Read.All',
          'GET /security/alerts_v2 with SecurityAlert.Read.All',
          'POST /security/runHuntingQuery with ThreatHunting.Read.All',
        ],
        tip: 'Graph incidents have no providerName or alertProductNames. Use the alerts\' serviceSource, detectionSource and productName.',
      },
      '[[do:add-action|Add each change as an action]].',
    ],
    snippets: ['HTTP_GRAPH_INCIDENTS'],
    expected: 'A list of consumers with planned changes and permissions.',
    record: [
      'The consumers and planned changes: [[do:add-action|add an action]] for each',
      'The Graph permissions requested, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: ['The list: [[do:add-note|add it as a note]] or [[do:add-file|attach a file]]'],
    sources: [src('move', 'Graph recommended; response body changes; field table'), src('siincident', 'SecurityInsights incident fields'), src('graphincident', 'Graph incident properties'), src('graphlistincidents', 'Permissions'), src('graphalerts', 'Alerts filter by serviceSource; permissions'), src('graphhunting', 'runHuntingQuery permission'), src('securityincidenttable', 'SecurityIncident schema')],
    caveats: ['The transition guide\'s field table mixes the Sentinel and Graph APIs (alertProductNames with ?$expand=alerts). In the Sentinel API, alertProductNames is under additionalData; Graph incidents do not have it.', 'The SecurityIncident schema reference still lists a Description column. Treat it as not populated after connection, and verify.'],
  }),
  k({
    id: 'PREP-INT-03', stage: 'prepare', workstream: 'integrations', order: 30, kind: 'check', criticality: 'medium', applicability: q('manual_incidents'),
    title: 'Replace manual, API or playbook-created incidents',
    objective: 'Find workflows that create incidents outside analytics rules, and plan alternatives.',
    why: [
      'Incidents created in Sentinel through the API, by a Logic App playbook, or manually in the Azure portal are not synchronised to the Defender portal.',
      'The Microsoft Graph incident API has no create method.',
    ],
    where: [at(ORG, 'SOC processes and integrations that create incidents')],
    steps: [
      'Run the heuristic query.',
      'Ask the SOC which processes create incidents manually or by API.',
      'For each workflow, plan an alternative (for example an analytics rule or custom detection that raises the alert, or an external case process).',
      '[[do:add-decision|Add a decision]] for each workflow.',
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Threat management > Incidents** in the Azure portal and look for incidents with no product name. Manually created incidents show no **Product name** in the queue, and their **Alerts** tab stays empty unless alerts are related to them. The queue shows **New** and **Active** incidents by default, so change the status filter to include closed ones.",
    ],
    snippets: ['K_MANUAL_INCIDENTS'],
    expected: 'Every such workflow has an alternative.',
    record: ['The workflows and their alternatives: [[do:add-decision|add a decision]] for each'],
    evidence: ['The list: [[do:add-note|add it as a note]] or [[do:add-file|attach a file]]'],
    sources: [src('move', 'Not synchronised to the Defender portal'), src('manualincidents', 'Manual incidents; portal: no Product name in the queue, empty Alerts tab, default status filter New and Active'), src('graphincident', 'No create method in Graph')],
  }),

];
