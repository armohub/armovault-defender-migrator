// Window planner profile: which time ranges fit this project. "auto" follows the answers and the
// workspace list; a team can choose another profile. The ranges are practical guidance, not Microsoft's.
// One sign of a bigger environment is not enough for the longer ranges: it takes several workspaces in the
// list, several tenants, or two signs together. Without answers the planner stays on the standard ranges.
import { PLAN_PROFILES } from './model.js';

const answered = (project, id, values) => !!(project.answers[id] && values.includes(project.answers[id].value));
const SIGNS = [
  ['multi_workspace', 'more than one workspace in scope'],
  ['multi_tenant', 'more than one tenant'],
  ['playbooks', 'playbooks run from automation'],
  ['itsm', 'a ticketing (ITSM) integration'],
];

// { profile, reasons: [plain-language reasons], known: whether any answer or workspace list informed it }
export function profileReasons(project) {
  const yes = (id) => answered(project, id, ['yes']);
  const no = (id) => answered(project, id, ['no', 'na']);
  const envs = (project.meta.environments || []).filter((e) => e.alias);
  const signs = SIGNS.filter(([id]) => yes(id)).map(([, label]) => label);
  const reasons = [...signs];
  if (envs.length > 2) reasons.unshift(`${envs.length} workspaces in your list`);
  const known = envs.length > 0 || SIGNS.some(([id]) => yes(id) || no(id));
  if (envs.length > 2 || yes('multi_tenant') || signs.length >= 2) return { profile: 'larger', reasons, known };
  if (envs.length <= 1 && SIGNS.every(([id]) => no(id))) return { profile: 'lean', reasons: ['one workspace, one tenant, no playbooks and no ticketing integration'], known };
  return { profile: 'smaller', reasons, known };
}

export function suggestedProfile(project) {
  return profileReasons(project).profile;
}

export function planProfile(project) {
  const chosen = project.meta.planProfile;
  return chosen && chosen !== 'auto' && PLAN_PROFILES.includes(chosen) ? chosen : suggestedProfile(project);
}
