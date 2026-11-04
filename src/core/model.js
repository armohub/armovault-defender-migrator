// Project data model: statuses, answers, creation and audited mutations.
// All mutation helpers write an audit entry; nothing here fabricates dates, evidence or approvals:
// timestamps are always "now" at the moment the user acts, and people are whoever the user typed.

import { uid, nowIso } from './util.js';
import { DEPTHS, TOPICS, topicPreset, planOf, REHEARSAL_OFF } from './depth.js';

export const PROJECT_SCHEMA = 'armohub.dma.project';
export const PROJECT_SCHEMA_VERSION = 1;

// Check/task statuses. "Done" is not the same as "passed": a task can be done without its result being verified.
export const STATUSES = [
  { id: 'not_started', label: 'Not started', short: 'Not started', tone: 'neutral', open: true },
  { id: 'in_progress', label: 'In progress', short: 'In progress', tone: 'info', open: true },
  { id: 'passed', label: 'Passed, verified with evidence', short: 'Passed', tone: 'good', open: false },
  { id: 'not_verified', label: 'Done, not verified (your word only)', short: 'Not verified', tone: 'caution', open: false },
  { id: 'failed', label: 'Failed', short: 'Failed', tone: 'bad', open: false },
  { id: 'blocked', label: 'Blocked', short: 'Blocked', tone: 'bad', open: true },
  { id: 'needs_review', label: 'Needs review', short: 'Needs review', tone: 'caution', open: true },
  { id: 'not_applicable', label: 'Not applicable (with rationale)', short: 'N/A', tone: 'muted', open: false },
];
export const STATUS_IDS = STATUSES.map((s) => s.id);
export const statusById = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];

export const ANSWERS = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'unknown', label: "I don't know yet" },
  { id: 'na', label: 'Not applicable' },
];
export const ANSWER_IDS = ANSWERS.map((a) => a.id);
export const answerLabel = (id) => (ANSWERS.find((a) => a.id === id) || { label: 'Not answered' }).label;

export const REGISTER_TYPES = [
  { id: 'action', label: 'Action' },
  { id: 'issue', label: 'Issue' },
  { id: 'risk', label: 'Risk' },
  { id: 'exception', label: 'Exception / risk acceptance' },
  { id: 'decision', label: 'Decision' },
];
export const REGISTER_TYPE_IDS = REGISTER_TYPES.map((t) => t.id);
export const REGISTER_STATUS_IDS = ['open', 'in_progress', 'done', 'accepted', 'closed'];
export const SEVERITY_IDS = ['critical', 'high', 'medium', 'low'];

export const GATE_DECISIONS = [
  { id: 'go', label: 'Go: proceed' },
  { id: 'go_with_exceptions', label: 'Go with documented exceptions' },
  { id: 'no_go', label: 'No-go: do not proceed' },
  { id: 'deferred', label: 'Decision deferred' },
];
export const GATE_DECISION_IDS = GATE_DECISIONS.map((g) => g.id);

export const EVIDENCE_KINDS = ['image', 'note', 'link', 'file'];
export const GUIDANCE = ['simple', 'detailed'];
// Window planner ranges: 'auto' follows the answers; the others are the team's own choice.
export const PLAN_PROFILES = ['auto', 'lean', 'smaller', 'larger'];
export const MAX_TEXT = 20000; // generous upper bound for any free-text field
export const MAX_EVIDENCE_ITEMS = 5000; // matches the import limit
export const MAX_REGISTER_ITEMS = 5000;
export const MAX_SNAPSHOTS = 200;
export const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024; // per attachment
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const ALLOWED_FILE_TYPES = ['text/plain', 'text/csv', 'application/json', 'application/pdf'];

export function createProject({ meta = {}, mode = 'tailored', guidance = 'simple', appVersion, kbVersion, operator } = {}) {
  const at = nowIso();
  const p = {
    schema: PROJECT_SCHEMA,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: uid('prj'),
    createdAt: at,
    updatedAt: at,
    createdWith: { appVersion: appVersion || 'unknown', kbVersion: kbVersion || 'unknown' },
    isDemo: false,
    meta: {
      name: '',
      organisation: '',
      operatorName: '',
      operatorRole: '',
      startDate: '',
      windowStart: '',
      windowEnd: '',
      environments: [],
      workstreamOwners: {},
      workstreamPeople: {},
      approvers: [],
      plannedPrimary: '',
      plannedPrimaries: {},
      helpers: {},
      showExtras: true,
      ownersWanted: '',
      planProfile: 'auto',
      people: [],
      inventoryChoice: '',
      notes: '',
      ...meta,
    },
    mode, // 'tailored' | 'full'
    guidance: GUIDANCE.includes(guidance) ? guidance : 'simple', // how the plan is shown; records are the same in both
    answers: {},
    checks: {},
    evidence: {},
    register: [],
    stages: {
      test: { availability: 'undecided', reason: '', decidedBy: '', decidedAt: '' },
    },
    gates: {},
    snapshots: [],
    audit: [],
  };
  if (operator) p.meta.operatorName = operator;
  addAudit(p, 'project.created', `Project created (${mode === 'full' ? 'full checklist' : 'tailored'} mode)`);
  return p;
}

