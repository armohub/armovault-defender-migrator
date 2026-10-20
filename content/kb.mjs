// Knowledge base assembly. The UI renders this data; it contains no presentation code.
import { SOURCES } from './sources.mjs';
import { QUESTIONS, QUESTION_SECTIONS } from './questions.mjs';
import { SNIPPETS } from './snippets.mjs';
import { PREPARE } from './stage-prepare.mjs';
import { TEST } from './stage-test.mjs';
import { TRANSITION } from './stage-transition.mjs';
import { VALIDATE } from './stage-validate.mjs';

export const KB_META = {
  id: 'armohub.dma.kb',
  version: '2026.10.19',
  lastReviewed: '2026-10-19',
  language: 'en',
  scope: 'Moving Microsoft Sentinel from the Azure portal to the Microsoft Defender portal. That means connecting your Sentinel workspaces to the Defender portal, and adapting access, data governance, connectors, detections, automation, integrations, content and SOC operations. Out of scope: migrating to Sentinel from another SIEM, deploying Sentinel from scratch, and detection engineering beyond what the transition requires.',
  method: 'Built from current Microsoft Learn documentation, fetched and read on the review date, plus practical guidance that is clearly labelled as such. Where official statements conflict or are ambiguous, they are marked "Needs review" and shown to you.',
  limitations: [
    'The knowledge base reflects Microsoft documentation as read on the review date. Microsoft updates these pages often, so check critical steps again before you act.',
    'The authors checked the snippets against documentation but did not run them against a live customer tenant.',
    'Coverage is limited to the scope above and to the answers you give about your environment. It does not claim to cover every possible environment.',
  ],
};

export const STAGES = [
  { id: 'prepare', number: '1', title: 'Preparation and readiness', short: 'Prepare', purpose: 'Get to know your environment and find what the transition changes for you. Then fix or accept each finding, and decide whether you\'re ready.', deliverable: 'Preparation and readiness report', reportKind: 'prepare' },
  { id: 'test', number: '1.5', title: 'Test validation (optional)', short: 'Test', purpose: 'If you have a suitable non-production environment, use it to validate your riskiest assumptions before production.', deliverable: 'Test validation report', reportKind: 'test', optional: true },
  { id: 'transition', number: '2', title: 'Production transition', short: 'Transition', purpose: 'Work through the runbook in order, with human checkpoints. Record exactly what was done, by whom and when.', deliverable: 'Transition execution report', reportKind: 'transition' },
  { id: 'validate', number: '3', title: 'Post-transition validation', short: 'Validate', purpose: 'Show that monitoring and response still work, document the residual risks, and hand over to operations.', deliverable: 'Final post-transition validation report', reportKind: 'validate' },
];

export const WORKSTREAMS = [
  { id: 'scope', stage: 'prepare', title: 'Scope, governance and timeline' },
  { id: 'topology', stage: 'prepare', title: 'Workspaces and tenants' },
  { id: 'access', stage: 'prepare', title: 'Access and permissions' },
  { id: 'governance', stage: 'prepare', title: 'Data governance, compliance and cost' },
  { id: 'connectors', stage: 'prepare', title: 'Data connectors and ingestion' },
  { id: 'detections', stage: 'prepare', title: 'Analytics rules, correlation and incidents' },
  { id: 'automation', stage: 'prepare', title: 'Automation rules and playbooks' },
  { id: 'integrations', stage: 'prepare', title: 'Integrations and APIs' },
  { id: 'content', stage: 'prepare', title: 'Hunting, workbooks, threat intelligence and content' },
  { id: 'operations', stage: 'prepare', title: 'SOC operations and training' },
  { id: 'planning', stage: 'prepare', title: 'Planning, backup and rollback' },
  { id: 'test-setup', stage: 'test', title: 'Setting up the test' },
  { id: 'test-execution', stage: 'test', title: 'Running the tests' },
  { id: 'test-outcome', stage: 'test', title: 'Test outcome' },
  { id: 'pre-change', stage: 'transition', title: 'Checks before the change' },
  { id: 'change', stage: 'transition', title: 'The change' },
  { id: 'post-change', stage: 'transition', title: 'Checks after the change' },
  { id: 'platform', stage: 'validate', title: 'Platform and access' },
  { id: 'data', stage: 'validate', title: 'Data' },
  { id: 'detections', stage: 'validate', title: 'Detections and incidents' },
  { id: 'automation', stage: 'validate', title: 'Automation' },
  { id: 'integrations', stage: 'validate', title: 'Integrations' },
  { id: 'content', stage: 'validate', title: 'Content' },
  { id: 'operations', stage: 'validate', title: 'Operations' },
  { id: 'closure', stage: 'validate', title: 'Closure' },
];

