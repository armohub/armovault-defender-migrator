// Import-based assistance: analyse the JSON produced by tools/Get-ArMoSentinelInventory.ps1.
// The file is untrusted input. Values are coerced, capped and only ever rendered as text.
// Output: findings mapped to knowledge-base items (become "imported" evidence notes when the user accepts them)
// and questionnaire suggestions (applied only when the user ticks them). Absence of a finding in one workspace is
// never turned into a "No" answer, because other workspaces may differ.

import { isPlainObject } from './util.js';

export const INVENTORY_SCHEMA = 'armohub.dma.inventory';
export const MAX_INVENTORY_BYTES = 5 * 1024 * 1024;

const str = (v, max = 300) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const bool = (v) => (v === true ? true : v === false ? false : null);
const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

// Standalone Microsoft connector kinds in the SecurityInsights dataConnectors API that the Defender XDR connector replaces.
const STANDALONE_KINDS = {
  MicrosoftDefenderAdvancedThreatProtection: 'Microsoft Defender for Endpoint',
  AzureAdvancedThreatProtection: 'Microsoft Defender for Identity',
  MicrosoftCloudAppSecurity: 'Microsoft Defender for Cloud Apps',
  OfficeATP: 'Microsoft Defender for Office 365',
  AzureActiveDirectory: 'Microsoft Entra ID Protection (connector kind AzureActiveDirectory)',
};