export function actor(project) {
  const n = (project && project.meta && project.meta.operatorName) || '';
  return n.trim() || 'Unnamed operator';
}

export function addAudit(project, action, detail, extra) {
  const entry = { at: nowIso(), by: actor(project), action, detail: String(detail || '').slice(0, 2000) };
  if (extra && typeof extra === 'object') entry.ref = String(extra.ref || '').slice(0, 200);
  project.audit.push(entry);
  if (project.audit.length > 5000) project.audit.splice(0, project.audit.length - 5000);
  project.updatedAt = entry.at;
  return entry;
}

export function checkState(project, checkId) {
  return project.checks[checkId] || null;
}

export function ensureCheckState(project, checkId, kbVersion) {
  if (!project.checks[checkId]) {
    project.checks[checkId] = {
      status: 'not_started',
      notes: '',
      owner: '',
      due: '',
      statusReason: '',
      evidenceIds: [],
      updatedAt: '',
      updatedBy: '',
      kbVersion: kbVersion || '',
      override: null, // { value: 'applies'|'not_applicable', reason, by, at }
      evidenceWaiver: null, // { reason, by, at }: the team decided no evidence is needed for this step
      history: [],
    };
  }
  if (project.checks[checkId].evidenceWaiver === undefined) project.checks[checkId].evidenceWaiver = null;
  return project.checks[checkId];
}

function pushHistory(state, project, field, from, to) {
  const at = nowIso();
  const by = actor(project);
  state.history.push({ at, by, field, from: from == null ? '' : String(from).slice(0, 500), to: to == null ? '' : String(to).slice(0, 500) });
  if (state.history.length > 500) state.history.splice(0, state.history.length - 500);
  state.updatedAt = at;
  state.updatedBy = by;
}

// Returns { ok, error } and enforces the rules that keep the record honest.
export function setCheckStatus(project, check, status, { reason = '', kbVersion } = {}) {
  if (!STATUS_IDS.includes(status)) return { ok: false, error: 'Unknown status.' };
  const st = ensureCheckState(project, check.id, kbVersion);
  const evidenceCount = st.evidenceIds.filter((id) => project.evidence[id]).length;
  if (status === 'passed' && evidenceCount === 0 && !st.evidenceWaiver) {
    return { ok: false, error: 'A step can only be marked "Passed" when evidence is attached (screenshot, observation note, link or file), or when you have recorded that no evidence is needed for it. Otherwise record it as "Done, not verified".' };
  }
  const needsReason = status === 'not_applicable' || status === 'blocked' || status === 'failed';
  const from = st.status;
  if (needsReason && from !== status && !String(reason).trim()) {
    return { ok: false, error: 'Please record a short rationale for this status.' };
  }
  if (from === status && !reason) return { ok: true };
  st.status = status;
  if (reason) st.statusReason = String(reason).slice(0, MAX_TEXT);
  else if (from !== status && !['needs_review'].includes(status)) st.statusReason = '';
  pushHistory(st, project, 'status', from, status);
  addAudit(project, 'check.status', `${check.id}: ${statusById(from).short} → ${statusById(status).short}${reason ? ` (${String(reason).slice(0, 200)})` : ''}`, { ref: check.id });
  return { ok: true };
}

export function setCheckField(project, checkId, field, value, kbVersion) {
  if (!['notes', 'owner', 'due', 'statusReason'].includes(field)) return;
  const st = ensureCheckState(project, checkId, kbVersion);
  const v = String(value == null ? '' : value).slice(0, MAX_TEXT);
  if (st[field] === v) return;
  const from = st[field];
  st[field] = v;
  pushHistory(st, project, field, field === 'notes' ? `${from.length} chars` : from, field === 'notes' ? `${v.length} chars` : v);
  project.updatedAt = st.updatedAt;
}

