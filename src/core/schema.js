// Validation, sanitisation and version migration for imported project data.
// Imported content is untrusted. Rather than trusting the input shape, we rebuild a clean project object
// from known fields only, coerce types, cap lengths, and reject unknown enum values and unsafe keys.

import {
  PROJECT_SCHEMA, PROJECT_SCHEMA_VERSION, STATUS_IDS, ANSWER_IDS, REGISTER_TYPE_IDS, REGISTER_STATUS_IDS,
  SEVERITY_IDS, GATE_DECISION_IDS, EVIDENCE_KINDS, MAX_TEXT, HELPER_KEYS, MAX_HELPER_SUBJECTS, cleanHelperSubject,
  MAX_WORKSTREAM_PEOPLE, cleanWorkstreamPeople, MAX_PEOPLE, cleanPeople, INVENTORY_CHOICES,
} from './model.js';
import { FORBIDDEN_KEYS, isPlainObject } from './util.js';

export const MAX_PROJECT_JSON_BYTES = 40 * 1024 * 1024;
const ID_RE = /^[A-Za-z0-9_.:-]{1,80}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

const str = (v, max = 300) => (typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '').slice(0, max);
const iso = (v) => { const s = str(v, 40); return s === '' || ISO_RE.test(s) ? s : ''; };
const oneOf = (v, allowed, dflt) => (allowed.includes(v) ? v : dflt);
const safeId = (k) => typeof k === 'string' && ID_RE.test(k) && !FORBIDDEN_KEYS.has(k);

function safeEntries(obj, errors, label, limit = 5000) {
  if (!isPlainObject(obj)) return [];
  const entries = Object.entries(obj);
  if (entries.length > limit) { errors.push(`${label}: too many entries (${entries.length}).`); return []; }
  return entries.filter(([k]) => {
    if (!safeId(k)) { errors.push(`${label}: rejected invalid key "${String(k).slice(0, 40)}".`); return false; }
    return true;
  });
}

function sanitiseHistory(list, max = 500) {
  if (!Array.isArray(list)) return [];
  return list.slice(-max).filter(isPlainObject).map((h) => ({ at: iso(h.at), by: str(h.by, 200), field: str(h.field, 80), from: str(h.from, 500), to: str(h.to, 500) }));
}

export function migrateProject(raw) {
  // Version 1 is the first published schema. Future versions add steps here, e.g.:
  // if (raw.schemaVersion === 1) { raw = upgrade1to2(raw); }
  return raw;
}

