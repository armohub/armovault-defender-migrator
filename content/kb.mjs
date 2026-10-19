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
