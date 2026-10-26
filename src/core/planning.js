// Window planner profile: which time ranges fit this project. "auto" follows the answers and the
// workspace list; a team can choose another profile. The ranges are practical guidance, not Microsoft's.
import { PLAN_PROFILES } from './model.js';

const answered = (project, id, values) => !!(project.answers[id] && values.includes(project.answers[id].value));

export function suggestedProfile(project) {
  const yes = (id) => answered(project, id, ['yes']);
  const no = (id) => answered(project, id, ['no', 'na']);
  const envs = (project.meta.environments || []).filter((e) => e.alias);
  if (yes('multi_workspace') || yes('multi_tenant') || yes('playbooks') || yes('itsm') || envs.length > 2) return 'larger';
  if (envs.length <= 1 && ['multi_workspace', 'multi_tenant', 'playbooks', 'itsm'].every(no)) return 'lean';
  return 'smaller';
}

export function planProfile(project) {
  const chosen = project.meta.planProfile;
  return chosen && chosen !== 'auto' && PLAN_PROFILES.includes(chosen) ? chosen : suggestedProfile(project);
}
