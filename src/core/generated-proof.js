// Proof from the user's own entries: an observation note built from what a "do it here" form saved.
// Returns null when the form holds nothing yet. Wherever it is shown, it is labelled as generated.
import { plannedRole, DEFENDER_STATES } from './model.js';

const lines = (xs) => xs.filter(Boolean).join('\n');

export function generatedProof(kb, project, check) {
  const m = project.meta;
  const envs = (m.environments || []).filter((e) => e.alias);
  switch (check.tool) {
    case 'workspaces':
      return envs.length ? { title: 'Workspace inventory (from your entries)', text: lines(envs.map((e) => `${e.alias}: ${e.kind}${e.region ? `, ${e.region}` : ''}${e.tenant ? `, tenant ${e.tenant}` : ''}`)) } : null;
    case 'connection':
      return envs.length && envs.every((e) => e.defender !== 'unknown') ? { title: 'Connection state (from your entries)', text: lines(envs.map((e) => `${e.alias}: ${(DEFENDER_STATES.find((d) => d.id === e.defender) || { label: '' }).label}`)) } : null;
    case 'primary': {
      const rows = envs.filter((e) => plannedRole(project, e));
      return rows.some((e) => plannedRole(project, e) === 'primary') ? { title: 'Planned primary workspace (from your entries)', text: lines(rows.map((e) => `${e.alias}: planned ${plannedRole(project, e)}`)) } : null;
    }
    case 'window':
      return m.windowStart ? { title: 'Transition window (from your entries)', text: `Window: ${m.windowStart}${m.windowEnd ? ` to ${m.windowEnd}` : ''}.${m.startDate ? ` Project start: ${m.startDate}.` : ''}` } : null;
    case 'owners':
      return (m.approvers || []).length ? { title: 'Approvers (from your entries)', text: lines(m.approvers.map((a) => `${a.role}: ${a.name}`)) } : null;
    case 'briefing':
    case 'comms': {
      const used = project.audit.filter((a) => a.action === (check.tool === 'briefing' ? 'briefing.copied' : 'comms.copied'));
      return used.length ? { title: check.tool === 'briefing' ? 'Stakeholder briefing (from your entries)' : 'Team messages (from your entries)', text: lines(used.map((a) => `${a.at.slice(0, 10)}, ${a.by}: ${a.detail}`)) } : null;
    }
    default:
      return null;
  }
}