export function parseInventory(text) {
  let obj;
  try { obj = JSON.parse(String(text).replace(/^﻿/, '')); } catch { throw new Error('The file is not valid JSON.'); }
  if (!isPlainObject(obj) || obj.schema !== INVENTORY_SCHEMA) throw new Error('This is not an inventory file produced by Get-ArMoSentinelInventory.ps1 (schema identifier missing).');
  if (Number(obj.schemaVersion) !== 1) throw new Error(`Unsupported inventory schema version ${str(obj.schemaVersion, 10)}.`);
  const limit = (list, name) => { if (list.length > 10000) throw new Error(`Too many ${name} entries.`); return list.filter(isPlainObject); };
  return {
    collectedAt: str(obj.collectedAt, 40),
    alias: str(isPlainObject(obj.workspace) ? obj.workspace.alias : '', 120),
    tool: isPlainObject(obj.tool) ? `${str(obj.tool.name, 80)} ${str(obj.tool.version, 20)}`.trim() : '',
    analyticsRules: limit(arr(obj.analyticsRules), 'analytics rule').map((r) => ({
      name: str(r.name), kind: str(r.kind, 60), enabled: bool(r.enabled), createIncident: bool(r.createIncident), groupingEnabled: bool(r.groupingEnabled),
      reopenClosed: bool(r.reopenClosed), correlationTag: str(r.correlationTag, 20), usesIdentityInfo: r.usesIdentityInfo === true, usesLegacyTI: r.usesLegacyTI === true,
      productFilter: str(r.productFilter, 120), apiVersion: str(r.apiVersion, 30),
    })),
    automationRules: limit(arr(obj.automationRules), 'automation rule').map((a) => ({
      name: str(a.name), enabled: bool(a.enabled), triggersOn: str(a.triggersOn, 30), triggersWhen: str(a.triggersWhen, 30),
      riskyConditions: arr(a.riskyConditions).map((x) => str(x, 60)).filter((x) => ['IncidentProviderName', 'IncidentTitle', 'IncidentDescription', 'IncidentUpdatedBySource'].includes(x)),
      playbookActions: Math.max(0, Math.min(1000, Number(a.playbookActions) || 0)), taskActions: Math.max(0, Math.min(1000, Number(a.taskActions) || 0)),
    })),
    dataConnectors: limit(arr(obj.dataConnectors), 'data connector').map((c) => ({ kind: str(c.kind, 80), name: str(c.name, 200) })),
    watchlists: limit(arr(obj.watchlists), 'watchlist').map((w) => ({ alias: str(w.alias, 120), name: str(w.name, 200) })),
    errors: arr(obj.errors).map((e) => str(e, 300)).slice(0, 50),
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
  // Which collections failed? The script reports "GET <resourceType> returned HTTP <code>".
  const failed = (type) => inv.errors.some((e) => e.includes(type));
  const failNote = (type) => (failed(type) ? `\n\nWARNING: collecting ${type} failed (${inv.errors.filter((e) => e.includes(type)).join('; ')}). These results are incomplete — do not treat missing entries as absent.` : '');
  const header = `Imported from ${inv.tool || 'inventory script'} output for ${label}. Values were computed by the read-only script; review them before relying on them.`;
  const findings = [];
  const suggestions = [];
  const add = (checkId, title, body) => findings.push({ checkId, title: `Imported inventory: ${title}`, text: `${header}\n\n${body}` });
  const rules = inv.analyticsRules;
  const enabled = rules.filter((r) => r.enabled !== false);
  const kinds = {};
  for (const r of rules) kinds[r.kind || 'unknown'] = (kinds[r.kind || 'unknown'] || 0) + 1;
  add('PREP-DET-01', `${rules.length} analytics rules${failed('alertRules') ? ' (collection incomplete)' : ''}`, `Rules by kind: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}.\nEnabled: ${enabled.length}. Disabled: ${rules.length - enabled.length}.${inv.errors.length ? `\nRequests that failed during collection: ${inv.errors.join('; ')}` : ''}`);

  const fusion = enabled.filter((r) => r.kind === 'Fusion');
  if (fusion.length) { add('PREP-DET-02', 'Fusion rule enabled', list(fusion, (r) => r.name)); suggestions.push({ questionId: 'fusion', value: 'yes', reason: `Fusion rule enabled in ${label}` }); }
  const msic = enabled.filter((r) => r.kind === 'MicrosoftSecurityIncidentCreation');
  if (msic.length) { add('PREP-DET-03', `${msic.length} Microsoft incident creation rule(s) enabled`, list(msic, (r) => `${r.name}${r.productFilter ? ` — product: ${r.productFilter}` : ''}`)); suggestions.push({ questionId: 'ms_incident_rules', value: 'yes', reason: `${msic.length} enabled in ${label}` }); }
  const alertOnly = enabled.filter((r) => r.createIncident === false);
  if (alertOnly.length) { add('PREP-DET-04', `${alertOnly.length} alert-only rule(s)`, list(alertOnly, (r) => `${r.name} (${r.kind})`)); suggestions.push({ questionId: 'alert_only_rules', value: 'yes', reason: `${alertOnly.length} alert-only rules in ${label}` }); }
  const reopen = enabled.filter((r) => r.reopenClosed === true);
  const grouping = enabled.filter((r) => r.groupingEnabled === true);
  const tags = rules.filter((r) => r.correlationTag);
  if (reopen.length || grouping.length || tags.length) {
    add('PREP-DET-05', 'grouping, reopen and correlation settings', [
      `Alert grouping enabled: ${grouping.length} rule(s).`, grouping.length ? list(grouping, (r) => r.name, 25) : '',
      `"Re-open closed matching incidents" enabled: ${reopen.length} rule(s) — not available after connection.`, reopen.length ? list(reopen, (r) => r.name, 25) : '',
      `Correlation tags in descriptions: ${tags.length}.`, tags.length ? list(tags, (r) => `${r.name}: ${r.correlationTag}`, 25) : '',
    ].filter(Boolean).join('\n'));
  }
  const legacyTi = rules.filter((r) => r.usesLegacyTI);
  if (legacyTi.length) { add('PREP-CNT-05', `${legacyTi.length} rule(s) query the legacy ThreatIntelligenceIndicator table`, list(legacyTi, (r) => r.name)); suggestions.push({ questionId: 'ti', value: 'yes', reason: `Rules use threat intelligence in ${label}` }); }

  const autos = inv.automationRules;
  if (autos.length) suggestions.push({ questionId: 'automation_rules', value: 'yes', reason: `${autos.length} automation rules in ${label}` });
  const risky = autos.filter((a) => a.riskyConditions.length);
  if (risky.length || !failed('automationRules')) {
    add('PREP-AUT-01', `${risky.length} of ${autos.length} automation rule(s) use conditions that change`, (risky.length ? list(risky, (a) => `${a.name}: ${a.riskyConditions.join(', ')}${a.enabled === false ? ' (disabled)' : ''}`) : 'No automation rule uses Incident provider, title, description or "Updated by" conditions (string screening of the condition definitions).') + failNote('automationRules'));
  }
  const alertTrig = autos.filter((a) => a.triggersOn === 'Alerts');
  if (alertTrig.length) add('PREP-AUT-02', `${alertTrig.length} alert-trigger automation rule(s)`, `In the Defender portal these act only on Microsoft Sentinel alerts.\n${list(alertTrig, (a) => a.name)}`);
  const pb = autos.filter((a) => a.playbookActions > 0);
  if (pb.length) { add('PREP-AUT-03', `${pb.length} automation rule(s) run playbooks`, list(pb, (a) => `${a.name}: ${a.playbookActions} playbook action(s)`)); suggestions.push({ questionId: 'playbooks', value: 'yes', reason: `Automation rules run playbooks in ${label}` }); }

  const conns = inv.dataConnectors;
  const standalone = conns.filter((c) => isStandalone(c.kind));
  if (conns.length || !failed('dataConnectors')) {
    add('PREP-CON-01', `${conns.length} data connector(s) reported by the API`, `${list(conns, (c) => `${c.kind}${isStandalone(c.kind) ? ` — ${STANDALONE_KINDS[c.kind]} (standalone; replaced by the Defender XDR connector)` : ''}`) || 'None reported.'}\n\nThe data connectors API does not list every connector type; use the ingestion baseline as ground truth.${failNote('dataConnectors')}`);
  }
  if (standalone.length) {
    add('PREP-TOP-03', `${standalone.length} standalone Microsoft connector(s)`, list(standalone, (c) => STANDALONE_KINDS[c.kind]));
    suggestions.push({ questionId: 'standalone_connectors', value: 'yes', reason: `Standalone Microsoft connectors in ${label}` });
  }
  const mdcLegacy = conns.filter((c) => c.kind === 'AzureSecurityCenter');
  const mdcRules = msic.filter((r) => /azure security center/i.test(r.productFilter));
  if (mdcLegacy.length || mdcRules.length) {
    add('PREP-CON-02', 'Defender for Cloud connector and rules', `${mdcLegacy.length ? 'Subscription-based (legacy) Defender for Cloud connector present (kind AzureSecurityCenter).\n' : ''}${mdcRules.length ? `Microsoft incident creation rules for Defender for Cloud alerts: ${mdcRules.map((r) => r.name).join(', ')}` : ''}`);
    suggestions.push({ questionId: 'mdc', value: 'yes', reason: `Defender for Cloud connector or rules in ${label}` });
  }
  if (inv.watchlists.length) { add('PREP-CNT-04', `${inv.watchlists.length} watchlist(s)`, list(inv.watchlists, (w) => `${w.alias}${w.name && w.name !== w.alias ? ` (${w.name})` : ''}`)); suggestions.push({ questionId: 'watchlists', value: 'yes', reason: `${inv.watchlists.length} watchlists in ${label}` }); }

  const counts = { analyticsRules: rules.length, automationRules: autos.length, dataConnectors: conns.length, watchlists: inv.watchlists.length };
  return { label, counts, findings, suggestions, errors: inv.errors };
}
