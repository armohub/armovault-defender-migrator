// Missions: Simplified mode's view of the plan. A mission is a workstream, and its checklist is the
// workstream's checks over the same records as Detailed mode. Nothing here changes a record.
import { questionsUsed, visibleQuestions } from './applicability.js';
import { effectiveStatus } from './readiness.js';
import { leftOutByPlan } from './depth.js';

export const DONE_STATUSES = new Set(['passed', 'not_verified', 'not_applicable']);
const ATTENTION_STATUSES = new Set(['failed', 'blocked', 'needs_review']);
const testUsed = (project) => project.stages.test.availability === 'available';

// Unanswered questions that decide whether these checks apply. None in full-checklist mode.
export function missionQuestions(kb, project, checks) {
  if (project.mode === 'full') return [];
  const used = new Set();
  for (const c of checks) if (c.applicability && !leftOutByPlan(c, project)) questionsUsed(c.applicability, used);
  const visible = new Set(visibleQuestions(kb, project).map((q) => q.id));
  return kb.questions.filter((q) => used.has(q.id) && visible.has(q.id) && !project.answers[q.id]);
}

export function missionOf(kb, project, stageId, workstreamId, appMap) {
  const ws = kb.workstreams.find((w) => w.stage === stageId && w.id === workstreamId);
  if (!ws) return null;
  const rows = kb.checks
    .filter((c) => c.stage === stageId && c.workstream === workstreamId)
    .sort((a, b) => a.order - b.order)
    .map((check) => ({ check, app: appMap.get(check.id), status: effectiveStatus(project, check.id) }));
  const inScope = rows.filter((r) => r.app.value !== 'not_applicable');
  const needed = inScope.filter((r) => r.check.scope !== 'extra');
  const done = needed.filter((r) => DONE_STATUSES.has(r.status)).length;
  return {
    stage: stageId,
    workstream: workstreamId,
    key: `${stageId}:${workstreamId}`,
    title: ws.mission.title,
    purpose: ws.mission.purpose,
    needed,
    extras: inScope.filter((r) => r.check.scope === 'extra'),
    setAside: rows.filter((r) => r.app.value === 'not_applicable'),
    done,
    total: needed.length,
    complete: done === needed.length,
    attention: needed.filter((r) => ATTENTION_STATUSES.has(r.status)).length,
    questions: missionQuestions(kb, project, rows.map((r) => r.check)),
  };
}

export function missionsForStage(kb, project, stageId, appMap) {
  return kb.workstreams.filter((w) => w.stage === stageId).map((w) => missionOf(kb, project, stageId, w.id, appMap));
}

// The first mission, in route order, with needed work left. The Test stage counts only when it is used.
export function nextMission(kb, project, appMap) {
  for (const s of kb.stages) {
    if (s.id === 'test' && !testUsed(project)) continue;
    const m = missionsForStage(kb, project, s.id, appMap).find((x) => !x.complete);
    if (m) return m;
  }
  return null;
}

// The row to open first: the first needed check without an outcome, failed and blocked included.
export function firstOpenRow(mission) {
  return mission.needed.find((r) => !DONE_STATUSES.has(r.status)) || null;
}

// Every mission on the route, by stage, with what is done. Extras never count.
export function journey(kb, project, appMap) {
  const stages = kb.stages.filter((s) => s.id !== 'test' || testUsed(project)).map((s) => {
    const missions = missionsForStage(kb, project, s.id, appMap);
    return { stage: s, missions, complete: missions.every((m) => m.complete) };
  });
  const all = stages.flatMap((x) => x.missions);
  const done = all.reduce((n, m) => n + m.done, 0);
  const total = all.reduce((n, m) => n + m.total, 0);
  return { stages, done, total, pct: total ? Math.round((done / total) * 100) : 100, missionsDone: all.filter((m) => m.complete).length, missions: all.length };
}

// In Simplified, a step opened from its mission stays inside it: the mission, the checks before and after it in the
// mission, and the mission after this one in route order. Null in Detailed, or for a step that is set aside.
export function missionContext(kb, project, checkId, appMap) {
  if (project.guidance !== 'simple') return null;
  const check = kb.checks.find((c) => c.id === checkId);
  if (!check) return null;
  const mission = missionOf(kb, project, check.stage, check.workstream, appMap);
  const rows = mission ? [...mission.needed, ...mission.extras] : [];
  const i = rows.findIndex((r) => r.check.id === checkId);
  if (i < 0) return null;
  const order = journey(kb, project, appMap).stages.flatMap((x) => x.missions);
  const at = order.findIndex((m) => m.key === mission.key);
  return { mission, prev: i > 0 ? rows[i - 1].check : null, next: rows[i + 1] ? rows[i + 1].check : null, after: at >= 0 ? order[at + 1] || null : null };
}