export function setApplicabilityOverride(project, checkId, value, reason, kbVersion) {
  const st = ensureCheckState(project, checkId, kbVersion);
  if (value === null) {
    const prev = st.override;
    st.override = null;
    pushHistory(st, project, 'applicability override', prev ? prev.value : '', 'removed');
    addAudit(project, 'check.applicability', `${checkId}: applicability override removed`, { ref: checkId });
    return { ok: true };
  }
  if (!['applies', 'not_applicable'].includes(value)) return { ok: false, error: 'Invalid applicability value.' };
  if (!String(reason || '').trim()) return { ok: false, error: 'An applicability override needs a reason so reviewers can understand the decision.' };
  st.override = { value, reason: String(reason).slice(0, 2000), by: actor(project), at: nowIso() };
  pushHistory(st, project, 'applicability override', '', value);
  addAudit(project, 'check.applicability', `${checkId}: reviewer set applicability to "${value === 'applies' ? 'applies' : 'not applicable'}": ${String(reason).slice(0, 200)}`, { ref: checkId });
  return { ok: true };
}

export function setAnswer(project, questionId, value, reason = '') {
  if (value !== null && !ANSWER_IDS.includes(value)) return { ok: false, error: 'Invalid answer.' };
  const prev = project.answers[questionId] ? project.answers[questionId].value : null;
  if (value === null) delete project.answers[questionId];
  else project.answers[questionId] = { value, reason: String(reason || '').slice(0, 2000), by: actor(project), at: nowIso() };
  if (prev !== value) addAudit(project, 'answer.changed', `${questionId}: ${prev ? answerLabel(prev) : 'not answered'} → ${value ? answerLabel(value) : 'not answered'}`, { ref: questionId });
  return { ok: true, changed: prev !== value, previous: prev };
}

// How the plan is shown: Simplified (missions with short checklists) or Detailed (full step pages).
// A view only: checks, evidence, answers and decisions are the same in both.
export function setGuidance(project, guidance) {
  if (!GUIDANCE.includes(guidance)) return { ok: false, error: 'Unknown guidance mode.' };
  if (project.guidance === guidance) return { ok: true, changed: false };
  project.guidance = guidance;
  addAudit(project, 'project.guidance', guidance === 'simple' ? 'Switched to Simplified mode' : 'Switched to Detailed mode');
  return { ok: true, changed: true };
}

export function setShowExtras(project, show) {
  project.meta.showExtras = show === true;
  addAudit(project, 'project.extras', project.meta.showExtras ? 'Recommended extras shown' : 'Recommended extras hidden');
  return { ok: true };
}

export function setPlanProfile(project, value) {
  if (!PLAN_PROFILES.includes(value)) return { ok: false, error: 'Unknown planning profile.' };
  project.meta.planProfile = value;
  addAudit(project, 'project.plan', `Planning profile: ${value}`);
  return { ok: true };
}

// Detailed mode asks once whether the team wants to record owners: 'yes' shows the form, 'later' folds it.
export function setOwnersWanted(project, value) {
  if (!['yes', 'later', ''].includes(value)) return { ok: false, error: 'Invalid choice.' };
  project.meta.ownersWanted = value;
  return { ok: true };
}

export function addEvidence(project, checkId, item, kbVersion) {
  const st = ensureCheckState(project, checkId, kbVersion);
  const id = uid('ev');
  const ev = {
    id,
    checkId,
    kind: item.kind,
    title: String(item.title || '').slice(0, 300),
    text: String(item.text || '').slice(0, MAX_TEXT),
    url: item.kind === 'link' ? String(item.url || '').slice(0, 2000) : '',
    fileName: String(item.fileName || '').slice(0, 260),
    mime: String(item.mime || ''),
    size: Number(item.size) || 0,
    sha256: String(item.sha256 || ''),
    redactionConfirmed: !!item.redactionConfirmed,
    createdAt: nowIso(),
    createdBy: actor(project),
    stage: String(item.stage || ''),
    origin: item.origin === 'import' ? 'import' : 'user', // 'import' = created from an imported export file, not typed by the user
    generated: item.kind === 'note' && item.generated === true, // an observation note built from the user's own entries
  };
  project.evidence[id] = ev;
  st.evidenceIds.push(id);
  pushHistory(st, project, 'evidence', '', `${ev.kind}: ${ev.title || ev.fileName || 'untitled'}`);
  addAudit(project, 'evidence.added', `${checkId}: ${ev.kind} evidence added${ev.fileName ? ` (${ev.fileName})` : ''}`, { ref: checkId });
  return ev;
}

