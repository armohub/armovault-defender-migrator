// Import-based assistance: analyse the JSON produced by tools/Get-ArMoSentinelInventory.ps1.
// The file is untrusted input. Values are coerced, capped and only ever rendered as text.
// Output: findings mapped to knowledge-base items (become "imported" evidence notes when the user accepts them),
// evidence per question, and Yes suggestions for this workspace. Across the workspaces in scope, suggestAnswers()
// turns the evidence into answers: Yes when any workspace shows it, No only when every in-scope workspace was read
// for that part and none has it. The absence of a finding in one workspace is never turned into a "No" on its own.

import { isPlainObject } from './util.js';

export const INVENTORY_SCHEMA = 'armohub.dma.inventory';
export const MAX_INVENTORY_BYTES = 5 * 1024 * 1024;

// The questions the import can suggest an answer for, in questionnaire order, and those it can also answer No.
export const INVENTORY_QUESTIONS = ['multi_workspace', 'multi_tenant', 'sovereign_cloud', 'defender_xdr', 'test_env', 'test_separate_tenant', 'cmk', 'mdc', 'standalone_connectors', 'irm',
  'fusion', 'ms_incident_rules', 'alert_only_rules', 'grouping_dependency', 'automation_rules', 'playbooks', 'itsm', 'api_consumers', 'cicd', 'workspace_manager', 'granular_rbac', 'sp_roles',
  'workbooks', 'hunting', 'watchlists', 'ti', 'ueba', 'soc_workflows'];
export const YES_OR_NO_QUESTIONS = ['multi_workspace', 'test_separate_tenant', 'standalone_connectors', 'irm', 'fusion', 'ms_incident_rules', 'alert_only_rules', 'automation_rules',
  'workspace_manager', 'sp_roles', 'watchlists', 'ueba'];

const PARTS = ['analyticsRules', 'automationRules', 'dataConnectors', 'watchlists', 'onboarding', 'settings', 'workspaceManager', 'repositories', 'bookmarks', 'hunts', 'installedContent', 'logicApps', 'access'];
const CLOUDS = ['AzureCloud', 'AzureUSGovernment', 'AzureChinaCloud'];
const SOVEREIGN = { AzureUSGovernment: 'Azure Government', AzureChinaCloud: 'Azure operated by 21Vianet' };

const str = (v, max = 300) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const bool = (v) => (v === true ? true : v === false ? false : null);
const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const plain = (v) => (isPlainObject(v) ? v : {});
const count = (v) => Math.max(0, Math.min(1000000, Math.floor(Number(v) || 0)));

// Standalone Microsoft connector kinds in the SecurityInsights dataConnectors API that the Defender XDR connector replaces.
const STANDALONE_KINDS = {
  MicrosoftDefenderAdvancedThreatProtection: 'Microsoft Defender for Endpoint',
  AzureAdvancedThreatProtection: 'Microsoft Defender for Identity',
  MicrosoftCloudAppSecurity: 'Microsoft Defender for Cloud Apps',
  OfficeATP: 'Microsoft Defender for Office 365',
  AzureActiveDirectory: 'Microsoft Entra ID Protection (connector kind AzureActiveDirectory)',
};
const DEFENDER_KINDS = ['MicrosoftThreatProtection', 'MicrosoftDefenderAdvancedThreatProtection', 'AzureAdvancedThreatProtection', 'MicrosoftCloudAppSecurity', 'OfficeATP'];
const TI_KINDS = ['ThreatIntelligence', 'ThreatIntelligenceTaxii', 'MicrosoftThreatIntelligence', 'PremiumMicrosoftDefenderForThreatIntelligence'];

