// Stage summaries and evidence-based conclusions.
// The conclusion is computed from explicit, visible criteria. It never becomes "ready" just because
// fields were filled in: critical items need verified evidence or an accepted, named exception.

import { applicabilityMap } from './applicability.js';
import { APPROVED_DECISIONS } from './model.js';
import { REHEARSAL_OFF } from './depth.js';

// The gate that closes each stage. When a named person approves it, the steps recorded as done without proof
// count as reviewed and accepted: warnings, never verified.
export const STAGE_GATES = { prepare: 'PREP-PLN-05', test: 'TEST-11', transition: 'TRN-17', validate: 'VAL-18' };

export const STAGES_ORDER = ['prepare', 'test', 'transition', 'validate'];

const ASSESSED = new Set(['passed', 'not_verified', 'failed', 'not_applicable']);
const UNASSESSED = new Set(['not_started', 'in_progress', 'needs_review']);

export const CONCLUSION_LABELS = {
  prepare: {
    ready: 'Ready to proceed',
    ready_with_exceptions: 'Ready with exceptions',
    undetermined: 'Unable to determine',
    not_ready: 'Not ready',
  },
  test: {
    ready: 'Test validation passed',
    ready_with_exceptions: 'Test passed with exceptions',
    undetermined: 'Test results incomplete',
    not_ready: 'Test found blocking issues',
    skipped: 'Test stage not available',
    skippedByPlan: 'Not part of your plan',
  },
  transition: {
    ready: 'Transition executed as planned',
    ready_with_exceptions: 'Transition executed with exceptions',
    undetermined: 'Transition record incomplete',
    not_ready: 'Transition has failed or blocked steps',
  },
  validate: {
    ready: 'Post-transition validation passed',
    ready_with_exceptions: 'Validated with exceptions',
    undetermined: 'Unable to determine',
    not_ready: 'Validation found blocking issues',
  },
};

export const CONCLUSION_CRITERIA = [
  'Not ready / blocking: any in-scope critical or high item is Failed or Blocked without an accepted exception, or a critical open issue exists in the register.',
  'Unable to determine: no blocking findings, but at least one in-scope critical or high item has not been assessed yet (Not started, In progress, Needs review, or applicability still uncertain), or a critical item is recorded only as a user assertion without evidence and the stage gate has not accepted it.',
  'Ready with exceptions: every critical and high item is verified or covered by a named, accepted exception, but exceptions exist, or items recorded as done without proof were accepted at the stage gate by a named person, or high items rely on user assertion, or medium/low items are open, failed or unverified.',
  'Ready: every in-scope item is Passed with evidence or Not applicable with rationale, with no open blockers or exceptions.',
];

// An accepted exception covers its linked item only while the item still has the status it was accepted for.
export function exceptionsByCheck(project) {
  const m = new Map();
  for (const r of project.register) {
    const current = r.checkId && project.checks[r.checkId] ? project.checks[r.checkId].status : 'not_started';
    if (r.type === 'exception' && r.status === 'accepted' && r.checkId && (!r.acceptedStatus || r.acceptedStatus === current)) {
      if (!m.has(r.checkId)) m.set(r.checkId, []);
      m.get(r.checkId).push(r);
    }
  }
  return m;
}

// A gate step is done when its decision is recorded with an approving choice by a named person: the decision is its record.
export function effectiveStatus(project, checkId) {
  const st = project.checks[checkId];
  const status = st ? st.status : 'not_started';
  const g = project.gates && project.gates[checkId];
  if (g && APPROVED_DECISIONS.has(g.decision) && UNASSESSED.has(status)) return 'passed';
  return status;
}

export function evidenceCount(project, checkId) {
  const st = project.checks[checkId];
  if (!st) return 0;
  return st.evidenceIds.filter((id) => project.evidence[id]).length;
}

// Items of a stage, each with applicability and status.
export function stageItems(kb, project, stageId, appMap = applicabilityMap(kb, project)) {
  return kb.checks
    .filter((c) => c.stage === stageId)
    .map((c) => {
      const app = appMap.get(c.id);
      const status = effectiveStatus(project, c.id);
      const inScope = app.value !== 'not_applicable' && status !== 'not_applicable';
      return { check: c, app, status, inScope, evidence: evidenceCount(project, c.id) };
    });
}