export function removeEvidence(project, evidenceId) {
  const ev = project.evidence[evidenceId];
  if (!ev) return null;
  delete project.evidence[evidenceId];
  const st = project.checks[ev.checkId];
  if (st) {
    st.evidenceIds = st.evidenceIds.filter((x) => x !== evidenceId);
    pushHistory(st, project, 'evidence', `${ev.kind}: ${ev.title || ev.fileName}`, 'removed');
    // A verified pass without evidence is no longer verified (unless the team recorded that none is needed).
    if (st.status === 'passed' && st.evidenceIds.length === 0 && !st.evidenceWaiver) {
      st.status = 'not_verified';
      pushHistory(st, project, 'status', 'passed', 'not_verified');
      addAudit(project, 'check.status', `${ev.checkId}: Passed → Not verified (last evidence item removed)`, { ref: ev.checkId });
    }
  }
  addAudit(project, 'evidence.removed', `${ev.checkId}: ${ev.kind} evidence removed`, { ref: ev.checkId });
  return ev;
}

export function addRegisterItem(project, item) {
  const entry = {
    id: uid('reg'),
    type: REGISTER_TYPE_IDS.includes(item.type) ? item.type : 'action',
    title: String(item.title || '').slice(0, 300),
    description: String(item.description || '').slice(0, MAX_TEXT),
    owner: String(item.owner || '').slice(0, 200),
    due: String(item.due || '').slice(0, 30),
    severity: SEVERITY_IDS.includes(item.severity) ? item.severity : 'medium',
    status: REGISTER_STATUS_IDS.includes(item.status) && item.status !== 'accepted' ? item.status : 'open',
    checkId: String(item.checkId || '').slice(0, 80),
    acceptedBy: '',
    acceptedRole: '',
    acceptedAt: '',
    rationale: '',
    acceptedStatus: '', // status of the linked item when the exception was accepted; the acceptance covers only that status
    createdAt: nowIso(),
    createdBy: actor(project),
    updatedAt: nowIso(),
  };
  project.register.push(entry);
  addAudit(project, 'register.added', `${entry.type}: ${entry.title}`, { ref: entry.checkId || entry.id });
  return entry;
}

export function updateRegisterItem(project, id, patch) {
  const entry = project.register.find((r) => r.id === id);
  if (!entry) return { ok: false, error: 'Not found.' };
  const before = { type: entry.type, title: entry.title, checkId: entry.checkId, severity: entry.severity, status: entry.status };
  const allowed = ['title', 'description', 'owner', 'due', 'severity', 'status', 'checkId', 'type'];
  for (const k of allowed) {
    if (k in patch) {
      const v = String(patch[k] == null ? '' : patch[k]).slice(0, k === 'description' ? MAX_TEXT : 300);
      if (k === 'severity' && !SEVERITY_IDS.includes(v)) continue;
      if (k === 'status' && (!REGISTER_STATUS_IDS.includes(v) || v === 'accepted')) continue; // "accepted" only via acceptException
      if (k === 'type' && !REGISTER_TYPE_IDS.includes(v)) continue;
      entry[k] = v;
    }
  }
  if (before.status === 'accepted' && entry.status !== 'accepted') {
    addAudit(project, 'register.acceptance_reset', `Acceptance by ${entry.acceptedBy} withdrawn (status changed to ${entry.status}): ${entry.title}`, { ref: entry.checkId || entry.id });
    entry.acceptedBy = ''; entry.acceptedRole = ''; entry.acceptedAt = ''; entry.rationale = ''; entry.acceptedStatus = '';
  }
  if (entry.status === 'accepted') {
    const changed = ['type', 'title', 'checkId', 'severity'].filter((k) => before[k] !== entry[k]);
    if (changed.length || entry.type !== 'exception') {
      entry.status = 'open';
      addAudit(project, 'register.acceptance_reset', `Acceptance by ${entry.acceptedBy} withdrawn because ${changed.join(', ') || 'type'} changed: ${entry.title}`, { ref: entry.checkId || entry.id });
      entry.acceptedBy = ''; entry.acceptedRole = ''; entry.acceptedAt = ''; entry.rationale = ''; entry.acceptedStatus = '';
    }
  }
  entry.updatedAt = nowIso();
  addAudit(project, 'register.updated', `${entry.type}: ${entry.title}`, { ref: entry.checkId || entry.id });
  return { ok: true };
}

// A risk acceptance needs a named person, a role and a rationale, typed by the user, never defaulted.
export function acceptException(project, id, { acceptedBy, acceptedRole, rationale }) {
  const entry = project.register.find((r) => r.id === id);
  if (!entry) return { ok: false, error: 'Not found.' };
  if (!String(acceptedBy || '').trim() || !String(rationale || '').trim()) {
    return { ok: false, error: 'An exception needs the name of the person accepting the risk and a rationale.' };
  }
  entry.type = 'exception';
  entry.status = 'accepted';
  entry.acceptedBy = String(acceptedBy).slice(0, 200);
  entry.acceptedRole = String(acceptedRole || '').slice(0, 200);
  entry.rationale = String(rationale).slice(0, MAX_TEXT);
  entry.acceptedAt = nowIso();
  entry.acceptedStatus = entry.checkId && project.checks[entry.checkId] ? project.checks[entry.checkId].status : (entry.checkId ? 'not_started' : '');
  entry.updatedAt = entry.acceptedAt;
  addAudit(project, 'register.accepted', `Exception accepted by ${entry.acceptedBy}${entry.acceptedRole ? ` (${entry.acceptedRole})` : ''}: ${entry.title}`, { ref: entry.checkId || entry.id });
  return { ok: true };
}

