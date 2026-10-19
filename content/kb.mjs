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
  version: '2026.10.19-rc1',
  lastReviewed: '2026-10-19',
  language: 'en',
  scope: 'Transitioning Microsoft Sentinel from the Azure portal to the Microsoft Defender portal: connecting Sentinel workspaces to the Defender portal and adapting access, data governance, connectors, detections, automation, integrations, content and SOC operations. Out of scope: migrating from another SIEM to Sentinel, Sentinel deployment from scratch, and detection engineering beyond what the transition requires.',
  method: 'Built from current Microsoft Learn documentation fetched and read on the review date, plus clearly labelled practical guidance. Conflicting or ambiguous official statements are marked "Needs review" and shown to the user.',
  limitations: [
    'The knowledge base reflects Microsoft documentation as read on the review date. Microsoft updates these pages frequently; re-verify critical steps before acting.',
    'Snippets were checked against documentation but not executed against a live customer tenant by the authors.',
    'Coverage is limited to the scope above and to the environment answers you give. It does not claim to cover every possible environment.',
  ],
};

export const STAGES = [
  { id: 'prepare', number: '1', title: 'Preparation and readiness', short: 'Prepare', purpose: 'Understand your environment, find what the transition changes for you, fix or accept the findings, and decide whether you are ready.', deliverable: 'Preparation / readiness report', reportKind: 'prepare' },
  { id: 'test', number: '1.5', title: 'Test validation (optional)', short: 'Test', purpose: 'If you have a suitable non-production environment, validate the riskiest assumptions before production.', deliverable: 'Test validation report', reportKind: 'test', optional: true },
  { id: 'transition', number: '2', title: 'Production transition', short: 'Transition', purpose: 'Execute the sequenced runbook with human checkpoints, and record exactly what was done, by whom and when.', deliverable: 'Transition execution report', reportKind: 'transition' },
  { id: 'validate', number: '3', title: 'Post-transition validation', short: 'Validate', purpose: 'Demonstrate that monitoring and response still work, document residual risks and hand over to operations.', deliverable: 'Final post-transition validation report', reportKind: 'validate' },
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
  { id: 'planning', stage: 'prepare', title: 'Transition planning, backup and rollback' },
  { id: 'test-setup', stage: 'test', title: 'Test set-up' },
  { id: 'test-execution', stage: 'test', title: 'Test execution' },
  { id: 'test-outcome', stage: 'test', title: 'Test outcome' },
  { id: 'pre-change', stage: 'transition', title: 'Pre-change checks' },
  { id: 'change', stage: 'transition', title: 'Change' },
  { id: 'post-change', stage: 'transition', title: 'Post-change verification' },
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
    { term: 'Transition (this tool)', meaning: 'Moving your SOC\'s day-to-day Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal, including the configuration and process changes that requires.', sources: ['move'] },
    { term: 'Connect / onboard a workspace', meaning: 'The technical step in Defender portal settings (System > Settings > Microsoft Sentinel > Connect a workspace) that makes a Sentinel-enabled Log Analytics workspace available in the Defender portal. Log data stays in Log Analytics.', sources: ['onboard', 'move'] },
    { term: 'Primary / secondary workspace', meaning: 'Each tenant has one primary workspace (correlated with Defender XDR data and receiving Defender XDR incidents) and any number of secondary workspaces.', sources: ['multiws'] },
    { term: 'Microsoft Defender XDR', meaning: 'Microsoft\'s extended detection and response products (for example Defender for Endpoint, Office 365, Identity, Cloud Apps) that share the Defender portal with Sentinel. Not required to use Sentinel in the Defender portal.', sources: ['defportal'] },
    { term: 'Unified security operations', meaning: 'Microsoft\'s term for running SIEM (Sentinel) and XDR in one portal with a unified incident queue, advanced hunting and entity pages.', sources: ['defportal'] },
    { term: 'What is not happening', meaning: 'Microsoft Sentinel is not being discontinued as a product; its Azure portal experience is. Connecting does not move your log data out of Log Analytics.', sources: ['defportal', 'move'] },
  ],
  keyDates: [
    { date: '2025-07-01', event: 'New customers onboarding their first Sentinel workspace (with Owner or User Access Administrator permissions, not Lighthouse-delegated) are automatically onboarded to the Defender portal.', sources: ['overview', 'whatsnew'] },
    { date: '2025-07-31', event: 'Ingestion into the legacy ThreatIntelligenceIndicator table stopped.', sources: ['ti'] },
    { date: '2026-03', event: 'Playbooks called directly from analytics rules (classic alert automation) deprecated.', sources: ['runplaybooks'] },
    { date: '2026-08-01', event: 'Microsoft Defender Threat Intelligence (standalone) reached end of life; capabilities available at no extra cost in the Defender portal.', sources: ['mdtieol', 'tiexplorer'] },
    { date: '2026-08-18', event: 'Microsoft Sentinel retired in Azure operated by 21Vianet.', sources: ['residency'] },
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
    { feature: 'Fusion rule', change: 'Disabled on connection; Defender XDR correlation replaces it.', sources: ['move', 'fusion'] },
    { feature: 'Microsoft incident creation rules', change: 'Deactivated on connection; not supported.', sources: ['move', 'xdrint'] },
    { feature: 'Alert-only analytics rules', change: 'Their alerts are not visible in the Defender portal.', sources: ['move'] },
    { feature: 'Incident provider', change: 'Always Microsoft XDR; the Incident provider automation condition is removed.', sources: ['move', 'automation'] },
    { feature: 'SecurityIncident Description', change: 'No longer included after connection.', sources: ['move'] },
    { feature: 'Updated by: Microsoft 365 Defender', change: 'Replaced by "Other" in existing automation rules.', sources: ['automation'] },
    { feature: 'Incident titles', change: 'May change when correlation applies; avoid titles in automation conditions.', sources: ['automation', 'corrsettings'] },
    { feature: 'Re-open closed matching incidents', change: 'Not available; new alerts create new incidents.', sources: ['createrules', 'move'] },
    { feature: 'Run playbook manually on an alert or entity', change: 'Not supported in the Defender portal (running on an incident is supported).', sources: ['move', 'runplaybooks'] },
    { feature: 'Add or remove alerts from incidents in playbooks', change: 'Not supported after connection.', sources: ['move', 'automation'] },
    { feature: 'Alert-trigger automation rules', change: 'Act only on Sentinel alerts; use the Enhanced Alert Trigger for Defender XDR alerts.', sources: ['automation'] },
    { feature: 'Automation timing', change: 'Up to 5 minutes for Defender incidents to integrate; up to 10 minutes before automation runs; updates within 5–10 minutes are batched.', sources: ['automation', 'move'] },
    { feature: 'Incidents created manually, by API or by playbooks', change: 'Not synchronised to the Defender portal.', sources: ['move'] },
    { feature: 'Editing comments', change: 'Not supported in the Defender portal; Azure-portal edits not synchronised.', sources: ['move'] },
    { feature: 'Similar incidents', change: 'Not supported in the Defender portal.', sources: ['move'] },
    { feature: 'Incident tasks', change: 'Available; tasks created in Sentinel sync one way; no automatic task creation in the Defender portal yet.', sources: ['tasksdefender'] },
    { feature: 'Create automation rule from an incident', change: 'Azure portal only.', sources: ['automation'] },
    { feature: 'Add entity to threat intelligence from incidents', change: 'Azure portal only.', sources: ['move'] },
    { feature: 'Workspace manager', change: 'Not available; use repositories or multitenant content distribution.', sources: ['move', 'defportal'] },
    { feature: 'IdentityInfo', change: 'Native Defender table in advanced hunting with renamed fields and no table-level RBAC; Sentinel rules and workbooks unaffected.', sources: ['move', 'ueba'] },
    { feature: 'Bookmarks', change: 'Not in advanced hunting; available under Microsoft Sentinel > Threat management > Hunting.', sources: ['ah'] },
    { feature: 'Livestream', change: 'No longer available.', sources: ['hunting'] },
    { feature: 'Workbooks', change: 'Continue to work; some visuals and print/PDF Azure-portal only; Workbooks page shows primary-workspace data only.', sources: ['move', 'workbooks', 'multiws'] },
    { feature: 'Data policies', change: 'Microsoft Defender XDR policies apply in the Defender portal, even to Sentinel data.', sources: ['move'] },
    { feature: 'Customer-managed keys', change: 'Alerts and incidents are not CMK-encrypted after connection (sources describe this differently).', sources: ['move', 'cmk'] },
    { feature: 'Connectors hidden in the Defender Data connectors page', change: 'Defender for Cloud Apps, Endpoint, Identity, Office 365, Defender XDR, and both Defender for Cloud connectors (still visible in the Azure portal).', sources: ['move'] },
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