export function parseInventory(text) {
  let obj;
  try { obj = JSON.parse(String(text).replace(/^﻿/, '')); } catch { throw new Error('The file is not valid JSON.'); }
  if (!isPlainObject(obj) || obj.schema !== INVENTORY_SCHEMA) throw new Error('This is not an inventory file produced by Get-ArMoSentinelInventory.ps1 (schema identifier missing).');
  const version = Number(obj.schemaVersion);
  if (version !== 1 && version !== 2) throw new Error(`Unsupported inventory schema version ${str(obj.schemaVersion, 10)}.`);
  const limit = (list, name) => { if (list.length > 10000) throw new Error(`Too many ${name} entries.`); return list.filter(isPlainObject); };
  const ws = plain(obj.workspace);
  const errors = arr(obj.errors).map((e) => str(e, 300)).slice(0, 50);
  // Version 1 files have only the first four parts; a part counts as collected when none of its requests failed.
  const failedV1 = (type) => errors.some((e) => e.includes(type));
  const c = plain(obj.collected);
  const collected = Object.fromEntries(PARTS.map((p) => [p, version === 2 ? c[p] === true
    // Version 1 read data connectors from the stable API only, which lacks kinds such as OfficeIRM and OfficeATP.
    : ({ analyticsRules: !failedV1('alertRules'), automationRules: !failedV1('automationRules'), dataConnectors: false, watchlists: !failedV1('watchlists') })[p] === true]));
  const settings = plain(obj.settings);
  const manager = plain(obj.workspaceManager);
  const repos = plain(obj.repositories);
  const installed = plain(obj.installedContent);
  const access = plain(obj.access);
  return {
    schemaVersion: version,
    collectedAt: str(obj.collectedAt, 40),
    alias: str(ws.alias, 120),
    region: str(ws.region, 80),
    tenantRef: /^t-[0-9a-f]{8}$/.test(ws.tenantRef) ? ws.tenantRef : '',
    delegated: ws.delegated === true,
    cloud: CLOUDS.includes(ws.cloud) ? ws.cloud : '',
    customerManagedKey: bool(ws.customerManagedKey),
    tool: isPlainObject(obj.tool) ? `${str(obj.tool.name, 80)} ${str(obj.tool.version, 20)}`.trim() : '',
    analyticsRules: limit(arr(obj.analyticsRules), 'analytics rule').map((r) => ({
      name: str(r.name), kind: str(r.kind, 60), enabled: bool(r.enabled), createIncident: bool(r.createIncident), groupingEnabled: bool(r.groupingEnabled),
      reopenClosed: bool(r.reopenClosed), correlationTag: str(r.correlationTag, 20), usesIdentityInfo: r.usesIdentityInfo === true, usesLegacyTI: r.usesLegacyTI === true,
      usesTI: r.usesTI === true || r.usesLegacyTI === true, productFilter: str(r.productFilter, 120), apiVersion: str(r.apiVersion, 30),
    })),
    automationRules: limit(arr(obj.automationRules), 'automation rule').map((a) => ({
      name: str(a.name), enabled: bool(a.enabled), triggersOn: str(a.triggersOn, 30), triggersWhen: str(a.triggersWhen, 30),
      riskyConditions: arr(a.riskyConditions).map((x) => str(x, 60)).filter((x) => ['IncidentProviderName', 'IncidentTitle', 'IncidentDescription', 'IncidentUpdatedBySource'].includes(x)),
      playbookActions: Math.max(0, Math.min(1000, Number(a.playbookActions) || 0)), taskActions: Math.max(0, Math.min(1000, Number(a.taskActions) || 0)),
    })),
    dataConnectors: limit(arr(obj.dataConnectors), 'data connector').map((x) => ({ kind: str(x.kind, 80), name: str(x.name, 200) })),
    watchlists: limit(arr(obj.watchlists), 'watchlist').map((w) => ({ alias: str(w.alias, 120), name: str(w.name, 200) })),
    settings: { ueba: settings.ueba === true, entityAnalytics: settings.entityAnalytics === true, anomalies: settings.anomalies === true },
    workspaceManager: { enabled: manager.enabled === true, members: count(manager.members) },
    repositories: { count: count(repos.count), huntingQueries: repos.huntingQueries === true },
    bookmarks: count(obj.bookmarks),
    hunts: count(obj.hunts),
    installedContent: { workbooks: count(installed.workbooks), playbooks: count(installed.playbooks) },
    sentinelPlaybooks: limit(arr(plain(obj.logicApps).sentinelPlaybooks), 'playbook').map((p) => ({ name: str(p.name), ticketing: p.ticketing === true })),
    access: { spWithSentinelRoles: count(access.spWithSentinelRoles), spWithReadOnlyRoles: count(access.spWithReadOnlyRoles), tableLevelRestrictions: count(access.tableLevelRestrictions) },
    collected,
    errors,
  };
}