export function removeRegisterItem(project, id) {
  const idx = project.register.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const [entry] = project.register.splice(idx, 1);
  addAudit(project, 'register.removed', `${entry.type}: ${entry.title}`, { ref: entry.checkId || entry.id });
}

export function recordGate(project, gateId, { decision, decidedBy, decidedRole, rationale }) {
  if (!GATE_DECISION_IDS.includes(decision)) return { ok: false, error: 'Choose a decision.' };
  if (!String(decidedBy || '').trim()) return { ok: false, error: 'Record who made the decision.' };
  if ((decision === 'go_with_exceptions' || decision === 'no_go') && !String(rationale || '').trim()) {
    return { ok: false, error: 'Record the rationale for this decision.' };
  }
  const prev = project.gates[gateId];
  project.gates[gateId] = {
    decision,
    decidedBy: String(decidedBy).slice(0, 200),
    decidedRole: String(decidedRole || '').slice(0, 200),
    rationale: String(rationale || '').slice(0, MAX_TEXT),
    at: nowIso(),
    history: [...((prev && prev.history) || []), ...(prev ? [{ decision: prev.decision, decidedBy: prev.decidedBy, at: prev.at }] : [])].slice(-50),
  };
  addAudit(project, 'gate.decision', `${gateId}: ${decision} by ${decidedBy}`, { ref: gateId });
  return { ok: true };
}

// The plan's depth and topics. A test rehearsal switched off skips the Test stage; switched back on, the test
// question decides again. A Test stage skipped for another reason stays skipped.
export function setPlanDepth(project, depth, topics = {}) {
  if (!DEPTHS.some((d) => d.id === depth)) return { ok: false, error: 'Unknown plan depth.' };
  const preset = topicPreset(depth);
  const next = Object.fromEntries(TOPICS.map((t) => [t.id, typeof topics[t.id] === 'boolean' ? topics[t.id] : preset[t.id]]));
  const before = JSON.stringify(planOf(project));
  project.meta.planDepth = depth;
  project.meta.planTopics = next;
  const t = project.stages.test;
  if (!next.rehearsal && t.availability !== 'unavailable') setTestAvailability(project, 'unavailable', REHEARSAL_OFF);
  else if (next.rehearsal && t.availability === 'unavailable' && t.reason === REHEARSAL_OFF) setTestAvailability(project, 'undecided', '');
  const changed = before !== JSON.stringify(planOf(project));
  if (changed) addAudit(project, 'project.plan', `Plan depth: ${(DEPTHS.find((d) => d.id === depth) || {}).label}; topics: ${TOPICS.map((x) => `${x.label} ${next[x.id] ? 'on' : 'off'}`).join(', ')}`);
  return { ok: true, changed };
}

export function setTestAvailability(project, availability, reason) {
  if (!['undecided', 'available', 'unavailable'].includes(availability)) return { ok: false, error: 'Invalid value.' };
  if (availability === 'unavailable' && !String(reason || '').trim()) {
    return { ok: false, error: 'Please record why no suitable test environment is available. The report states this and lists the compensating controls.' };
  }
  const t = project.stages.test;
  const prev = t.availability;
  t.availability = availability;
  t.reason = String(reason || '').slice(0, MAX_TEXT);
  t.decidedBy = actor(project);
  t.decidedAt = nowIso();
  addAudit(project, 'stage.test', `Test stage: ${prev} → ${availability}${reason ? ` (${String(reason).slice(0, 200)})` : ''}`);
  return { ok: true };
}

// ───────── Evidence not needed ─────────
// A team may decide that a step needs no evidence. That decision is recorded with a reason, who and when,
// and reports show it as "evidence not needed", never as missing evidence.
export function setEvidenceWaiver(project, checkId, reason, kbVersion) {
  const r = String(reason || '').trim();
  if (!r) return { ok: false, error: 'Say briefly why no evidence is needed for this step.' };
  const st = ensureCheckState(project, checkId, kbVersion);
  st.evidenceWaiver = { reason: r.slice(0, 2000), by: actor(project), at: nowIso() };
  pushHistory(st, project, 'evidence', '', `not needed: ${r.slice(0, 200)}`);
  addAudit(project, 'check.evidence_waived', `${checkId}: evidence not needed (${r.slice(0, 200)})`, { ref: checkId });
  return { ok: true };
}