export function summariseStage(kb, project, stageId, appMap) {
  const items = stageItems(kb, project, stageId, appMap);
  // Good-practice checks (scope 'extra') are listed, but never count toward progress or readiness.
  const inScope = items.filter((i) => i.inScope && i.check.scope !== 'extra');
  const extras = items.filter((i) => i.inScope && i.check.scope === 'extra');
  const counts = { total: items.length, inScope: inScope.length, outOfScope: items.filter((i) => !i.inScope).length, uncertain: 0 };
  for (const s of ['not_started', 'in_progress', 'passed', 'not_verified', 'failed', 'blocked', 'needs_review', 'not_applicable']) counts[s] = 0;
  // Status counts cover in-scope items only; items marked "not applicable" are counted as out of scope.
  for (const i of items) {
    if (i.inScope && i.check.scope !== 'extra') counts[i.status] += 1;
    else if (i.status === 'not_applicable') counts.not_applicable += 1;
  }
  counts.uncertain = inScope.filter((i) => i.app.value === 'unknown' && UNASSESSED.has(i.status)).length;
  const assessed = inScope.filter((i) => ASSESSED.has(i.status)).length;
  counts.assessed = assessed;
  counts.progress = inScope.length ? Math.round((assessed / inScope.length) * 100) : 0;
  return { stageId, items, inScope, extras, counts };
}

// Core conclusion algorithm (shared by all stages).
export function assessStage(kb, project, stageId, appMap = applicabilityMap(kb, project)) {
  const summary = summariseStage(kb, project, stageId, appMap);
  const exc = exceptionsByCheck(project);
  const blocking = [];
  const undetermined = [];
  const exceptions = [];
  const open = [];

  if (stageId === 'test' && project.stages.test.availability === 'unavailable') {
    const byPlan = project.stages.test.reason === REHEARSAL_OFF;
    return {
      stageId,
      level: 'skipped',
      label: byPlan ? CONCLUSION_LABELS.test.skippedByPlan : CONCLUSION_LABELS.test.skipped,
      summary,
      reasons: { blocking, undetermined, exceptions, open: [] },
      note: byPlan ? 'You chose not to include a test rehearsal in your plan. The change relies on the compensating controls in Stage 2.' : `No suitable test environment: ${project.stages.test.reason || 'no reason recorded'}. Production carries additional risk; see the compensating controls in Stage 2.`,
    };
  }

  const gateId = STAGE_GATES[stageId];
  const gate = gateId && project.gates[gateId] && APPROVED_DECISIONS.has(project.gates[gateId].decision) ? project.gates[gateId] : null;
  const acceptedAtGate = gate ? `done without proof; reviewed and accepted at the stage gate by ${gate.decidedBy}${gate.decidedRole ? ` (${gate.decidedRole})` : ''} on ${String(gate.at || '').slice(0, 10)}` : '';
  for (const i of summary.inScope) {
    const c = i.check;
    const crit = c.criticality;
    const accepted = exc.get(c.id) || [];
    const label = c.title;
    const majorItem = crit === 'critical' || crit === 'high';
    if (i.status === 'failed' || i.status === 'blocked') {
      if (accepted.length) exceptions.push({ id: c.id, text: `${label}: ${i.status === 'failed' ? 'failed' : 'blocked'}, accepted by ${accepted.map((a) => a.acceptedBy).join(', ')}` });
      else if (majorItem) blocking.push({ id: c.id, text: `${label}: ${i.status === 'failed' ? 'failed' : 'blocked'} (${crit})` });
      else open.push({ id: c.id, text: `${label}: ${i.status} (${crit})` });
      continue;
    }
    if (UNASSESSED.has(i.status)) {
      const why = i.app.value === 'unknown' ? 'applicability uncertain, not yet investigated' : i.status === 'needs_review' ? 'needs review' : 'not yet assessed';
      if (accepted.length) exceptions.push({ id: c.id, text: `${label}: ${why}, accepted by ${accepted.map((a) => a.acceptedBy).join(', ')}` });
      else if (majorItem) undetermined.push({ id: c.id, text: `${label}: ${why} (${crit})` });
      else open.push({ id: c.id, text: `${label}: ${why} (${crit})` });
      continue;
    }
    if (i.status === 'not_verified') {
      if (accepted.length) exceptions.push({ id: c.id, text: `${label}: your word only, accepted by ${accepted.map((a) => a.acceptedBy).join(', ')}` });
      else if (gate && (crit === 'critical' || crit === 'high')) exceptions.push({ id: c.id, text: `${label}: ${acceptedAtGate} (${crit})`, warning: true });
      else if (crit === 'critical') undetermined.push({ id: c.id, text: `${label}: recorded as done but not verified with evidence (critical)` });
      else if (crit === 'high') exceptions.push({ id: c.id, text: `${label}: your word only, no evidence (high)` });
      else open.push({ id: c.id, text: `${label}: your word only (${crit})` });
    }
  }

  // Register items linked to this stage's checks (or unlinked critical issues) also matter.
  const stageCheckIds = new Set(summary.items.map((i) => i.check.id));
  const knownIds = new Set(kb.checks.map((c) => c.id));
  for (const r of project.register) {
    const linked = r.checkId && stageCheckIds.has(r.checkId);
    const unlinked = !r.checkId || !knownIds.has(r.checkId);
    if (!linked && !(unlinked && stageId === 'prepare') && !(unlinked && stageId === 'validate')) continue;
    if (['done', 'closed', 'accepted'].includes(r.status)) continue;
    if ((r.type === 'issue' || r.type === 'risk') && r.severity === 'critical') blocking.push({ id: r.id, text: `Open ${r.type} (critical): ${r.title}` });
    else if ((r.type === 'issue' || r.type === 'risk' || r.type === 'action') && r.severity === 'high') open.push({ id: r.id, text: `Open ${r.type} (high): ${r.title}` });
  }
  for (const r of project.register) {
    if (r.type === 'exception' && r.status === 'accepted' && (!r.checkId || !knownIds.has(r.checkId) || stageCheckIds.has(r.checkId))) {
      if (!exceptions.some((e) => e.id === r.checkId)) exceptions.push({ id: r.id, text: `Accepted exception: ${r.title} (by ${r.acceptedBy})` });
    }
  }

  let level;
  if (blocking.length) level = 'not_ready';
  else if (summary.inScope.length === 0) level = 'undetermined';
  else if (undetermined.length) level = 'undetermined';
  else if (exceptions.length || open.length) level = 'ready_with_exceptions';
  else level = 'ready';

  return {
    stageId,
    level,
    label: CONCLUSION_LABELS[stageId][level],
    summary,
    reasons: { blocking, undetermined, exceptions, open },
  };
}