const list = (items, fmt, max = 40) => {
  const lines = items.slice(0, max).map((x) => `• ${fmt(x)}`);
  if (items.length > max) lines.push(`• …and ${items.length - max} more`);
  return lines.join('\n');
};

const isStandalone = (kind) => Object.prototype.hasOwnProperty.call(STANDALONE_KINDS, kind);

export function analyseInventory(inv) {
  const label = `${inv.alias || 'workspace'} (collected ${inv.collectedAt || 'unknown time'})`;
  const where = inv.alias || 'this workspace';
  // Which collections failed? The script reports "GET <resourceType> returned HTTP <code>".
  const failed = (type) => inv.errors.some((e) => e.includes(type));
  const failNote = (type) => (failed(type) ? `\n\nWARNING: collecting ${type} failed (${inv.errors.filter((e) => e.includes(type)).join('; ')}). These results are incomplete. Do not treat missing entries as absent.` : '');
  const header = `Imported from ${inv.tool || 'inventory script'} output for ${label}. Values were computed by the read-only script; review them before relying on them.`;
  const findings = [];
  const add = (checkId, title, body) => findings.push({ checkId, title: `Imported inventory: ${title}`, text: `${header}\n\n${body}` });
  // Evidence per question: found (with the reason shown to you), and checked (the part was read completely).
  const evidence = {};
  const ev = (questionId, found, reason, checked = false) => { evidence[questionId] = { found: !!found, checked: !!checked, reason: found ? `${reason} in ${where}` : '' }; };
  const got = inv.collected;

  const rules = inv.analyticsRules;
  const enabled = rules.filter((r) => r.enabled !== false);
  const kinds = {};
  for (const r of rules) kinds[r.kind || 'unknown'] = (kinds[r.kind || 'unknown'] || 0) + 1;
  add('PREP-DET-01', `${rules.length} analytics rules${failed('alertRules') ? ' (collection incomplete)' : ''}`, `Rules by kind: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}.\nEnabled: ${enabled.length}. Disabled: ${rules.length - enabled.length}.${inv.errors.length ? `\nRequests that failed during collection: ${inv.errors.join('; ')}` : ''}`);

  const fusion = enabled.filter((r) => r.kind === 'Fusion');
  if (fusion.length) add('PREP-DET-02', 'Fusion rule enabled', list(fusion, (r) => r.name));
  ev('fusion', fusion.length, 'Fusion rule enabled', got.analyticsRules);
  const msic = enabled.filter((r) => r.kind === 'MicrosoftSecurityIncidentCreation');
  if (msic.length) add('PREP-DET-03', `${msic.length} Microsoft incident creation rule(s) enabled`, list(msic, (r) => `${r.name}${r.productFilter ? ` (product: ${r.productFilter})` : ''}`));
  ev('ms_incident_rules', msic.length, `${msic.length} Microsoft incident creation rule(s) enabled`, got.analyticsRules);
  const alertOnly = enabled.filter((r) => r.createIncident === false);
  if (alertOnly.length) add('PREP-DET-04', `${alertOnly.length} alert-only rule(s)`, list(alertOnly, (r) => `${r.name} (${r.kind})`));
  ev('alert_only_rules', alertOnly.length, `${alertOnly.length} alert-only rule(s)`, got.analyticsRules);
  const reopen = enabled.filter((r) => r.reopenClosed === true);
  const grouping = enabled.filter((r) => r.groupingEnabled === true);
  const tags = rules.filter((r) => r.correlationTag);
  if (reopen.length || grouping.length || tags.length) {
    add('PREP-DET-05', 'grouping, reopen and correlation settings', [
      `Alert grouping enabled: ${grouping.length} rule(s).`, grouping.length ? list(grouping, (r) => r.name, 25) : '',
      `"Re-open closed matching incidents" enabled: ${reopen.length} rule(s). This option is not available after connection.`, reopen.length ? list(reopen, (r) => r.name, 25) : '',
      `Correlation tags in descriptions: ${tags.length}.`, tags.length ? list(tags, (r) => `${r.name}: ${r.correlationTag}`, 25) : '',
    ].filter(Boolean).join('\n'));
  }
  const legacyTi = rules.filter((r) => r.usesLegacyTI);
  if (legacyTi.length) add('PREP-CNT-05', `${legacyTi.length} rule(s) query the legacy ThreatIntelligenceIndicator table`, list(legacyTi, (r) => r.name));

  const autos = inv.automationRules;
  ev('automation_rules', autos.length, `${autos.length} automation rule(s)`, got.automationRules);
  const risky = autos.filter((a) => a.riskyConditions.length);
  if (risky.length || !failed('automationRules')) {
    add('PREP-AUT-01', `${risky.length} of ${autos.length} automation rule(s) use conditions that change`, (risky.length ? list(risky, (a) => `${a.name}: ${a.riskyConditions.join(', ')}${a.enabled === false ? ' (disabled)' : ''}`) : 'No automation rule uses Incident provider, title, description or "Updated by" conditions (string screening of the condition definitions).') + failNote('automationRules'));
  }
  const titleConditions = autos.filter((a) => a.riskyConditions.includes('IncidentTitle'));
  ev('grouping_dependency', reopen.length || titleConditions.length, [reopen.length ? `${reopen.length} rule(s) reopen closed incidents` : '', titleConditions.length ? `${titleConditions.length} automation rule(s) test the incident title` : ''].filter(Boolean).join(', '));
  const alertTrig = autos.filter((a) => a.triggersOn === 'Alerts');
  if (alertTrig.length) add('PREP-AUT-02', `${alertTrig.length} alert-trigger automation rule(s)`, `In the Defender portal these act only on Microsoft Sentinel alerts.\n${list(alertTrig, (a) => a.name)}`);
  const pb = autos.filter((a) => a.playbookActions > 0);
  if (pb.length) add('PREP-AUT-03', `${pb.length} automation rule(s) run playbooks`, list(pb, (a) => `${a.name}: ${a.playbookActions} playbook action(s)`));
  const tasks = autos.filter((a) => a.taskActions > 0);
  ev('soc_workflows', tasks.length, `${tasks.length} automation rule(s) add incident tasks`);

  const playbooks = inv.sentinelPlaybooks;
  if (playbooks.length) add('PREP-AUT-03', `${playbooks.length} Logic App(s) use the Microsoft Sentinel connector`, `In the workspace's subscription:\n${list(playbooks, (p) => `${p.name}${p.ticketing ? ' (also uses a ticketing connector)' : ''}`)}`);
  else if (inv.schemaVersion === 2 && got.logicApps) add('PREP-AUT-03', 'no Sentinel playbook found in the Logic Apps you can read', 'No Logic App that uses the Microsoft Sentinel connector was found in the workspace\'s subscription. Microsoft Sentinel Reader does not include Logic Apps, and a list you cannot read can come back empty rather than refused, so this proves nothing on its own. List your playbooks by hand, or run the script again with Reader on their resource group.');
  else if (inv.schemaVersion === 2 && !got.logicApps) add('PREP-AUT-03', 'Logic Apps could not be read', 'The script could not list the Logic Apps in the workspace\'s subscription. Microsoft Sentinel Reader does not include Logic Apps; Reader on their resource group does. List your playbooks by hand, or run the script again with Reader.');
  ev('playbooks', pb.length || playbooks.length || inv.installedContent.playbooks, [pb.length ? `${pb.length} automation rule(s) run playbooks` : '', playbooks.length ? `${playbooks.length} Logic App(s) use the Sentinel connector` : '', inv.installedContent.playbooks ? `${inv.installedContent.playbooks} playbook(s) installed from the content hub` : ''].filter(Boolean).join(', '));
  const ticketing = playbooks.filter((p) => p.ticketing);
  if (ticketing.length) add('PREP-INT-01', `${ticketing.length} Sentinel playbook(s) use a ticketing connector`, list(ticketing, (p) => p.name));
  ev('itsm', ticketing.length, `${ticketing.length} Sentinel playbook(s) use a ticketing connector`);

  const conns = inv.dataConnectors;
  const has = (k) => conns.some((x) => x.kind === k);
  const standalone = conns.filter((x) => isStandalone(x.kind));
  if (conns.length || !failed('dataConnectors')) {
    add('PREP-CON-01', `${conns.length} data connector(s) reported by the API`, `${list(conns, (x) => `${x.kind}${isStandalone(x.kind) ? `: ${STANDALONE_KINDS[x.kind]} (standalone; replaced by the Defender XDR connector)` : ''}`) || 'None reported.'}\n\nThe data connectors API does not list every connector type; use the ingestion baseline as ground truth.${failNote('dataConnectors')}`);
  }
  if (standalone.length) add('PREP-TOP-03', `${standalone.length} standalone Microsoft connector(s)`, list(standalone, (x) => STANDALONE_KINDS[x.kind]));
  ev('standalone_connectors', standalone.length, `${standalone.length} standalone Microsoft connector(s)`, got.dataConnectors);
  if (has('OfficeIRM')) add('PREP-CON-03', 'Insider Risk Management connector present', 'Connector kind OfficeIRM. It must be on the primary workspace only before you connect.');
  ev('irm', has('OfficeIRM'), 'Insider Risk Management connector', got.dataConnectors);
  const defender = conns.filter((x) => DEFENDER_KINDS.includes(x.kind));
  ev('defender_xdr', defender.length, has('MicrosoftThreatProtection') ? 'Defender XDR connector' : `${defender.length} Defender product connector(s)`);
  const mdcLegacy = conns.filter((x) => x.kind === 'AzureSecurityCenter');
  const mdcRules = msic.filter((r) => /azure security center/i.test(r.productFilter));
  if (mdcLegacy.length || mdcRules.length) {
    add('PREP-CON-02', 'Defender for Cloud connector and rules', `${mdcLegacy.length ? 'Subscription-based (legacy) Defender for Cloud connector present (kind AzureSecurityCenter).\n' : ''}${mdcRules.length ? `Microsoft incident creation rules for Defender for Cloud alerts: ${mdcRules.map((r) => r.name).join(', ')}` : ''}`);
  }
  ev('mdc', mdcLegacy.length || mdcRules.length, 'Defender for Cloud connector or rules');
  const tiConns = conns.filter((x) => TI_KINDS.includes(x.kind));
  const tiRules = rules.filter((r) => r.usesTI);
  ev('ti', tiConns.length || tiRules.length, [tiConns.length ? `${tiConns.length} threat intelligence connector(s)` : '', tiRules.length ? `${tiRules.length} rule(s) query threat intelligence tables` : ''].filter(Boolean).join(', '));

  if (inv.watchlists.length) add('PREP-CNT-04', `${inv.watchlists.length} watchlist(s)`, list(inv.watchlists, (w) => `${w.alias}${w.name && w.name !== w.alias ? ` (${w.name})` : ''}`));
  ev('watchlists', inv.watchlists.length, `${inv.watchlists.length} watchlist(s)`, got.watchlists);

  // Schema 2 parts.
  if (inv.customerManagedKey === true) add('PREP-GOV-03', 'customer-managed keys in use', 'The Sentinel onboarding state reports a customer-managed key (CMK) for this workspace.');
  ev('cmk', inv.customerManagedKey === true, 'Customer-managed key reported', got.onboarding);
  const s = inv.settings;
  if (s.ueba || s.entityAnalytics) add('PREP-CNT-06', 'UEBA settings', `UEBA data sources configured: ${s.ueba ? 'yes' : 'no'}. Entity analytics providers configured: ${s.entityAnalytics ? 'yes' : 'no'}. Anomalies: ${s.anomalies ? 'on' : 'off'}.`);
  ev('ueba', s.ueba || s.entityAnalytics, 'UEBA or entity analytics configured', got.settings);
  const wm = inv.workspaceManager;
  if (wm.enabled) add('PREP-TOP-06', 'workspace manager enabled', `Workspace manager is enabled, with ${wm.members} member workspace(s).`);
  ev('workspace_manager', wm.enabled, 'Workspace manager enabled', got.workspaceManager);
  const repos = inv.repositories;
  if (repos.count) add('PREP-CNT-07', `${repos.count} repository connection(s)`, `Sentinel repositories deploy content as code here${repos.huntingQueries ? ', including hunting queries' : ''}.`);
  ev('cicd', repos.count, `${repos.count} repository connection(s)`);
  if (inv.bookmarks || inv.hunts) add('PREP-CNT-03', 'bookmarks and hunts', `Bookmarks: ${inv.bookmarks}. Hunts: ${inv.hunts}.`);
  ev('hunting', inv.bookmarks || inv.hunts || repos.huntingQueries, [inv.bookmarks ? `${inv.bookmarks} bookmark(s)` : '', inv.hunts ? `${inv.hunts} hunt(s)` : '', repos.huntingQueries ? 'a repository deploys hunting queries' : ''].filter(Boolean).join(', '));
  if (inv.installedContent.workbooks) add('PREP-CNT-01', `${inv.installedContent.workbooks} workbook(s) installed from the content hub`, 'Workbooks saved by hand are not listed by the documented API, so check the Workbooks page as well.');
  ev('workbooks', inv.installedContent.workbooks, `${inv.installedContent.workbooks} workbook(s) installed from the content hub`);
  const ac = inv.access;
  if (ac.spWithSentinelRoles) add('PREP-ACC-06', `${ac.spWithSentinelRoles} service principal role assignment(s)`, `Service principals or managed identities hold Sentinel or Log Analytics roles at or above this workspace: ${ac.spWithSentinelRoles} assignment(s), ${ac.spWithReadOnlyRoles} of them read-only. The script counts them only; find who they are under Access control (IAM).`);
  ev('sp_roles', ac.spWithSentinelRoles, `${ac.spWithSentinelRoles} service principal assignment(s) with Sentinel or Log Analytics roles`, got.access);
  ev('api_consumers', ac.spWithReadOnlyRoles, `${ac.spWithReadOnlyRoles} service principal(s) with read-only Sentinel or Log Analytics roles (a hint)`);
  if (ac.tableLevelRestrictions) add('PREP-ACC-04', `${ac.tableLevelRestrictions} access restriction(s) per table`, 'Role assignments with a condition on tables, or custom roles that allow queries on named tables only.');
  ev('granular_rbac', ac.tableLevelRestrictions, `${ac.tableLevelRestrictions} access restriction(s) per table`);
  if (SOVEREIGN[inv.cloud]) add('PREP-SCOPE-05', `signed in to ${SOVEREIGN[inv.cloud]}`, `The script ran against ${SOVEREIGN[inv.cloud]} (${inv.cloud}).`);
  ev('sovereign_cloud', SOVEREIGN[inv.cloud], `Signed in to ${SOVEREIGN[inv.cloud] || ''}`);
  if (inv.delegated) add('PREP-TOP-05', 'subscription managed from another tenant', 'The workspace\'s subscription is managed by another tenant (Azure Lighthouse).');
  ev('multi_tenant', inv.delegated, 'Subscription managed from another tenant (Azure Lighthouse)');

  // This workspace on its own only ever suggests Yes.
  const suggestions = INVENTORY_QUESTIONS.filter((q) => evidence[q] && evidence[q].found).map((q) => ({ questionId: q, value: 'yes', reason: evidence[q].reason }));
  const counts = { analyticsRules: rules.length, automationRules: autos.length, dataConnectors: conns.length, watchlists: inv.watchlists.length };
  return { label, counts, findings, suggestions, evidence, errors: inv.errors };
}