export function clearEvidenceWaiver(project, checkId) {
  const st = project.checks[checkId];
  if (!st || !st.evidenceWaiver) return { ok: true };
  st.evidenceWaiver = null;
  pushHistory(st, project, 'evidence', 'not needed', 'needed again');
  addAudit(project, 'check.evidence_waiver_removed', `${checkId}: evidence needed again`, { ref: checkId });
  if (st.status === 'passed' && st.evidenceIds.filter((id) => project.evidence[id]).length === 0) {
    st.status = 'not_verified';
    pushHistory(st, project, 'status', 'passed', 'not_verified');
    addAudit(project, 'check.status', `${checkId}: Passed → Not verified (evidence needed again, none attached)`, { ref: checkId });
  }
  return { ok: true };
}

// ───────── Workspaces, owners and approvers ─────────
export const DEFENDER_STATES = [
  { id: 'unknown', label: 'Not checked yet' },
  { id: 'not_connected', label: 'Not connected' },
  { id: 'primary', label: 'Connected, primary' },
  { id: 'secondary', label: 'Connected, secondary' },
];
export const ENV_KINDS = ['production', 'test', 'other'];

export function cleanEnvironment(e) {
  const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  return {
    alias: s(e.alias, 120), kind: ENV_KINDS.includes(e.kind) ? e.kind : 'other', tenant: s(e.tenant, 120),
    subscription: s(e.subscription, 200), resourceGroup: s(e.resourceGroup, 200), region: s(e.region, 80),
    owner: s(e.owner, 200), defender: DEFENDER_STATES.some((d) => d.id === e.defender) ? e.defender : 'unknown', notes: s(e.notes, 2000),
  };
}

export function setEnvironments(project, list) {
  const next = (Array.isArray(list) ? list : []).map(cleanEnvironment).filter((e) => e.alias).slice(0, 50);
  const primaries = new Map();
  for (const e of next.filter((x) => x.defender === 'primary')) primaries.set(e.tenant, (primaries.get(e.tenant) || 0) + 1);
  if ([...primaries.values()].some((n) => n > 1)) return { ok: false, error: 'Only one workspace per tenant can be the primary workspace. Mark the others as secondary, or set the tenant of each workspace.' };
  // A connected secondary always has a primary in its tenant: the first connected workspace becomes primary.
  const lone = next.find((x) => x.defender === 'secondary' && !primaries.has(x.tenant));
  if (lone) return { ok: false, error: `${lone.alias} is marked as connected, secondary, but no workspace${lone.tenant ? ` in ${lone.tenant}` : ''} is marked as primary. A secondary workspace needs a primary in the same tenant: mark which one is primary (add it to the list if it is not there), or change this one.` };
  project.meta.environments = next;
  addAudit(project, 'project.environments', `Workspace inventory updated (${next.length} workspace${next.length === 1 ? '' : 's'})`);
  return { ok: true };
}

// Where the workspaces stand, from the connection check. Test workspaces do not count for "all connected".
export function connectionState(project) {
  const envs = (project.meta.environments || []).filter((e) => e.alias);
  const connected = (e) => e.defender === 'primary' || e.defender === 'secondary';
  const prod = envs.filter((e) => e.kind !== 'test');
  return { any: envs.some(connected), all: prod.length > 0 && prod.every(connected), checked: envs.length > 0 && envs.every((e) => e.defender !== 'unknown') };
}

// True when the tenant has workspaces and every one of them is connected.
export function tenantConnected(project, tenant) {
  const envs = (project.meta.environments || []).filter((e) => e.alias && (e.tenant || '') === (tenant || ''));
  return envs.length > 0 && envs.every((e) => e.defender === 'primary' || e.defender === 'secondary');
}

// Keeps "Is any workspace already connected?" in line with the connection check. Nothing changes until it is checked.
export function syncConnectionAnswer(project) {
  const st = connectionState(project);
  const value = st.any ? 'yes' : st.checked ? 'no' : null;
  const cur = project.answers.onboarded_any;
  if (value && (!cur || cur.value !== value)) setAnswer(project, 'onboarded_any', value, 'From the connection check');
}

export const workstreamKey = (stage, workstream) => `${stage}:${workstream}`;

// The planned primary workspace of a tenant: a decision, separate from what is connected today.
// Without tenants it is meta.plannedPrimary; with tenants, meta.plannedPrimaries[tenant]. A primary chosen
// before tenants were entered still counts for the tenant its workspace belongs to.
export function plannedPrimaryOf(project, tenant = '') {
  const t = String(tenant || '');
  if (!t) return project.meta.plannedPrimary || '';
  const set = (project.meta.plannedPrimaries || {})[t];
  if (set) return set;
  const legacy = project.meta.plannedPrimary || '';
  return legacy && (project.meta.environments || []).some((e) => e.tenant === t && e.alias === legacy) ? legacy : '';
}

