// Short forms of every check for Simplified mode: an action title, one to three "do this" points and one
// line of proof. Each restates the check's own content: same facts, same sources, no new claims.
// EXTRAS: checks that are good practice, not needed for the move (shown as good-practice extras).
// Health monitoring (PREP-CON-06) and the rule health baseline (PREP-DET-07) are needed, not extras:
// Validate checks query SentinelHealth, which exists only once monitoring is on.
export const EXTRAS = ['PREP-CON-08', 'PREP-AUT-06', 'PREP-DET-08', 'PREP-GOV-04', 'PREP-GOV-05', 'PREP-CNT-04', 'PREP-CNT-06', 'TEST-10', 'VAL-19'];

export const SHORT = {
  // ───── Prepare: scope, governance and timeline ─────
  'PREP-SCOPE-01': {
    title: 'Brief your stakeholders',
    do: [
      'Choose who the email is for, then read it as they would.',
      'Copy it into Outlook or download it as a draft, and send it to the teams involved.',
    ],
    proof: 'The email you sent, or a note of who received it and when.',
    info: {
      title: "What changes, and what stays the same",
      lead: "The move changes where your SOC works, not where your data lives.",
      points: [
        "Microsoft Sentinel is not being discontinued. Only its Azure portal experience is. After 31 March 2027, Sentinel is available only in the Defender portal.",
        "Connecting a workspace does not move your log data. It stays in Log Analytics.",
        "Microsoft states the transition has no extra cost.",
        "What does change is behaviour, for example how incidents are created, the Fusion rule, automation and playbooks, and which data policies apply.",
        "Misreading the change can lead to the wrong scope, such as planning a data migration that is not needed, or missing what breaks detections and integrations.",
      ],
    },
  },
  'PREP-SCOPE-02': {
    title: 'Name who approves the change',
    do: [
      'Add who approves the change, for example your change board and the SOC lead.',
      'Record how changes get approved here, for example the change request type, as a [[do:add-decision|decision]].',
    ],
    proof: 'The approvers recorded below.',
  },
  'PREP-SCOPE-03': {
    title: 'Confirm the transition window',
    do: [
      'Check the window you entered at setup, below, or enter it now. The planner shows example timings for each phase.',
      'Avoid your change freezes, and leave time before 31 March 2027.',
      '[[do:add-decision|Record who approved the window]] as a decision.',
    ],
    proof: 'The approved plan or change calendar entry, or the window recorded below.',
    info: {
      title: "Why pick your own date",
      lead: "Moving on your own schedule gives you time to prepare, instead of absorbing the change unprepared.",
      points: [
        "Microsoft supports Sentinel in the Azure portal until 31 March 2027. Customers still using it then will be redirected to the Defender portal.",
        "Microsoft does not document how that redirect works, or what happens to workspaces that were never connected. Do not plan to rely on an automatic switch.",
        "Some Microsoft pages still mention July 2026. The current date in the main pages is 31 March 2027.",
      ],
    },
  },
  'PREP-SCOPE-04': {
    title: 'Check whether any workspace is already connected',
    do: [
      'Sign in to security.microsoft.com with at least Microsoft Sentinel Reader. If Microsoft Sentinel is in the left menu, a workspace is connected.',
      'Open System > Settings > Microsoft Sentinel > Workspaces, then mark each workspace below.',
    ],
    proof: 'A screenshot of the Workspaces page, with IDs redacted if your policy requires.',
    info: {
      title: 'What you are looking for, and why',
      lead: 'You are finding out where you start. Some tenants were connected automatically.',
      points: [
        'Microsoft Sentinel appears in the Defender portal menu only after a workspace is connected.',
        'The Workspaces page lists each connected workspace and shows which one is primary.',
        'You only see workspaces you have permissions for. Without Microsoft Sentinel Reader, an empty list proves nothing.',
        'US Government clouds sign in elsewhere: GCC High at security.microsoft.us, DoD at security.apps.mil.',
      ],
    },
  },
  'PREP-SCOPE-05': {
    title: 'Check what your cloud supports',
    do: [
      'Note the cloud of each tenant in scope, for example GCC, GCC High or DoD. Your cloud platform team knows.',
      'In the Microsoft feature support page, find each feature your SOC uses and check it is available in your cloud.',
      '[[do:add-risk|Add each limit that affects you as a risk]], for example a preview feature you planned to use.',
    ],
    proof: 'Links to the Microsoft pages you checked, or a note of the limits found.',
    info: {
      title: 'What to look for, and why',
      lead: 'Some features are not available in government clouds. Find out before the move, not after.',
      points: [
        'In the Defender portal, generally available features work in commercial, GCC, GCC High and DoD. Preview features work only in the commercial cloud.',
        'The page "Microsoft Sentinel feature support for Azure commercial/other clouds" has a table per feature. For example repositories, summary rules and SOC optimizations show No for Azure Government.',
        'In GCC-M, advanced hunting queries that mix Sentinel and Defender tables are not supported, so a query using search or union * across both fails.',
        'The advanced hunting page also has Known issues for Sentinel data, for example no near-real-time custom detections and no bookmarks.',
        'Both pages are linked under Sources in Details.',
      ],
    },
  },

  // ───── Prepare: workspaces and tenants ─────
  'PREP-TOP-01': {
    title: 'List every Sentinel workspace',
    do: [
      'Fill in the workspace list below: alias, environment, region and owner. Names and IDs only, no secrets.',
      'No query access? Use the portal way under Details.',
    ],
    proof: 'Your workspace list, saved below, or a screenshot of the workspace list in the Azure portal.',
    info: {
      title: "Why every workspace counts",
      lead: "A workspace you miss is a workspace whose detections and automation you miss.",
      points: [
        "Each workspace is connected to the Defender portal on its own, so this list is the basis of your plan.",
        "One workspace per tenant becomes the primary, and several behaviours depend on whether a workspace is primary or secondary.",
        "Both ways of finding workspaces only show what you have permission to read. Check with your platform team that nothing is missing.",
        "More workspaces than you expected? Confirm whether each one is in scope. Forgotten workspaces often hold legacy rules.",
        "Workspaces in several tenants mean Sentinel runs across more than one tenant. Answer Yes to the multi-tenant question in your answers.",
      ],
    },
  },
  'PREP-TOP-02': {
    title: 'Choose the primary workspace',
    do: [
      'Choose one primary per tenant below. Every other workspace becomes secondary: its rules keep running, but its alerts are not correlated with Defender XDR.',
      'Split production because of the rule limit? Keep the rules that need correlation in the primary.',
    ],
    proof: 'The planned primary recorded below, and the decision with its approver.',
    info: {
      title: "What primary and secondary mean",
      lead: "Secondary workspaces keep working. The primary is the one that works together with Defender XDR.",
      points: [
        "Each tenant has one primary workspace. Only its alerts are correlated with Defender XDR data, and all Defender XDR alerts and incidents sync to it.",
        "Secondary workspaces run their own analytics rules and automation, and their incidents appear in the same unified queue. Their alerts are not correlated with Defender XDR or other workspaces.",
        "Only primary-workspace data shows on the Workbooks page, and custom detections and API queries are limited to the primary.",
        "If you plan to use the optional data lake, it must be in the primary's region.",
        "Microsoft recommends considering the workspace of your global security operations centre as the primary.",
        "You can change the primary later on the Workspaces page. The Defender XDR connector then moves to the new primary automatically.",
      ],
    },
  },
  'PREP-TOP-03': {
    title: 'Find content that relies on standalone Microsoft connectors',
    do: [
      'In each planned secondary workspace, run the alerts-by-product query (under Details) to see which Microsoft products send alerts there.',
      'Search your analytics rules, workbooks and saved queries for SecurityAlert with those products. The rule scan or a rule export helps.',
      'For each one, decide: move it to the primary, ingest the Defender tables into that workspace, or retire it.',
    ],
    proof: 'The list of affected content, with a decision for each item.',
    info: {
      title: 'What this means, with examples',
      lead: 'After the move, alerts from Microsoft security products arrive only in the primary workspace.',
      points: [
        'Standalone connectors are the separate connectors for Defender for Endpoint, Office 365, Identity, Cloud Apps and Entra ID Protection. They are disconnected in secondary workspaces when you connect.',
        'Example: a rule in a secondary workspace that queries SecurityAlert for Defender for Endpoint alerts stops finding anything.',
        'Example: a workbook tile counting Defender for Office 365 alerts in that workspace goes empty.',
        'Not sure which products to look for? The alerts-by-product query lists them, with counts.',
        'If you never used these connectors in secondary workspaces, mark this check as not applying, with that reason.',
      ],
      practice: true,
    },
  },
  'PREP-TOP-04': {
    title: 'Plan to move automation to the primary workspace',
    do: [
      'List the automation rules in secondary workspaces that act on Defender XDR incidents or alerts.',
      'Plan to recreate each one in the primary, and turn the original off after validation. Add each move as an action.',
    ],
    proof: 'A list or export of the rules to move, each with an owner.',
    info: {
      title: "Why automation has to move",
      lead: "After the move, Defender XDR alerts and incidents sync to the primary workspace only.",
      points: [
        "An automation rule in a secondary workspace that acts on Defender XDR incidents or alerts needs to live in the primary to keep running. Microsoft advises transferring it.",
        "Export and import is available for automation rules, which helps you recreate them in the primary.",
        "Keep the original until validation shows the copy works, then turn the original off.",
      ],
    },
  },
  'PREP-TOP-05': {
    title: 'Decide how each tenant is accessed',
    do: [
      "Fill in a card per tenant below: today's access method, and who connects its workspace from inside that tenant.",
      'Keep Azure Lighthouse where you need cross-tenant queries. Do not rely on GDAP for Sentinel data until you have confirmed it with Microsoft.',
      "Record each tenant's access model as a decision.",
    ],
    proof: 'The decision for each tenant, and a screenshot of the multitenant tenant list once it is set up.',
    info: {
      title: "The access options, in plain words",
      lead: "Each tenant connects its own workspace. This step is about how people reach the data afterwards.",
      points: [
        "Each workspace must be connected inside its own tenant, by someone with the onboarding roles in that tenant.",
        "Multitenant management (MTO, at mto.security.microsoft.com) works across up to 100 target tenants. Its access to Sentinel data relies on Entra B2B or governance relationships.",
        "Azure Lighthouse is still needed to run cross-tenant queries with workspace(), and to query a secondary workspace in another tenant.",
        "GDAP: Microsoft pages disagree on whether it is supported for Sentinel data. Some say not supported, one says in preview. Treat it as unresolved and confirm with Microsoft.",
        "A community report, not Microsoft, describes failures when onboarding through Lighthouse delegation. Plan to connect from within each customer tenant.",
      ],
    },
  },
  'PREP-TOP-06': {
    title: 'Replace workspace manager',
    do: [
      'Write down what workspace manager distributes today: content types, member workspaces and how often.',
      'Choose repositories (content as code) or multitenant content distribution, and pilot it with one item.',
      '[[do:add-decision|Record the choice as a decision]].',
    ],
    proof: 'Pilot notes, or a screenshot of the pilot result.',
    info: {
      title: "What replaces workspace manager",
      lead: "Workspace manager is not available in the Defender portal, so its job needs a new home.",
      points: [
        "Today, workspace manager distributes Sentinel content to member workspaces from the Azure portal.",
        "Microsoft lists two alternatives: deploying content as code from repositories, and content distribution in multitenant management.",
        "Multitenant management content distribution for analytics rules, automation rules and workbooks became generally available in February 2026.",
        "Microsoft pages differ on repositories. The transition guide calls content as code public preview, What's new (March 2026) calls repositories generally available. Check the current status.",
      ],
    },
  },

  // ───── Prepare: access and permissions ─────
  'PREP-ACC-01': {
    title: 'Check the person who connects has the right roles',
    do: [
      'Name who will connect the workspaces: a person, a break-glass account or a PIM role.',
      "In each subscription's Access control (IAM), confirm Owner with an empty Condition column, or User Access Administrator plus Microsoft Sentinel Contributor.",
      'In Entra, confirm Security Administrator or higher, or a PIM activation planned for the change window.',
    ],
    proof: 'A screenshot of the role assignments, with identifiers redacted as needed.',
    info: {
      title: 'What "Owner with no condition" means',
      points: [
        'A condition is an extra rule on a role assignment. On Owner, it limits which roles that person may assign, or to whom.',
        'Connecting a workspace assigns roles to Microsoft apps, so Microsoft requires an unconditional Owner assignment at subscription scope.',
        'To check: Azure portal > the subscription > Access control (IAM) > Role assignments > Privileged tab. Find the Owner row.',
        'Condition column empty: fine. It shows View/Edit: there is a condition, so use User Access Administrator plus Microsoft Sentinel Contributor instead, or ask for an unconditional assignment.',
      ],
    },
  },
  'PREP-ACC-02': {
    title: 'Map analyst roles for the Defender portal',
    do: [
      'List your SOC personas, for example triage, investigation, detection engineering and read-only auditors.',
      'For each, note the Sentinel roles and the Defender XDR permissions it needs. Prefer resource-group scope.',
      'Review who holds Entra roles with default Defender portal access, such as Global and Security Administrator, and keep them to the fewest needed.',
    ],
    proof: 'Your role matrix, attached or linked.',
    info: {
      title: 'Who can see Defender data by default?',
      points: [
        'Accounts with Global Administrator, Security Administrator, Security Operator, Global Reader or Security Reader can access Defender XDR functionality and data.',
        'Microsoft recommends the roles with the fewest permissions, and Global Administrator only for emergencies.',
        'Review these accounts in the Defender portal under System > Permissions.',
      ],
    },
  },
  'PREP-ACC-03': {
    title: 'Decide on unified RBAC for Sentinel',
    info: {
      title: 'Where to check unified RBAC today',
      points: [
        'Defender portal > System > Permissions, then Roles under Microsoft Defender XDR. System is near the bottom of the navigation pane: scroll down.',
        'Some Microsoft pages call the same place Permissions, or Setup & Configuration > Permissions.',
        'Direct link: https://security.microsoft.com/mtp_roles. Workload settings at the top of that page shows which workloads use unified RBAC.',
        'You need at least Security Administrator in Microsoft Entra ID to open it. If you cannot see it, ask your identity team.',
      ],
    },
    do: [
      'Answer the questions below and compare both ways: keep Azure RBAC for now, or activate unified RBAC per workspace after the move.',
      'Service principals and managed identities stay on Azure RBAC. Treat activation as its own change.',
      'Record the choice, with its timing and owner, as a decision.',
    ],
    proof: 'The recorded decision, and a screenshot of the current unified RBAC state.',
  },
  'PREP-ACC-04': {
    title: 'Check access limits that will not carry over',
    do: [
      "List the roles that limit access to specific tables (especially IdentityInfo), and users who reach data through resources they own rather than the workspace.",
      "For each one, [[do:add-control|record a compensating control]]: what the restriction was, and what you do instead.",
    ],
    proof: 'The list of roles and assignments, and a decision for each restriction.',
    info: {
      title: "What these access restrictions are",
      lead: "Some ways of limiting who sees which data may not work the same way in the Defender portal.",
      points: [
        "Table-level RBAC limits a role to specific tables in the workspace, for example a restriction on who can read IdentityInfo.",
        "Resource-context access means people reach data through the resources they own, rather than through the workspace.",
        "IdentityInfo becomes a native Defender table that does not support table-level RBAC, so a restriction on it today is no longer available.",
        "How other table-level restrictions and resource-context access behave in the Defender portal is not documented. Test it with a restricted test user.",
        "A compensating control is what you do instead, for example scoping with unified RBAC (in preview, with limits) or a different access design.",
      ],
    },
  },
  'PREP-ACC-05': {
    title: 'Protect the role assignments the connection creates',
    do: [
      'Tell your IAM or governance team which assignments to expect when you connect.',
      'Exclude them from automated removal: access reviews, scripts and policy remediation.',
    ],
    proof: 'A ticket or email reference showing the team was told and the exclusions are set.',
    info: {
      title: "Which role assignments to expect",
      lead: "Microsoft creates these assignments itself. If an automated clean-up removes them, the integration can break.",
      points: [
        "When you connect, Microsoft assigns Microsoft Sentinel Contributor to the \"Microsoft Threat Protection\" and \"WindowsDefenderATP\" apps in your subscription.",
        "If you activate unified RBAC, User Access Administrator is assigned to the \"MTP Unified RBAC\" app.",
        "If you use the optional data lake, it creates a managed identity that must keep its permissions.",
        "Microsoft describes the scope only as \"in your subscription\".",
      ],
    },
  },
  'PREP-ACC-06': {
    title: 'List non-human identities with Sentinel roles',
    do: [
      'List the service principals and managed identities that hold Microsoft Sentinel roles.',
      'Note which integration or automation uses each one. They stay on Azure RBAC if you activate unified RBAC.',
    ],
    proof: 'The exported list of these identities, with their roles and owners.',
    info: {
      title: "Why non-human identities need a list",
      lead: "Integrations and automation that use these identities must keep working after the move.",
      points: [
        "Service principals and managed identities are non-human identities: what integrations and automation use to access Sentinel.",
        "Service principal assignments are not supported in unified RBAC for Sentinel. Microsoft advises keeping Azure RBAC if you need them.",
        "So if you activate unified RBAC later, these identities stay on Azure RBAC. The list tells you which assignments to leave in place.",
        "Find them in the resource group or workspace under Access control (IAM) > Role assignments, filtered by type.",
      ],
    },
  },

  // ───── Prepare: data governance, compliance and cost ─────
  'PREP-GOV-01': {
    title: 'Find out which data policies apply',
    do: [
      "Note each workspace's region, and the Defender tenant's storage location under Settings > Microsoft Defender XDR > Account.",
      'Read the Defender XDR data retention page and the Sentinel data residency page. Defender data is kept for 180 days.',
      'Write a short summary of the differences for your compliance team.',
    ],
    proof: 'A screenshot of the Defender account settings, and your summary note.',
    info: {
      title: "What changes for your data",
      lead: "Your raw logs stay where they are. What changes is which policies apply when you work in the Defender portal.",
      points: [
        "In the Defender portal, Microsoft Defender XDR policies for storage, processing, retention and sharing apply, even when you work with Sentinel data.",
        "The raw log data storage location does not change, but the service might process data in Defender XDR regions.",
        "The Defender tenant has its own data storage location, shown under Settings > Microsoft Defender XDR > Account. It cannot be moved after creation.",
        "On retention: Defender data is kept for 180 days, and advanced hunting covers 30 days of native Defender data unless it is streamed to Sentinel.",
      ],
    },
  },
  'PREP-GOV-02': {
    title: 'Get compliance sign-off',
    do: [
      'Share your data policy summary with your data protection or compliance owner.',
      '[[do:add-decision|Record their decision]] (approve, approve with conditions, or reject) with their name, role and the date.',
    ],
    proof: 'The approval email, or the recorded decision.',
  },
  'PREP-GOV-03': {
    title: 'Check what customer-managed keys still protect',
    do: [
      'Confirm with your key-management owner which workspaces use customer-managed keys.',
      'Share the two Microsoft statements on keys (under Details) with your compliance owner, and record their acceptance or a blocker.',
    ],
    proof: 'The recorded acceptance decision.',
    info: {
      title: "What your own keys cover after the move",
      lead: "Your logs and Sentinel content stay protected by your keys. Alerts and incidents do not.",
      points: [
        "The transition guide says workspace log data, analytics rules and other Sentinel content stay CMK-encrypted, but alerts and incidents are no longer CMK-encrypted after onboarding.",
        "The CMK page says operational data such as alerts and incidents use Microsoft-managed keys. The pages word it differently, but both mean your keys no longer protect alerts and incidents.",
        "The optional data lake does not support CMK, and CMK workspaces are not accessible via data lake experiences.",
        "If CMK is a hard requirement for alerts and incidents, record it as a blocking issue, and confirm with Microsoft if it matters for compliance.",
      ],
    },
  },
  'PREP-GOV-04': {
    title: 'Decide separately about the Sentinel data lake',
    do: [
      'If you plan to use the data lake, check region support, Azure Policy blocks and the cost with your finance owner.',
      '[[do:add-decision|Record it as its own decision]], separate from the portal move.',
    ],
    proof: 'The recorded decision.',
    info: {
      title: "Why the data lake is its own decision",
      lead: "The data lake is optional and separate from the portal move, with its own prerequisites and costs.",
      points: [
        "It needs a primary workspace connected to the Defender portal, and must be in the primary's region.",
        "It automatically attaches all Defender-connected workspaces in that region, so test and production workspaces there are both attached.",
        "It cannot be offboarded without a support request, and it does not support customer-managed keys.",
        "It switches some billing meters (search jobs, auxiliary logs, long-term retention) to data lake meters that may increase costs.",
        "Azure Policy can block it. Microsoft notes error DL103 and an exemption for Microsoft.SentinelPlatformServices/sentinelplatformservices.",
        "What's new (September 2026) changes how customers onboarding after 23 September 2026 enable the lake tier. How this applies to existing customers is unclear, so confirm if cost matters.",
      ],
    },
  },
  'PREP-GOV-05': {
    title: 'Confirm cost and retention expectations',
    do: [
      'Confirm with finance that the move needs no licence change. Sentinel works in the Defender portal without Defender XDR or E5.',
      'If you plan to stream more Defender tables into Sentinel, estimate that ingestion cost.',
    ],
    proof: 'A note or email with the outcome.',
    info: {
      title: "What costs what",
      lead: "Microsoft states the transition itself has no extra cost.",
      points: [
        "No licence change is needed. Sentinel works in the Defender portal without Defender XDR or E5.",
        "Defender XDR alerts and incidents synced to Sentinel are free. Raw Defender advanced hunting tables ingested into Sentinel are charged.",
        "Native Defender data can be queried for 30 days in advanced hunting without ingestion.",
        "Extra cost comes from streaming more Defender tables into Sentinel, for example for longer retention or for workbooks.",
      ],
    },
  },

  // ───── Prepare: data connectors and ingestion ─────
  'PREP-CON-01': {
    title: 'Review the Defender XDR connector',
    do: [
      'Open the Microsoft Defender XDR connector page in each workspace that uses it, and note what is connected: incidents and alerts, entities, events.',
      'Plan for it to run on the primary workspace, with incidents and alerts turned on.',
    ],
    proof: 'A screenshot of the connector page for each workspace.',
    info: {
      title: "What this connector does after the move",
      lead: "If you are licensed for Defender XDR, the connector is set up for you when you connect, on the primary workspace only.",
      points: [
        "The connector page has three sections: \"Connect incidents & alerts\", \"Connect entities\" and \"Connect events\", which lists the event tables streamed.",
        "Microsoft asks you to make sure incidents and alerts from this connector are turned on.",
        "Switching to this connector replaces the standalone Microsoft connectors, and changes some alert schema details and filtering.",
        "For example, informational Defender for Cloud alerts are not ingested, and Entra ID Protection alerts below High are not ingested by default.",
      ],
    },
  },
  'PREP-CON-02': {
    title: 'Choose your Defender for Cloud connector approach',
    do: [
      'Note which Defender for Cloud connector each workspace uses today.',
      'Answer the questions below. The recommended way is the tenant-based connector on the primary, with incident-creating rules for its alerts turned off.',
      'Record the choice, and the rules to turn off, as a decision.',
    ],
    proof: 'Connector screenshots, and the recorded decision.',
    info: {
      title: "Why the connector choice matters",
      lead: "The wrong mix of Defender for Cloud connectors can give you duplicate incidents, or incidents with empty alerts.",
      points: [
        "There are two connectors: the tenant-based one (preview) and the legacy subscription-based one.",
        "Microsoft recommends the tenant-based connector on the primary, and the legacy one disconnected from all workspaces, to avoid duplicates.",
        "With only the legacy connector and Defender XDR incident integration, you may get Defender for Cloud incidents with empty alerts.",
        "Both connectors are hidden from the Defender portal's Data connectors page, so you set them up in the Azure portal.",
        "Want the alerts but not the incidents? Microsoft suggests automation rules that close those incidents as they arrive.",
        "No current Microsoft page documents a way to opt out of Defender for Cloud incident sync. Treat older guidance that describes one as possibly outdated.",
      ],
    },
  },
  'PREP-CON-03': {
    title: 'Plan where the Insider Risk Management connector goes',
    do: [
      'Note which workspaces have the connector turned on today.',
      'Plan to have it on the primary workspace only, and check which rules or workbooks in other workspaces use its data.',
    ],
    proof: 'A screenshot of the connector state, and the planned change as an action.',
    info: {
      title: "Why this connector is singled out",
      points: [
        "Microsoft lists it as a prerequisite: before you connect, enable the Microsoft 365 Insider Risk Management connector on the primary workspace and disable it on secondary workspaces.",
        "Here you only plan the change. You make it on the day, in the Transition stage.",
        "Rules or workbooks in secondary workspaces may use its data, so check them before it is turned off there.",
      ],
    },
  },
  'PREP-CON-04': {
    title: 'Record an ingestion baseline',
    do: [
      'Run the ingestion and "days since last data" queries in each workspace, or use the Usage tab under Monitoring > Insights.',
      'Export the results with the time and workspace alias in the title, and mark your critical tables.',
    ],
    proof: 'Dated CSV exports for each workspace, and your list of critical tables.',
    info: {
      title: "What a baseline is for",
      lead: "A dated record of today's ingestion is the only reliable way to spot a gap after the move.",
      points: [
        "Ingestion from non-Microsoft connectors is not supposed to change. But standalone Microsoft connectors are replaced or disconnected in some workspaces.",
        "Critical tables are the ones that matter most for your detections. Write down how fresh you expect each one to be.",
        "The Usage tab under Monitoring > Insights shows usage per table and solution, refreshed hourly. You need read permissions.",
        "The exact last-record query is expensive. Run it for your critical tables only.",
        "Name files consistently, for example baseline-ingestion-<workspace>-<yyyymmdd>.csv. You will compare them in validation.",
      ],
      practice: true,
    },
  },
  'PREP-CON-05': {
    title: 'Record an alert and incident baseline',
    do: [
      'Run the three alert and incident queries in each workspace, and export the results with the time and workspace alias.',
      'Note your top rules by incident volume. You will use them in testing and validation.',
    ],
    proof: 'Dated CSV exports for each workspace.',
    info: {
      title: "Why count alerts and incidents now",
      lead: "Incidents will look different after the move. A baseline lets you explain the change instead of guessing.",
      points: [
        "After connecting, every incident shows the provider \"Microsoft XDR\", and alerts from Microsoft products arrive through the Defender XDR connector.",
        "Incidents may be named and grouped differently.",
        "Your top rules by incident volume become the representative detections you check in testing and validation.",
      ],
    },
  },
  'PREP-CON-06': {
    title: 'Turn on health and audit monitoring',
    do: [
      'In Microsoft Sentinel settings, turn on auditing and health monitoring for analytics rules, connectors and automation.',
      'SentinelHealth is free; SentinelAudit is billable. The tables appear at the first event.',
      'Later checks use this data to show that rules and automation still run after the move.',
    ],
    proof: 'A screenshot of the auditing and health monitoring settings turned on.',
    info: {
      title: 'Why this step is needed',
      points: [
        'Validation later checks that analytics rules and automation still run, using the SentinelHealth table.',
        'That table exists only once health monitoring is on, so turn it on before the move.',
        'SentinelHealth is not billable; SentinelAudit is.',
      ],
    },
  },
  'PREP-CON-07': {
    title: 'Find content affected by alert schema changes',
    do: [
      'Read the schema differences page (under Details).',
      'Search your rule export, workbooks and saved searches for SecurityAlert queries that use the listed fields, and add an action per update.',
    ],
    proof: 'The list of affected items, as a note or a file.',
    info: {
      title: "What schema differences are",
      lead: "Some SecurityAlert fields hold different values when alerts arrive through the Defender XDR connector.",
      points: [
        "Microsoft documents the differences between the standalone Microsoft connectors and the Defender XDR connector.",
        "They include CompromisedEntity mapping, ExtendedProperties values, Defender for Office 365 status values and Defender for Identity resource access events.",
        "Queries, rules and workbooks that rely on these fields may behave differently, so find them before the move.",
        "Your rule export includes the query of each scheduled rule, so you can search it for SecurityAlert.",
      ],
    },
  },
  'PREP-CON-08': {
    title: 'Review which Defender tables you stream into Sentinel',
    do: [
      'List the Defender tables you stream, on the Defender XDR connector page or with the query below.',
      'For each, check whether you need it beyond 30 days, or in Sentinel rules, workbooks or hunting queries.',
      'Record per table: keep streaming it, or stop after the move once nothing in Sentinel uses it.',
    ],
    proof: 'The recorded decision for each table, with its reason.',
    info: {
      title: 'Will we lose any logs?',
      lead: 'Nothing is deleted. Reviewing changes nothing, and if you later stop streaming a table, the data already in Sentinel stays until its retention ends.',
      points: [
        'No data is deleted: when you stop sending data to a table, what is already there stays in the workspace until the end of its retention period.',
        'Defender keeps its own copy: advanced hunting in the Defender portal can query native Defender data for 30 days, with no ingestion.',
        'Alerts and incidents keep flowing: Defender XDR alerts and incidents sync to Sentinel at no cost, whatever you decide about the raw tables.',
        'Sentinel only sees what you stream: keep any table that Sentinel rules, workbooks or hunting queries use, or that you need for longer than 30 days.',
        'It is optional and separate from the move: change nothing on the day you connect.',
      ],
    },
  },

  // ───── Prepare: analytics rules, correlation and incidents ─────
  'PREP-DET-01': {
    title: 'Export your analytics rules',
    do: [
      'Export the rules from Microsoft Sentinel > Configuration > Analytics, one page at a time, or run the read-only inventory script and import its results.',
      'Store the exports in secure, versioned storage, and note where they are and the rule counts per kind.',
    ],
    proof: 'The scan CSV, or a note with the export location.',
    info: {
      title: 'Several workspaces?',
      points: [
        'Run the inventory script with no parameters: it finds every workspace you can read and writes one file per workspace, named after it. For a list you choose, use -WorkspacesFile.',
        'Pick all the files at once in Import inventory results. Each workspace gets its own dialog, so you confirm what applies to each one, or skip it.',
        'The list holds resource names only: no passwords, secrets or tokens. A workspace that fails does not stop the others.',
      ],
    },
  },
  'PREP-DET-02': {
    title: 'Plan for the Fusion rule being turned off',
    do: [
      'Note whether Fusion is on today, and which attack scenarios your SOC relies on.',
      'Tell the SOC lead it will be turned off, and plan a correlation test with representative scenarios.',
      '[[do:add-decision|Record the acknowledgement]] as a decision.',
    ],
    proof: 'A screenshot of the Fusion rule state, and the recorded acknowledgement.',
    info: {
      title: 'Do we lose multistage detection?',
      lead: 'No. The Defender XDR correlation engine takes over the work Fusion did, and your analytics rules keep running.',
      points: [
        'Fusion is turned off when you connect, and the Defender XDR correlation engine replaces it.',
        'Analytics rules keep running and raising alerts as they do today.',
        'Plan a correlation test, so you see it working with your own scenarios.',
      ],
    },
  },
  'PREP-DET-03': {
    title: 'Replace Microsoft incident creation rules',
    do: [
      'List your Microsoft incident creation rules. They detect nothing: they turn Microsoft product alerts into incidents, and are turned off when you connect.',
      'Plan each filter they applied as alert tuning or an automation rule, and scheduled rules for products not in Defender XDR.',
      'Decide whether to select "Retain Sentinel incident creation behavior for XDR alerts" when you connect, and record it as a decision.',
    ],
    proof: 'Your list of these rules, each with its replacement.',
    info: {
      title: 'Will we miss any detections?',
      lead: 'No detection is lost. These rules only turned Microsoft product alerts into incidents; the Defender portal now does that itself.',
      points: [
        'They are turned off when you connect, to avoid duplicate incidents.',
        'Other analytics rules are not affected.',
        'Only their filters need a new home: alert tuning or automation rules.',
      ],
    },
  },
  'PREP-DET-04': {
    title: 'Decide what happens to alert-only rules',
    do: [
      'List the analytics rules with incident creation turned off, and ask each owner why.',
      'Decide for each: turn on incident creation, keep it alert-only, or retire it. Their alerts are not visible in the Defender portal.',
    ],
    proof: 'The scan CSV, and a decision for each rule.',
    info: {
      title: "What alert-only rules are",
      lead: "These rules raise alerts but create no incidents. In the Defender portal, those alerts are not visible.",
      points: [
        "An alert-only rule is an analytics rule with incident creation turned off. In the rule scan, CreateIncident is False.",
        "The reason may be noise, enrichment or chaining, so ask the owner before you decide.",
        "Microsoft advises leaving incident creation on for connected workspaces.",
        "If you keep a rule alert-only, alert-trigger automation rules remain an option for it. Custom detections cannot create alerts without incidents.",
        "Microsoft does not say where these alerts can be queried after the move. The workspace SecurityAlert table is the likely place, but that is an inference.",
      ],
    },
  },
  'PREP-DET-05': {
    title: 'Decide on incident correlation and grouping',
    do: [
      'Find the processes and automation that rely on incident titles, alert grouping or reopened incidents.',
      'Choose the tenant default for correlation, and which rules to include or exclude (per rule, or with #INC_CORR# and #DONT_CORR# tags).',
      'Replace title-based logic with the analytics rule name and tags.',
    ],
    proof: 'The recorded decision, and the list of processes to adapt.',
    info: {
      title: "Correlation, grouping and titles explained",
      lead: "When you first connect, analytics rules are excluded from correlation by default, and group alerts as they did in Sentinel.",
      points: [
        "Correlation lets the Defender XDR engine merge incidents. That can also change incident titles.",
        "You set a tenant default, then include or exclude rules: per rule (Tenant default, Enabled or Disabled), or with a tag at the start of the rule description, #INC_CORR# or #DONT_CORR#.",
        "Changing the setting does not affect alerts created earlier, and alert grouping rules remain the final authority.",
        "\"Re-open closed matching incidents\" is not available after connection: new alerts create new incidents.",
        "So anything that matches on incident titles should use the analytics rule name and tags instead.",
        "Microsoft pages describe the default differently, so check the actual setting in your tenant after connecting.",
      ],
    },
  },
  'PREP-DET-06': {
    title: 'Check for sources of duplicate alerts',
    do: [
      "List the analytics rules over third-party alerts that alert promotion also turns into Defender XDR alerts, currently CrowdStrike through its CCF connector.",
      "Plan alert tuning or rule changes for the duplicates.",
    ],
    proof: 'The list of possible duplicates, and how you will handle them.',
    info: {
      title: "Where duplicate alerts come from",
      points: [
        "Alert promotion (preview) automatically promotes supported third-party alerts to Defender XDR alerts. Currently that is CrowdStrike, through its CCF connector.",
        "These can duplicate analytics rules you already run over the same data.",
        "Your Defender for Cloud connector choices can also create duplicates.",
        "Handle duplicates with alert tuning, or by changing the rule.",
      ],
    },
  },
  'PREP-DET-07': {
    title: 'Record an analytics rule health baseline',
    do: [
      'Run the analytics rule health query, or open the Analytics Health & Audit workbook.',
      'Fix existing failures, or note them.',
    ],
    proof: 'The dated CSV export.',
    info: {
      title: "Why record rule health now",
      lead: "Failures that exist today should not be blamed on the move.",
      points: [
        "With a record of today, new failures after the move stand out.",
        "The Analytics Health & Audit workbook has a Health tab, if you prefer it to the query. What it shows depends on your permissions for the resources it uses.",
        "A rule's Insights tab (preview) shows failed executions and top health issues for scheduled and near-real-time rules.",
      ],
    },
  },
  'PREP-DET-08': {
    title: 'Decide whether custom detections wait until later',
    do: [
      'Decide whether converting analytics rules to custom detections is part of this move, and record the decision.',
      'If it is, keep it in a separate backlog, apart from the production change.',
    ],
    proof: 'The recorded decision.',
    info: {
      title: "What custom detections are, and why wait",
      lead: "Converting rules is optional and not required for the move. Deciding now keeps the transition focused.",
      points: [
        "Custom detection rules are Defender portal rules that can query Sentinel and Defender tables together. They are under Investigation & response > Hunting > Custom detection rules.",
        "With Sentinel data they have limits: analytics-tier data only, no workspace() or adx(), primary workspace only, no Sentinel custom functions, and a lookback of 5 minutes to 30 days.",
        "Without Defender XDR, custom detections are limited or unavailable.",
        "Microsoft pages disagree on near-real-time custom detections with Sentinel data.",
      ],
    },
  },

  // ───── Prepare: automation rules and playbooks ─────
  'PREP-AUT-01': {
    title: 'Find automation rules whose conditions change',
    do: [
      'Export your automation rules, or run the read-only automation rule scan.',
      'For each rule that uses the incident provider, title, description or "Updated by": scope it with "Analytic rule name", and use tags instead of titles.',
      'Add each change as an action, and note which can be made before connecting.',
    ],
    proof: 'The scan CSV, and an action for each affected rule.',
    info: {
      title: "Which conditions change, and why",
      lead: "Some automation rule conditions stop working, or start matching more incidents, once you connect.",
      points: [
        "Incident provider: the condition is removed. A rule filtering on Microsoft Sentinel or Microsoft 365 Defender then runs on both Sentinel and Defender XDR incidents.",
        "Description: a rule that uses it as a condition with the incident creation trigger won't work.",
        "Title: incident titles may change through correlation, so Microsoft recommends not using them as conditions.",
        "Updated by: the value \"Microsoft 365 Defender\" is replaced by \"Other\".",
        "To scope a rule, use the \"Analytic rule name\" condition, and use tags instead of titles. Adding these conditions is safe before you connect.",
      ],
    },
  },
  'PREP-AUT-02': {
    title: 'Check alert-trigger automation rules',
    do: [
      'List the automation rules that run when an alert is created.',
      'For each, confirm whether it should act on Sentinel alerts only, or on Defender XDR alerts too.',
      'For Defender XDR alerts, weigh the Enhanced Alert Trigger and its limits (under Details).',
    ],
    proof: 'The list of these rules, each with its intended scope.',
    info: {
      title: "Which alerts these rules will see",
      lead: "After the move, automation rules with an alert trigger act only on Microsoft Sentinel alerts.",
      points: [
        "An alert-trigger rule runs \"When alert is created\". The analytics rule is its only condition.",
        "If a rule is meant to act on Defender XDR alerts too, Microsoft points to the Enhanced Alert Trigger.",
        "Its limits: it works at tenant level, has no priority ordering or expiration, and its actions are limited to running generated playbooks and updating alerts.",
        "It also allows 500 active rules per tenant, one action per rule, and its run results are not written to SentinelHealth.",
      ],
    },
  },
  'PREP-AUT-03': {
    title: 'List playbooks and find unsupported actions',
    do: [
      'List the playbooks Sentinel uses (Automation > Active playbooks, or the Logic Apps query).',
      'Check each for actions that add or remove alerts or create incidents, and for use of the incident description, provider or title.',
      'Add each finding as an action, with its planned change.',
    ],
    proof: 'The playbook list, and your findings.',
    info: {
      title: "What can break in playbooks",
      lead: "A few playbook actions and assumptions stop working after the move. This step finds them.",
      points: [
        "Adding or removing alerts from incidents is not supported from playbooks after connection.",
        "Incidents created by Logic App playbooks are not synchronised to the Defender portal.",
        "Playbooks that read the incident description, provider name or title may be affected. Microsoft does not document Logic Apps field-level changes, so this is inferred.",
        "Playbooks called directly from analytics rules (classic alert automation) are deprecated as of March 2026.",
        "Roles: the Sentinel service account needs Microsoft Sentinel Automation Contributor on the playbooks' resource groups. People who run playbooks by hand need Microsoft Sentinel Playbook Operator.",
      ],
    },
  },
  'PREP-AUT-04': {
    title: 'Replace manual playbook runs on alerts and entities',
    do: [
      'List the playbooks analysts run by hand on alerts or entities, and why. This is not supported in the Defender portal.',
      'Redesign them to run on incidents where possible, and update the runbooks.',
    ],
    proof: 'A link to the updated runbook.',
    info: {
      title: "What still works, and what does not",
      lead: "You can still run a playbook by hand on an incident. Only runs on alerts and entities are affected.",
      points: [
        "Running a playbook by hand on an alert or an entity is not supported in the Defender portal.",
        "Running one on an incident is supported: Incidents > select the incident > Run Playbook.",
        "An Azure portal workaround is only temporary. It stops being an option when Azure portal support ends on 31 March 2027.",
      ],
    },
  },
  'PREP-AUT-05': {
    title: 'Check automation timing assumptions',
    do: [
      'List automations and SLAs with tight timing, such as auto-assignment, notification or containment, and logic that needs every incident update.',
      'Update the SLA documents, and redesign the logic where needed.',
    ],
    proof: 'The list of timing-sensitive items and their mitigations.',
    info: {
      title: "How automation timing changes",
      lead: "Automation still runs, but it can start later, and quick successive updates arrive as one.",
      points: [
        "It may take up to 5 minutes for Defender incidents to fully integrate with Sentinel, which delays playbooks.",
        "It may take up to 10 minutes before an automation rule runs.",
        "Several changes to the same incident within 5 to 10 minutes are sent as one update, so the updates in between are lost.",
      ],
    },
  },
  'PREP-AUT-06': {
    title: 'Record an automation health baseline',
    do: [
      'Run the automation failure and playbook trigger queries, or use the Automation health workbook.',
      'Fix existing failures, or note them.',
    ],
    proof: 'The dated CSV exports.',
    info: {
      title: "Why record automation health now",
      lead: "Knowing the failures that exist today makes new ones after the move stand out.",
      points: [
        "The Automation health workbook is an alternative to the queries. Workbooks are under Threat management > Workbooks.",
        "Playbook run details in the workbook need Logic Apps diagnostics.",
        "Each Logic App also keeps its own run history, with the status of each run.",
      ],
    },
  },

  // ───── Prepare: integrations and APIs ─────
  'PREP-INT-01': {
    title: 'Check your ticketing and SOAR integrations',
    do: [
      'For each integration, note how it gets incidents and which fields it maps.',
      'Flag mappings on description, provider name, title or incident link, and plan the change for each.',
      'Agree a test case with each integration owner.',
    ],
    proof: 'The field mapping, and an action for each planned change.',
    info: {
      title: "Which incident fields change",
      lead: "Your ticketing and SOAR tools may rely on incident fields that change after the move.",
      points: [
        "Description: missing after connection for integrations such as ServiceNow.",
        "Provider name: changes to Microsoft XDR. Title: may change.",
        "Link: incidentUrl still points to the Sentinel (Azure) portal. For a direct Defender portal link, use providerIncidentUrl, or incidentWebUrl in Microsoft Graph.",
        "Microsoft does not publish an end-to-end ServiceNow guide for this change.",
        "If the ticket needs a description, a common approach is to compose one from the title, severity and entities in the playbook that creates the ticket.",
      ],
      practice: true,
    },
  },
  'PREP-INT-02': {
    title: 'Check scripts and tools that read incidents',
    do: [
      'Search code and reports for Sentinel incident API calls, "Azure Sentinel" provider filters, incident links and the Description field.',
      'For each, adapt to the new values or move to Microsoft Graph, and add an action.',
    ],
    proof: 'The list of consumers, with their planned changes.',
    info: {
      title: "What changes for scripts and reports",
      lead: "Anything that reads incidents through the Sentinel API or the SecurityIncident table may need updating.",
      points: [
        "The provider name changes from \"Azure Sentinel\" to \"Microsoft XDR\", so filters on the old value need updating.",
        "The SecurityIncident table no longer includes a Description value, although the schema reference still lists the column.",
        "Microsoft recommends Microsoft Graph for unified incidents and alerts. The Sentinel API stays supported for Sentinel resources such as analytics and automation rules.",
        "Graph incidents have no providerName or alertProductNames. Use the alerts' serviceSource, detectionSource and productName instead.",
        "Each Graph call needs its own read permission, for example SecurityIncident.Read.All for incidents.",
      ],
    },
  },
  'PREP-INT-03': {
    title: 'Replace incidents created by hand, API or playbook',
    do: [
      "Ask the SOC which processes create incidents by hand or by API, and run the query that finds incidents without alerts. It is only a hint.",
      "Plan an alternative for each, such as an analytics rule that raises the alert, and record it as a decision.",
    ],
    proof: 'The list of these workflows, each with its alternative.',
    info: {
      title: "Which incidents stop appearing",
      lead: "Incidents created by hand, by API or by a playbook are not synchronised to the Defender portal.",
      points: [
        "This covers incidents created manually in the Azure portal, through the Sentinel API, or by a Logic App playbook.",
        "Microsoft Graph cannot replace this: its incident API has no create method.",
        "The heuristic query looks for incidents without alerts, which may have been created this way. It is only a hint, so confirm with the SOC.",
        "In the incident queue, a manually created incident shows no Product name and an empty Alerts tab.",
        "An alternative can be an analytics rule or custom detection that raises the alert, or an external case process.",
      ],
    },
  },

  // ───── Prepare: hunting, workbooks, threat intelligence and content ─────
  'PREP-CNT-01': {
    title: 'Check workbooks for Defender portal limits',
    do: [
      'List your workbooks (Threat management > Workbooks, or the Resource Graph query).',
      'Mark those linked to secondary workspaces, used for print or PDF, or using advanced hunting data or the legacy threat intelligence table.',
      'Plan the changes for each one.',
    ],
    proof: 'The workbook list, with the risks marked.',
    info: {
      title: "What changes for workbooks",
      lead: "Workbooks keep working in the Defender portal. A few features do not come along.",
      points: [
        "Some visualisations can only be viewed in the Azure portal (\"Open in Azure\").",
        "Print and Save as PDF are available only in the Azure portal.",
        "The Workbooks page shows only primary-workspace data, and workbooks need Defender data ingested into Sentinel.",
        "Workbooks that use the legacy ThreatIntelligenceIndicator table need updating.",
        "Microsoft does not document what happens to Azure-only workbook features after 31 March 2027, so track it as an open question.",
      ],
    },
  },
  'PREP-CNT-02': {
    title: 'Update Defender queries that use IdentityInfo',
    do: [
      'List the advanced hunting queries and custom detections that use IdentityInfo.',
      'Map the old field names to the new ones (for example AccountUPN becomes AccountUpn), then update and test each query.',
    ],
    proof: 'A list of the queries you updated.',
    info: {
      title: "Why some queries need new field names",
      lead: "Only Defender-side queries are affected. Sentinel rules, workbooks and other Sentinel queries keep using the Log Analytics table.",
      points: [
        "After the move, IdentityInfo exists in two places: advanced hunting and your Log Analytics workspace.",
        "In advanced hunting, some fields are renamed and some are not supported.",
        "Examples: AccountUPN becomes AccountUpn, AccountSID becomes OnPremSid, MailAddress becomes EmailAddress, UserType becomes TenantMembershipType.",
        "The UEBA reference has the full list, including removed fields such as UserState and UserStateChangedOn.",
      ],
    },
  },
  'PREP-CNT-03': {
    title: 'Prepare hunting content and replace livestream',
    do: [
      'List your hunting queries, parsers, functions and bookmark use, and tell hunters where each lives in the Defender portal.',
      'Replace livestream, which is no longer available, and note the advanced hunting quotas for heavy queries.',
    ],
    proof: 'Your hunting content inventory.',
    info: {
      title: "Where hunting content lives after the move",
      points: [
        "Sentinel shared and sample queries appear in advanced hunting, in folders marked Sentinel. Functions are on the Functions tab.",
        "Bookmarks are not in advanced hunting. They stay under Microsoft Sentinel > Threat management > Hunting, and the data stays in the HuntingBookmark table.",
        "Notebooks are under Microsoft Sentinel > Threat management > Notebooks.",
        "Livestream is no longer available. Microsoft suggests KQL jobs, analytics rules or playbooks instead.",
        "Advanced hunting has quotas on rows, timeouts and CPU, which matter for heavy queries.",
      ],
    },
  },
  'PREP-CNT-04': {
    title: 'List your watchlists',
    do: [
      'List your watchlists with their aliases and owners (Configuration > Watchlist, or the watchlist query).',
    ],
    proof: 'The query output, or your list.',
  },
  'PREP-CNT-05': {
    title: 'Prepare threat intelligence content',
    do: [
      'Search rules, workbooks and saved searches for the legacy ThreatIntelligenceIndicator table, and plan each update.',
      'Plan a replacement for adding entities to threat intelligence from incidents, and update your threat intelligence runbooks.',
    ],
    proof: 'The query outputs, or a list of what you found.',
    info: {
      title: "What changed for threat intelligence",
      points: [
        "The legacy ThreatIntelligenceIndicator table stopped receiving data after 31 July 2025. Use ThreatIntelIndicators and ThreatIntelObjects instead.",
        "Microsoft gives a migration query on the STIX objects page.",
        "Adding entities to threat intelligence from incidents works only in the Azure portal. One replacement is creating indicators in Intel explorer, which needs Microsoft Sentinel Contributor or higher.",
        "Intel projects are deprecated. Link indicators to a case instead.",
        "Microsoft Defender Threat Intelligence reached end of life as a standalone product on 1 August 2026. Its capabilities are in the Defender portal at no extra cost.",
        "Microsoft pages name the area differently: Threat intelligence > Intel management, or Overview and Intel explorer.",
      ],
    },
  },
  'PREP-CNT-06': {
    title: 'Check UEBA and tell analysts about entity pages',
    do: [
      'Note whether UEBA is on and which data sources it uses (System > Settings > Microsoft Sentinel > UEBA).',
      'Tell analysts about the Sentinel events tab on entity pages.',
    ],
    proof: 'A screenshot of the UEBA settings.',
    info: {
      title: "What changes for UEBA and entity pages",
      lead: "Most UEBA functionality stays the same.",
      points: [
        "UEBA settings move to System > Settings > Microsoft Sentinel > UEBA. Some data sources can only be turned on from the Defender portal.",
        "Entity pages combine Sentinel and Defender data. The Sentinel timeline and insights are on the \"Sentinel events\" tab.",
        "IoT device entity pages stay in the Azure portal for now.",
      ],
    },
  },
  'PREP-CNT-07': {
    title: 'Check your content-as-code pipelines',
    do: [
      'List the pipelines that deploy Sentinel content and the API versions they call, and update any that need it.',
      'Confirm which content hub solutions you use, and who can update them.',
    ],
    proof: 'A link to the pipeline configuration.',
    info: {
      title: "What to check in your pipelines",
      points: [
        "Repositories are available in the Defender portal under Microsoft Sentinel > Content management > Repositories.",
        "Older repositories API versions were retired in June 2026. Use 2025-09-01, 2025-06-01 or 2025-07-01-preview. What's new gives two dates: 1 June and 15 June 2026.",
        "Creating a repository connection needs Owner on the resource group.",
        "Custom hunting queries and parsers deploy as saved searches.",
        "Updating content hub solutions needs Microsoft Sentinel Contributor at resource-group level.",
      ],
    },
  },

  // ───── Prepare: SOC operations and training ─────
  'PREP-OPS-01': {
    title: 'Update SOC runbooks for the Defender portal',
    do: [
      'List the runbooks that point to Sentinel in the Azure portal.',
      'Update their navigation using the [[go:knowledge:portal|portal map]], then ask a SOC lead to review them.',
    ],
    proof: 'Links to the updated runbooks, and the reviewer recorded as a decision.',
    info: {
      title: "Where things move, with examples",
      lead: "Most Sentinel pages move. The portal map in Knowledge lists them all.",
      points: [
        "Logs moves to Investigation & response > Hunting > Advanced hunting. Incidents moves to Investigation & response > Incidents & alerts > Incidents.",
        "Analytics, Automation, Watchlists and Data connectors move to Microsoft Sentinel > Configuration.",
        "Workbooks, Hunting and Notebooks move to Microsoft Sentinel > Threat management.",
        "Settings move to System > Settings > Microsoft Sentinel.",
        "News & guides and workspace manager are not available.",
      ],
    },
  },
  'PREP-OPS-02': {
    title: 'Adapt analyst habits to feature differences',
    do: [
      'Ask analysts which features they use that work differently, such as similar incidents or editing comments.',
      'Agree a replacement for each, then update runbooks and training.',
    ],
    proof: 'Links to the updated runbooks.',
    info: {
      title: "Which analyst habits change",
      points: [
        "Similar incidents is not supported. Hunting queries are one replacement.",
        "Editing existing comments is not supported, and edits made in the Azure portal are not synchronised. Add a new comment instead.",
        "Creating an automation rule from an incident, and adding entities to threat intelligence, work only in the Azure portal. You can create automation rules from the Automation page.",
        "Tasks created in Sentinel sync one way to the Defender portal, and the Defender portal does not yet create tasks automatically.",
        "Treat any Azure portal workaround as temporary. It ends with Azure portal support.",
      ],
    },
  },
  'PREP-OPS-03': {
    title: 'Plan analyst training',
    do: [
      'Name who needs training: analysts, engineers and managers.',
      "Use Microsoft's training videos from the transition guide plus hands-on walkthroughs, and schedule them before the change.",
    ],
    proof: 'The training plan, and the attendance record.',
    info: {
      title: 'Use the time before the deadline',
      practice: true,
      points: [
        'Microsoft supports Sentinel in the Azure portal until 31 March 2027.',
        'Until then, analysts can practise in the Defender portal while the Azure portal is still there for the few tasks that need it.',
      ],
    },
  },
  'PREP-OPS-04': {
    title: 'Tell the teams involved',
    do: [
      'Use the ready texts below: a notice to analysts before the switch, and a "we\'re live" note for the day.',
      'Check what they say, then send them to the teams involved in the move.',
    ],
    proof: 'The messages you sent, or a note of who received them and when.',
  },

  // ───── Prepare: planning, backup and rollback ─────
  'PREP-PLN-01': {
    title: 'Back up the configuration',
    do: [
      'Export analytics rules, automation rules and playbook definitions, and record connector settings, watchlists, workbooks and saved searches.',
      'Store it all in secure, versioned storage, and note the location, the date and the SHA-256 hashes.',
    ],
    proof: 'The backup manifest.',
    info: {
      title: "Why back up first",
      lead: "Connecting changes some settings for you, and Microsoft does not say whether disconnecting puts them back.",
      points: [
        "Connecting disables Fusion, deactivates Microsoft incident creation rules and disconnects some connectors.",
        "That makes your backup the only reliable reference if you need to restore.",
        "In the portal, analytics and automation rules export one page at a time.",
        "Exporting a template from a resource or resource group is not guaranteed to succeed, and has a 200 resource limit.",
        "Don't attach full exports to this project if they contain sensitive data. Record where they are stored instead.",
      ],
      practice: true,
    },
  },
  'PREP-PLN-02': {
    title: 'Agree how you will know it worked',
    do: [
      'Set a measurable criterion per area, for example critical tables fresh within your agreed delay and named rules creating incidents in the Defender portal.',
      'Agree the tolerances with the SOC lead, and record who approved them.',
      'For detections, measure alerts per rule, not incident counts: merging lowers the count.',
    ],
    proof: 'The criteria document, and the approval recorded as a decision.',
  },
  'PREP-PLN-03': {
    title: 'Write the rollback plan',
    do: [
      'Write the disconnection steps and the rollback triggers, and name who may carry them out.',
      'List what must be restored by hand from your backup, such as Fusion and incident creation rules.',
      'Never use "Remove Microsoft Sentinel" as a rollback: it removes Sentinel from the workspace.',
    ],
    proof: 'A link to the approved rollback plan.',
    info: {
      title: "Disconnect is the rollback, never Remove",
      lead: "You can disconnect a workspace if you need to. Microsoft does not say what that restores, so plan for manual work.",
      points: [
        "Disconnecting also disconnects the Defender XDR connector and removes Sentinel from the Defender portal navigation.",
        "Microsoft does not document whether Fusion, Microsoft incident creation rules, auto-disconnected connectors or app role assignments are restored. Restore them from your backup.",
        "\"Remove Microsoft Sentinel\", in the same settings area, removes Sentinel from the workspace entirely. It is not a rollback and must never be used for this.",
        "One primary workspace must always stay connected. Disconnecting is only a temporary fallback before Azure portal support ends.",
        "A rollback trigger is the condition that makes you roll back, for example loss of incident flow for critical detections beyond an agreed time.",
        "If you use the data lake, it cannot be offboarded without a support request.",
      ],
    },
  },
  'PREP-PLN-04': {
    title: 'Decide how you will test',
    do: [
      'With a separate test tenant, plan the Test stage there. Without a suitable one, mark the Test stage as not available and say why.',
      'Without a test, plan compensating controls: complete baselines, staged changes, longer hypercare and a rehearsed rollback.',
      '[[do:add-decision|Record the decision]].',
    ],
    proof: 'The recorded decision, linked to this step.',
    info: {
      title: "Why the test tenant matters",
      lead: "Testing high-risk items first lowers production risk, as long as the test cannot disturb production.",
      points: [
        "Connecting a test workspace in the production tenant interacts with primary workspace selection and the Defender XDR connector, which serve production.",
        "If the test workspace is the only workspace connected, it becomes primary and receives the Defender XDR connector.",
        "If your only non-production workspace is in the production tenant, consider testing secondary-workspace behaviour after production is connected instead.",
        "Microsoft does not publish a test strategy for the transition. This advice is derived from documented primary workspace behaviour.",
      ],
    },
  },
  'PREP-PLN-05': {
    title: 'Decide whether you are ready for production',
    do: [
      'Read the Prepare summary: what is done, open or accepted as an exception.',
      'Record the decision below, with who decided.',
    ],
    proof: 'The recorded decision, with the decision maker and date.',
    info: {
      title: "What this decision means",
      lead: "Readiness depends on evidence, blockers and accepted exceptions, not on forms being filled.",
      points: [
        "The readiness report shows the computed conclusion and its criteria.",
        "Each blocker is resolved, or recorded as an exception with a named person, role and rationale.",
        "The decision is one of: Go, Go with documented exceptions, No-go or Deferred.",
        "A named decision makes accountability explicit. A snapshot of the report keeps the record.",
      ],
    },
  },

  // ───── Test (optional) ─────
  'TEST-01': {
    title: 'Check the test environment fits',
    do: [
      'Confirm the test workspace is in a separate tenant. If it is in the production tenant, re-read your test approach decision before connecting anything.',
      'Compare test with production: licensing, connectors, rules, automation, playbooks, integrations and access. Note each difference.',
    ],
    proof: 'Your comparison notes.',
    info: {
      title: "Why the test setup matters",
      points: [
        "A test that differs materially from production, in licensing, connectors, rules, automation or tenant topology, can give false confidence.",
        "A test workspace in the production tenant affects primary workspace selection and the Defender XDR connector that serve production. That is a high risk.",
        "Major differences, for example no Defender XDR in test, mean those areas are not representative. Mark them to validate in production.",
        "Microsoft does not publish a test strategy for the transition. The same-tenant warning comes from documented primary workspace and connector behaviour.",
      ],
    },
  },
  'TEST-02': {
    title: 'Choose what to test first',
    do: [
      'From the testable Prepare items on the Test stage page, pick what to test: failed, uncertain and critical items first.',
      'For each, write the expected result and how you will see it.',
    ],
    proof: 'The written test plan, linked or attached.',
  },
  'TEST-03': {
    title: 'Record a test baseline',
    do: [
      'Run the same baseline queries as in Prepare (ingestion, alerts, incidents, health) in the test workspace, before you connect it.',
      'Attach each result with its run time.',
    ],
    proof: 'The dated CSV exports.',
  },
  'TEST-04': {
    title: 'Connect the test workspace',
    do: [
      "In the test tenant's Defender portal, open System > Settings > Microsoft Sentinel > Connect a workspace, exactly as planned for production.",
      'Choose the primary, read the product changes, decide on the "Retain" option as planned, then select Connect.',
      'Note the time (UTC), and check that Microsoft Sentinel appears in the left menu.',
    ],
    proof: 'Screenshots of the product-change screen and the Workspaces page.',
    info: {
      title: "Why rehearse the real procedure",
      lead: "Doing it in test first reveals permission gaps, unexpected product-change notices and timings.",
      points: [
        "The person connecting needs, in the test tenant, Security Administrator in Entra plus Owner with no condition, or User Access Administrator plus Microsoft Sentinel Contributor.",
        "Make the same choice on \"Retain Sentinel incident creation behavior for XDR alerts\" as you plan for production.",
        "When it has worked, Microsoft Sentinel appears in the left navigation.",
      ],
    },
  },
  'TEST-05': {
    title: 'Test incident creation, correlation and titles',
    do: [
      "Note the tenant's actual incident correlation default setting.",
      'Trigger representative detections in a safe way agreed with their owner, and check grouping and titles. Allow up to 5 minutes.',
    ],
    proof: 'Screenshots of the incidents, or the query output.',
    info: {
      title: "What you are checking",
      lead: "Incident creation moves to the Defender XDR engine, so correlation, grouping and titles can change.",
      points: [
        "First note the tenant's actual \"Incident correlation default setting\", under System > Settings > Microsoft Defender XDR > Rules > Incident correlation.",
        "Use only safe test methods agreed with the detection owner. Allow up to 5 minutes for incidents to appear.",
        "If you selected the Retain option, check Settings > Microsoft Defender XDR > Alert grouping for the migrated rules.",
        "This follows Microsoft's own validation list: trigger representative detections, verify grouping and confirm title behaviour.",
      ],
    },
  },
  'TEST-06': {
    title: 'Test automation rules and playbooks',
    do: [
      'Trigger incidents that should, and should not, match each redesigned automation rule.',
      'Run playbooks on an incident by hand and through automation, check the run history, and measure delays against your SLAs.',
    ],
    proof: 'Query outputs or run history screenshots.',
    info: {
      title: "What could behave differently",
      points: [
        "Provider, title, description and Updated by conditions change. Test incidents that should match a rule, and incidents that should not.",
        "Alert-trigger rules act only on Sentinel alerts.",
        "Timings change, so measure trigger delays against your SLAs.",
        "When you run a playbook on an incident, the Runs tab on that panel opens the run log in Logic Apps.",
        "Playbook run details in the Automation health workbook need Logic Apps diagnostics.",
      ],
    },
  },
  'TEST-07': {
    title: 'Test integrations with test endpoints',
    do: [
      'Create test incidents, and check that tickets get the expected fields.',
      'Open the Defender link from a ticket, check status sync if you use it, and run your API consumers.',
    ],
    proof: 'Ticket screenshots, or redacted API output samples.',
    info: {
      title: "What to look for in a ticket",
      lead: "Description, provider name, titles and links change after connection.",
      points: [
        "The description may be missing for ServiceNow-type integrations.",
        "The link in the ticket should open the incident in the Defender portal, through providerIncidentUrl or incidentWebUrl.",
      ],
    },
  },
  'TEST-08': {
    title: 'Test access for each persona',
    do: [
      'Sign in as (or with) each persona and do its key tasks: triage, investigation, response and hunting.',
      'Check that restricted personas still cannot see what they should not, and note any missing permission.',
    ],
    proof: 'Notes or screenshots for each persona.',
    info: {
      title: "What a persona is, and what to check",
      points: [
        "A persona is a type of SOC user with its own key tasks, for example triage, investigation, response or hunting.",
        "Roles and navigation change in the Defender portal.",
        "Restricted access may not carry over, for example table-level RBAC on IdentityInfo. Test restricted personas against the restrictions you need to keep.",
      ],
    },
  },
  'TEST-09': {
    title: 'Test workbooks, hunting and threat intelligence',
    do: [
      'Open your key workbooks and run your key hunting queries, including the updated IdentityInfo queries.',
      'Check bookmarks, watchlists and the threat intelligence pages.',
    ],
    proof: 'Screenshots of what you checked.',
  },
  'TEST-10': {
    title: 'Rehearse disconnecting (optional)',
    do: [
      'With the test owner\'s agreement, disconnect the test workspace. Never use "Remove Microsoft Sentinel".',
      'Note the state of the Defender XDR connector, Fusion, incident creation rules, standalone connectors and role assignments, then reconnect.',
    ],
    proof: 'Screenshots before and after, with your notes.',
    info: {
      title: "Why rehearse disconnecting",
      lead: "Microsoft documents only part of what disconnecting changes. A rehearsal turns the rest into evidence.",
      points: [
        "Microsoft documents that disconnecting also disconnects the Defender XDR connector, but not whether other onboarding changes are reversed.",
        "\"Remove Microsoft Sentinel\" is a different action. Never use it here.",
      ],
    },
  },
  'TEST-11': {
    title: 'Record the test outcome',
    do: [
      'Review the test results, and list what must still be checked in production because test differs.',
      'Update any Prepare item the test changed, then record the decision below and save a snapshot of the test report.',
    ],
    proof: 'The recorded decision, and a snapshot of the test report.',
  },

  // ───── Transition ─────
  'TRN-01': {
    title: 'Decide go or no-go',
    do: [
      'Confirm the change record is approved, the window is open, and the operator, SOC lead and owners are present.',
      'Confirm the rollback plan is at hand, and review the Prepare conclusion (and the test outcome, if any).',
      'Record the decision below, with who decided.',
    ],
    proof: 'The change approval reference, and the recorded decision.',
  },
  'TRN-02': {
    title: 'Confirm nothing critical is left open',
    do: [
      'Check each step this one depends on: every failed, blocked or unassessed item is resolved, or accepted as an exception in the register.',
    ],
    proof: 'A note referring to a saved readiness report snapshot.',
  },
  'TRN-03': {
    title: 'Refresh the configuration backup',
    do: [
      'Repeat the Prepare backup exports, inside the change window.',
      'Note the location, the time and the hashes.',
    ],
    proof: 'The backup manifest.',
  },
  'TRN-04': {
    title: 'Apply the safe automation changes',
    do: [
      'Apply each planned automation rule change marked "before connection", and note each one (name, change, time).',
      'Leave the others for after connecting.',
    ],
    proof: 'The change log.',
    info: {
      title: "Why some changes go first",
      lead: "Some automation changes are safe to make now, and protect you the moment you connect.",
      points: [
        "When you connect, the Incident provider condition is removed. A rule scoped only by provider could then run on the wrong incidents.",
        "Adding an analytic rule name or tag condition before you connect stops that.",
        "Changes that depend on the new behaviour wait until after connecting.",
      ],
    },
  },
  'TRN-05': {
    title: 'Set up the Defender for Cloud connectors',
    do: [
      'Apply your connector decision, for example: tenant-based connector on the primary, legacy one disconnected, planned rules turned off.',
      'Note each change and its time.',
    ],
    proof: 'Screenshots of the connectors.',
    info: {
      title: "Why this happens in the Azure portal",
      points: [
        "Both Defender for Cloud connectors are hidden in the Defender portal, so you change them in the Azure portal.",
        "Microsoft recommends the tenant-based connector on the primary and the legacy connector disconnected, with incident-creating rules for Defender for Cloud alerts turned off. This prevents duplicate or empty incidents.",
        "The connector page lists subscriptions and their connection status. Once connected, it shows a Data received graph.",
        "On the Analytics page, the Active rules tab can be filtered by rule type, which helps you find the rules to turn off.",
      ],
    },
  },
  'TRN-06': {
    title: 'Put the Insider Risk Management connector on the primary only',
    do: [
      'Apply the planned change: on for the primary workspace, off for the others.',
      'Note the time and the workspaces you changed.',
    ],
    proof: 'Screenshots of the connector state.',
  },
  'TRN-07': {
    title: 'Handle other standalone Microsoft connectors',
    do: [
      'Apply your decisions for standalone Microsoft connectors with alerts in secondary workspaces, and note each change.',
    ],
    proof: 'Screenshots of the changed connectors.',
    info: {
      title: "Which connectors this is about",
      points: [
        "Some standalone Microsoft connectors are not disconnected automatically when you connect. This step handles those that bring in alerts.",
        "Microsoft advises disconnecting them in your workspaces before onboarding.",
        "You decided what to do with content that relies on them while preparing. Here you apply those decisions.",
      ],
    },
  },
  'TRN-08': {
    title: "Check the operator's roles are active",
    do: [
      "If you use PIM, activate the roles for the whole window.",
      "Confirm Security Administrator and your Azure roles (Owner with no condition, or User Access Administrator plus Microsoft Sentinel Contributor) are active now.",
    ],
    proof: 'A screenshot of the active assignments.',
    info: {
      title: "Why check roles on the day",
      points: [
        "Without the required permissions, workspaces are not shown for onboarding.",
        "PIM activations expire. Activate for a duration that covers the whole window.",
        "The Azure role combination is Owner with no condition, or User Access Administrator plus Microsoft Sentinel Contributor, as in the role check.",
      ],
    },
  },
  'TRN-09': {
    title: 'Take a snapshot just before connecting',
    do: [
      'Run the ingestion freshness, incidents by provider and health overview queries.',
      'Attach the results with the time they were taken.',
    ],
    proof: 'The timestamped CSV exports.',
  },
  'TRN-10': {
    title: 'Connect the workspaces to the Defender portal',
    do: [
      'At security.microsoft.com, open System > Settings > Microsoft Sentinel > Connect a workspace, and select the workspaces you planned.',
      'Select the primary you chose, read the product changes, and apply your choice on "Retain Sentinel incident creation behavior for XDR alerts".',
      'Select Connect, note the exact time (UTC), and make no other changes for the first few minutes.',
    ],
    proof: 'Screenshots of the product-change screen and of the Workspaces page after connecting.',
    info: {
      title: 'When to connect',
      practice: true,
      points: [
        'Connect on a Tuesday to Thursday morning, never on a Friday or the day before a holiday, so the team that made the change is there for the first days.',
        'Connecting takes minutes. Plan the rest of the day for the checks after connecting.',
      ],
    },
  },
  'TRN-11': {
    title: 'Confirm the connection',
    do: [
      'Check that Microsoft Sentinel appears in the left menu, and read the Home page banner.',
      'Open System > Settings > Microsoft Sentinel > Workspaces, and confirm the primary and secondary workspaces are as planned.',
    ],
    proof: 'A screenshot of the Workspaces page.',
  },
  'TRN-12': {
    title: 'Check the automatic changes happened',
    do: [
      'Confirm Fusion is off, and Microsoft incident creation rules are turned off, if you used them.',
      'Confirm the Defender XDR connector is on the primary (if you have Defender XDR), and standalone connectors are off in secondary workspaces.',
      'Confirm Microsoft Sentinel Contributor is assigned to the "Microsoft Threat Protection" and "WindowsDefenderATP" apps.',
    ],
    proof: 'The scan CSV, or screenshots of each item.',
    info: {
      title: "What Microsoft changes when you connect",
      lead: "These changes are expected. Checking them confirms your environment is in the state your plan assumed.",
      points: [
        "Fusion is disabled. Filter Active rules for the Fusion type to find Advanced Multistage Attack Detection and its status.",
        "Microsoft incident creation rules are deactivated. On the Analytics page, they have the Microsoft security rule type.",
        "With Defender XDR licensed, the Defender XDR connector is on the primary, with incidents and alerts on. Its page shows a graph line each for incidents, alerts and events.",
        "In multi-workspace setups, standalone connectors are disconnected in secondary workspaces.",
        "Microsoft Sentinel Contributor is assigned to the \"Microsoft Threat Protection\" and \"WindowsDefenderATP\" apps. Look under the subscription's Access control (IAM).",
      ],
    },
  },
  'TRN-13': {
    title: 'Check incidents reach the Defender portal',
    do: [
      'Watch the incident queue for new incidents from known rules, or trigger a safe test detection.',
      'Compare alerts per rule with your pre-change snapshot (expect fewer incidents), and note the first incident you see.',
    ],
    proof: 'A screenshot of the incident queue, or the query output.',
    info: {
      title: 'Why are there fewer incidents?',
      lead: 'Fewer incidents than before is expected: related alerts are merged into one incident.',
      points: [
        'Merged incidents keep all their alerts, in the incident that remains.',
        'Compare alerts per rule with your snapshot. If no incidents arrive at all after the expected time, check the connector and rule health.',
      ],
    },
  },
  'TRN-14': {
    title: 'Apply the settings that come after connecting',
    do: [
      'Note the actual correlation default, then apply your correlation and grouping decision and the planned alert tuning.',
      'Apply the automation changes planned for after connection. Keep unified RBAC as its own change.',
    ],
    proof: 'Screenshots of the settings you applied.',
    info: {
      title: "Why these wait until after connecting",
      points: [
        "Correlation settings, alert grouping validation and alert tuning live in Defender XDR settings, so they can only be done once you are connected.",
        "Some automation changes depend on the new behaviour.",
        "If you selected the Retain option, check the migrated alert grouping rules are present and enabled.",
        "Unified RBAC activation stays its own planned change, not part of this step.",
      ],
    },
  },
  'TRN-15': {
    title: 'Apply the integration changes',
    do: [
      'Deploy the planned changes: deep links, description handling, title-independent matching and Graph calls.',
      'Create a test incident, and check the integration end to end.',
    ],
    proof: 'A redacted ticket screenshot.',
    info: {
      title: "What the integration changes are",
      points: [
        "Ticketing and API consumers depend on incident fields that change after connection.",
        "Deep links should point to the Defender portal, using providerIncidentUrl.",
        "Microsoft recommends Microsoft Graph for API consumers.",
        "Each change comes from your earlier assessments of ticketing and SOAR, and of scripts and tools.",
      ],
    },
  },
  'TRN-16': {
    title: 'Watch closely after the change',
    do: [
      'Agree the hypercare period and who watches.',
      'At agreed intervals, check automation failures, health, duplicates and missing incidents against the baseline, and collect analyst feedback.',
      '[[do:add-issue|Log each issue]] in the register.',
    ],
    proof: 'The query outputs from each check.',
    info: {
      title: "What hypercare means",
      lead: "Hypercare is an agreed period of close watching after the change.",
      points: [
        "Some effects only show with real traffic: automation failures, missing incidents, duplicates and analyst confusion.",
        "Duplicates to watch for include Defender for Cloud incidents.",
        "Between query runs, the Automation health and Analytics Health & Audit workbooks, and the Data collection anomalies tab of the Data collection health monitoring workbook, can help.",
        "In the incident queue, the Service/detection sources filter shows where incidents come from.",
      ],
      practice: true,
    },
  },
  'TRN-17': {
    title: 'Record the outcome of the change',
    do: [
      'Review what was done, failed, blocked or not verified in Transition. If you roll back, follow the rollback plan.',
      'Record the decision below: complete, complete with exceptions, or rolled back. Save a snapshot of the report.',
    ],
    proof: 'The recorded decision, and the execution report snapshot.',
  },

  // ───── Validate ─────
  'VAL-01': {
    title: 'Check the workspaces appear correctly',
    do: [
      'Open the Workspaces page, and compare it with your workspace list and your primary workspace choice.',
    ],
    proof: 'A screenshot of the Workspaces page.',
    info: {
      title: "Why the primary must be right",
      points: [
        "Several things work only on the primary: Defender XDR correlation and sync, the Workbooks page, custom detections and API queries.",
        "A wrong primary affects all of them, so compare the Workspaces page with your plan.",
      ],
    },
  },
  'VAL-02': {
    title: 'Check each persona can do its job',
    do: [
      'For each persona, do the key tasks: triage, investigate entities, run advanced hunting, run a playbook on an incident, manage rules.',
      'Confirm restricted personas still cannot see what they should not. [[do:add-issue|Log each gap as an issue]].',
    ],
    proof: 'Notes or screenshots for each persona.',
  },
  'VAL-03': {
    title: 'Check data ingestion matches the baseline',
    do: [
      'Run the same ingestion query you ran before the move, for the same period length.',
      'Compare it with your baseline. Note any table whose volume differs by more than your acceptance criteria.',
    ],
    proof: 'Both results side by side, or a note with the numbers and the comparison.',
    info: {
      title: "How to read the comparison",
      lead: "Some differences are expected. A critical table that stopped receiving data is not.",
      points: [
        "Connector changes during the move can create silent gaps: the Defender XDR connector, disconnected standalone connectors and Defender for Cloud changes.",
        "A critical table stopped receiving data: treat it as a blocking issue, and check the connector that feeds it.",
        "Defender alert tables changed volume: this is expected when standalone connectors are replaced. Confirm it against your alert baseline.",
        "Non-Microsoft connectors keep operating as before.",
      ],
    },
  },
  'VAL-04': {
    title: 'Check analytics rules run and create incidents',
    do: [
      'Run the rule health and incidents-by-rule queries, and compare them with your baselines for representative rules.',
      'Confirm analytics rules appear in the Defender custom detection rules list.',
      'Compare alerts per rule with your baseline, not incident counts: related alerts are now merged into one incident.',
    ],
    proof: 'The CSV exports.',
    info: {
      title: 'Why are there fewer incidents?',
      lead: 'Fewer incidents than before is expected. The Defender portal merges related alerts into one incident, and no alert is lost.',
      points: [
        'When incidents merge, all alerts move into the remaining incident, and the merged one is closed with a Redirected tag.',
        'So compare alerts per analytics rule with your baseline, not the number of incidents.',
        'Investigate a rule whose alerts stop or drop sharply; fewer incidents on its own is not a problem.',
      ],
    },
  },
  'VAL-05': {
    title: 'Check correlation, grouping and titles',
    do: [
      'Note the actual correlation setting, and review a sample of recent incidents for grouping and titles.',
      'Check merged incidents (tagged Redirected) for effects downstream.',
    ],
    proof: 'Screenshots of the sample you reviewed.',
    info: {
      title: "What merged and Redirected mean",
      points: [
        "Correlation can merge incidents and change their titles.",
        "When incidents merge, the merged source incident is closed and tagged Redirected.",
        "Check what happens downstream to those closed incidents, for example in your ticketing.",
        "If you used the Retain option, confirm the alert grouping rules still match expectations.",
      ],
    },
  },
  'VAL-06': {
    title: 'Check automation rules run as expected',
    do: [
      'Run the automation failure query for the period since the change.',
      'Sample incidents: the right rules acted and the wrong ones did not. Check rules using "Updated by" with the new "Other" value.',
    ],
    proof: 'The query output.',
    info: {
      title: "What to look for in automation",
      points: [
        "Condition changes (provider, title, description, Updated by) and timing changes can break automation, or make it act more widely.",
        "\"Updated by: Microsoft 365 Defender\" is replaced by \"Other\" in existing rules, so check those rules behave correctly.",
        "An incident's Activity log shows actions taken on it, for example by automation rules.",
        "The Automation health workbook is an alternative to the query.",
      ],
    },
  },
  'VAL-07': {
    title: 'Check playbooks run',
    do: [
      'Run a playbook by hand on a test incident in the Defender portal.',
      'Run the automation-to-playbook query, and look into any failed runs.',
    ],
    proof: 'Run history screenshots, or the query output.',
  },
  'VAL-08': {
    title: 'Check ticketing end to end',
    do: [
      'Trigger, or wait for, an incident that should create a ticket.',
      "Check the ticket's description, title, severity and link to the Defender portal, and status sync if you use it.",
    ],
    proof: 'A redacted ticket screenshot.',
    info: {
      title: "What changes in tickets",
      points: [
        "Description, provider name, titles and links change after the move, and status sync may be affected.",
        "The description may be missing for ServiceNow-type integrations.",
        "The link should open the incident in the Defender portal (providerIncidentUrl).",
      ],
    },
  },
  'VAL-09': {
    title: 'Check scripts, dashboards and reports',
    do: [
      'Run each consumer and compare the results with what you expect. Check filters that used "Azure Sentinel" as provider.',
      'Confirm Graph permissions are least-privilege.',
    ],
    proof: 'Redacted output samples.',
    info: {
      title: "Why provider filters matter",
      points: [
        "Response bodies and field values change. The incident provider is now always Microsoft XDR, so filters on \"Azure Sentinel\" no longer match.",
        "Microsoft Graph has a different data model from the Sentinel API.",
        "Least-privilege means each Graph consumer has only the read permission it needs.",
      ],
    },
  },
  'VAL-10': {
    title: 'Check for duplicate or empty incidents',
    do: [
      'Review incidents from Microsoft sources for duplicates, and Defender for Cloud incidents for empty alerts.',
      'Compare alert volumes by product with your baseline.',
    ],
    proof: 'The query output, or screenshots.',
    info: {
      title: "Where duplicates and empty incidents come from",
      points: [
        "Connector choices and alert promotion can cause duplicates.",
        "Legacy Defender for Cloud connectors can cause incidents with empty alerts.",
        "In the incident queue, the Service/detection sources filter includes Microsoft Defender for Cloud, which helps you find them.",
      ],
    },
  },
  'VAL-11': {
    title: 'Check key workbooks',
    do: [
      'Open each key workbook, and note the visuals that need "Open in Azure".',
      '[[do:add-risk|Record those as a risk]] for after 31 March 2027.',
    ],
    proof: 'Screenshots of the workbooks.',
    info: {
      title: "What \"Open in Azure\" means",
      points: [
        "Some workbook visuals can only be viewed in the Azure portal. In the Defender portal they need \"Open in Azure\".",
        "After 31 March 2027 those visuals are a risk, which is why you record them.",
        "The Workbooks page shows primary-workspace data only, and queries on the legacy threat intelligence table break.",
      ],
    },
  },
  'VAL-12': {
    title: 'Check hunting queries and bookmarks',
    do: [
      'Run your top hunting queries in advanced hunting with the right workspace selected, including the updated IdentityInfo queries.',
      'Open your bookmarks.',
    ],
    proof: 'Screenshots of what you ran.',
    info: {
      title: "What changed for hunting",
      points: [
        "Hunting queries now run in advanced hunting. Select the right workspace before you run them.",
        "IdentityInfo fields differ in advanced hunting, so run the queries you updated.",
        "Bookmarks live under Microsoft Sentinel > Threat management > Hunting, not in advanced hunting.",
      ],
    },
  },
  'VAL-13': {
    title: 'Check threat intelligence, watchlists and UEBA',
    do: [
      'Confirm indicators are visible and threat intelligence matching rules run.',
      'Run a watchlist query, and check the Sentinel events tab on an entity page.',
    ],
    proof: 'Screenshots, or the query output.',
    info: {
      title: "What to look for",
      points: [
        "Threat intelligence navigation and tables changed. In Intel explorer you can search and filter without a query, and changes can take a few minutes to appear.",
        "Watchlists and UEBA should carry on, but confirm they do. Watchlists are under Microsoft Sentinel > Configuration > Watchlists.",
        "On an entity page, Sentinel data is on the Sentinel events tab.",
      ],
    },
  },
  'VAL-14': {
    title: 'Check secondary workspaces behave as planned',
    do: [
      'Filter incidents by each secondary workspace, and confirm the expected incidents are there.',
      'Confirm moved automation runs in the primary, and content that used standalone connectors was handled as decided.',
    ],
    proof: 'Screenshots for each workspace.',
    info: {
      title: "What to expect from secondary workspaces",
      points: [
        "Incidents from secondary workspaces do not include Defender XDR data.",
        "Standalone connectors were disconnected, and automation may have moved to the primary.",
        "You can filter incidents by workspace, and pick the workspace in advanced hunting.",
      ],
    },
  },
  'VAL-15': {
    title: 'Check Microsoft app roles and health monitoring',
    do: [
      'Confirm Microsoft Sentinel Contributor is still assigned to the "Microsoft Threat Protection" and "WindowsDefenderATP" apps.',
      'Run the health verification query, or check that health events still arrive.',
    ],
    proof: 'A screenshot, or the query output.',
    info: {
      title: "Why check these again",
      points: [
        "Governance clean-up could remove the role assignments the connection created. Look in the subscription's Access control (IAM).",
        "Health monitoring is needed for ongoing operations, and rule insights are based on its data.",
        "In the Defender portal settings, health monitoring shows as Enabled.",
      ],
    },
  },
  'VAL-16': {
    title: 'Confirm SOC procedures and training',
    do: [
      'Confirm the updated runbooks are published, and training attendance is recorded.',
      'Run a short walkthrough per tier (triage, investigation, response), and log open questions in the register.',
    ],
    proof: "The training record, and the SOC lead's confirmation.",
  },
  'VAL-17': {
    title: 'Write down known limitations and workarounds',
    do: [
      'List the limitations that affect your SOC (see [[go:knowledge:changes|Feature changes]]), each with a workaround.',
      'Add actions to replace any workaround that needs the Azure portal before 31 March 2027.',
    ],
    proof: 'The register entries linked to this step.',
    info: {
      title: "Which workarounds will not last",
      lead: "Some workarounds rely on the Azure portal, and they disappear when Azure portal support ends.",
      points: [
        "Examples: adding entities to threat intelligence from incidents, running playbooks by hand on alerts or entities, and creating automation rules from an incident.",
        "For each limitation, note whether its workaround depends on the Azure portal.",
        "In the end, every limitation needs a lasting workaround or an accepted risk.",
      ],
    },
  },
  'VAL-18': {
    title: 'Review what is left and sign off',
    do: [
      'Review the final validation report and the register: open actions, risks and exceptions. Give each one an owner.',
      'Record the sign-off below, save a snapshot of the final report, and save the project package.',
    ],
    proof: 'The final report snapshot.',
  },
  'VAL-19': {
    title: 'Schedule a post-transition review',
    do: [
      'Schedule a review with the SOC lead and workstream owners after a period of normal running.',
      'Include the open actions and any workarounds that need the Azure portal.',
    ],
    proof: 'The calendar reference.',
  },
};
