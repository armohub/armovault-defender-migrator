// Stage 1, Prepare (part 1 of 3): scope, workspaces, access, data governance.
import { k, src, q, any, all, at, outcome } from './define.mjs';

const DP = 'Defender portal';
const AP = 'Azure portal';
const ORG = 'Your organisation';

export const PREPARE_1 = [
  // ───────────────────────── Scope, governance and timeline ─────────────────────────
  k({
    tool: 'briefing',
    id: 'PREP-SCOPE-01', stage: 'prepare', workstream: 'scope', order: 10, kind: 'task', criticality: 'high',
    title: 'Agree what the transition changes, and what it does not',
    objective: "Make sure everyone involved knows what the move changes and what stays the same, before any technical work starts.",
    why: [
      'Misunderstanding the change leads to the wrong scope, for example planning a SIEM replacement or a data migration that isn\'t needed.',
      'It can also make you miss the behaviour changes that actually break detections, automation and integrations.',
    ],
    where: [at(ORG, 'Project kick-off or stakeholder briefing')],
    when: 'At project start, before any technical work.',
    steps: [
      "Read the short summary in **Do it here**: what changes, what stays the same and the deadline, with links to the Microsoft pages behind it.",
      {
        "text": "Send the ready-made email to your stakeholders, or use it for a short briefing call.",
        "tip": "No need to wait for replies or for the call. Choose **Leave for now** at the top of this page and carry on with the next steps."
      },
      "[[do:add-action|Add each open question to the register]] so it is tracked.",
      {
        "text": "If people are new to the words, explain them:",
        "bullets": [
          "**Transition**: moving your SOC's day-to-day Sentinel experience to the Defender portal.",
          "**Connect** or **onboard a workspace**: the technical step in Defender portal settings.",
          "**Defender XDR**: Microsoft's extended detection and response products that share the Defender portal."
        ],
        "tip": "More terms are on the [[go:knowledge:terms|terminology page]]."
      }
    ],
    expected: 'Stakeholders confirm the scope and the terminology, and the open questions are captured in the register.',
    record: [
      "Who you briefed and when, in [[do:write-notes|this step's notes]]",
      "Open questions: [[do:add-action|add each one to the register]]"
    ],
    evidence: [
      "The email you sent or the meeting notes: [[do:add-file|attach them]] or [[do:add-link|add a link]]",
      "If your team needs no evidence here, [[do:waive-evidence|record that instead]]"
    ],
    sources: [
      src('defportal', 'Retirement statement and feature reference / quick reference'),
      src('overview', 'Retirement timeline wording'),
      src('move', 'Log data stays in Log Analytics; no extra cost; behaviour changes; Defender XDR policies apply'),
      src('isoc', 'The former planning and deployment guide URLs now redirect to the ISOC preview overview'),
    ],
    caveats: ['As of 2026-10-19, two pages linked from the transition guide, "Plan for unified security operations" and "Deploy for unified security operations", redirect to the Integrated SOC (ISOC) preview page. That page targets tenants without a Sentinel workspace. Use the transition guide as your primary reference.'],
  }),
  k({
    tool: 'owners',
    id: 'PREP-SCOPE-02', stage: 'prepare', workstream: 'scope', order: 20, kind: 'task', criticality: 'high', provenance: 'practice', confidence: 'medium',
    title: 'Name owners, approvers and the change process',
    objective: "Give each workstream an owner and agree who approves the change. Enter them once in **Do it here**; every step then shows its owner.",
    why: [
      'The transition touches identity, compliance, detections, automation, integrations and SOC operations.',
      'Without named owners, decisions stall and approvals are missed.',
    ],
    where: [at(ORG, 'Project governance')],
    steps: [
      "Type an owner for each workstream in **Do it here**. Every step in that workstream then shows this owner. You can still set a different owner on a single step.",
      {
        "text": "Add the approvers you'll need:",
        "bullets": [
          "The change advisory board (or equivalent)",
          "Data protection or compliance",
          "Identity and access management",
          "Owners of ticketing (ITSM) and other integrations",
          "The SOC lead"
        ],
        "tip": "Their names are then suggested wherever the assistant asks who decided or approved something."
      },
      {
        "text": "Agree how the production change will be approved and recorded:",
        "bullets": [
          "The change record type",
          "The lead time",
          "Freeze periods"
        ],
        "tip": "Write these down in [[do:write-notes|this step's notes]]."
      }
    ],
    expected: 'Every workstream has an owner, and you know the approval path for the production change.',
    record: [
      "Owners and approvers: in **Do it here** (saved to [[go:owners|Project setup]])",
      "The change process and freeze periods, in [[do:write-notes|this step's notes]]"
    ],
    evidence: [
      "A link to your RACI or governance document, if you have one: [[do:add-link|add a link]]",
      "If the owners and approvers entered here are enough, [[do:waive-evidence|record that no evidence is needed]]"
    ],
    sources: [src('move', 'Microsoft structures the transition by audience: security architects, security engineers, security analysts'), src('mssp', 'MSSPs: establish clear timelines and expectations with customers before beginning')],
  }),
  k({
    tool: 'window',
    id: 'PREP-SCOPE-03', stage: 'prepare', workstream: 'scope', order: 30, kind: 'decision', criticality: 'critical',
    title: 'Set the transition window well before 31 March 2027',
    objective: 'Choose and approve a target date for connecting production workspaces. Leave time for testing, remediation and hypercare before Microsoft ends Azure portal support.',
    why: [
      'Microsoft states that customers still using Sentinel in the Azure portal will be redirected to the Defender portal.',
      'Moving on your own schedule lets you prepare automation, integrations and analysts, instead of absorbing the change unprepared.',
    ],
    where: [at(ORG, 'Project plan')],
    steps: [
      "Enter your planned window in **Do it here**. The planner shows how long each phase usually takes, and when to start so you reach the window in time.",
      "Check your organisation's change freezes (for example year-end) and avoid them.",
      "[[do:add-decision|Add the decision to the register]], with the name of the person who approved the window."
    ],
    expected: 'You have an approved window that ends comfortably before 31 March 2027.',
    record: [
      "The planned window: in **Do it here** (saved to [[go:window|Project setup]])",
      "Who approved it: [[do:add-decision|add the decision]] with their name",
      "Known freeze periods, in [[do:write-notes|this step's notes]]"
    ],
    evidence: ['The approved plan or change calendar entry: [[do:add-file|attach it]] or [[do:add-link|add a link]]'],
    sources: [src('defportal', 'Azure portal support until March 31, 2027; remaining customers redirected'), src('overview', 'Retirement timeline'), src('whatsnew', 'Date moved from July 2026 to March 31, 2027 in January 2026'), src('bestpractices', 'Still contains an outdated July 2026 bullet')],
    caveats: [
      'Microsoft does not document the redirect mechanism, or what happens on or after 31 March 2027 to workspaces that were never connected. Don\'t plan to rely on an automatic switch.',
      'Some Microsoft pages still mention July 2026. The current date in the main pages is 31 March 2027.',
    ],
  }),
  k({
    tool: 'connection',
    id: 'PREP-SCOPE-04', stage: 'prepare', workstream: 'scope', order: 40, kind: 'check', criticality: 'critical',
    title: 'Check whether any workspace is already connected to the Defender portal',
    objective: 'Find out whether Sentinel is already partly or fully in the Defender portal. Some customers were connected automatically.',
    why: [
      'Customers who onboarded their first Sentinel workspace on or after 1 July 2025 were connected to the Defender portal automatically. This applied when they had the required permissions and were not Azure Lighthouse-delegated users.',
      'If a primary workspace already exists, the behaviour changes are already in effect. Your plan then focuses on the remaining workspaces and on validation.',
    ],
    roles: [
      'Microsoft Sentinel Reader, to view Sentinel in the Defender portal',
      'The onboarding permissions, to see the workspace list for connecting (see [[PREP-ACC-01|the roles for connecting a workspace]])',
    ],
    where: [at(DP, 'https://security.microsoft.com > System > Settings > Microsoft Sentinel > Workspaces')],
    steps: [
      "Sign in to https://security.microsoft.com.",
      "Look for **Microsoft Sentinel** in the left navigation. If it's there, at least one workspace is connected.",
      "Open **System > Settings > Microsoft Sentinel**, then open the **Workspaces** page.",
      "In **Do it here**, set each workspace to **Not connected**, **Connected, primary** or **Connected, secondary**.",
      "If you only see **Connect a workspace**, no workspace is connected yet. Keep in mind that you only see the workspaces you have the required permissions for."
    ],
    expected: 'You have a clear list of connected workspaces, each marked primary or secondary, or confirmation that none are connected.',
    interpret: [
      outcome('No workspace connected', 'This is the normal starting point. Continue with the full plan.'),
      outcome('A primary workspace is already connected', 'The behaviour changes already apply to it. Note which workspace is primary and prioritise [[go:stage:validate|Stage 3 validation]] for it. Then plan the remaining workspaces as secondary, or [[PREP-TOP-02|decide whether to change the primary]].'),
      outcome('Unclear because of permissions', 'Ask an administrator with the [[PREP-ACC-01|onboarding roles]] to do this check.'),
    ],
    record: [
      "The connection state of each workspace: in **Do it here** (who checked and when is recorded for you when you set the status)"
    ],
    evidence: ['A screenshot of the Workspaces page: [[do:add-screenshot|attach it]]. Redact tenant and workspace IDs if your policy requires.'],
    sources: [src('overview', 'Automatic onboarding of new customers from July 2025 and its conditions'), src('onboard', 'Settings path, Workspaces page, permissions to see workspaces'), src('quickstart', 'Settings > Microsoft Sentinel > Workspaces')],
  }),
  k({
    id: 'PREP-SCOPE-05', stage: 'prepare', workstream: 'scope', order: 50, kind: 'check', criticality: 'high', applicability: q('sovereign_cloud'),
    title: 'Confirm cloud-specific availability and limitations',
    objective: 'Confirm that the capabilities you depend on are available in your government or sovereign cloud.',
    why: [
      'Some behaviours differ by cloud.',
      'For example, in GCC-M, advanced hunting queries that reference both Microsoft Sentinel and Defender tables are not supported.',
      'Microsoft Sentinel was retired in Azure operated by 21Vianet on 18 August 2026.',
    ],
    where: [at(ORG, 'Cloud environment documentation')],
    steps: [
      'Note the cloud for each tenant in scope in [[do:write-notes|this step\'s notes]].',
      {
        text: 'Review two Microsoft sources:',
        bullets: [
          'The known issues for advanced hunting with Sentinel data (the GCC-M limitation)',
          'The Sentinel geographical availability page',
        ],
      },
      'List any feature your SOC depends on that is limited in your cloud.',
      '[[do:add-risk|Add each one to the register as a risk]].',
    ],
    expected: 'Cloud-specific limitations are known and recorded.',
    record: [
      'The cloud for each tenant, in [[do:write-notes|this step\'s notes]]',
      'Limitations that affect you: [[do:add-risk|add a risk]] for each one',
    ],
    evidence: ['Notes with links to the relevant Microsoft pages: [[do:add-link|add each link]] or [[do:add-note|add a note]]'],
    sources: [src('ah', 'GCC-M: queries mixing Sentinel and Defender tables are not supported'), src('residency', 'Sentinel retired in Azure operated by 21Vianet on August 18, 2026'), src('whatsnew', 'May 2025: support for all government and commercial clouds became GA in the Defender portal')],
    caveats: ['Feature availability can differ per cloud and change over time. For critical capabilities, confirm with your Microsoft account team.'],
  }),

  // ───────────────────────── Workspaces and tenants ─────────────────────────
  k({
    tool: 'workspaces',
    id: 'PREP-TOP-01', stage: 'prepare', workstream: 'topology', order: 10, kind: 'check', criticality: 'critical',
    title: 'Inventory all Sentinel-enabled workspaces',
    objective: 'Build a complete list of the Sentinel workspaces in scope, with their subscription, resource group, region, environment and owner.',
    why: [
      'Each workspace is connected individually.',
      'One workspace per tenant becomes the primary, and several behaviours depend on whether a workspace is primary or secondary.',
      'Missing a workspace means missing its detections and automation.',
    ],
    roles: ['Read access on the subscriptions in scope'],
    where: [at(AP, 'Resource Graph Explorer'), at(AP, 'Microsoft Sentinel > workspace list')],
    steps: [
      {
        "text": "Find your Sentinel workspaces. Choose the way that suits your access:",
        "bullets": [
          "**In the portal:** open the Azure portal, search for **Microsoft Sentinel** and open it. The list shows the Sentinel workspaces you can read.",
          "**With a query:** run the Resource Graph query below. It searches every subscription you can read at once."
        ],
        "tip": "Both ways only show what you have permission to read. Check with the platform team that nothing is missing."
      },
      "Enter each workspace in **Do it here**: alias, environment, subscription, resource group, region and owner.",
      "Set whether each workspace is already connected to the Defender portal, from [[PREP-SCOPE-04|your check of connected workspaces]].",
      "Note any workspace you leave out of scope, and why, in [[do:write-notes|this step's notes]]."
    ],
    snippets: ['ARG_SENTINEL_WORKSPACES', 'PS_ONBOARDING_STATE'],
    expected: 'Every Sentinel workspace in scope is listed with its environment, region and owner.',
    interpret: [
      outcome('More workspaces than expected', 'Confirm whether each one is in scope. Forgotten workspaces often hold legacy rules.'),
      outcome('Workspaces in several tenants', 'Sentinel runs across more than one tenant. Answer **Yes** to the multi-tenant question in [[go:answers|your answers]], then complete [[PREP-TOP-05]].'),
    ],
    record: [
      "The workspace inventory: in **Do it here** (saved to [[go:environments|Project setup]] and used in your reports)",
      "Workspaces left out of scope, and why, in [[do:write-notes|this step's notes]]"
    ],
    evidence: [
      "If your policy asks for it, the CSV export of the query: [[do:add-file|attach it]]",
      "If the inventory entered here is enough, [[do:waive-evidence|record that no evidence is needed]]"
    ],
    sources: [src('multiws', 'One primary and any number of secondary workspaces per tenant'), src('argtypes', 'Resource Graph resource types'), src('roles', 'The SecurityInsights solution resource exists on Sentinel workspaces'), src('quickstart', 'Moving a workspace to another resource group or subscription after Sentinel deployment is not supported')],
    caveats: ['The makers of the assistant composed the Resource Graph query, and it was not run against a live tenant. Cross-check the result.'],
  }),
  k({
    tool: 'primary',
    id: 'PREP-TOP-02', stage: 'prepare', workstream: 'topology', order: 20, kind: 'decision', criticality: 'critical', applicability: q('multi_workspace'), testable: true,
    title: 'Decide which workspace will be primary',
    objective: 'Choose the primary workspace deliberately and record why.',
    why: [
      'Only the primary workspace\'s alerts are correlated with Defender XDR data, and all Defender XDR alerts and incidents sync to the primary only.',
      'Incidents in secondary workspaces do not include data from other workspaces or from Defender XDR.',
      'The Workbooks page shows only primary-workspace data, and custom detections and API queries are limited to the primary.',
      'The optional data lake must be in the primary\'s region.',
    ],
    roles: [
      'The security architect makes the decision',
      'Changing the primary later needs Security Administrator plus Owner, or User Access Administrator and Microsoft Sentinel Contributor',
    ],
    where: [at(ORG, 'Architecture decision'), at(DP, 'System > Settings > Microsoft Sentinel > Workspaces (to set or change the primary later)')],
    steps: [
      "Your workspaces from [[PREP-TOP-01|the inventory]] are listed in **Do it here**.",
      {
        "text": "Assess each candidate against the primary-only behaviours under **Why it matters**.",
        "tip": "Microsoft recommends considering the primary workspace for your global security operations centre."
      },
      {
        "text": "Identify which workspaces currently use the Defender XDR connector. This matters because:",
        "bullets": [
          "Workspaces previously connected to it are disconnected and become secondary.",
          "Their rules and automation based on Defender XDR data stop working until table ingestion is configured."
        ]
      },
      "Choose the primary workspace in **Do it here**.",
      {
        "text": "[[do:add-decision|Add the decision to the register]], with the rationale and the approver.",
        "tip": "You can change the primary later: Workspaces > select the workspace > Set as primary > Confirm and proceed. The Defender XDR connector then moves to the new primary automatically."
      }
    ],
    expected: 'Each tenant has one approved primary workspace, and the secondary workspaces and their impacts are listed.',
    record: [
      "The planned primary workspace: in **Do it here**",
      "The rationale and the approver: [[do:add-decision|add the decision]]",
      "Secondary workspaces and their impact, in [[do:write-notes|this step's notes]]"
    ],
    evidence: ['The decision record: [[do:add-decision|add it to the register]]'],
    sources: [src('multiws', 'Primary/secondary behaviours, connector moves, recommendation for global SOC'), src('onboard', 'Set as primary steps'), src('lakeonboard', 'Data lake must be in the same region as the primary workspace')],
  }),
  k({
    id: 'PREP-TOP-03', stage: 'prepare', workstream: 'topology', order: 30, kind: 'check', criticality: 'high', applicability: all(q('multi_workspace'), q('standalone_connectors')), testable: true,
    title: 'Find content that depends on standalone Microsoft connectors in secondary workspaces',
    objective: 'Find the analytics rules, workbooks and queries in secondary workspaces that rely on alerts from standalone Microsoft product connectors.',
    why: [
      'During connection, the standalone connectors for Defender for Office 365, Entra ID Protection, Defender for Cloud Apps, Defender for Endpoint and Defender for Identity are disconnected automatically in secondary workspaces.',
      'Queries, rules and workbooks relying on those alerts no longer work as expected.',
    ],
    roles: ['Microsoft Sentinel Reader on each workspace'],
    where: [at(AP, 'Each secondary workspace > Logs'), at(AP, 'Microsoft Sentinel > Data connectors')],
    steps: [
      'In each planned secondary workspace, run the SecurityAlert-by-product query.',
      'Note the products that come from standalone Microsoft connectors.',
      'Use the analytics rule scan (or your rule export) to find rules whose queries filter SecurityAlert on those products.',
      'List the affected rules, workbooks and saved queries.',
      {
        text: 'For each one, decide what to do:',
        bullets: [
          'Move the use case to the primary workspace.',
          'Configure Defender table ingestion for the secondary workspace: the Defender XDR connector in the Azure portal, or Microsoft Sentinel > Configuration > Tables in the Defender portal.',
          'Accept and retire it.',
        ],
      },
      'Also list any other standalone Microsoft connectors with alerts. Microsoft says to disconnect them before connecting.',
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Configuration > Data connectors** in each secondary workspace in the Azure portal. Select each Microsoft connector, then **Open connector page**: a connected connector shows the **Data received** graph and the status of its data types. This shows which connectors send data, not how many alerts each product sends. Standalone Defender connectors can still look connected after the Defender XDR connector is turned on in the same workspace, though no data flows through them.",
      "Export the analytics rules from **Microsoft Sentinel > Configuration > Analytics**: select the rules, then **Export**. The file includes each scheduled rule's query, so you can search it for SecurityAlert and the product names. Export works one page of rules at a time.",
    ],
    snippets: ['K_ALERTS_BY_PRODUCT', 'PS_ANALYTICS_SCAN'],
    expected: 'You have a list of dependent content for each secondary workspace, with a decision for each item.',
    record: [
      'Affected content per workspace: [[do:add-file|attach the list]]',
      'The decision for each item: [[do:add-decision|add it to the register]]',
    ],
    evidence: [
      'Query results as CSV: [[do:add-file|attach the file]]',
      'The decision list: [[do:add-file|attach it]]',
    ],
    sources: [src('move', 'Standalone connectors disconnected automatically in secondary workspaces'), src('multiws', 'Disconnect other standalone Microsoft connectors with alerts before onboarding; table ingestion options'), src('schemadiff', 'Rules and workbooks relying on those alerts in secondary workspaces no longer function as expected'), src('configconnector', 'Connector page shows the Data received graph and the connectivity status of its data types'), src('xdrconnector', 'Component connectors can still appear connected after the Defender XDR connector is enabled, with no data flowing through them'), src('exportrules', 'Export from the Analytics page; the file includes the query of scheduled rules; one page of rules at a time')],
  }),
  k({
    id: 'PREP-TOP-04', stage: 'prepare', workstream: 'topology', order: 40, kind: 'task', criticality: 'high', applicability: all(q('multi_workspace'), q('automation_rules')), testable: true,
    title: 'Plan to move automation rules to the workspace that will receive Defender XDR incidents',
    objective: 'Make sure automation that acts on Defender XDR incidents lives in the primary workspace.',
    why: 'Defender XDR data is ingested only into the primary workspace. Microsoft advises transferring automation rules to the relevant workspace to keep them running.',
    where: [at(AP, 'Microsoft Sentinel > Automation (each workspace)')],
    steps: [
      'From [[PREP-AUT-01|your automation rule inventory]], list the rules in secondary workspaces that act on Defender XDR incidents or alerts.',
      {
        text: 'Plan to recreate them in the primary workspace, and to disable the originals after validation.',
        tip: 'Export and import is available for automation rules.',
      },
      '[[do:add-action|Add each move to the register as an action]], with an owner.',
    ],
    portalWay: [
      "Open **Microsoft Sentinel > Configuration > Automation** in each secondary workspace and select the **Automation rules** tab. It lists every rule on the workspace, with its status and the analytics rules it applies to.",
      "Open each rule to read its trigger and conditions. An **Incident provider** condition set to **Microsoft 365 Defender** limits the rule to Defender XDR incidents.",
    ],
    snippets: ['PS_AUTOMATION_SCAN'],
    expected: 'You have a list of automation rules to move, each with an owner.',
    record: ['The rules to move and their target workspace: [[do:add-action|add an action]] for each one'],
    evidence: ['A list or export of the rules: [[do:add-file|attach it]]'],
    sources: [src('automation', 'Transfer automation rules to the relevant workspace; portal: Incident provider condition values Microsoft Sentinel and Microsoft 365 Defender'), src('multiws', 'Defender XDR alerts and incidents sync to the primary only'), src('exportauto', 'Automation rule export/import'), src('autorules', 'The Automation rules tab lists all rules on the workspace with their status and the analytics rules they apply to; rules can be opened and edited there')],
  }),
  k({
    id: 'PREP-TOP-05', stage: 'prepare', workstream: 'topology', order: 50, kind: 'decision', criticality: 'high', applicability: q('multi_tenant'), validation: 'needs-review', confidence: 'medium',
    title: 'Define the multi-tenant access model',
    objective: 'For each tenant, decide how analysts and partners will access Sentinel data in the Defender portal, and who will connect each workspace.',
    why: [
      'Each workspace must be connected in its own tenant.',
      'Access to Sentinel data in Microsoft Defender multitenant management (MTO) relies on Entra B2B (or governance relationships).',
      'Azure Lighthouse remains required for some cross-tenant queries.',
      'Microsoft pages currently disagree about GDAP support.',
    ],
    where: [at(DP, 'https://mto.security.microsoft.com (multitenant management)'), at(DP, 'System > Permissions > Delegated Access (governance relationships)')],
    steps: [
      {
        text: 'List the tenants in scope and today\'s access method for each one:',
        bullets: ['Azure Lighthouse', 'Entra B2B', 'GDAP', 'Governance relationships'],
      },
      'Plan to connect each workspace inside its own tenant, by someone with the [[PREP-ACC-01|onboarding roles]] in that tenant.',
      {
        text: 'For MTO, plan Entra B2B (or governance relationships) for Sentinel data.',
        tip: 'MTO supports up to 100 target tenants.',
      },
      'Sign in to MTO, select **Add tenants**, choose the tenants and select **Add**.',
      {
        text: 'Keep Azure Lighthouse where you need to:',
        bullets: [
          'Run cross-tenant queries with workspace().',
          'Query a secondary workspace in another tenant.',
        ],
      },
      'Don\'t rely on GDAP for Sentinel data until you have confirmed its status for your scenario with Microsoft (see **Watch out** below).',
      '[[do:add-decision|Add a decision to the register]] for the access model of each tenant.',
    ],
    expected: 'Each tenant has a documented, tested access model.',
    record: [
      'The access model per tenant: [[do:add-decision|add a decision]]',
      'Who connects each workspace, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: [
      'The decision record: [[do:add-decision|add it to the register]]',
      'A screenshot of the MTO tenant list once configured: [[do:add-screenshot|attach it]]',
    ],
    sources: [src('mto', 'Each workspace onboarded per tenant; Lighthouse needed for secondary workspaces in other tenants'), src('mtoreq', 'B2B for Sentinel data; 100 target tenant limit; Lighthouse for cross-tenant queries; GDAP not supported for Sentinel data'), src('govrel', 'Governance relationships and licensing'), src('onboard', 'GDAP with Azure Lighthouse not supported for Sentinel data in the Defender portal'), src('move', 'GDAP for Microsoft Sentinel described as in preview'), src('urbac', 'GDAP user group assignment described as supported in unified RBAC'), src('urbacactivate', 'GDAP user group assignment described as not supported in unified RBAC'), src('overview', 'Lighthouse-delegated users are not automatically onboarded'), src('mssp', 'MSSP guidance')],
    caveats: [
      'Microsoft pages conflict on GDAP (as of 2026-10-19). The onboarding page and the MTO requirements say "not supported". The transition guide says "in preview". Two unified RBAC pages say "supported in unified RBAC" and "not supported in unified RBAC". Treat GDAP support as unresolved.',
      'A community report (not Microsoft) describes failures when onboarding through Lighthouse delegation. Plan to onboard from within each customer tenant.',
    ],
  }),
  k({
    id: 'PREP-TOP-06', stage: 'prepare', workstream: 'topology', order: 60, kind: 'task', criticality: 'high', applicability: q('workspace_manager'),
    title: 'Replace workspace manager',
    objective: 'Choose and pilot a replacement for workspace manager content distribution.',
    why: [
      'Workspace manager is not available in the Defender portal.',
      'Microsoft lists two alternatives: deploying content as code from repositories, and multitenant management content distribution.',
    ],
    where: [at(AP, 'Microsoft Sentinel > Workspace manager (current configuration)'), at(DP, 'Microsoft Sentinel > Content management > Repositories'), at(DP, 'Multitenant management (content distribution)')],
    steps: [
      {
        text: 'Document what workspace manager distributes today:',
        bullets: ['Content types', 'Member workspaces', 'Frequency'],
      },
      'Evaluate repositories (content as code) and MTO content distribution against those needs.',
      'Pilot the chosen option with one non-critical content item.',
      '[[do:add-decision|Add the decision to the register]].',
      '[[do:add-action|Add a migration action]] for each content group.',
    ],
    expected: 'You have an approved, piloted replacement.',
    record: [
      'The current distribution scope, in [[do:write-notes|this step\'s notes]]',
      'The chosen replacement: [[do:add-decision|add the decision]]',
      'The pilot result, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: ['Pilot notes or a screenshot: [[do:add-note|add a note]] or [[do:add-screenshot|attach a screenshot]]'],
    sources: [src('move', 'Workspace Manager is not available in the Defender portal; alternatives'), src('defportal', 'Quick reference: Workspace manager not available'), src('wsmgr', 'Workspace manager is in preview'), src('xdrwhatsnew', 'MTO content distribution for analytics rules, automation rules and workbooks became GA (February 2026)'), src('cicd', 'Repositories')],
    caveats: ['The transition guide labels "deploy content as code from your repository" as public preview. What\'s new (March 2026) describes repositories as generally available. Check the current status before you rely on it.'],
  }),

  // ───────────────────────── Access and permissions ─────────────────────────
  k({
    id: 'PREP-ACC-01', stage: 'prepare', workstream: 'access', order: 10, kind: 'check', criticality: 'critical',
    title: 'Confirm the person who will connect the workspace has the required roles',
    objective: 'Check the onboarding operator\'s Entra and Azure roles before the change window.',
    why: [
      'For onboarding, Microsoft lists at least Security Administrator in Microsoft Entra ID, plus either an unconditional Owner role assignment at subscription scope, or User Access Administrator and Microsoft Sentinel Contributor.',
      'Workspaces you lack permissions for are not shown for onboarding.',
    ],
    roles: ['Entra ID: at least Security Administrator', 'Azure: Owner (unconditional, at subscription scope), or User Access Administrator plus Microsoft Sentinel Contributor'],
    where: [at(AP, 'Subscription > Access control (IAM) > Role assignments'), at('Microsoft Entra admin center', 'Roles and administrators')],
    steps: [
      'Identify the person (or break-glass or PIM role) who will connect the workspaces.',
      'In the Azure portal, open the subscription that contains each workspace, then open **Access control (IAM) > Role assignments**.',
      'Confirm the operator holds Owner, or User Access Administrator plus Microsoft Sentinel Contributor.',
      'If Owner is used, confirm the assignment is unconditional: no condition restricts which roles can be assigned.',
      {
        text: 'In the Entra admin center, confirm the operator holds Security Administrator (or a higher role), either directly or through a PIM activation planned for the change window.',
        tip: 'The same combination applies later, to [[PREP-TOP-02|change the primary workspace]] or to [[PREP-ACC-03|activate unified RBAC]].',
      },
    ],
    expected: 'The operator has the required roles for every workspace to be connected, or a PIM activation is planned.',
    interpret: [
      outcome('Owner with a condition', 'This is not sufficient for onboarding. Request an unconditional assignment, or use User Access Administrator plus Microsoft Sentinel Contributor.'),
      outcome('Roles missing', 'Request them in time, or nominate another authorised operator.'),
    ],
    record: ['In [[do:write-notes|this step\'s notes]]: the operator, their roles and scopes, and the PIM activation plan'],
    evidence: ['A screenshot of the role assignments, with identifiers redacted as required: [[do:add-screenshot|attach it]]'],
    remediation: [
      'Request the missing role assignment through your access process.',
      'For PIM, confirm the activation duration covers the change window.',
    ],
    sources: [src('onboard', 'Roles table for onboarding; unconditional Owner; workspaces without permissions not shown'), src('multiws', 'Roles for primary change and connecting secondary workspaces'), src('urbacmap', 'Security Architect persona permissions')],
    caveats: [
      'The onboarding page footnote suggests Security Administrator is required only when the tenant has more than one Sentinel workspace. The roles table lists it for all cases. The assistant treats it as required.',
      'The Azure IAM and Entra navigation paths are general administration paths, not taken from the transition documentation.',
    ],
  }),
  k({
    id: 'PREP-ACC-02', stage: 'prepare', workstream: 'access', order: 20, kind: 'task', criticality: 'high', testable: true,
    title: 'Map analyst roles for working in the Defender portal',
    objective: 'Make sure every SOC persona will have the access it needs in the Defender portal on day one.',
    why: [
      'Viewing Sentinel in the Defender portal requires Microsoft Sentinel Reader. Investigative actions require Microsoft Sentinel Contributor.',
      'Unified advanced hunting across Sentinel and Defender data needs at least Microsoft Sentinel Reader.',
      'Manual playbook runs need Microsoft Sentinel Playbook Operator.',
      'Defender XDR data has its own permissions.',
    ],
    where: [at(AP, 'Resource group or workspace > Access control (IAM)'), at(DP, 'System > Permissions')],
    steps: [
      {
        text: 'List your personas, for example:',
        bullets: ['Tier 1 triage', 'Tier 2 investigation', 'Incident responder', 'Detection engineer', 'Automation engineer', 'Read-only auditor'],
      },
      {
        text: 'For each persona, record which Sentinel Azure roles they need:',
        bullets: ['Reader', 'Responder', 'Contributor', 'Playbook Operator', 'Automation Contributor', 'Workbook Reader or Workbook Contributor'],
      },
      'For each persona, also record the Defender XDR permissions they need.',
      'Prefer assignments at resource-group scope. If you assign Sentinel roles at workspace scope, Microsoft notes they must also be assigned on the SecurityInsights solution resource.',
      'Plan a role test for each persona in Stage 3, in [[VAL-02|the persona test]].',
    ],
    expected: 'You have a role matrix that covers every persona.',
    record: ['The role matrix: [[do:add-file|attach it]]'],
    evidence: ['The role matrix document or table: [[do:add-file|attach it]] or [[do:add-link|add a link]]'],
    sources: [src('onboard', 'Roles to view Sentinel, query, and take actions in the Defender portal'), src('ah', 'Unified advanced hunting needs at least Microsoft Sentinel Reader'), src('runplaybooks', 'Playbook Operator for manual runs'), src('roles', 'Role definitions; resource-group scope and SecurityInsights solution note'), src('multiws', 'Primary-workspace access includes Defender XDR data')],
  }),
  k({
    id: 'PREP-ACC-03', stage: 'prepare', workstream: 'access', order: 30, kind: 'decision', criticality: 'high', validation: 'needs-review', confidence: 'medium', testable: true,
    title: 'Decide whether and when to use Defender unified RBAC for Sentinel',
    objective: 'Make an explicit decision about unified RBAC (URBAC) for Sentinel workspaces, and understand its limitations.',
    why: [
      'Once enabled, unified RBAC becomes the source of permissions for Sentinel in the Defender portal. Assignments sync to Azure RBAC.',
      'It does not support service principal assignments, and some Sentinel roles have no URBAC equivalent.',
      'Making permission changes in the Azure portal after URBAC is active may cause sync errors.',
    ],
    roles: ['Activation: Security Administrator plus Owner, or User Access Administrator and Microsoft Sentinel Contributor on the workspace'],
    where: [at(DP, 'System > Permissions > Microsoft Defender XDR > Roles (Activate workloads / Workload settings)'), at(DP, 'System > Settings > Microsoft Defender XDR > General > Permissions and roles')],
    steps: [
      'Check whether unified RBAC is already active in the tenant, and for which workloads.',
      {
        text: 'Review the role mapping:',
        bullets: [
          'Microsoft Sentinel Reader maps to "Defender Unified RBAC Reader".',
          'Responder maps to "Defender Unified RBAC Responder".',
          'Contributor maps to "Defender Unified RBAC Contributor and Responder".',
          'Playbook Operator, Automation Contributor and Workbook Contributor are not available in URBAC and stay in Azure.',
        ],
      },
      'List the service principals and managed identities with Sentinel roles, from [[PREP-ACC-06|your list of non-human identities]]. They must stay on Azure RBAC.',
      {
        text: 'Decide which way to go:',
        bullets: [
          'Keep Azure RBAC for now.',
          'Or activate URBAC per workspace after the transition. Microsoft requires per-workspace activation.',
        ],
        tip: 'Treat activation as its own change.',
      },
      'If you need row-level access (Sentinel scoping, in preview), note that it requires URBAC.',
      '[[do:add-decision|Add the decision to the register]], with its timing and owner.',
    ],
    expected: 'A recorded decision with its timing and owner.',
    record: [
      'The current URBAC state, in [[do:write-notes|this step\'s notes]]',
      'The decision and its timing: [[do:add-decision|add the decision]]',
      'Accounts that must stay on Azure RBAC, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: [
      'A screenshot of Permissions > Roles or the workload settings: [[do:add-screenshot|attach it]]',
      'The decision record: [[do:add-decision|add it to the register]]',
    ],
    sources: [src('urbac', 'URBAC for Sentinel workspaces, source of permissions, service principals unsupported, per-workspace activation, Global Administrator note'), src('urbacmap', 'Role mapping and roles not available in URBAC'), src('urbacactivate', 'Activation paths; Azure-portal permission changes may cause sync errors'), src('scoping', 'Row-level scoping requires URBAC (preview)'), src('multiws', 'Roles for activation')],
    caveats: [
      'No Microsoft page fetched on 2026-10-19 explicitly labels unified RBAC for Sentinel as generally available or preview.',
      'Unverified: a non-Microsoft blog reports a Message Center post (MC1457836) saying Microsoft may enable unified RBAC automatically for some tenants between late September and December 2026. Check your tenant\'s Message Center.',
    ],
  }),
  k({
    id: 'PREP-ACC-04', stage: 'prepare', workstream: 'access', order: 40, kind: 'check', criticality: 'high', applicability: q('granular_rbac'), validation: 'needs-review', confidence: 'medium', testable: true,
    title: 'Assess table-level and resource-context access restrictions',
    objective: 'Find the access restrictions that will not carry over to the Defender portal, and design compensating controls.',
    why: [
      'IdentityInfo becomes a native Defender table that does not support table-level RBAC. If you restrict IdentityInfo with table-level RBAC today, that control is no longer available.',
      'Microsoft does not document how other table-level or resource-context restrictions behave in the Defender portal.',
    ],
    where: [at(AP, 'Azure RBAC custom roles and table-level assignments'), at(ORG, 'IAM design documentation')],
    steps: [
      'List the custom roles and assignments that restrict access to specific tables, especially IdentityInfo.',
      'List the users or groups who rely on resource-context access: access to data through the resources they own, rather than the workspace.',
      {
        text: 'For each one, decide a compensating control, for example:',
        bullets: [
          'Scoping with unified RBAC (in preview, with limits)',
          'A different access design',
        ],
      },
      '[[do:add-decision|Record each compensating control as a decision]] in the register.',
      'Plan a test of the restricted personas in the [[go:stage:test|test stage]] or in [[go:stage:validate|Stage 3]].',
    ],
    expected: 'Each restriction has a documented outcome and compensating control.',
    record: [
      'The restrictions found, in [[do:write-notes|this step\'s notes]]',
      'Compensating controls: [[do:add-decision|add a decision]] for each one',
      'Risk acceptance where no control exists: [[do:add-exception|add an exception]]',
    ],
    evidence: [
      'The list of roles and assignments: [[do:add-file|attach it]]',
      'The decision record: [[do:add-decision|add it to the register]]',
    ],
    remediation: ['If a restriction cannot be preserved, [[do:add-risk|add a risk]] or [[do:add-exception|an exception]] to the register.'],
    sources: [src('move', 'IdentityInfo table-level RBAC no longer available'), src('scoping', 'Sentinel scoping limits: 100 scopes, ingestion-time transformation tables only, XDR tables unsupported, only newly ingested data tagged'), src('resourcectx', 'Resource-context access')],
    caveats: ['How table-level RBAC behaves for tables other than IdentityInfo, and how resource-context RBAC behaves in the Defender portal, is not documented. Validate it with a restricted test user.'],
  }),
  k({
    id: 'PREP-ACC-05', stage: 'prepare', workstream: 'access', order: 50, kind: 'task', criticality: 'medium',
    title: 'Protect the role assignments that the connection creates',
    objective: 'Make sure identity governance does not remove the role assignments that Microsoft creates during connection.',
    why: [
      'When you connect, Microsoft assigns Microsoft Sentinel Contributor to the "Microsoft Threat Protection" and "WindowsDefenderATP" apps in your subscription.',
      'Activating unified RBAC assigns User Access Administrator to the "MTP Unified RBAC" app.',
      'The optional data lake creates a managed identity that must keep its permissions.',
      'Automated clean-up of unexpected assignments could break the integration.',
    ],
    where: [at(ORG, 'Identity governance: access reviews, clean-up scripts, policy remediation')],
    steps: [
      'Tell the IAM or governance team which assignments to expect.',
      {
        text: 'Exclude these assignments from automated removal:',
        bullets: ['Access reviews', 'Scripts', 'Policy remediation'],
      },
      'Plan to verify after connection, in [[go:stage:validate|Stage 3]], that the assignments exist.',
    ],
    expected: 'The governance team is informed and the exclusions are in place.',
    record: [
      'Who was informed, in [[do:write-notes|this step\'s notes]]',
      'The exclusions configured, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: ['A ticket or email reference: [[do:add-link|add a link]] or [[do:add-note|add a note]]'],
    sources: [src('move', 'Sentinel Contributor assigned to Microsoft Threat Protection and WindowsDefenderATP apps'), src('urbac', 'User Access Administrator assigned to the MTP Unified RBAC app on activation'), src('lakeonboard', 'Data lake managed identity must keep its permissions')],
    caveats: ['Microsoft describes the scope only as "in your subscription".'],
  }),
  k({
    id: 'PREP-ACC-06', stage: 'prepare', workstream: 'access', order: 60, kind: 'check', criticality: 'medium', applicability: q('sp_roles'),
    title: 'List service principals and managed identities with Sentinel roles',
    objective: 'Know which non-human identities depend on Sentinel role assignments.',
    why: [
      'Service principal assignments are not supported in unified RBAC for Sentinel. Microsoft advises keeping Azure RBAC if you need them.',
      'Integrations that use these identities must keep working after the transition.',
    ],
    where: [at(AP, 'Resource group / workspace > Access control (IAM) > Role assignments (filter by type)')],
    steps: [
      'List the service principals and managed identities with Microsoft Sentinel roles.',
      'Map each one to the integration or automation that uses it.',
      'Note in [[do:write-notes|this step\'s notes]] that these must remain on Azure RBAC if [[PREP-ACC-03|unified RBAC]] is activated.',
    ],
    expected: 'You have a list of the identities, their roles and their owners.',
    record: ['Each identity, its roles and its owning integration: [[do:add-file|attach the list]]'],
    evidence: ['The exported role assignment list: [[do:add-file|attach it]]'],
    sources: [src('urbac', 'Service principal assignments not supported in URBAC; keep Azure RBAC'), src('urbacactivate', 'Service principal assignment not supported in unified RBAC')],
  }),

  // ───────────────────────── Data governance, compliance and cost ─────────────────────────
  k({
    id: 'PREP-GOV-01', stage: 'prepare', workstream: 'governance', order: 10, kind: 'check', criticality: 'high',
    title: 'Understand which data policies apply in the Defender portal',
    objective: 'Find out where Sentinel data is stored and processed once you work in the Defender portal, and which retention and privacy policies apply.',
    why: [
      'Microsoft states that when you use the Defender portal, Microsoft Defender XDR policies for storage, processing, retention and sharing apply, even when you work with Sentinel data.',
      'The raw log data storage location does not change, but the service might process data in Defender XDR regions.',
    ],
    where: [at(DP, 'Settings > Microsoft Defender XDR > Account (shows the Defender data storage location)'), at(AP, 'Log Analytics workspace > Overview (workspace region)')],
    steps: [
      'Note the region of each Sentinel workspace in [[do:write-notes|this step\'s notes]].',
      'In the Defender portal, open **Settings > Microsoft Defender XDR > Account**.',
      'Note the data storage location of the Defender tenant. It cannot be moved after creation.',
      'Read the Defender XDR data retention and security page, and the Sentinel data residency page.',
      {
        text: 'Note the retention and processing statements. On retention:',
        bullets: [
          'Defender data is retained for 180 days.',
          'Advanced hunting covers 30 days of native Defender data, unless it is streamed to Sentinel.',
        ],
      },
      'Summarise the differences that matter to your compliance team.',
      'If you have residency constraints, hand the summary to [[PREP-GOV-02|the compliance sign-off]].',
    ],
    expected: 'You have a short written comparison of storage and processing locations and retention.',
    record: [
      'Workspace regions, in [[do:write-notes|this step\'s notes]]',
      'The Defender tenant storage location, in [[do:write-notes|this step\'s notes]]',
      'Notable policy differences: [[do:add-note|add a summary note]]',
    ],
    evidence: [
      'A screenshot of the Defender account settings: [[do:add-screenshot|attach it]]',
      'The summary note: [[do:add-note|add it]]',
    ],
    sources: [src('move', 'Defender XDR policies apply instead, even with Sentinel data'), src('residency', 'Raw data storage location remains unchanged; processing may occur in Defender XDR regions'), src('xdrprivacy', 'Defender storage geographies, Account settings, 180-day retention, tenant cannot be moved'), src('ahoverview', '30 days of native Defender XDR data in advanced hunting')],
  }),
  k({
    id: 'PREP-GOV-02', stage: 'prepare', workstream: 'governance', order: 20, kind: 'decision', criticality: 'critical', applicability: q('data_residency'), provenance: 'practice', confidence: 'medium',
    title: 'Obtain compliance sign-off for data storage and processing',
    objective: 'Get documented approval from your data protection or compliance function that the Defender portal data policies meet your obligations.',
    why: [
      'Where regulation or contracts constrain data location or processing, using the Defender portal changes which policies apply.',
      'Proceeding without approval creates compliance risk.',
    ],
    where: [at(ORG, 'Data protection officer / compliance')],
    dependsOn: ['PREP-GOV-01'],
    steps: [
      'Share [[PREP-GOV-01|your data policy comparison]] with the data protection or compliance owner.',
      'Get their decision: approve, approve with conditions, or reject.',
      '[[do:add-decision|Add their decision to the register]], with their name, role and the date.',
      'If they reject or set conditions, [[do:add-action|add the conditions as actions]] or [[do:add-issue|add the risk as an issue]].',
    ],
    expected: 'You have a named, dated approval or a documented blocker.',
    record: [
      'The approver\'s name and role, in [[do:add-decision|the decision]]',
      'The decision and any conditions: [[do:add-decision|add the decision]], with conditions as [[do:add-action|actions]]',
    ],
    evidence: ['The approval email or the decision record: [[do:add-file|attach the email]] or [[do:add-decision|add the decision]]'],
    sources: [src('move', 'Defender XDR policies apply in the Defender portal'), src('xdrprivacy', 'Defender data policies'), src('residency', 'Sentinel data residency')],
  }),
  k({
    id: 'PREP-GOV-03', stage: 'prepare', workstream: 'governance', order: 30, kind: 'check', criticality: 'critical', applicability: q('cmk'), validation: 'needs-review', confidence: 'medium',
    title: 'Assess customer-managed key (CMK) implications',
    objective: 'Understand what remains protected by your keys after the transition, and obtain acceptance.',
    why: [
      'The transition guide states that workspace log data, analytics rules and other Sentinel content remain CMK-encrypted, but alerts and incidents will no longer be CMK-encrypted after onboarding.',
      'The CMK page states that operational data such as alerts and incidents use Microsoft-managed keys.',
      'The optional data lake does not support CMK, and CMK workspaces are not accessible via data lake experiences.',
    ],
    where: [at(ORG, 'Key management owner'), at(AP, 'Log Analytics dedicated cluster / CMK configuration')],
    steps: [
      'Confirm with the key-management owner which workspaces are CMK-protected.',
      'Share the two Microsoft statements with your compliance owner (see **Watch out** below).',
      '[[do:add-decision|Add the acceptance decision to the register]], with name, role and date.',
      'If CMK is a hard requirement for alerts and incidents, [[do:add-issue|record it as a blocking issue]].',
      'If you plan to use the data lake, note in [[do:write-notes|this step\'s notes]] that it does not support CMK.',
    ],
    expected: 'You have a documented acceptance or a blocking issue.',
    record: [
      'CMK workspaces, in [[do:write-notes|this step\'s notes]]',
      'The acceptance decision: [[do:add-decision|add the decision]]',
    ],
    evidence: ['The decision record: [[do:add-decision|add it to the register]]'],
    sources: [src('move', 'Alerts and incidents no longer CMK-encrypted after onboarding; other content remains CMK-encrypted'), src('cmk', 'What CMK protects; operational data uses Microsoft-managed keys'), src('lakeonboard', 'Data lake does not support CMK')],
    caveats: ['Microsoft\'s transition guide and CMK page describe alerts and incidents differently. Both indicate that alerts and incidents are not protected by your keys after the transition. Confirm with Microsoft if this matters for compliance.'],
  }),
  k({
    id: 'PREP-GOV-04', stage: 'prepare', workstream: 'governance', order: 40, kind: 'decision', criticality: 'medium', applicability: q('data_lake'), validation: 'needs-review', confidence: 'medium',
    title: 'Decide separately whether to onboard the Sentinel data lake',
    objective: 'Treat the data lake as an optional, separate decision with its own prerequisites and costs.',
    why: [
      'The data lake requires a primary workspace connected to the Defender portal, and must be in the primary\'s region.',
      'It automatically attaches all Defender-connected workspaces in that region.',
      'It cannot be offboarded without a support request, and it does not support CMK.',
      'It switches some billing meters (search jobs, auxiliary logs, long-term retention) to data lake meters that may increase costs.',
    ],
    roles: ['Direct subscription owner, for billing setup', 'Entra Global Administrator or Security Administrator'],
    where: [at(DP, 'Data lake onboarding (after the workspace is connected)')],
    steps: [
      'Confirm whether you already use the data lake.',
      {
        text: 'If you plan to use it, check:',
        bullets: [
          'Region support.',
          'That test and production workspaces in the same region will both be attached.',
        ],
      },
      {
        text: 'Check Azure Policy for blocks.',
        tip: 'Microsoft notes error DL103 and an exemption for Microsoft.SentinelPlatformServices/sentinelplatformservices.',
      },
      'Estimate the cost impact with your finance owner.',
      '[[do:add-decision|Add a separate go/no-go decision to the register]]. Don\'t bundle it with the portal transition unless that is planned.',
    ],
    expected: 'You have a recorded decision, independent of the portal transition.',
    record: [
      'The decision: [[do:add-decision|add it to the register]]',
      'The region, in [[do:write-notes|this step\'s notes]]',
      'The cost estimate owner, in [[do:write-notes|this step\'s notes]]',
    ],
    evidence: ['The decision record: [[do:add-decision|add it to the register]]'],
    sources: [src('lakeonboard', 'Prerequisites, region, automatic attachment, cannot offboard, CMK unsupported, policy exemption'), src('billing', 'Data lake billing meters'), src('lake', 'Data lake overview'), src('whatsnew', 'September 2026 changes for customers onboarding after 23 September 2026')],
    caveats: ['What\'s new (September 2026) says customers onboarding after 23 September 2026 enable the lake tier through Table management, and that retention "evolves" to data lake retention after Sentinel onboarding. It is unclear how this applies to existing customers who connect later. If cost predictability matters, confirm before connecting.'],
  }),
  k({
    id: 'PREP-GOV-05', stage: 'prepare', workstream: 'governance', order: 50, kind: 'check', criticality: 'medium',
    title: 'Confirm cost and retention expectations',
    objective: 'Confirm with finance and the SOC that the transition itself does not change Sentinel billing, and understand the optional cost drivers.',
    why: [
      'Microsoft states the transition has no extra cost.',
      'Defender XDR alerts and incidents synced to Sentinel are free, while raw Defender advanced hunting tables ingested into Sentinel are charged.',
      'Native Defender data is queryable for 30 days in advanced hunting without ingestion.',
    ],
    where: [at(ORG, 'Finance / cost owner')],
    steps: [
      'Confirm that no licence change is needed for the transition. Sentinel works in the Defender portal without Defender XDR or E5.',
      'If you plan to stream more Defender tables into Sentinel for longer retention or workbooks, estimate the ingestion cost.',
      'Record the outcome in [[do:write-notes|this step\'s notes]].',
    ],
    expected: 'Finance acknowledges the cost expectations.',
    record: ['The outcome and any planned ingestion changes, in [[do:write-notes|this step\'s notes]]'],
    evidence: ['A note or email: [[do:add-note|add a note]] or [[do:add-file|attach the email]]'],
    sources: [src('move', 'Transition has no extra cost'), src('xdrint', 'Defender XDR alerts and incidents free; raw tables charged'), src('defportal', 'Advanced hunting raw logs free for 30 days without ingestion; no E5 required'), src('billing', 'Sentinel pricing'), src('tiers', 'Data tiers: Defender XDR tables 30 days by default; supported tables extendable in the analytics tier')],
  }),

];