export function setPlannedPrimary(project, tenant, alias) {
  const t = String(tenant || '').trim().slice(0, 120);
  const a = String(alias || '').trim().slice(0, 120);
  if (!t) project.meta.plannedPrimary = a;
  else {
    const next = { ...(project.meta.plannedPrimaries || {}) };
    if (a) next[t] = a; else delete next[t];
    project.meta.plannedPrimaries = next;
    if (project.meta.plannedPrimary && (project.meta.environments || []).some((e) => e.tenant === t && e.alias === project.meta.plannedPrimary)) project.meta.plannedPrimary = '';
  }
  addAudit(project, 'project.primary', a ? `Planned primary workspace${t ? ` for tenant ${t}` : ''}: ${a}` : `Planned primary workspace${t ? ` for tenant ${t}` : ''} cleared`);
  return { ok: true };
}

// 'primary' or 'secondary' once the workspace's tenant has a planned primary, else ''.
export function plannedRole(project, env) {
  if (!env || !env.alias) return '';
  const primary = plannedPrimaryOf(project, env.tenant || '');
  return !primary ? '' : primary === env.alias ? 'primary' : 'secondary';
}

export function setWorkstreamOwners(project, map) {
  const out = {};
  for (const [k, v] of Object.entries(map || {})) {
    if (!/^[a-z-]+:[a-z-]+$/.test(k)) continue;
    const name = String(v == null ? '' : v).trim().slice(0, 200);
    if (name) out[k] = name;
  }
  project.meta.workstreamOwners = out;
  addAudit(project, 'project.owners', `Workstream owners updated (${Object.keys(out).length} assigned)`);
  return { ok: true };
}

// The other people in a workstream besides its lead, each with what they cover (for example "timeline").
export const MAX_WORKSTREAM_PEOPLE = 20;
export function cleanWorkstreamPeople(map) {
  const out = {};
  for (const [k, list] of Object.entries(map || {})) {
    if (!/^[a-z-]+:[a-z-]+$/.test(k) || !Array.isArray(list)) continue;
    const people = list.filter((x) => x && typeof x === 'object')
      .map((x) => ({ name: String(x.name == null ? '' : x.name).trim().slice(0, 200), covers: String(x.covers == null ? '' : x.covers).trim().slice(0, 200) }))
      .filter((x) => x.name).slice(0, MAX_WORKSTREAM_PEOPLE);
    if (people.length) out[k] = people;
  }
  return out;
}

export function setWorkstreamPeople(project, map) {
  const out = cleanWorkstreamPeople(map);
  project.meta.workstreamPeople = out;
  const n = Object.values(out).reduce((sum, l) => sum + l.length, 0);
  addAudit(project, 'project.owners', `Workstream people updated (${n} ${n === 1 ? 'person' : 'people'} besides the leads)`);
  return { ok: true };
}

// The lead and the other people of a step's workstream.
export function workstreamTeam(project, check) {
  const key = workstreamKey(check.stage, check.workstream);
  return { lead: (project.meta.workstreamOwners || {})[key] || '', people: (project.meta.workstreamPeople || {})[key] || [] };
}

export function setApprovers(project, list) {
  const out = (Array.isArray(list) ? list : []).map((a) => ({ role: String(a.role || '').trim().slice(0, 200), name: String(a.name || '').trim().slice(0, 200) })).filter((a) => a.role && a.name).slice(0, 30);
  project.meta.approvers = out;
  addAudit(project, 'project.approvers', `Approvers updated (${out.length})`);
  return { ok: true };
}

// The owner of a step: its own Owner field, else the owner of its workstream.
export function effectiveOwner(project, check) {
  const st = project.checks[check.id];
  if (st && st.owner) return { name: st.owner, source: 'step' };
  const ws = (project.meta.workstreamOwners || {})[workstreamKey(check.stage, check.workstream)];
  return ws ? { name: ws, source: 'workstream' } : { name: '', source: '' };
}

// People added by name with their role, for example from "Add a new person" in an owner list.
export const MAX_PEOPLE = 200;
export const INVENTORY_CHOICES = ['import', 'manual', ''];
export function cleanPeople(list) {
  const seen = new Set();
  const out = [];
  for (const x of Array.isArray(list) ? list : []) {
    if (!x || typeof x !== 'object') continue;
    const name = String(x.name == null ? '' : x.name).trim().slice(0, 200);
    const role = String(x.role == null ? '' : x.role).trim().slice(0, 200);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({ name, role });
  }
  return out.slice(0, MAX_PEOPLE);
}