// Returns { ok, project, errors[], warnings[] }. `ok` is false only for fatal problems.
export function validateProject(input, { kb } = {}) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(input)) return { ok: false, errors: ['The file does not contain a project object.'], warnings };
  if (input.schema !== PROJECT_SCHEMA) return { ok: false, errors: ['This file is not an ArMo MS Defender Migration Assistant project (schema identifier missing or different).'], warnings };
  const ver = Number(input.schemaVersion);
  if (!Number.isInteger(ver) || ver < 1) return { ok: false, errors: ['The project schema version is missing or invalid.'], warnings };
  if (ver > PROJECT_SCHEMA_VERSION) return { ok: false, errors: [`This project was created by a newer version of the app (schema v${ver}; this app reads up to v${PROJECT_SCHEMA_VERSION}). Please use a newer release.`], warnings };
  const raw = migrateProject(input);

  const p = {
    schema: PROJECT_SCHEMA,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: safeId(raw.id) ? raw.id : '',
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
    createdWith: isPlainObject(raw.createdWith) ? { appVersion: str(raw.createdWith.appVersion, 40), kbVersion: str(raw.createdWith.kbVersion, 40) } : { appVersion: '', kbVersion: '' },
    isDemo: raw.isDemo === true,
    meta: {},
    mode: oneOf(raw.mode, ['tailored', 'full'], 'tailored'),
    guidance: oneOf(raw.guidance, ['simple', 'detailed'], 'detailed'),
    answers: {},
    checks: {},
    evidence: {},
    register: [],
    stages: { test: { availability: 'undecided', reason: '', decidedBy: '', decidedAt: '' } },
    gates: {},
    snapshots: [],
    audit: [],
  };
  if (!p.id) errors.push('Project id is missing or invalid.');

  const m = isPlainObject(raw.meta) ? raw.meta : {};
  p.meta = {
    name: str(m.name, 200), organisation: str(m.organisation, 200), operatorName: str(m.operatorName, 200), operatorRole: str(m.operatorRole, 200),
    startDate: iso(m.startDate), windowStart: iso(m.windowStart), windowEnd: iso(m.windowEnd), notes: str(m.notes, MAX_TEXT),
    environments: Array.isArray(m.environments) ? m.environments.slice(0, 50).filter(isPlainObject).map((e) => ({ alias: str(e.alias, 120), kind: oneOf(e.kind, ['production', 'test', 'other'], 'other'), tenant: str(e.tenant, 120), subscription: str(e.subscription, 200), resourceGroup: str(e.resourceGroup, 200), region: str(e.region, 80), owner: str(e.owner, 200), defender: oneOf(e.defender, ['unknown', 'not_connected', 'primary', 'secondary'], 'unknown'), notes: str(e.notes, 2000) })) : [],
    workstreamOwners: {},
    workstreamPeople: {},
    plannedPrimary: str(m.plannedPrimary, 120),
    plannedPrimaries: {},
    approvers: Array.isArray(m.approvers) ? m.approvers.slice(0, 30).filter(isPlainObject).map((a) => ({ role: str(a.role, 200), name: str(a.name, 200) })).filter((a) => a.role && a.name) : [],
    helpers: {},
    showExtras: m.showExtras !== false,
    ownersWanted: oneOf(m.ownersWanted, ['yes', 'later', ''], ''),
    planProfile: oneOf(m.planProfile, ['auto', 'lean', 'smaller', 'larger'], 'auto'),
    people: Array.isArray(m.people) ? cleanPeople(m.people.slice(0, MAX_PEOPLE).filter(isPlainObject).map((x) => ({ name: str(x.name, 200), role: str(x.role, 200) }))) : [],
    inventoryChoice: oneOf(m.inventoryChoice, INVENTORY_CHOICES, ''),
  };
  // Decision helpers: known helpers only; answers and choices are short identifiers, never text.
  if (isPlainObject(m.helpers)) {
    for (const key of HELPER_KEYS) {
      const x = Object.prototype.hasOwnProperty.call(m.helpers, key) ? m.helpers[key] : null;
      if (!isPlainObject(x) || !Array.isArray(x.subjects)) continue;
      const subjects = x.subjects.slice(0, MAX_HELPER_SUBJECTS).filter(isPlainObject)
        .map((s) => cleanHelperSubject({ label: str(s.label, 120), answers: isPlainObject(s.answers) ? Object.fromEntries(safeEntries(s.answers, warnings, `helper ${key} answers`, 20)) : {}, choice: s.choice, person: str(s.person, 200) }));
      p.meta.helpers[key] = { subjects, by: str(x.by, 200), at: iso(x.at) };
    }
  }
  if (isPlainObject(m.workstreamOwners)) {
    for (const [k, v] of Object.entries(m.workstreamOwners).slice(0, 100)) {
      if (FORBIDDEN_KEYS.has(k) || !/^[a-z-]+:[a-z-]+$/.test(k)) continue;
      const name = str(v, 200);
      if (name) p.meta.workstreamOwners[k] = name;
    }
  }
  if (isPlainObject(m.plannedPrimaries)) {
    for (const [k, v] of Object.entries(m.plannedPrimaries).slice(0, 50)) {
      const t = str(k, 120);
      const a = str(v, 120);
      if (!FORBIDDEN_KEYS.has(k) && t && a) p.meta.plannedPrimaries[t] = a;
    }
  }
  if (isPlainObject(m.workstreamPeople)) {
    const safe = {};
    for (const [k, v] of Object.entries(m.workstreamPeople).slice(0, 100)) {
      if (FORBIDDEN_KEYS.has(k) || !Array.isArray(v)) continue;
      safe[k] = v.slice(0, MAX_WORKSTREAM_PEOPLE).filter(isPlainObject).map((x) => ({ name: str(x.name, 200), covers: str(x.covers, 200) }));
    }
    p.meta.workstreamPeople = cleanWorkstreamPeople(safe);
  }

  for (const [k, a] of safeEntries(raw.answers, warnings, 'answers', 500)) {
    if (!isPlainObject(a) || !ANSWER_IDS.includes(a.value)) { warnings.push(`Answer "${k}" ignored (invalid value).`); continue; }
    p.answers[k] = { value: a.value, reason: str(a.reason, 2000), by: str(a.by, 200), at: iso(a.at) };
  }

  for (const [k, ev] of safeEntries(raw.evidence, warnings, 'evidence', 5000)) {
    if (!isPlainObject(ev) || !EVIDENCE_KINDS.includes(ev.kind)) { warnings.push(`Evidence "${k}" ignored (invalid).`); continue; }
    let url = '';
    if (ev.kind === 'link') {
      url = str(ev.url, 2000);
      if (!/^https?:\/\//i.test(url)) { warnings.push(`Evidence link "${k}" kept as text only (only http/https links are allowed).`); url = ''; }
    }
    p.evidence[k] = {
      id: k, checkId: safeId(ev.checkId) ? ev.checkId : '', kind: ev.kind, title: str(ev.title, 300), text: str(ev.text, MAX_TEXT), url,
      fileName: str(ev.fileName, 260), mime: str(ev.mime, 80), size: Number.isFinite(ev.size) ? Math.max(0, Math.floor(ev.size)) : 0,
      sha256: /^[a-f0-9]{64}$/.test(ev.sha256 || '') ? ev.sha256 : '', redactionConfirmed: ev.redactionConfirmed === true,
      createdAt: iso(ev.createdAt), createdBy: str(ev.createdBy, 200), stage: str(ev.stage, 40), origin: ev.origin === 'import' ? 'import' : 'user', generated: ev.kind === 'note' && ev.generated === true,
    };
  }

  for (const [k, c] of safeEntries(raw.checks, warnings, 'checks', 2000)) {
    if (!isPlainObject(c)) continue;
    const ov = isPlainObject(c.override) && ['applies', 'not_applicable'].includes(c.override.value) && str(c.override.reason).trim()
      ? { value: c.override.value, reason: str(c.override.reason, 2000), by: str(c.override.by, 200), at: iso(c.override.at) } : null;
    p.checks[k] = {
      status: oneOf(c.status, STATUS_IDS, 'not_started'), notes: str(c.notes, MAX_TEXT), owner: str(c.owner, 200), due: iso(c.due), statusReason: str(c.statusReason, MAX_TEXT),
      // Evidence can only support the check it was recorded on.
      evidenceIds: Array.isArray(c.evidenceIds) ? [...new Set(c.evidenceIds)].filter((id) => safeId(id) && p.evidence[id] && (p.evidence[id].checkId === k || !p.evidence[id].checkId)).slice(0, 500) : [],
      updatedAt: iso(c.updatedAt), updatedBy: str(c.updatedBy, 200), kbVersion: str(c.kbVersion, 40), override: ov, history: sanitiseHistory(c.history),
      evidenceWaiver: isPlainObject(c.evidenceWaiver) && str(c.evidenceWaiver.reason).trim() ? { reason: str(c.evidenceWaiver.reason, 2000), by: str(c.evidenceWaiver.by, 200), at: iso(c.evidenceWaiver.at) } : null,
    };
    // Integrity rule: "passed" requires evidence or a recorded "evidence not needed". Otherwise downgrade and say so.
    if (p.checks[k].status === 'passed' && p.checks[k].evidenceIds.length === 0 && !p.checks[k].evidenceWaiver) {
      p.checks[k].status = 'not_verified';
      warnings.push(`${k}: was "Passed" but has no evidence in the file, so it was imported as "Done, not verified".`);
    }
    // Integrity rule: these statuses require a rationale.
    if (['failed', 'blocked', 'not_applicable'].includes(p.checks[k].status) && !p.checks[k].statusReason.trim()) {
      warnings.push(`${k}: status "${p.checks[k].status}" had no rationale, so it was imported as "Needs review".`);
      p.checks[k].status = 'needs_review';
    }
    if (kb && !kb.checks.some((x) => x.id === k)) warnings.push(`${k}: not in the current knowledge base (kept as historical data).`);
  }
  for (const ev of Object.values(p.evidence)) {
    if (!ev.checkId) continue;
    if (!p.checks[ev.checkId]) p.checks[ev.checkId] = { status: 'not_started', notes: '', owner: '', due: '', statusReason: '', evidenceIds: [], updatedAt: '', updatedBy: '', kbVersion: '', override: null, evidenceWaiver: null, history: [] };
    if (!p.checks[ev.checkId].evidenceIds.includes(ev.id)) p.checks[ev.checkId].evidenceIds.push(ev.id);
  }

  if (Array.isArray(raw.register)) {
    const seen = new Set();
    for (const r of raw.register.slice(0, 5000)) {
      if (!isPlainObject(r) || !safeId(r.id)) continue;
      if (seen.has(r.id)) { warnings.push(`Duplicate register item id "${r.id}" ignored.`); continue; }
      seen.add(r.id);
      p.register.push({
        id: r.id, type: oneOf(r.type, REGISTER_TYPE_IDS, 'action'), title: str(r.title, 300), description: str(r.description, MAX_TEXT), owner: str(r.owner, 200), due: iso(r.due),
        severity: oneOf(r.severity, SEVERITY_IDS, 'medium'), status: oneOf(r.status, REGISTER_STATUS_IDS, 'open'), checkId: safeId(r.checkId) ? r.checkId : '',
        acceptedBy: str(r.acceptedBy, 200), acceptedRole: str(r.acceptedRole, 200), acceptedAt: iso(r.acceptedAt), rationale: str(r.rationale, MAX_TEXT),
        acceptedStatus: oneOf(r.acceptedStatus, STATUS_IDS, ''),
        createdAt: iso(r.createdAt), createdBy: str(r.createdBy, 200), updatedAt: iso(r.updatedAt),
      });
      const last = p.register[p.register.length - 1];
      if (last.status === 'accepted' && (last.type !== 'exception' || !last.acceptedBy.trim() || !last.rationale.trim())) {
        last.status = 'open';
        warnings.push(`Register item "${last.title}" was marked accepted without being an exception with a named person and rationale, so it was imported as open.`);
      }
      if (kb && last.checkId && !kb.checks.some((x) => x.id === last.checkId)) warnings.push(`Register item "${last.title}" is linked to "${last.checkId}", which is not in the current knowledge base; it is treated as unlinked.`);
    }
  }

  const t = isPlainObject(raw.stages) && isPlainObject(raw.stages.test) ? raw.stages.test : {};
  p.stages.test = { availability: oneOf(t.availability, ['undecided', 'available', 'unavailable'], 'undecided'), reason: str(t.reason, MAX_TEXT), decidedBy: str(t.decidedBy, 200), decidedAt: iso(t.decidedAt) };
  if (p.stages.test.availability === 'unavailable' && !p.stages.test.reason.trim()) {
    p.stages.test.availability = 'undecided';
    warnings.push('The test stage was marked unavailable without a reason, so it was imported as "not decided".');
  }

  for (const [k, g] of safeEntries(raw.gates, warnings, 'gates', 100)) {
    if (!isPlainObject(g) || !GATE_DECISION_IDS.includes(g.decision) || !str(g.decidedBy).trim()) { warnings.push(`Gate "${k}" ignored (incomplete decision record).`); continue; }
    if ((g.decision === 'no_go' || g.decision === 'go_with_exceptions') && !str(g.rationale).trim()) { warnings.push(`Gate "${k}" ignored (decision "${g.decision}" without a rationale).`); continue; }
    p.gates[k] = {
      decision: g.decision, decidedBy: str(g.decidedBy, 200), decidedRole: str(g.decidedRole, 200), rationale: str(g.rationale, MAX_TEXT), at: iso(g.at),
      history: Array.isArray(g.history) ? g.history.slice(-50).filter(isPlainObject).map((h) => ({ decision: oneOf(h.decision, GATE_DECISION_IDS, 'deferred'), decidedBy: str(h.decidedBy, 200), at: iso(h.at) })) : [],
    };
  }

  if (Array.isArray(raw.snapshots)) {
    for (const s of raw.snapshots.slice(-200)) {
      if (!isPlainObject(s) || !safeId(s.id) || !isPlainObject(s.model)) continue;
      p.snapshots.push({
        id: s.id, kind: oneOf(s.kind, ['prepare', 'test', 'transition', 'validate', 'final'], 'final'), title: str(s.title, 300), createdAt: iso(s.createdAt), createdBy: str(s.createdBy, 200),
        appVersion: str(s.appVersion, 40), kbVersion: str(s.kbVersion, 40), sha256: /^[a-f0-9]{64}$/.test(s.sha256 || '') ? s.sha256 : '', note: str(s.note, 2000),
        model: sanitiseModel(s.model, 0),
      });
    }
  }

  if (Array.isArray(raw.audit)) {
    p.audit = raw.audit.slice(-5000).filter(isPlainObject).map((a) => ({ at: iso(a.at), by: str(a.by, 200), action: str(a.action, 80), detail: str(a.detail, 2000), ...(a.ref ? { ref: str(a.ref, 200) } : {}) }));
  }

  return { ok: errors.length === 0, project: p, errors, warnings };
}

