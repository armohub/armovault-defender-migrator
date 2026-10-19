// Tailoring questionnaire. Answers: yes / no / unknown ("I don't know — needs investigation") / na.
// "Unknown" never removes a check: dependent checks stay in scope as "applicability uncertain".
// `showIf` only controls whether a follow-up question is shown; it never hides checks.

export const QUESTION_SECTIONS = [
  { id: 'environment', title: 'Environment and scope', intro: 'Tenants, workspaces and what is already connected.' },
  { id: 'data', title: 'Data, compliance and connectors', intro: 'Where data lives, how it is protected, and which Microsoft connectors feed Sentinel.' },
  { id: 'detections', title: 'Detections and incidents', intro: 'How alerts become incidents today.' },
  { id: 'automation', title: 'Automation and integrations', intro: 'Automation rules, playbooks and systems that consume incidents.' },
  { id: 'access', title: 'Access and permissions', intro: 'How people and services get access to Sentinel data.' },
  { id: 'content', title: 'Content and analyst workflows', intro: 'Workbooks, hunting, threat intelligence and day-to-day analyst habits.' },
];

export const QUESTIONS = [
  // Environment
  { id: 'onboarded_any', section: 'environment', text: 'Is any Sentinel workspace in this tenant already connected to the Defender portal?',
    help: 'New customers who first enabled Sentinel on or after 1 July 2025 may have been connected automatically. Check Defender portal > System > Settings > Microsoft Sentinel > Workspaces.', sources: ['overview', 'onboard'] },
  { id: 'multi_workspace', section: 'environment', text: 'Is more than one Sentinel-enabled workspace in scope in this tenant?',
    help: 'The Defender portal supports one primary workspace and any number of secondary workspaces per tenant. Several behaviours differ between primary and secondary workspaces.', sources: ['multiws'] },
  { id: 'multi_tenant', section: 'environment', text: 'Do you operate Sentinel across more than one tenant (for example as an MSSP, or using Azure Lighthouse, Entra B2B, GDAP or governance relationships)?',
    help: 'Each workspace is connected separately in its own tenant. Cross-tenant access models have specific constraints in the Defender portal.', sources: ['mto', 'mtoreq'] },
  { id: 'sovereign_cloud', section: 'environment', text: 'Is any in-scope tenant in a government or sovereign cloud (for example GCC, GCC High, DoD, or Azure operated by 21Vianet)?',
    help: 'Some capabilities differ in these clouds (for example GCC-M cannot run queries mixing Sentinel and Defender tables).', sources: ['ah', 'residency'] },
  { id: 'defender_xdr', section: 'environment', text: 'Is Microsoft Defender XDR licensed and in use in this tenant (for example Defender for Endpoint, Office 365, Identity or Cloud Apps)?',
    help: 'Sentinel works in the Defender portal without Defender XDR or an E5 licence, but some capabilities are limited without Defender services.', sources: ['defportal', 'onboard'] },
  { id: 'test_env', section: 'environment', text: 'Do you have a non-production Sentinel environment that can be used to test the transition first?',
    help: 'Optional. Without one you can still transition; the plan adds compensating controls.', sources: [] },
  { id: 'test_separate_tenant', section: 'environment', showIf: { q: 'test_env' }, text: 'Is that test environment in a separate tenant from production?',
    help: 'Important: connecting a test workspace in the production tenant interacts with primary-workspace selection and the Defender XDR connector, which serve production.', sources: ['multiws', 'onboard'] },

  // Data
  { id: 'data_residency', section: 'data', text: 'Do regulatory, contractual or internal policies constrain where security data may be stored or processed?',
    help: 'When you use the Defender portal, Microsoft Defender XDR data policies apply, even to Sentinel data.', sources: ['move', 'xdrprivacy', 'residency'] },
  { id: 'cmk', section: 'data', text: 'Is any in-scope workspace protected with customer-managed keys (CMK)?', help: 'CMK workspaces have specific caveats for alerts, incidents and the data lake.', sources: ['move', 'cmk'] },
  { id: 'data_lake', section: 'data', text: 'Do you use, or plan to onboard, the Microsoft Sentinel data lake?',
    help: 'The data lake is optional for the transition and requires a primary workspace connected to the Defender portal. It has its own cost, region and CMK considerations.', sources: ['lakeonboard'] },
  { id: 'mdc', section: 'data', text: 'Do you bring Microsoft Defender for Cloud alerts or incidents into Sentinel?', help: 'Connector choice affects duplicate or empty incidents after the transition.', sources: ['onboard', 'mdcxdr'] },
  { id: 'standalone_connectors', section: 'data', text: 'Do any workspaces use standalone Microsoft product connectors (Defender for Endpoint, Defender for Office 365, Defender for Identity, Defender for Cloud Apps, Microsoft Entra ID Protection)?',
    help: 'These are replaced by the Defender XDR connector and are disconnected automatically in secondary workspaces.', sources: ['move', 'multiws'] },
  { id: 'irm', section: 'data', text: 'Do you use the Microsoft 365 Insider Risk Management connector?', help: 'It must be enabled on the primary workspace and disabled on secondary workspaces before you connect.', sources: ['onboard'] },

  // Detections
  { id: 'fusion', section: 'detections', text: 'Is the Fusion (Advanced multistage attack detection) rule enabled?', help: 'Fusion is disabled when you connect to the Defender portal.', sources: ['move', 'fusion'] },
  { id: 'ms_incident_rules', section: 'detections', text: 'Do you use Microsoft security incident creation rules?', help: 'They are deactivated on connection and are not supported in the Defender portal.', sources: ['move', 'xdrint'] },
  { id: 'alert_only_rules', section: 'detections', text: 'Do you have analytics rules with incident creation turned off (alert-only rules)?', help: 'Their alerts are not visible in the Defender portal.', sources: ['move'] },
  { id: 'grouping_dependency', section: 'detections', text: 'Do processes, automation or reports depend on alert grouping, incident titles, or reopening closed incidents?',
    help: 'Correlation can rename and merge incidents; "Re-open closed matching incidents" is not available after connection.', sources: ['corrsettings', 'createrules'] },
  { id: 'manual_incidents', section: 'detections', text: 'Do you create incidents manually, through the API, or from playbooks?', help: 'Such incidents are not synchronised to the Defender portal.', sources: ['move'] },

  // Automation
  { id: 'automation_rules', section: 'automation', text: 'Do you use automation rules?', help: 'Several automation conditions and behaviours change after connection.', sources: ['automation'] },
  { id: 'playbooks', section: 'automation', text: 'Do you use playbooks (Logic Apps)?', help: 'Some playbook actions and manual runs are not supported in the Defender portal.', sources: ['automation', 'runplaybooks'] },
  { id: 'manual_playbooks', section: 'automation', showIf: { q: 'playbooks' }, text: 'Do analysts run playbooks manually on alerts or entities?', help: 'Running a playbook manually on an alert or an entity is not supported in the Defender portal.', sources: ['move', 'runplaybooks'] },
  { id: 'itsm', section: 'automation', text: 'Are incidents synchronised to a ticketing/ITSM or SOAR system (for example ServiceNow or Jira)?', help: 'Incident description, provider name, title and URL fields change.', sources: ['move', 'automation'] },
  { id: 'api_consumers', section: 'automation', text: 'Do scripts, reports or tools read incidents through the Sentinel (SecurityInsights) API or the SecurityIncident table?', help: 'Response bodies and table fields change; Microsoft recommends Microsoft Graph for unified incidents and alerts.', sources: ['move'] },
  { id: 'cicd', section: 'automation', text: 'Do you deploy Sentinel content as code (repositories or CI/CD pipelines)?', help: 'Repositories are available in the Defender portal; review pipelines and API versions.', sources: ['cicd'] },
  { id: 'workspace_manager', section: 'automation', text: 'Do you use Sentinel workspace manager?', help: 'Workspace manager is not available in the Defender portal.', sources: ['move', 'defportal'] },

  // Access
  { id: 'urbac', section: 'access', text: 'Is Microsoft Defender unified RBAC active, or planned, for Sentinel workspaces?', help: 'Unified RBAC changes where Sentinel permissions are managed and has specific limitations.', sources: ['urbac'] },
  { id: 'granular_rbac', section: 'access', text: 'Do you restrict access with table-level or resource-context RBAC (for example on IdentityInfo)?', help: 'IdentityInfo becomes a native Defender table without table-level RBAC.', sources: ['move'] },
  { id: 'sp_roles', section: 'access', text: 'Do service principals or managed identities hold Sentinel roles for integrations or automation?', help: 'Unified RBAC does not support service principal assignments for Sentinel.', sources: ['urbac', 'urbacactivate'] },

  // Content
  { id: 'workbooks', section: 'content', text: 'Do you use workbooks?', help: 'Workbooks keep working, with some exceptions (primary-workspace data only, some visuals Azure-only).', sources: ['move', 'workbooks', 'multiws'] },
  { id: 'identityinfo', section: 'content', text: 'Do you run, or plan to run, hunting queries or custom detections in the Defender portal that use the IdentityInfo table?', help: 'The advanced hunting version of IdentityInfo renames or removes some fields. Sentinel analytics rules and workbooks are not affected.', sources: ['move', 'ueba'] },
  { id: 'hunting', section: 'content', text: 'Do analysts use hunting queries, bookmarks, livestream or notebooks?', help: 'Bookmarks stay under Microsoft Sentinel > Threat management > Hunting; livestream is no longer available.', sources: ['ah', 'hunting'] },
  { id: 'watchlists', section: 'content', text: 'Do you use watchlists?', help: 'Watchlists remain available under Microsoft Sentinel > Configuration > Watchlists.', sources: ['watchlists', 'defportal'] },
  { id: 'ti', section: 'content', text: 'Do you use threat intelligence in Sentinel (TI connectors, indicators, TI matching rules)?', help: 'TI management moves to the Defender threat intelligence pages; legacy TI table ingestion has stopped.', sources: ['ti', 'titransition'] },
  { id: 'ueba', section: 'content', text: 'Is UEBA (User and Entity Behavior Analytics) enabled?', help: 'UEBA largely remains the same; some data sources can only be enabled from the Defender portal.', sources: ['move', 'enableueba'] },
  { id: 'soc_workflows', section: 'content', text: 'Do analyst runbooks rely on incident tasks, similar incidents, editing comments, or creating automation rules from an incident?', help: 'These behave differently or are not available in the Defender portal.', sources: ['move', 'tasksdefender'] },
];