export function addPerson(project, { name, role }) {
  const n = String(name || '').trim().slice(0, 200);
  if (!n) return { ok: false, error: 'Please enter a name.' };
  const list = cleanPeople(project.meta.people);
  const found = list.find((x) => x.name.toLowerCase() === n.toLowerCase());
  if (found) { if (role && String(role).trim()) found.role = String(role).trim().slice(0, 200); } else list.push({ name: n, role: String(role || '').trim().slice(0, 200) });
  project.meta.people = cleanPeople(list);
  addAudit(project, 'project.people', `Person added: ${n}${role ? ` (${String(role).trim()})` : ''}`);
  return { ok: true, name: found ? found.name : n };
}

// Every known person with the role or part they play, for owner lists: [{ name, role }].
export function peopleWithRoles(project) {
  const roles = new Map();
  const add = (n, r) => { const v = String(n || '').trim(); if (!v) return; const cur = roles.get(v); if (!cur && r) roles.set(v, String(r).trim()); else if (!roles.has(v)) roles.set(v, ''); };
  (project.meta.people || []).forEach((x) => add(x.name, x.role));
  add(project.meta.operatorName, project.meta.operatorRole);
  (project.meta.approvers || []).forEach((a) => add(a.name, a.role));
  Object.values(project.meta.workstreamPeople || {}).forEach((l) => l.forEach((x) => add(x.name, x.covers)));
  for (const n of knownPeople(project)) add(n, '');
  return [...roles.entries()].map(([name, role]) => ({ name, role })).sort((a, b) => a.name.localeCompare(b.name));
}

export function setInventoryChoice(project, choice) {
  project.meta.inventoryChoice = INVENTORY_CHOICES.includes(choice) ? choice : '';
  return { ok: true };
}

// Every person the project already knows, for name suggestions in forms.
export function knownPeople(project) {
  const names = new Set();
  const add = (n) => { const v = String(n || '').trim(); if (v) names.add(v); };
  add(project.meta.operatorName);
  (project.meta.people || []).forEach((x) => add(x.name));
  Object.values(project.meta.workstreamOwners || {}).forEach(add);
  Object.values(project.meta.workstreamPeople || {}).forEach((l) => l.forEach((x) => add(x.name)));
  (project.meta.approvers || []).forEach((a) => add(a.name));
  (project.meta.environments || []).forEach((e) => add(e.owner));
  Object.values(project.meta.helpers || {}).forEach((x) => (x.subjects || []).forEach((s) => add(s.person)));
  Object.values(project.checks).forEach((c) => add(c.owner));
  return [...names].sort((a, b) => a.localeCompare(b));
}

// ───────── Decision helpers ─────────
// The answers and the chosen approach of a step's decision helper (content: `helper` on the step).
// One subject per helper, or one per tenant. Who approved the choice is recorded in the register, not here.
export const HELPER_KEYS = ['mdc', 'urbac', 'tenants'];
export const MAX_HELPER_SUBJECTS = 100;
const HELPER_ID = /^[a-z][a-z0-9_-]{0,39}$/;

export function cleanHelperSubject(s) {
  const t = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const answers = {};
  for (const [q, v] of Object.entries((s && typeof s.answers === 'object' && s.answers) || {}).slice(0, 20)) {
    if (!HELPER_ID.test(q)) continue;
    const vals = (Array.isArray(v) ? v : [v]).filter((x) => typeof x === 'string' && HELPER_ID.test(x)).slice(0, 10);
    if (!vals.length) continue;
    answers[q] = Array.isArray(v) ? [...new Set(vals)] : vals[0];
  }
  const choice = s && typeof s.choice === 'string' && HELPER_ID.test(s.choice) ? s.choice : '';
  return { label: t(s && s.label, 120), answers, choice, person: t(s && s.person, 200) };
}

export function setHelper(project, key, subjects, { detail, ref } = {}) {
  if (!HELPER_KEYS.includes(key)) return { ok: false, error: 'Unknown decision helper.' };
  const list = (Array.isArray(subjects) ? subjects : []).slice(0, MAX_HELPER_SUBJECTS).map(cleanHelperSubject);
  if (!project.meta.helpers) project.meta.helpers = {};
  project.meta.helpers[key] = { subjects: list, by: actor(project), at: nowIso() };
  const fallback = list.map((s) => `${s.label ? `${s.label}: ` : ''}${s.choice || 'no choice yet'}`).join('; ');
  addAudit(project, 'project.helper', detail || `Decision helper "${key}" saved (${fallback})`, ref ? { ref } : undefined);
  return { ok: true };
}