// Snapshot models are plain data rendered with textContent only. Keep them JSON-shaped, bounded and key-safe.
function sanitiseModel(v, depth) {
  if (depth > 12) return null;
  if (v == null || typeof v === 'boolean' || typeof v === 'number') return Number.isNaN(v) ? null : v;
  if (typeof v === 'string') return v.slice(0, MAX_TEXT);
  if (Array.isArray(v)) return v.slice(0, 5000).map((x) => sanitiseModel(x, depth + 1));
  if (isPlainObject(v)) {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      if (FORBIDDEN_KEYS.has(k) || k.length > 80) continue;
      o[k] = sanitiseModel(x, depth + 1);
    }
    return o;
  }
  return null;
}

// Settings are separate from project data and validated the same defensive way.
export const DEFAULT_SETTINGS = Object.freeze({
  schema: 'armohub.dma.settings',
  schemaVersion: 1,
  storageMode: 'none', // 'none' (manual save/export only) | 'browser' (autosave to this browser's IndexedDB)
  theme: 'dark', // 'system' | 'light' | 'dark'
  density: 'comfortable', // 'comfortable' | 'compact'
  operatorName: '',
  operatorRole: '',
  welcomeSeen: false,
  introSeen: false, // the animated introduction plays once, then a short splash
  motion: 'system', // 'system' (follow the operating system) | 'reduced'
  disclaimerAcknowledgedAt: '',
  lastProjectId: '',
});

export function validateSettings(input) {
  const s = { ...DEFAULT_SETTINGS };
  if (!isPlainObject(input)) return s;
  s.storageMode = oneOf(input.storageMode, ['none', 'browser'], 'none');
  s.theme = oneOf(input.theme, ['system', 'light', 'dark'], 'dark');
  s.density = oneOf(input.density, ['comfortable', 'compact'], 'comfortable');
  s.operatorName = str(input.operatorName, 200);
  s.operatorRole = str(input.operatorRole, 200);
  s.welcomeSeen = input.welcomeSeen === true;
  s.introSeen = input.introSeen === true;
  s.motion = oneOf(input.motion, ['system', 'reduced'], 'system');
  s.disclaimerAcknowledgedAt = iso(input.disclaimerAcknowledgedAt);
  s.lastProjectId = safeId(input.lastProjectId) ? input.lastProjectId : '';
  return s;
}