// Reference material shown under Knowledge. Every entry cites sources.
export const REFERENCE = {
  // The stakeholder briefing on the first Prepare step: one email, written for the person who reads it.
  // Each change says what it is, then what it means for the reader. Every statement restates the cited
  // Microsoft Learn pages. skipWhenNo: left out when every listed question was answered No.
  briefing: {
    audiences: [
      {
        id: 'leadership', label: 'Security leadership', hint: 'CISO or security manager: impact, risk and the decisions needed.',
        subject: 'Microsoft Sentinel moves to the Defender portal: what it means for us',
        asksTitle: 'What we need from you',
        asks: [
          'Approve the change window, and confirm who approves the change itself.',
          'Ask compliance and data protection to review the data policy change described above.',
          'Make time for analyst training before the switch.',
        ],
      },
      {
        id: 'soc', label: 'SOC team', hint: 'SOC lead and analysts: how daily work changes.',
        subject: 'Microsoft Sentinel moves to the Defender portal: what changes for the SOC',
        asksTitle: 'What we need from you',
        asks: [
          'Tell us about automation, reports or integrations that rely on incident titles, descriptions or the incident provider.',
          'Join the Defender portal training, and review the updated runbooks before the switch.',
          'After the switch, report anything that looks different: missing or duplicate incidents, or automation that did not run.',
        ],
      },
      {
        id: 'client', label: 'A client we serve', hint: 'From a security service provider to a customer.',
        subject: 'Microsoft Sentinel moves to the Defender portal: what it means for you',
        intro: 'As your security service provider, we plan and run this move with you.',
        asksTitle: 'What we need from you',
        asks: [
          'Confirm the change window, and who on your side approves the change.',
          'Ask your compliance or data protection team to review the data policy change described above.',
          'Tell us about tools on your side that read incidents, such as ticketing or reporting.',
          'Tell us who on your side needs access to incidents in the Defender portal.',
        ],
      },
    ],
    intro: 'Sentinel itself stays. This is a move to a new portal and a new incident engine, not a new product and not a data migration.',
    inShort: 'detections keep running, log data stays where it is, and Microsoft charges nothing extra for the move. What changes is where analysts work and how alerts become incidents. We review and adjust that before the switch.',
    changes: [
      {
        what: 'Analysts work in the Microsoft Defender portal (security.microsoft.com) instead of the Azure portal.',
        meaning: 'Sentinel and Defender XDR incidents appear in one queue, and advanced hunting covers both. Menus, runbooks and habits change, so analysts get training and updated procedures before the switch.',
        sources: ['defportal', 'onboard'],
      },
      {
        what: 'The Defender XDR engine creates all incidents, and the Fusion rule is turned off.',
        meaning: 'Analytics rules keep running and raising alerts as they do today, and multistage attack detection continues: the Defender XDR correlation engine takes over from Fusion. Alert grouping and incident titles can differ from today, and closed incidents are not reopened: new alerts open a new incident. We set the grouping options and check what depends on titles before the switch.',
        sources: ['move', 'fusion', 'corrsettings'],
      },
      {
        what: 'Microsoft incident creation rules are turned off.',
        meaning: 'These rules detect nothing themselves. They only turned alerts from Microsoft security products, such as Defender for Endpoint, into Sentinel incidents. The Defender portal now does this itself, which avoids duplicate incidents, so no detection is lost. Where these rules filtered alerts, for example high severity only, we move that filter to alert tuning or automation rules. Without that, more alerts can become incidents.',
        sources: ['xdrint', 'createincidents', 'move'],
        skipWhenNo: ['ms_incident_rules'],
      },
      {
        what: 'Some automation rules and playbooks need changes.',
        meaning: 'Conditions on the incident provider, title or description no longer work as before, so a rule can run on the wrong incidents or not at all. Playbooks can no longer be run by hand on a single alert or entity, and automation can run up to 10 minutes after an alert. We review and fix every affected rule and playbook before the switch.',
        sources: ['automation', 'move'],
        skipWhenNo: ['automation_rules', 'playbooks'],
      },
      {
        what: 'Tools that read incidents, such as ticketing, reports or scripts, may need changes.',
        meaning: 'Every incident now has Microsoft XDR as its provider, the incident description is no longer included, and titles can differ. Incidents created by hand, through the API or by a playbook are not synchronised to the Defender portal. We check each integration end to end before the switch.',
        sources: ['move', 'automation'],
        skipWhenNo: ['itsm', 'api_consumers', 'manual_incidents'],
      },
      {
        what: 'A few investigation features work differently.',
        meaning: 'Similar incidents, editing comments and livestream are not available in the Defender portal. Bookmarks are under Microsoft Sentinel > Threat management > Hunting, not in advanced hunting. The updated runbooks cover each of these.',
        sources: ['move', 'ah', 'hunting'],
        audiences: ['soc'],
      },
      {
        what: 'Microsoft Defender XDR data policies apply to Sentinel data used in the Defender portal.',
        meaning: 'Raw log data stays where it is stored today. Alert and incident data may be processed in Defender XDR regions and follows Defender XDR retention. Where customer-managed keys (CMK) are in use, alerts and incidents are no longer encrypted with them. Compliance reviews this before the switch.',
        sources: ['move', 'residency', 'xdrprivacy', 'cmk'],
      },
    ],
    same: [
      { what: 'Microsoft Sentinel stays the SIEM.', meaning: 'Only its Azure portal experience is retired, not the product.', sources: ['defportal', 'overview'] },
      { what: 'Detections keep running.', meaning: 'Microsoft states that analytics rules work the same way. Their logic, schedules and the data they query do not change.', sources: ['move'] },
      { what: 'Log data stays in Log Analytics.', meaning: 'Connecting changes the portal, not how logs are stored.', sources: ['move'] },
      { what: 'No extra cost for the move.', meaning: 'Sentinel billing continues as today. The optional Sentinel data lake is a separate decision with its own billing.', sources: ['move', 'lakeonboard'] },
    ],
    fallback: { text: 'A workspace can be disconnected from the Defender portal again as a temporary fallback, but that does not undo every change the connection made. So we back up the configuration first and keep a written rollback plan.', sources: ['onboard'] },
    deadline: 'After 31 March 2027, Microsoft Sentinel is no longer supported in the Azure portal and is available only in the Defender portal.',
    closing: 'Questions, or something that depends on Sentinel that we should know about? Reply to this email.',
    sources: ['defportal', 'move', 'xdrint', 'overview'],
  },
  // What being primary or secondary means after connection. Shown in the primary workspace tool.
  workspaceRoles: {
    primary: [
      'Its alerts are correlated with Defender XDR data, and Defender XDR alerts and incidents sync to it.',
      'Custom detections, queries through the API and the Workbooks page work with this workspace only.',
      'Insider Risk Management alerts are correlated to it only.',
      'The optional data lake attaches only workspaces in the same region as this one.',
    ],
    secondary: [
      'Keeps running its own analytics rules and automation.',
      'Its incidents appear in the same unified queue, which you can filter by workspace.',
      'Its alerts are not correlated with Defender XDR data, or with other workspaces.',
      'Standalone Microsoft product connectors, such as Defender for Endpoint and Office 365, are disconnected automatically. It can still ingest Defender XDR tables.',
    ],
    shared: 'Global search, entity pages and SOC optimization combine data from all connected workspaces.',
    split: 'Only one can be primary. The others keep running as secondary workspaces, so splitting production does not stop any detection. The steps below explain where to put each rule if you split because of the analytics rule limit.',
    sources: ['multiws', 'correlation'],
  },
  // Planning ranges for the window planner. Practical guidance from the makers, not Microsoft guidance.
  planning: {
    note: 'Typical ranges from practice, not Microsoft guidance. Your timeline depends on the number of workspaces, tenants, automation rules, playbooks and integrations. Adjust them to your organisation.',
    phases: [
      { id: 'prepare', label: 'Prepare: find what changes, fix or accept it', smaller: [2, 4], larger: [4, 8] },
      { id: 'test', label: 'Test run (optional, if you have a test environment)', smaller: [1, 2], larger: [2, 3] },
      { id: 'approval', label: 'Change approval lead time', smaller: [1, 2], larger: [1, 3] },
      { id: 'hypercare', label: 'Watch closely after the change, then validate and sign off', smaller: [1, 2], larger: [2, 4] },
    ],
    change: 'The change itself: plan one attended working day. Connecting a workspace takes minutes; the rest of the day is for checks.',
    larger: 'Your answers suggest a larger environment (several workspaces or tenants, or playbooks), so the planner uses the longer ranges.',
    smaller: 'Your answers suggest a smaller environment, so the planner uses the shorter ranges.',
  },
  terminology: [
    { term: 'Transition (in this assistant)', meaning: 'Moving your SOC\'s day-to-day Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal, with the configuration and process changes that this requires.', sources: ['move'] },
    { term: 'Connect / onboard a workspace', meaning: 'The technical step that makes a Sentinel-enabled Log Analytics workspace available in the Defender portal. You take it in the Defender portal settings, under System > Settings > Microsoft Sentinel > Connect a workspace. Log data stays in Log Analytics.', sources: ['onboard', 'move'] },
    { term: 'Primary / secondary workspace', meaning: 'Each tenant has one primary workspace and any number of secondary workspaces. The primary workspace is correlated with Defender XDR data and receives Defender XDR incidents.', sources: ['multiws'] },
    { term: 'Microsoft Defender XDR', meaning: 'Microsoft\'s extended detection and response products, for example Defender for Endpoint, Office 365, Identity and Cloud Apps. They share the Defender portal with Sentinel. You don\'t need them to use Sentinel in the Defender portal.', sources: ['defportal'] },
    { term: 'Unified security operations', meaning: 'Microsoft\'s term for running SIEM (Sentinel) and XDR in one portal, with a unified incident queue, advanced hunting and entity pages.', sources: ['defportal'] },
    { term: 'What is not happening', meaning: 'Microsoft Sentinel is not being discontinued as a product. Only its Azure portal experience is. Connecting does not move your log data out of Log Analytics.', sources: ['defportal', 'move'] },
  ],
  keyDates: [
    { date: '2025-07-01', event: 'New customers who onboard their first Sentinel workspace are automatically onboarded to the Defender portal. This applies when they have Owner or User Access Administrator permissions and are not Lighthouse-delegated.', sources: ['overview', 'whatsnew'] },
    { date: '2025-07-31', event: 'Ingestion into the legacy ThreatIntelligenceIndicator table stopped.', sources: ['ti'] },
    { date: '2026-03', event: 'Playbooks called directly from analytics rules (classic alert automation) were deprecated.', sources: ['runplaybooks'] },
    { date: '2026-08-01', event: 'Microsoft Defender Threat Intelligence (standalone) reached end of life. Its capabilities are available at no extra cost in the Defender portal.', sources: ['mdtieol', 'tiexplorer'] },
    { date: '2026-08-18', event: 'Microsoft Sentinel was retired in Azure operated by 21Vianet.', sources: ['residency'] },
    { date: '2027-03-31', event: 'After this date, Microsoft Sentinel is no longer supported in the Azure portal and is available only in the Defender portal.', sources: ['defportal', 'overview'] },
  ],
  portalMap: [
    ['Overview', 'Overview'],
    ['Logs', 'Investigation & response > Hunting > Advanced hunting'],
    ['News & guides', 'Not available'],
    ['Search', 'Microsoft Sentinel > Search'],
    ['Incidents', 'Investigation & response > Incidents & alerts > Incidents'],
    ['Workbooks', 'Microsoft Sentinel > Threat management > Workbooks'],
    ['Hunting', 'Microsoft Sentinel > Threat management > Hunting'],
    ['Notebooks', 'Microsoft Sentinel > Threat management > Notebooks'],
    ['Entity behavior', 'Assets > Identities or Devices > {entity} > Sentinel events'],
    ['Threat intelligence', 'Threat intelligence > Intel management (newer Defender pages: Overview / Intel explorer)'],
    ['MITRE ATT&CK', 'Microsoft Sentinel > Threat management > MITRE ATT&CK'],
    ['Content hub', 'Microsoft Sentinel > Content management > Content hub'],
    ['Repositories', 'Microsoft Sentinel > Content management > Repositories'],
    ['Community', 'Microsoft Sentinel > Content management > Community'],
    ['Workspace manager', 'Not available'],
    ['Data connectors', 'Microsoft Sentinel > Configuration > Data connectors'],
    ['Analytics', 'Microsoft Sentinel > Configuration > Analytics, and Investigation & response > Hunting > Custom detection rules'],
    ['Watchlists', 'Microsoft Sentinel > Configuration > Watchlists'],
    ['Automation', 'Microsoft Sentinel > Configuration > Automation'],
    ['Settings', 'System > Settings > Microsoft Sentinel'],
  ],
  portalMapSources: ['defportal', 'titransition'],
  featureChanges: [
    { feature: 'Fusion rule', change: 'Disabled when you connect. Defender XDR correlation replaces it.', sources: ['move', 'fusion'] },
    { feature: 'Microsoft incident creation rules', change: 'Deactivated when you connect, and not supported.', sources: ['move', 'xdrint'] },
    { feature: 'Alert-only analytics rules', change: 'Their alerts are not visible in the Defender portal.', sources: ['move'] },
    { feature: 'Incident provider', change: 'Always Microsoft XDR. The Incident provider automation condition is removed.', sources: ['move', 'automation'] },
    { feature: 'SecurityIncident Description', change: 'No longer included after connection.', sources: ['move'] },
    { feature: 'Updated by: Microsoft 365 Defender', change: 'Replaced by "Other" in existing automation rules.', sources: ['automation'] },
    { feature: 'Incident titles', change: 'May change when correlation applies, so avoid titles in automation conditions.', sources: ['automation', 'corrsettings'] },
    { feature: 'Re-open closed matching incidents', change: 'Not available. New alerts create new incidents.', sources: ['createrules', 'move'] },
    { feature: 'Run playbook manually on an alert or entity', change: 'Not supported in the Defender portal. Running a playbook on an incident is supported.', sources: ['move', 'runplaybooks'] },
    { feature: 'Add or remove alerts from incidents in playbooks', change: 'Not supported after connection.', sources: ['move', 'automation'] },
    { feature: 'Alert-trigger automation rules', change: 'Act only on Sentinel alerts. For Defender XDR alerts, use the Enhanced Alert Trigger.', sources: ['automation'] },
    { feature: 'Automation timing', change: 'Defender incidents take up to 5 minutes to integrate, and it can be up to 10 minutes before automation runs. Updates within 5 to 10 minutes are batched.', sources: ['automation', 'move'] },
    { feature: 'Incidents created manually, by API or by playbooks', change: 'Not synchronised to the Defender portal.', sources: ['move'] },
    { feature: 'Editing comments', change: 'Not supported in the Defender portal, and edits made in the Azure portal are not synchronised.', sources: ['move'] },
    { feature: 'Similar incidents', change: 'Not supported in the Defender portal.', sources: ['move'] },
    { feature: 'Incident tasks', change: 'Available. Tasks created in Sentinel sync one way, and the Defender portal has no automatic task creation yet.', sources: ['tasksdefender'] },
    { feature: 'Create automation rule from an incident', change: 'Azure portal only.', sources: ['automation'] },
    { feature: 'Add entity to threat intelligence from incidents', change: 'Azure portal only.', sources: ['move'] },
    { feature: 'Workspace manager', change: 'Not available. Use repositories or multitenant content distribution instead.', sources: ['move', 'defportal'] },
    { feature: 'IdentityInfo', change: 'A native Defender table in advanced hunting, with renamed fields and no table-level RBAC. Sentinel rules and workbooks are not affected.', sources: ['move', 'ueba'] },
    { feature: 'Bookmarks', change: 'Not in advanced hunting. They are available under Microsoft Sentinel > Threat management > Hunting.', sources: ['ah'] },
    { feature: 'Livestream', change: 'No longer available.', sources: ['hunting'] },
    { feature: 'Workbooks', change: 'Continue to work. Some visuals, and print or PDF, are Azure portal only. The Workbooks page shows primary-workspace data only.', sources: ['move', 'workbooks', 'multiws'] },
    { feature: 'Data policies', change: 'Microsoft Defender XDR policies apply in the Defender portal, even to Sentinel data.', sources: ['move'] },
    { feature: 'Customer-managed keys', change: 'Alerts and incidents are not CMK-encrypted after connection. The sources describe this differently.', sources: ['move', 'cmk'] },
    { feature: 'Connectors hidden in the Defender Data connectors page', change: 'Defender for Cloud Apps, Endpoint, Identity, Office 365, Defender XDR, and both Defender for Cloud connectors. They are still visible in the Azure portal.', sources: ['move'] },
  ],
};

function buildKb() {
  return {
    meta: KB_META,
    stages: STAGES,
    workstreams: WORKSTREAMS,
    questionSections: QUESTION_SECTIONS,
    questions: QUESTIONS,
    sources: SOURCES,
    snippets: SNIPPETS,
    checks: [...PREPARE, ...TEST, ...TRANSITION, ...VALIDATE],
    reference: REFERENCE,
  };
}

export const KB = buildKb();