// Dependency status for an item: shows whether its prerequisites (often Stage 1 checks) are in place.
export function dependencyStatus(kb, project, check, appMap) {
  const deps = (check.dependsOn || []).map((id) => kb.checks.find((c) => c.id === id)).filter(Boolean);
  const problems = [];
  const pending = [];
  for (const d of deps) {
    const app = appMap.get(d.id);
    const st = effectiveStatus(project, d.id);
    if (app && app.value === 'not_applicable') continue;
    // Test-stage prerequisites only count when a test environment is actually available.
    if (d.stage === 'test' && project.stages.test.availability !== 'available') continue;
    if (st === 'not_applicable') continue;
    if (st === 'failed' || st === 'blocked') problems.push({ id: d.id, title: d.title, status: st });
    else if (UNASSESSED.has(st)) pending.push({ id: d.id, title: d.title, status: st });
  }
  return { deps, problems, pending };
}

// Next recommended action for the overview: first unassessed critical item in the earliest open stage.
export function nextAction(kb, project, appMap = applicabilityMap(kb, project)) {
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  for (const stageId of STAGES_ORDER) {
    if (stageId === 'test' && project.stages.test.availability !== 'available') continue;
    const s = summariseStage(kb, project, stageId, appMap);
    const candidates = s.inScope
      .filter((i) => UNASSESSED.has(i.status) || i.status === 'blocked')
      .sort((a, b) => (rank[a.check.criticality] - rank[b.check.criticality]) || ((a.check.order || 0) - (b.check.order || 0)));
    if (candidates.length) return { stageId, item: candidates[0] };
  }
  return null;
}

// Overall conclusion across several stages (final report): the worst stage level wins; a skipped test stage is neutral.
export const OVERALL_LABELS = {
  ready: 'All stages complete and verified',
  ready_with_exceptions: 'Complete with exceptions',
  undetermined: 'Incomplete, not yet possible to decide',
  not_ready: 'Blocking issues remain',
};
export function overallAssessment(kb, project, stageIds = STAGES_ORDER, appMap = applicabilityMap(kb, project)) {
  const rank = { not_ready: 0, undetermined: 1, ready_with_exceptions: 2, ready: 3 };
  const parts = stageIds.map((id) => assessStage(kb, project, id, appMap)).filter((a) => a.level !== 'skipped');
  let level = 'ready';
  for (const a of parts) if (rank[a.level] < rank[level]) level = a.level;
  if (!parts.length) level = 'undetermined';
  return { level, label: OVERALL_LABELS[level], stages: parts };
}

// Where the route marker stands. A stage holds it while it is incomplete, or while its gate has not approved, unless
// a later stage is complete with an approved gate (that puts the earlier ones behind you). Returns the stage index
// (stages.length when the journey is done), how far into that stage, and the gate note when a gate holds it.
export function routePosition(stageInfo) {
  const complete = (st) => (st.inScope > 0 ? st.assessed >= st.inScope : true);
  let last = -1;
  stageInfo.forEach((st, i) => { if (!st.skipped && complete(st) && st.gateDone) last = i; });
  for (let i = 0; i < stageInfo.length; i += 1) {
    const st = stageInfo[i];
    if (st.skipped) continue;
    if (!complete(st)) return { index: i, fraction: st.inScope ? st.assessed / st.inScope : 0, note: '' };
    if (!st.gateDone && i > last) return { index: i, fraction: 1, note: st.gateNote || '' };
  }
  return { index: stageInfo.length, fraction: 1, note: '' };
}
