// Short forms of every check for Simplified mode: an action title, one to three "do this" points and one
// line of proof. Each restates the check's own content: same facts, same sources, no new claims.
// EXTRAS: checks that are good practice, not needed for the move (shown as recommended extras).
// Health monitoring (PREP-CON-06) and the rule health baseline (PREP-DET-07) are needed, not extras:
// Validate checks query SentinelHealth, which exists only once monitoring is on.
export const EXTRAS = ['PREP-AUT-06', 'PREP-DET-08', 'PREP-GOV-04', 'PREP-GOV-05', 'PREP-CNT-04', 'PREP-CNT-06', 'TEST-10', 'VAL-19'];

export const SHORT = {
  // ───── Prepare: scope, governance and timeline ─────
  'PREP-SCOPE-01': {
    title: 'Brief your stakeholders',
    do: [
      'Choose who the email is for, then read it as they would.',
      'Copy it into Outlook or download it as a draft, and send it to the teams involved.',
    ],
    proof: 'The email you sent, or a note of who received it and when.',
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
    title: 'Set the transition window',
    do: [
      'Enter your planned window below. The planner shows when to start each phase to reach it in time.',
      'Avoid your change freezes, and leave time before 31 March 2027.',
      '[[do:add-decision|Record who approved the window]] as a decision.',
    ],
    proof: 'The approved plan or change calendar entry, or the window recorded below.',
  },
  'PREP-SCOPE-04': {
    title: 'Check whether any workspace is already connected',
    do: [
      'Sign in to security.microsoft.com. If Microsoft Sentinel is in the left menu, at least one workspace is connected.',
      'Open System > Settings > Microsoft Sentinel > Workspaces, then mark each workspace below.',
    ],
    proof: 'A screenshot of the Workspaces page, with IDs redacted if your policy requires.',
  },
  'PREP-SCOPE-05': {
    title: 'Check what your cloud supports',
    do: [
      'Note the cloud of each tenant in scope.',
      'Check the advanced hunting known issues and the Sentinel availability page for limits in your cloud.',
      '[[do:add-risk|Add each limit that affects you as a risk]].',
    ],
    proof: 'Links to the Microsoft pages you checked, or a note of the limits found.',
  },

  // ───── Prepare: workspaces and tenants ─────
  'PREP-TOP-01': {
    title: 'List every Sentinel workspace',
    do: [
      'Fill in the workspace list below: alias, environment, region and owner. Names and IDs only, no secrets.',
      'No query access? Use the portal way under Details.',
    ],
    proof: 'Your workspace list, saved below, or a screenshot of the workspace list in the Azure portal.',
  },
  'PREP-TOP-02': {
    title: 'Choose the primary workspace',
    do: [
      'Choose one primary per tenant below. Every other workspace becomes secondary: its rules keep running, but its alerts are not correlated with Defender XDR.',
      'Split production because of the rule limit? Keep the rules that need correlation in the primary.',
    ],
    proof: 'The planned primary recorded below, and the decision with its approver.',
  },
  'PREP-TOP-03': {
    title: 'Find content that relies on standalone Microsoft connectors',
    do: [
      'In each planned secondary workspace, find rules, workbooks and queries that use alerts from standalone Microsoft product connectors.',
      'For each one, decide: move it to the primary, ingest the Defender tables into that workspace, or retire it.',
    ],
    proof: 'The list of affected content, with a decision for each item.',
  },
  'PREP-TOP-04': {
    title: 'Plan to move automation to the primary workspace',
    do: [
      'List the automation rules in secondary workspaces that act on Defender XDR incidents or alerts.',
      'Plan to recreate each one in the primary, and turn the original off after validation. Add each move as an action.',
    ],
    proof: 'A list or export of the rules to move, each with an owner.',
  },
  'PREP-TOP-05': {
    title: 'Decide how each tenant is accessed',
    do: [
      "Fill in a card per tenant below: today's access method, and who connects its workspace from inside that tenant.",
      'Keep Azure Lighthouse where you need cross-tenant queries. Do not rely on GDAP for Sentinel data until you have confirmed it with Microsoft.',
      "Record each tenant's access model as a decision.",
    ],
    proof: 'The decision for each tenant, and a screenshot of the multitenant tenant list once it is set up.',
  },
  'PREP-TOP-06': {
    title: 'Replace workspace manager',
    do: [
      'Write down what workspace manager distributes today: content types, member workspaces and how often.',
      'Choose repositories (content as code) or multitenant content distribution, and pilot it with one item.',
      '[[do:add-decision|Record the choice as a decision]].',
    ],
    proof: 'Pilot notes, or a screenshot of the pilot result.',
  },

  // ───── Prepare: access and permissions ─────
  'PREP-ACC-01': {
    title: 'Check the person who connects has the right roles',
    do: [
      'Name who will connect the workspaces: a person, a break-glass account or a PIM role.',
      "In each subscription's Access control (IAM), confirm Owner, or User Access Administrator plus Microsoft Sentinel Contributor. Owner must have no conditions.",
      'In Entra, confirm Security Administrator or higher, or a PIM activation planned for the change window.',
    ],
    proof: 'A screenshot of the role assignments, with identifiers redacted as needed.',
  },
  'PREP-ACC-02': {
    title: 'Map analyst roles for the Defender portal',
    do: [
      'List your SOC personas, for example triage, investigation, detection engineering and read-only auditors.',
      'For each, note the Sentinel roles and the Defender XDR permissions it needs. Prefer resource-group scope.',
    ],
    proof: 'Your role matrix, attached or linked.',
  },
  'PREP-ACC-03': {
    title: 'Decide on unified RBAC for Sentinel',
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
      'List roles that limit access to specific tables (especially IdentityInfo), and users who rely on resource-context access.',
      '[[do:add-decision|Record a compensating control for each one]] as a decision.',
    ],
    proof: 'The list of roles and assignments, and a decision for each restriction.',
  },
  'PREP-ACC-05': {
    title: 'Protect the role assignments the connection creates',
    do: [
      'Tell your IAM or governance team which assignments to expect when you connect.',
      'Exclude them from automated removal: access reviews, scripts and policy remediation.',
    ],
    proof: 'A ticket or email reference showing the team was told and the exclusions are set.',
  },
  'PREP-ACC-06': {
    title: 'List non-human identities with Sentinel roles',
    do: [
      'List the service principals and managed identities that hold Microsoft Sentinel roles.',
      'Note which integration or automation uses each one. They stay on Azure RBAC if you activate unified RBAC.',
    ],
    proof: 'The exported list of these identities, with their roles and owners.',
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
  },
  'PREP-GOV-04': {
    title: 'Decide separately about the Sentinel data lake',
    do: [
      'If you plan to use the data lake, check region support, Azure Policy blocks and the cost with your finance owner.',
      '[[do:add-decision|Record it as its own decision]], separate from the portal move.',
    ],
    proof: 'The recorded decision.',
  },
  'PREP-GOV-05': {
    title: 'Confirm cost and retention expectations',
    do: [
      'Confirm with finance that the move needs no licence change. Sentinel works in the Defender portal without Defender XDR or E5.',
      'If you plan to stream more Defender tables into Sentinel, estimate that ingestion cost.',
    ],
    proof: 'A note or email with the outcome.',
  },

  // ───── Prepare: data connectors and ingestion ─────
  'PREP-CON-01': {
    title: 'Review the Defender XDR connector',
    do: [
      'Open the Microsoft Defender XDR connector page in each workspace that uses it, and note what is connected: incidents and alerts, entities, events.',
      'Plan for it to run on the primary workspace, with incidents and alerts turned on.',
    ],
    proof: 'A screenshot of the connector page for each workspace.',
  },
  'PREP-CON-02': {
    title: 'Choose your Defender for Cloud connector approach',
    do: [
      'Note which Defender for Cloud connector each workspace uses today.',
      'Answer the questions below. The recommended way is the tenant-based connector on the primary, with incident-creating rules for its alerts turned off.',
      'Record the choice, and the rules to turn off, as a decision.',
    ],
    proof: 'Connector screenshots, and the recorded decision.',
  },
  'PREP-CON-03': {
    title: 'Plan where the Insider Risk Management connector goes',
    do: [
      'Note which workspaces have the connector turned on today.',
      'Plan to have it on the primary workspace only, and check which rules or workbooks in other workspaces use its data.',
    ],
    proof: 'A screenshot of the connector state, and the planned change as an action.',
  },
  'PREP-CON-04': {
    title: 'Record an ingestion baseline',
    do: [
      'Run the ingestion and "days since last data" queries in each workspace, or use the Usage tab under Monitoring > Insights.',
      'Export the results with the time and workspace alias in the title, and mark your critical tables.',
    ],
    proof: 'Dated CSV exports for each workspace, and your list of critical tables.',
  },
  'PREP-CON-05': {
    title: 'Record an alert and incident baseline',
    do: [
      'Run the three alert and incident queries in each workspace, and export the results with the time and workspace alias.',
      'Note your top rules by incident volume. You will use them in testing and validation.',
    ],
    proof: 'Dated CSV exports for each workspace.',
  },
  'PREP-CON-06': {
    title: 'Turn on health and audit monitoring',
    do: [
      'In Microsoft Sentinel settings, turn on auditing and health monitoring for analytics rules, connectors and automation.',
      'SentinelHealth is free; SentinelAudit is billable. The tables appear at the first event.',
      'Later checks use this data to show that rules and automation still run after the move.',
    ],
    proof: 'A screenshot of the auditing and health monitoring settings turned on.',
  },
  'PREP-CON-07': {
    title: 'Find content affected by alert schema changes',
    do: [
      'Read the schema differences page (under Details).',
      'Search your rule export, workbooks and saved searches for SecurityAlert queries that use the listed fields, and add an action per update.',
    ],
    proof: 'The list of affected items, as a note or a file.',
  },

  // ───── Prepare: analytics rules, correlation and incidents ─────
  'PREP-DET-01': {
    title: 'Export your analytics rules',
    do: [
      'Export the rules from Microsoft Sentinel > Configuration > Analytics, one page at a time, or run the read-only inventory script and import its results.',
      'Store the exports in secure, versioned storage, and note where they are and the rule counts per kind.',
    ],
    proof: 'The scan CSV, or a note with the export location.',
  },
  'PREP-DET-02': {
    title: 'Plan for the Fusion rule being turned off',
    do: [
      'Note whether Fusion is on today, and which attack scenarios your SOC relies on.',
      'Tell the SOC lead it will be turned off, and plan a correlation test with representative scenarios.',
      '[[do:add-decision|Record the acknowledgement]] as a decision.',
    ],
    proof: 'A screenshot of the Fusion rule state, and the recorded acknowledgement.',
  },
  'PREP-DET-03': {
    title: 'Replace Microsoft incident creation rules',
    do: [
      'List your Microsoft incident creation rules. They detect nothing: they turn Microsoft product alerts into incidents, and are turned off when you connect.',
      'Plan each filter they applied as alert tuning or an automation rule, and scheduled rules for products not in Defender XDR.',
      'Decide whether to select "Retain Sentinel incident creation behavior for XDR alerts" when you connect, and record it as a decision.',
    ],
    proof: 'Your list of these rules, each with its replacement.',
  },
  'PREP-DET-04': {
    title: 'Decide what happens to alert-only rules',
    do: [
      'List the analytics rules with incident creation turned off, and ask each owner why.',
      'Decide for each: turn on incident creation, keep it alert-only, or retire it. Their alerts are not visible in the Defender portal.',
    ],
    proof: 'The scan CSV, and a decision for each rule.',
  },
  'PREP-DET-05': {
    title: 'Decide on incident correlation and grouping',
    do: [
      'Find the processes and automation that rely on incident titles, alert grouping or reopened incidents.',
      'Choose the tenant default for correlation, and which rules to include or exclude (per rule, or with #INC_CORR# and #DONT_CORR# tags).',
      'Replace title-based logic with the analytics rule name and tags.',
    ],
    proof: 'The recorded decision, and the list of processes to adapt.',
  },
  'PREP-DET-06': {
    title: 'Check for sources of duplicate alerts',
    do: [
      'List the analytics rules that create alerts from third-party security products covered by alert promotion.',
      'Plan alert tuning or rule changes for the duplicates.',
    ],
    proof: 'The list of possible duplicates, and how you will handle them.',
  },
  'PREP-DET-07': {
    title: 'Record an analytics rule health baseline',
    do: [
      'Run the analytics rule health query, or open the Analytics Health & Audit workbook.',
      'Fix existing failures, or note them.',
    ],
    proof: 'The dated CSV export.',
  },
  'PREP-DET-08': {
    title: 'Decide whether custom detections wait until later',
    do: [
      'Decide whether converting analytics rules to custom detections is part of this move, and record the decision.',
      'If it is, keep it in a separate backlog, apart from the production change.',
    ],
    proof: 'The recorded decision.',
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
  },
  'PREP-AUT-02': {
    title: 'Check alert-trigger automation rules',
    do: [
      'List the automation rules that run when an alert is created.',
      'For each, confirm whether it should act on Sentinel alerts only, or on Defender XDR alerts too.',
      'For Defender XDR alerts, weigh the Enhanced Alert Trigger and its limits (under Details).',
    ],
    proof: 'The list of these rules, each with its intended scope.',
  },
  'PREP-AUT-03': {
    title: 'List playbooks and find unsupported actions',
    do: [
      'List the playbooks Sentinel uses (Automation > Active playbooks, or the Logic Apps query).',
      'Check each for actions that add or remove alerts or create incidents, and for use of the incident description, provider or title.',
      'Add each finding as an action, with its planned change.',
    ],
    proof: 'The playbook list, and your findings.',
  },
  'PREP-AUT-04': {
    title: 'Replace manual playbook runs on alerts and entities',
    do: [
      'List the playbooks analysts run by hand on alerts or entities, and why. This is not supported in the Defender portal.',
      'Redesign them to run on incidents where possible, and update the runbooks.',
    ],
    proof: 'A link to the updated runbook.',
  },
  'PREP-AUT-05': {
    title: 'Check automation timing assumptions',
    do: [
      'List automations and SLAs with tight timing, such as auto-assignment, notification or containment, and logic that needs every incident update.',
      'Update the SLA documents, and redesign the logic where needed.',
    ],
    proof: 'The list of timing-sensitive items and their mitigations.',
  },
  'PREP-AUT-06': {
    title: 'Record an automation health baseline',
    do: [
      'Run the automation failure and playbook trigger queries, or use the Automation health workbook.',
      'Fix existing failures, or note them.',
    ],
    proof: 'The dated CSV exports.',
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
  },
  'PREP-INT-02': {
    title: 'Check scripts and tools that read incidents',
    do: [
      'Search code and reports for Sentinel incident API calls, "Azure Sentinel" provider filters, incident links and the Description field.',
      'For each, adapt to the new values or move to Microsoft Graph, and add an action.',
    ],
    proof: 'The list of consumers, with their planned changes.',
  },
  'PREP-INT-03': {
    title: 'Replace incidents created by hand, API or playbook',
    do: [
      'Ask the SOC which processes create incidents by hand or by API, and run the heuristic query.',
      'Plan an alternative for each, such as an analytics rule that raises the alert, and record it as a decision.',
    ],
    proof: 'The list of these workflows, each with its alternative.',
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
  },
  'PREP-CNT-02': {
    title: 'Update Defender queries that use IdentityInfo',
    do: [
      'List the advanced hunting queries and custom detections that use IdentityInfo.',
      'Map the old field names to the new ones (for example AccountUPN becomes AccountUpn), then update and test each query.',
    ],
    proof: 'A list of the queries you updated.',
  },
  'PREP-CNT-03': {
    title: 'Prepare hunting content and replace livestream',
    do: [
      'List your hunting queries, parsers, functions and bookmark use, and tell hunters where each lives in the Defender portal.',
      'Replace livestream, which is no longer available, and note the advanced hunting quotas for heavy queries.',
    ],
    proof: 'Your hunting content inventory.',
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
  },
  'PREP-CNT-06': {
    title: 'Check UEBA and tell analysts about entity pages',
    do: [
      'Note whether UEBA is on and which data sources it uses (System > Settings > Microsoft Sentinel > UEBA).',
      'Tell analysts about the Sentinel events tab on entity pages.',
    ],
    proof: 'A screenshot of the UEBA settings.',
  },
  'PREP-CNT-07': {
    title: 'Check your content-as-code pipelines',
    do: [
      'List the pipelines that deploy Sentinel content and the API versions they call, and update any that need it.',
      'Confirm which content hub solutions you use, and who can update them.',
    ],
    proof: 'A link to the pipeline configuration.',
  },

  // ───── Prepare: SOC operations and training ─────
  'PREP-OPS-01': {
    title: 'Update SOC runbooks for the Defender portal',
    do: [
      'List the runbooks that point to Sentinel in the Azure portal.',
      'Update their navigation using the [[go:knowledge:portal|portal map]], then ask a SOC lead to review them.',
    ],
    proof: 'Links to the updated runbooks, and the reviewer recorded as a decision.',
  },
  'PREP-OPS-02': {
    title: 'Adapt analyst habits to feature differences',
    do: [
      'Ask analysts which features they use that work differently, such as similar incidents or editing comments.',
      'Agree a replacement for each, then update runbooks and training.',
    ],
    proof: 'Links to the updated runbooks.',
  },
  'PREP-OPS-03': {
    title: 'Plan analyst training',
    do: [
      'Name who needs training: analysts, engineers and managers.',
      "Use Microsoft's training videos from the transition guide plus hands-on walkthroughs, and schedule them before the change.",
    ],
    proof: 'The training plan, and the attendance record.',
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
  },
  'PREP-PLN-02': {
    title: 'Agree how you will know it worked',
    do: [
      'Set a measurable criterion per area, for example critical tables fresh within your agreed delay and named rules creating incidents in the Defender portal.',
      'Agree the tolerances with the SOC lead, and record who approved them.',
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
  },
  'PREP-PLN-04': {
    title: 'Decide how you will test',
    do: [
      'With a separate test tenant, plan the Test stage there. Without a suitable one, mark the Test stage as not available and say why.',
      'Without a test, plan compensating controls: complete baselines, staged changes, longer hypercare and a rehearsed rollback.',
      '[[do:add-decision|Record the decision]].',
    ],
    proof: 'The recorded decision, linked to this step.',
  },
  'PREP-PLN-05': {
    title: 'Decide whether you are ready for production',
    do: [
      'Read the Prepare summary: what is done, open or accepted as an exception.',
      'Record the decision below, with who decided.',
    ],
    proof: 'The recorded decision, with the decision maker and date.',
  },

  // ───── Test (optional) ─────
  'TEST-01': {
    title: 'Check the test environment fits',
    do: [
      'Confirm the test workspace is in a separate tenant. If it is in the production tenant, re-read your test approach decision before connecting anything.',
      'Compare test with production: licensing, connectors, rules, automation, playbooks, integrations and access. Note each difference.',
    ],
    proof: 'Your comparison notes.',
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
  },
  'TEST-05': {
    title: 'Test incident creation, correlation and titles',
    do: [
      "Note the tenant's actual incident correlation default setting.",
      'Trigger representative detections in a safe way agreed with their owner, and check grouping and titles. Allow up to 5 minutes.',
    ],
    proof: 'Screenshots of the incidents, or the query output.',
  },
  'TEST-06': {
    title: 'Test automation rules and playbooks',
    do: [
      'Trigger incidents that should, and should not, match each redesigned automation rule.',
      'Run playbooks on an incident by hand and through automation, check the run history, and measure delays against your SLAs.',
    ],
    proof: 'Query outputs or run history screenshots.',
  },
  'TEST-07': {
    title: 'Test integrations with test endpoints',
    do: [
      'Create test incidents, and check that tickets get the expected fields.',
      'Open the Defender link from a ticket, check status sync if you use it, and run your API consumers.',
    ],
    proof: 'Ticket screenshots, or redacted API output samples.',
  },
  'TEST-08': {
    title: 'Test access for each persona',
    do: [
      'Sign in as (or with) each persona and do its key tasks: triage, investigation, response and hunting.',
      'Check that restricted personas still cannot see what they should not, and note any missing permission.',
    ],
    proof: 'Notes or screenshots for each persona.',
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
  },
  'TRN-05': {
    title: 'Set up the Defender for Cloud connectors',
    do: [
      'Apply your connector decision, for example: tenant-based connector on the primary, legacy one disconnected, planned rules turned off.',
      'Note each change and its time.',
    ],
    proof: 'Screenshots of the connectors.',
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
  },
  'TRN-08': {
    title: "Check the operator's roles are active",
    do: [
      'If you use PIM, activate the roles for the whole window.',
      'Confirm that Security Administrator and the Azure role combination are active right now.',
    ],
    proof: 'A screenshot of the active assignments.',
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
  },
  'TRN-13': {
    title: 'Check incidents reach the Defender portal',
    do: [
      'Watch the incident queue for new incidents from known rules, or trigger a safe test detection.',
      'Compare the volume with your pre-change snapshot, and note the first incident you see (time and rule).',
    ],
    proof: 'A screenshot of the incident queue, or the query output.',
  },
  'TRN-14': {
    title: 'Apply the settings that come after connecting',
    do: [
      'Note the actual correlation default, then apply your correlation and grouping decision and the planned alert tuning.',
      'Apply the automation changes planned for after connection. Keep unified RBAC as its own change.',
    ],
    proof: 'Screenshots of the settings you applied.',
  },
  'TRN-15': {
    title: 'Apply the integration changes',
    do: [
      'Deploy the planned changes: deep links, description handling, title-independent matching and Graph calls.',
      'Create a test incident, and check the integration end to end.',
    ],
    proof: 'A redacted ticket screenshot.',
  },
  'TRN-16': {
    title: 'Watch closely after the change',
    do: [
      'Agree the hypercare period and who watches.',
      'At agreed intervals, check automation failures, health, duplicates and missing incidents against the baseline, and collect analyst feedback.',
      '[[do:add-issue|Log each issue]] in the register.',
    ],
    proof: 'The query outputs from each check.',
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
  },
  'VAL-04': {
    title: 'Check analytics rules run and create incidents',
    do: [
      'Run the rule health and incidents-by-rule queries, and compare them with your baselines for representative rules.',
      'Confirm analytics rules appear in the Defender custom detection rules list.',
    ],
    proof: 'The CSV exports.',
  },
  'VAL-05': {
    title: 'Check correlation, grouping and titles',
    do: [
      'Note the actual correlation setting, and review a sample of recent incidents for grouping and titles.',
      'Check merged incidents (tagged Redirected) for effects downstream.',
    ],
    proof: 'Screenshots of the sample you reviewed.',
  },
  'VAL-06': {
    title: 'Check automation rules run as expected',
    do: [
      'Run the automation failure query for the period since the change.',
      'Sample incidents: the right rules acted and the wrong ones did not. Check rules using "Updated by" with the new "Other" value.',
    ],
    proof: 'The query output.',
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
  },
  'VAL-09': {
    title: 'Check scripts, dashboards and reports',
    do: [
      'Run each consumer and compare the results with what you expect. Check filters that used "Azure Sentinel" as provider.',
      'Confirm Graph permissions are least-privilege.',
    ],
    proof: 'Redacted output samples.',
  },
  'VAL-10': {
    title: 'Check for duplicate or empty incidents',
    do: [
      'Review incidents from Microsoft sources for duplicates, and Defender for Cloud incidents for empty alerts.',
      'Compare alert volumes by product with your baseline.',
    ],
    proof: 'The query output, or screenshots.',
  },
  'VAL-11': {
    title: 'Check key workbooks',
    do: [
      'Open each key workbook, and note the visuals that need "Open in Azure".',
      '[[do:add-risk|Record those as a risk]] for after 31 March 2027.',
    ],
    proof: 'Screenshots of the workbooks.',
  },
  'VAL-12': {
    title: 'Check hunting queries and bookmarks',
    do: [
      'Run your top hunting queries in advanced hunting with the right workspace selected, including the updated IdentityInfo queries.',
      'Open your bookmarks.',
    ],
    proof: 'Screenshots of what you ran.',
  },
  'VAL-13': {
    title: 'Check threat intelligence, watchlists and UEBA',
    do: [
      'Confirm indicators are visible and threat intelligence matching rules run.',
      'Run a watchlist query, and check the Sentinel events tab on an entity page.',
    ],
    proof: 'Screenshots, or the query output.',
  },
  'VAL-14': {
    title: 'Check secondary workspaces behave as planned',
    do: [
      'Filter incidents by each secondary workspace, and confirm the expected incidents are there.',
      'Confirm moved automation runs in the primary, and content that used standalone connectors was handled as decided.',
    ],
    proof: 'Screenshots for each workspace.',
  },
  'VAL-15': {
    title: 'Check Microsoft app roles and health monitoring',
    do: [
      'Confirm Microsoft Sentinel Contributor is still assigned to the "Microsoft Threat Protection" and "WindowsDefenderATP" apps.',
      'Run the health verification query, or check that health events still arrive.',
    ],
    proof: 'A screenshot, or the query output.',
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