// Answers for the workspaces in scope: [{ alias, kind, inv, res }]. Yes when any workspace shows it; No only when
// every one of them was read for that part and none has it; the workspace list answers the workspace and tenant
// questions. Returns [{ questionId, value, reasons }] in questionnaire order.
export function suggestAnswers(items) {
  const n = items.length;
  if (!n) return [];
  const out = new Map();
  for (const q of INVENTORY_QUESTIONS) {
    const evs = items.map((it) => (it.res.evidence || {})[q]);
    const yes = evs.filter((e) => e && e.found);
    if (yes.length) out.set(q, { questionId: q, value: 'yes', reasons: yes.map((e) => e.reason) });
    else if (YES_OR_NO_QUESTIONS.includes(q) && evs.every((e) => e && e.checked)) out.set(q, { questionId: q, value: 'no', reasons: [`none found in the ${n} workspace${n === 1 ? '' : 's'} checked`] });
  }
  // From the workspace list: tenants, workspaces per tenant, and test workspaces.
  const tenantOf = (it) => it.inv.tenantRef || '';
  const perTenant = new Map();
  for (const it of items.filter(tenantOf)) perTenant.set(tenantOf(it), (perTenant.get(tenantOf(it)) || 0) + 1);
  const crowded = [...perTenant.values()].some((x) => x > 1);
  // Without a fingerprint for every workspace, "one per tenant" is not known; Yes still is when two share one.
  if (crowded) out.set('multi_workspace', { questionId: 'multi_workspace', value: 'yes', reasons: [`${n} workspaces in scope, several in one tenant`] });
  else if (items.every(tenantOf)) out.set('multi_workspace', { questionId: 'multi_workspace', value: 'no', reasons: [n === 1 ? 'one workspace in scope' : `${n} workspaces in scope, one per tenant`] });
  const tenants = new Set(items.map(tenantOf).filter(Boolean));
  if (tenants.size > 1) {
    const cur = out.get('multi_tenant');
    out.set('multi_tenant', { questionId: 'multi_tenant', value: 'yes', reasons: [`workspaces in ${tenants.size} tenants`, ...(cur ? cur.reasons : [])] });
  }
  const tests = items.filter((it) => it.kind === 'test');
  const prods = items.filter((it) => it.kind === 'production');
  if (tests.length) {
    out.set('test_env', { questionId: 'test_env', value: 'yes', reasons: [`${tests.map((t) => t.alias).join(', ')} marked as test`] });
    if (prods.length && [...tests, ...prods].every(tenantOf)) {
      const prodTenants = new Set(prods.map(tenantOf));
      const apart = tests.some((t) => !prodTenants.has(tenantOf(t)));
      out.set('test_separate_tenant', { questionId: 'test_separate_tenant', value: apart ? 'yes' : 'no', reasons: [apart ? 'a test workspace is in a tenant without production workspaces' : 'the test workspaces share a tenant with production'] });
    }
  }
  return INVENTORY_QUESTIONS.filter((q) => out.has(q)).map((q) => out.get(q));
}
