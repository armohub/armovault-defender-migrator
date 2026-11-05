// "Do it here" tools: the forms a step needs, right inside the step, so information is entered once
// and reused everywhere it is needed (project setup, other steps, reports).
import { h, icon, toast, field, copyText, savedPulse, externalLink, modal } from './dom.js';
import { state, mutate } from '../app/store.js';
import { render } from './shell.js';
import { readyText, emailActions } from './templates.js';
import { setPlanProfile, setOwnersWanted, setEnvironments, setPlannedPrimary, plannedPrimaryOf, plannedRole, setWorkstreamOwners, setWorkstreamPeople, cleanWorkstreamPeople, setApprovers, setCheckField, DEFENDER_STATES, ENV_KINDS, workstreamKey, knownPeople, addAudit, setHelper, MAX_HELPER_SUBJECTS, addPerson, peopleWithRoles, setAnswer, setPlanDepth, setShowExtras, connectionState, syncConnectionAnswer, tenantConnected } from '../core/model.js';
import { applicabilityMap } from '../core/applicability.js';
import { DEPTHS, TOPICS, tierOf, topicPreset, planOf, planSummary } from '../core/depth.js';
import { evaluateHelper, decisionDraft } from '../core/decision-helper.js';
import { formatDate } from '../core/util.js';
import { btn, callout, infoTip } from './components.js';
import { planProfile, suggestedProfile, profileReasons } from '../core/planning.js';
import { rich, renderList } from './rich.js';
import { editRegisterItem } from './views/records.js';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Names the project already knows, offered as suggestions in every name field.
export function peopleList() {
  return h('datalist', { id: 'people-list' }, knownPeople(state.project).map((n) => h('option', { value: n })));
}

// A person list: everyone the project knows, with their role, and "Add a new person" at the end. A new person
// is recorded with a role, so they appear in every other person list too. Rebuilds itself, so it also works in dialogs.
const ROLE_SUGGESTIONS = ['SOC lead', 'SOC analyst', 'Detection engineer', 'Security architect', 'Security engineer', 'Project manager', 'Identity and access management', 'Data protection and compliance', 'Change advisory board', 'Ticketing (ITSM) owner', 'Cloud platform team'];
const NEW_PERSON = '__new__';
// extra: names not saved yet that the list should still offer (for example people typed into the same form).
export function personPicker({ value = '', onChange, label, focusKey, placeholder = 'Not set', id, cls, extra } = {}) {
  let current = String(value || '');
  const sel = h('select', { id, class: ['person-picker', cls], 'aria-label': label, 'data-focus-key': focusKey });
  const fill = () => {
    const people = peopleWithRoles(state.project);
    for (const n of (extra ? extra() : []).map((x) => String(x || '').trim()).filter(Boolean)) if (!people.some((x) => x.name === n)) people.push({ name: n, role: '' });
    if (current && !people.some((x) => x.name === current)) people.unshift({ name: current, role: '' });
    sel.replaceChildren(
      h('option', { value: '', selected: !current }, placeholder),
      ...people.map((x) => h('option', { value: x.name, selected: x.name === current }, x.role ? `${x.name} (${x.role})` : x.name)),
      h('option', { value: NEW_PERSON }, '+ Add a new person'));
  };
  fill();
  sel.addEventListener('change', async () => {
    if (sel.value !== NEW_PERSON) { current = sel.value; if (onChange) onChange(current); return; }
    const name = h('input', { type: 'text', maxlength: '200', placeholder: 'Name or team' });
    const role = h('input', { type: 'text', maxlength: '200', list: 'person-role-list', placeholder: 'For example: SOC lead' });
    const res = await modal({
      title: 'Add a new person',
      body: h('div', { class: 'stack' },
        h('p', { class: 'small muted' }, 'They are added to the project and offered in every person list, with their role.'),
        field('Name', name, { required: true }), field('Role', role, { hint: 'What they do in this project, or their job title.' }),
        h('datalist', { id: 'person-role-list' }, ROLE_SUGGESTIONS.map((r) => h('option', { value: r })))),
      actions: [{ label: 'Cancel', value: null }, { label: 'Add', kind: 'primary', value: () => (name.value.trim() ? { name: name.value.trim(), role: role.value.trim() } : (toast('Please enter a name.', 'bad'), null)) }],
      onOpen: () => name.focus(),
    });
    if (!res) { fill(); return; }
    const out = mutate((pr) => addPerson(pr, res), { silent: true });
    if (!out || !out.ok) { toast((out && out.error) || 'The person could not be added.', 'bad'); fill(); return; }
    current = out.name;
    fill();
    savedPulse(`${out.name} added`);
    if (onChange) onChange(current);
  });
  sel.refill = fill;
  return sel;
}

function saveBar(dirty, onSave, onDiscard, savedText) {
  return h('div', { class: 'tool-bar' },
    h('span', { class: 'small muted' }, dirty ? 'Changes not saved yet.' : savedText),
    dirty ? btn('Discard', onDiscard, { kind: 'ghost', small: true }) : null,
    h('button', { type: 'button', class: 'btn btn-primary btn-sm', disabled: !dirty, onclick: onSave }, icon('check', 'icon-sm'), 'Save'));
}

// ───────── How thorough: the plan depth and its topics ─────────
const TOPIC_HINT = {
  backups: 'the configuration backup, the pre-change snapshot and the baselines',
  rehearsal: 'the optional Test stage, in a non-production environment',
  verification: 'the checks after the change and in Validate, beyond the must-do ones',
};
// The choices, used in setup (a draft) and in Project setup (the project). onDepth(id), onTopic(id, on).
export function planChoices({ depth, topics, onDepth, onTopic, name = 'plan-depth', legend = 'How much should the plan cover?' }) {
  const kb = state.kb;
  const upTo = (keeps) => kb.checks.filter((c) => keeps.includes(tierOf(c))).length;
  const desc = {
    essentials: `Only the must-do steps: up to ${upTo(['must'])} of the ${kb.checks.length} steps. For a simple environment or a tight timeline.`,
    recommended: `Must-do and recommended steps: up to ${upTo(['must', 'recommended'])} of the ${kb.checks.length} steps, plus the good-practice extras, which you can hide.`,
    thorough: `Every step: up to all ${kb.checks.length}, the useful ones included.`,
  };
  return h('div', { class: 'stack plan-choices' },
    h('fieldset', { class: 'choices' }, h('legend', { class: 'small muted' }, legend),
      DEPTHS.map((d) => h('label', { class: ['choice', depth === d.id && 'selected'] },
        h('input', { type: 'radio', name, value: d.id, checked: depth === d.id, 'data-focus-key': `${name}-${d.id}`, onchange: () => onDepth(d.id) }),
        h('div', null, h('strong', null, d.id === 'recommended' ? 'Recommended (default)' : d.label), h('p', { class: 'small' }, desc[d.id]))))),
    h('fieldset', { class: 'plan-topics stack' }, h('legend', { class: 'small muted' }, 'Also include'),
      TOPICS.map((t) => h('label', { class: 'check-line' },
        h('input', { type: 'checkbox', checked: !!topics[t.id], 'data-focus-key': `${name}-topic-${t.id}`, onchange: (e) => onTopic(t.id, e.target.checked) }),
        h('span', null, ` ${t.label}`, h('span', { class: 'small muted' }, `: ${TOPIC_HINT[t.id]}`))))),
    h('p', { class: 'small muted' }, 'Your answers and your inventory still decide what applies, so your plan is often shorter. Must-do steps always stay. Steps left out are set aside with the reason, never deleted, and you can change this later in Project setup.'));
}

// Project setup: the same choices, applied at once, with what they mean for the plan.
export function planTool() {
  const p = state.project;
  if (p.mode === 'full') return h('div', { class: 'tool' }, callout('info', 'This project uses the full checklist.', ' Every step is shown, so the plan depth does not apply. Switch to tailoring in Your answers to use it.'));
  const { depth, topics } = planOf(p);
  const count = () => { const app = applicabilityMap(state.kb, state.project); return { inPlan: state.kb.checks.filter((c) => app.get(c.id).value !== 'not_applicable').length, out: state.kb.checks.filter((c) => app.get(c.id).source === 'plan').length }; };
  const apply = (d, t) => {
    const before = count().inPlan;
    mutate((pr) => setPlanDepth(pr, d, t));
    const after = count();
    toast(`Your plan now has ${after.inPlan} step${after.inPlan === 1 ? '' : 's'} (${after.inPlan >= before ? `${after.inPlan - before} more` : `${before - after.inPlan} fewer`}). ${after.out} left out by the plan.`, 'good', 7000);
  };
  return h('div', { class: 'tool' },
    h('p', { class: 'small' }, planSummary(p, count().out)),
    planChoices({ depth, topics, name: 'proj-depth', onDepth: (d) => apply(d, topicPreset(d)), onTopic: (id, on) => apply(depth, { ...topics, [id]: on }) }),
    h('label', { class: 'check-line' }, h('input', { type: 'checkbox', checked: p.meta.showExtras !== false, 'data-focus-key': 'proj-show-extras', onchange: (e) => mutate((pr) => setShowExtras(pr, e.target.checked)) }), ' Show the good-practice extras in missions (not needed for the move, never counted)'),
    h('p', { class: 'small muted' }, 'This only shows or hides the extras. To leave out the Recommended steps, choose Essentials above.'));
}

// ───────── Workspace inventory ─────────
const envDraft = { id: '', base: '', rows: [] };
const blankEnv = () => ({ alias: '', kind: 'production', tenant: '', subscription: '', resourceGroup: '', region: '', owner: '', defender: 'unknown', notes: '' });
function envRows() {
  const p = state.project;
  const base = JSON.stringify(p.meta.environments || []);
  const dirty = envDraft.id === p.id && JSON.stringify(envDraft.rows) !== envDraft.base;
  if (envDraft.id !== p.id || (!dirty && envDraft.base !== base)) {
    envDraft.id = p.id;
    envDraft.base = base;
    envDraft.rows = (p.meta.environments || []).map((e) => ({ ...blankEnv(), ...e }));
    if (!envDraft.rows.length) envDraft.rows.push(blankEnv());
    envDraft.base = JSON.stringify(envDraft.rows);
  }
  return envDraft.rows;
}

export function workspaceTool({ show = 'all' } = {}) {
  const rows = envRows();
  const multiTenant = (state.project.answers.multi_tenant && state.project.answers.multi_tenant.value === 'yes') || rows.some((r) => r.tenant);
  const dirty = JSON.stringify(rows) !== envDraft.base;
  const sel = (value, options, onchange, label) => h('select', { 'aria-label': label, onchange: (e) => { onchange(e.target.value); render(); } }, options.map(([v, l]) => h('option', { value: v, selected: value === v }, l)));
  const inp = (row, key, label, attrs = {}) => field(label, key === 'owner'
    ? personPicker({ value: row.owner, label, onChange: (v) => { row.owner = v; refresh(); } })
    : h('input', { type: 'text', value: row[key] || '', maxlength: '200', oninput: (e) => { row[key] = e.target.value; refresh(); }, ...attrs }));
  const cards = rows.map((r, i) => h('div', { class: 'ws-card' },
    h('div', { class: 'ws-card-head' }, h('strong', null, r.alias || `Workspace ${i + 1}`),
      rows.length > 1 ? h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove ${r.alias || `workspace ${i + 1}`}`, onclick: () => { rows.splice(i, 1); render(); } }, icon('trash', 'icon-sm')) : null),
    h('div', { class: 'tool-grid' },
      inp(r, 'alias', 'Workspace alias', { maxlength: '120', placeholder: 'For example: SOC-PROD-WEU', 'data-focus-key': `env-alias-${i}` }),
      field('Environment', sel(r.kind, ENV_KINDS.map((k) => [k, k[0].toUpperCase() + k.slice(1)]), (v) => { r.kind = v; }, 'Environment')),
      field('In the Defender portal', sel(r.defender, DEFENDER_STATES.map((d) => [d.id, d.label]), (v) => { r.defender = v; }, 'Defender portal connection'))),
    show === 'connection' ? null : h('div', { class: 'tool-grid' },
      inp(r, 'subscription', 'Subscription (name or ID)'),
      inp(r, 'resourceGroup', 'Resource group'),
      inp(r, 'region', 'Region', { maxlength: '80', placeholder: 'For example: West Europe' })),
    show === 'connection' ? null : h('div', { class: ['tool-grid', multiTenant ? null : 'two'] }, multiTenant ? inp(r, 'tenant', 'Tenant (alias)', { maxlength: '120', placeholder: 'For example: Contoso EU' }) : null, inp(r, 'owner', 'Owner (team or person)'), inp(r, 'notes', 'Notes', { maxlength: '2000' }))));
  const ans = state.project.answers.onboarded_any;
  const wrap = h('div', { class: 'tool' },
    show === 'connection' && connectionState(state.project).all && !(state.project.answers.all_connected && state.project.answers.all_connected.value === 'yes')
      ? callout('info', 'Every production workspace is connected.', ' Your plan can skip the steps for connecting and focus on checking. ', btn('Focus on checking', () => offerCheckingFocus(), { small: true })) : null,
    show === 'connection' && ans ? callout('info', `In the questions you answered: ${ans.value === 'yes' ? 'Yes, a workspace is already connected' : ans.value === 'no' ? 'No workspace is connected yet' : ans.value === 'unknown' ? 'I don\'t know yet' : 'Not applicable'}.`, ' Confirm it here for each workspace.') : null,
    h('p', { class: 'small muted' }, 'One list for the whole project. What you enter here also appears in Project setup, in the steps that need it, and in your reports. No secrets: names, aliases and IDs only.'),
    ...cards,
    btn('Add a workspace', () => { rows.push(blankEnv()); render(); }, { small: true, iconName: 'plus' }));
  const barSlot = h('div');
  function refresh() { barSlot.replaceChildren(saveBar(JSON.stringify(rows) !== envDraft.base, save, discard, `${(state.project.meta.environments || []).length} workspace(s) saved.`)); }
  function save() {
    const wasAll = connectionState(state.project).all;
    const res = mutate((pr) => { const r = setEnvironments(pr, rows); if (r.ok) syncConnectionAnswer(pr); return r; });
    if (res && !res.ok) { toast(res.error, 'bad', 9000); return; }
    envDraft.id = '';
    savedPulse('Workspaces saved');
    render();
    const nowAll = connectionState(state.project).all;
    const focus = state.project.answers.all_connected;
    if (nowAll && !wasAll && !(focus && focus.value === 'yes')) offerCheckingFocus();
    else if (!nowAll && focus && focus.value === 'yes') {
      mutate((pr) => setAnswer(pr, 'all_connected', 'no', 'From the connection check: not every production workspace is connected'));
      toast('Not every production workspace is connected now, so the steps for connecting are back in your plan.', 'info', 8000);
    }
  }
  function discard() { envDraft.id = ''; render(); }
  refresh();
  wrap.appendChild(barSlot);
  if (dirty) refresh();
  return wrap;
}

// Every production workspace is connected: offer to focus the plan on checking. The steps for connecting are set
// aside with that reason, never deleted, and come back when a workspace is marked as not connected.
async function offerCheckingFocus() {
  const before = applicabilityMap(state.kb, state.project);
  const choice = await modal({
    title: 'Your workspaces are already in the Defender portal',
    body: h('div', { class: 'stack' },
      h('p', null, 'Every production workspace is marked as connected, so the changes of the move already apply.'),
      h('p', null, 'Your plan can skip the steps for connecting, such as the change window, the operator\'s roles and the change itself, and focus on checking that everything works. The checks on what changed stay, and so do the checks after the change and Stage 3 validation.'),
      h('p', { class: 'small muted' }, 'Set-aside steps stay visible, with the reason. They come back if you mark a workspace as not connected.')),
    actions: [{ label: 'Keep the full plan', value: 'keep' }, { label: 'Focus on checking', kind: 'primary', value: 'focus' }],
  });
  if (choice === 'focus') {
    mutate((pr) => setAnswer(pr, 'all_connected', 'yes', 'From the connection check: every production workspace is connected'));
    const after = applicabilityMap(state.kb, state.project);
    const n = state.kb.checks.filter((c) => before.get(c.id).value !== 'not_applicable' && after.get(c.id).value === 'not_applicable').length;
    toast(`${n} step${n === 1 ? '' : 's'} for connecting set aside. Next: check that everything works.`, 'good', 8000);
  }
}

// Planned primary workspace: one per tenant, a decision separate from what is connected today.
// Every other workspace of the tenant becomes secondary, and the tool says what that means.
export function primaryTool() {
  const kb = state.kb;
  const p = state.project;
  const roles = kb.reference.workspaceRoles;
  const envs = (p.meta.environments || []).filter((e) => e.alias);
  if (!envs.length) return h('div', { class: 'tool' }, callout('info', 'Add your workspaces first.', ' ', h('a', { href: '#/item/PREP-TOP-01' }, 'Inventory your workspaces'), ', then come back to choose the primary one.'));
  const tenants = [...new Set(envs.map((e) => e.tenant || ''))];
  const byTenant = tenants.length > 1 || tenants[0] !== '';
  const cite = roles.sources.map((id) => kb.sources.find((x) => x.id === id)).filter(Boolean);
  const group = (tenant, ti) => {
    const list = envs.filter((e) => (e.tenant || '') === tenant);
    const primary = plannedPrimaryOf(p, tenant);
    const secondaries = list.filter((e) => primary && e.alias !== primary);
    const prod = list.filter((e) => e.kind === 'production');
    const choose = (alias) => mutate((pr) => setPlannedPrimary(pr, tenant, alias));
    return h('div', { class: 'stack primary-group' },
      h('fieldset', { class: 'choices' }, h('legend', { class: 'small muted' }, byTenant ? `Tenant ${tenant || '(not set)'}: which workspace should be primary?` : 'Which workspace should be primary?'),
        list.map((e) => {
          const role = plannedRole(p, e);
          return h('label', { class: ['choice', role === 'primary' && 'selected'] },
            h('input', { type: 'radio', name: `planned-primary-${ti}`, checked: role === 'primary', 'data-focus-key': `primary-${ti}-${e.alias}`, onchange: () => { choose(e.alias); savedPulse('Primary workspace recorded'); } }),
            h('div', null,
              h('div', { class: 'row' }, h('strong', null, e.alias), role ? h('span', { class: ['chip', role === 'primary' ? 'chip-accent' : null] }, role === 'primary' ? 'Primary' : 'Secondary') : null),
              h('p', { class: 'small' }, [e.kind[0].toUpperCase() + e.kind.slice(1), e.region, (DEFENDER_STATES.find((d) => d.id === e.defender) || {}).label].filter(Boolean).join(', '))));
        })),
      prod.length > 1 ? callout('info', `${prod.length} production workspaces${byTenant ? ` in tenant ${tenant || '(not set)'}` : ''}.`, ' ', roles.split) : null,
      primary && list.length > 1 ? h('div', { class: 'brief-cols role-cols' },
        h('div', { class: 'brief-col' }, h('h3', null, `Primary: ${primary}`), h('ul', { class: 'bullets' }, roles.primary.map((x) => h('li', null, x)))),
        h('div', { class: 'brief-col' }, h('h3', null, `${secondaries.length === 1 ? 'Secondary' : 'Each secondary'}: ${secondaries.map((e) => e.alias).join(', ')}`), h('ul', { class: 'bullets' }, roles.secondary.map((x) => h('li', null, x))))) : null);
  };
  const any = tenants.some((t) => plannedPrimaryOf(p, t));
  return h('div', { class: 'tool' },
    byTenant ? h('p', { class: 'small muted' }, 'Each tenant has exactly one primary workspace. Choose one per tenant.') : null,
    ...tenants.map(group),
    any ? h('p', { class: 'small muted' }, roles.shared, ' Recorded as your plan. Record who approved it with ', h('strong', null, 'Add the decision'), ' in the steps below. Sources: ', ...cite.flatMap((x, i) => [i ? ', ' : '', externalLink(x.url, x.title)]), '.') : null);
}

// ───────── Owners and approvers ─────────
// One lead per workstream, the other people in it with what they cover, and an owner per step where
// it differs from the lead (for example the timeline step goes to the project manager).
const APPROVER_ROLES = ['Change advisory board', 'Data protection and compliance', 'Identity and access management', 'Ticketing (ITSM) owner', 'SOC lead', 'Security architect'];
const ownDraft = { id: '', src: '', base: '', owners: {}, people: {}, steps: {}, approvers: [] };
const ownOpen = { id: '', keys: new Set() };
const pruneMap = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => String(v || '').trim()));
const prunePeople = (m) => Object.fromEntries(Object.entries(m).map(([k, l]) => [k, l.filter((x) => x.name.trim())]).filter(([, l]) => l.length));
const draftJson = (d) => JSON.stringify([pruneMap(d.owners), prunePeople(d.people), pruneMap(d.steps), d.approvers]);
const stepOwnersOf = (p) => Object.fromEntries(Object.entries(p.checks).filter(([, st]) => st && st.owner).map(([id, st]) => [id, st.owner]));
const personText = (x) => (x.covers ? `${x.name} (${x.covers})` : x.name);
function ownersDraft() {
  const p = state.project;
  const src = JSON.stringify([p.meta.workstreamOwners || {}, p.meta.workstreamPeople || {}, stepOwnersOf(p), p.meta.approvers || []]);
  const dirty = ownDraft.id === p.id && draftJson(ownDraft) !== ownDraft.base;
  if (ownDraft.id !== p.id || (!dirty && ownDraft.src !== src)) {
    ownDraft.id = p.id;
    ownDraft.src = src;
    ownDraft.owners = { ...(p.meta.workstreamOwners || {}) };
    ownDraft.people = Object.fromEntries(Object.entries(p.meta.workstreamPeople || {}).map(([k, l]) => [k, l.map((x) => ({ ...x }))]));
    ownDraft.steps = stepOwnersOf(p);
    ownDraft.approvers = (p.meta.approvers || []).map((x) => ({ ...x }));
    if (!ownDraft.approvers.length) ownDraft.approvers = APPROVER_ROLES.slice(0, 5).map((role) => ({ role, name: '' }));
    ownDraft.base = draftJson(ownDraft);
  }
  if (ownOpen.id !== p.id) { ownOpen.id = p.id; ownOpen.keys = new Set(['stage:prepare']); }
  return ownDraft;
}

// simple: only "who approves the change" (Simplified, or Detailed after "Later").
// setupPage: Project setup always shows the full form, without the question.
export function ownersTool({ simple, setupPage = false } = {}) {
  const p0 = state.project;
  if (simple === undefined) simple = p0.guidance === 'simple';
  if (!setupPage && !simple && !p0.meta.ownersWanted) {
    return h('div', { class: 'tool stack' },
      h('p', null, 'Do you want to record owners for this project? Most teams start with who approves the change, and add owners per workstream later.'),
      h('div', { class: 'row-actions' },
        btn('Yes, record owners', () => mutate((pr) => setOwnersWanted(pr, 'yes')), { kind: 'primary', small: true }),
        btn('Later', () => mutate((pr) => setOwnersWanted(pr, 'later')), { small: true })));
  }
  const kb = state.kb;
  const p = state.project;
  const d = ownersDraft();
  const app = applicabilityMap(kb, p);
  const testUsed = p.stages.test.availability !== 'unavailable';
  const barSlot = h('div');
  const refresh = () => barSlot.replaceChildren(saveBar(draftJson(d) !== d.base, save, discard, 'Saved. Each step shows its own owner, or else its workstream lead.'));
  // Opens and closes are remembered, so adding a person does not fold the section you are working in.
  const disclose = (key, cls, summary, ...body) => h('details', { class: ['disclose', cls], open: ownOpen.keys.has(key), ontoggle: (e) => { if (e.target.open) ownOpen.keys.add(key); else ownOpen.keys.delete(key); } }, h('summary', null, icon('chevron', 'icon-sm'), ...summary), ...body);
  const addAndFocus = (fn, focusKey) => { fn(); render(); const el = document.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`); if (el) el.focus(); };

  const workstream = (stage, ws) => {
    const key = workstreamKey(stage.id, ws.id);
    const people = d.people[key] || (d.people[key] = []);
    const steps = kb.checks.filter((c) => c.stage === ws.stage && c.workstream === ws.id && (app.get(c.id) || {}).value !== 'not_applicable');
    const named = people.filter((x) => x.name.trim()).length;
    const ownSteps = steps.filter((c) => (d.steps[c.id] || '').trim()).length;
    const team = h('datalist', { id: `team-${key}` });
    const stepPickers = [];
    const teamNames = () => [d.owners[key], ...people.map((x) => x.name)];
    const fillTeam = () => { team.replaceChildren(...[...new Set([...teamNames(), ...knownPeople(p)].map((n) => String(n || '').trim()).filter(Boolean))].map((n) => h('option', { value: n }))); stepPickers.forEach((x) => x.refill()); };
    fillTeam();
    const counts = () => [named ? `${named} more ${named === 1 ? 'person' : 'people'}` : '', ownSteps ? `${ownSteps} of ${steps.length} steps with their own owner` : ''].filter(Boolean).join(', ');
    const personRow = (x, i) => h('div', { class: 'person-row' },
      h('input', { type: 'text', list: 'people-list', maxlength: '200', placeholder: 'Name or team', 'aria-label': `${ws.title}: person ${i + 1}`, value: x.name, 'data-focus-key': `ppl-${key}-${i}`, oninput: (e) => { x.name = e.target.value; fillTeam(); refresh(); } }),
      h('input', { type: 'text', maxlength: '200', placeholder: 'What they cover', 'aria-label': `${ws.title}: what person ${i + 1} covers`, value: x.covers, oninput: (e) => { x.covers = e.target.value; refresh(); } }),
      h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove ${x.name || `person ${i + 1}`} from ${ws.title}`, onclick: () => { people.splice(i, 1); render(); } }, icon('trash', 'icon-sm')));
    const stepRow = (c) => {
      const picker = personPicker({ id: `own-step-${c.id}`, value: d.steps[c.id] || '', placeholder: d.owners[key] ? `Lead: ${d.owners[key]}` : 'Not set', focusKey: `own-step-${c.id}`, extra: teamNames, onChange: (v) => { d.steps[c.id] = v; refresh(); } });
      stepPickers.push(picker);
      return h('div', { class: 'owner-row step-owner' }, h('label', { for: `own-step-${c.id}` }, c.title), picker);
    };
    return h('div', { class: 'ws-owner' },
      h('div', { class: 'owner-row' },
        h('label', { for: `own-${key}` }, ws.title, h('span', { class: 'small muted' }, ` ${steps.length} step${steps.length === 1 ? '' : 's'}`)),
        personPicker({ id: `own-${key}`, value: d.owners[key] || '', placeholder: 'Lead: not set', label: `${ws.title}: lead`, focusKey: `own-${key}`, onChange: (v) => { d.owners[key] = v; fillTeam(); refresh(); } })),
      disclose(`ws:${key}`, 'ws-more', ['More people and step owners', h('span', { class: 'small muted' }, counts())],
        h('div', { class: 'ws-more-body' },
          team,
          h('p', { class: 'small muted' }, 'Other people in this workstream, and what they cover (for example: timeline).'),
          people.length ? h('div', { class: 'owner-grid' }, people.map(personRow)) : null,
          h('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'data-focus-key': `ppl-add-${key}`, onclick: () => addAndFocus(() => people.push({ name: '', covers: '' }), `ppl-${key}-${people.length}`) }, icon('plus', 'icon-sm'), 'Add a person'),
          steps.length ? h('p', { class: 'small muted', style: { marginTop: '12px' } }, 'Owner per step. Leave a step blank and it shows the lead.') : null,
          steps.length ? h('div', { class: 'owner-grid' }, steps.map(stepRow)) : null)));
  };
  const stageBlock = (stage) => {
    const list = kb.workstreams.filter((w) => w.stage === stage.id);
    const led = list.filter((w) => (d.owners[workstreamKey(stage.id, w.id)] || '').trim()).length;
    return disclose(`stage:${stage.id}`, 'owner-stage', [stage.short, h('span', { class: 'small muted tnum' }, ` ${led} of ${list.length} with a lead`)],
      stage.id !== 'prepare' ? h('div', { class: 'row', style: { margin: '8px 0' } }, btn('Use the Prepare leads and people where the area matches', () => {
        for (const w of list) {
          const k = workstreamKey(stage.id, w.id);
          const pk = workstreamKey('prepare', w.id);
          if (d.owners[pk] && !d.owners[k]) d.owners[k] = d.owners[pk];
          if ((d.people[pk] || []).length && !(d.people[k] || []).some((x) => x.name.trim())) d.people[k] = d.people[pk].map((x) => ({ ...x }));
        }
        render();
      }, { small: true, kind: 'ghost' })) : null,
      h('div', { class: 'owner-grid' }, list.map((w) => workstream(stage, w))));
  };
  const approvers = h('div', { class: 'owner-grid' }, d.approvers.map((x, i) => h('div', { class: 'approver-row' },
    h('input', { type: 'text', list: 'role-list', 'aria-label': `Approver role ${i + 1}`, value: x.role, maxlength: '200', placeholder: 'Role', oninput: (e) => { x.role = e.target.value; refresh(); } }),
    personPicker({ value: x.name, label: `Approver name ${i + 1}`, placeholder: 'Choose a name', focusKey: `appr-${i}`, onChange: (v) => { x.name = v; refresh(); } }),
    h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove approver ${i + 1}`, onclick: () => { d.approvers.splice(i, 1); render(); } }, icon('trash', 'icon-sm')))));
  function save() {
    const kbv = kb.meta.version;
    mutate((pr) => {
      const owners = pruneMap(d.owners);
      if (!same(owners, pr.meta.workstreamOwners || {})) setWorkstreamOwners(pr, owners);
      const people = prunePeople(d.people);
      if (!same(cleanWorkstreamPeople(people), pr.meta.workstreamPeople || {})) setWorkstreamPeople(pr, people);
      const steps = pruneMap(d.steps);
      const current = stepOwnersOf(pr);
      for (const id of new Set([...Object.keys(steps), ...Object.keys(current)])) {
        const v = String(steps[id] || '').trim();
        if (v !== (current[id] || '')) setCheckField(pr, id, 'owner', v, kbv);
      }
      const appr = d.approvers.filter((x) => x.role.trim() && x.name.trim()).map((x) => ({ role: x.role.trim(), name: x.name.trim() }));
      if (!same(appr, pr.meta.approvers || [])) setApprovers(pr, appr);
    });
    ownDraft.id = '';
    savedPulse('Owners and approvers saved');
    render();
  }
  function discard() { ownDraft.id = ''; render(); }
  const stages = kb.stages.filter((st) => st.id !== 'test' || testUsed);
  refresh();
  if (!setupPage && (simple || p0.meta.ownersWanted === 'later')) {
    return h('div', { class: 'tool' },
      h('datalist', { id: 'role-list' }, APPROVER_ROLES.map((r) => h('option', { value: r }))),
      h('h3', null, 'Who approves the change'),
      h('p', { class: 'small muted' }, 'One or two names is enough. They are suggested wherever the assistant asks who decided or approved something.'),
      approvers,
      h('button', { type: 'button', class: 'btn btn-sm', 'data-focus-key': 'appr-add', onclick: () => addAndFocus(() => d.approvers.push({ role: '', name: '' }), `appr-${d.approvers.length}`) }, icon('plus', 'icon-sm'), 'Add an approver'),
      barSlot,
      h('p', { class: 'small' }, h('a', { href: '#/project/owners' }, 'Record owners per workstream too'), simple ? ' (in Project setup)' : '', '.'));
  }
  return h('div', { class: 'tool' },
    h('datalist', { id: 'role-list' }, APPROVER_ROLES.map((r) => h('option', { value: r }))),
    h('h3', null, 'Who owns each workstream'),
    h('p', { class: 'small muted' }, 'Name one lead per workstream. Under ', h('strong', null, 'More people and step owners'), ', add the other people involved and what they cover, and give a step its own owner when it is not the lead: for example the timeline step to your project manager.'),
    ...stages.map(stageBlock),
    h('h3', null, 'Who approves the change'),
    h('p', { class: 'small muted' }, 'These names are suggested wherever the assistant asks who decided or approved something.'),
    approvers,
    h('button', { type: 'button', class: 'btn btn-sm', 'data-focus-key': 'appr-add', onclick: () => addAndFocus(() => d.approvers.push({ role: '', name: '' }), `appr-${d.approvers.length}`) }, icon('plus', 'icon-sm'), 'Add an approver'),
    barSlot);
}

// ───────── Stakeholder briefing ─────────
// One structure, shown three ways: on screen, as a formatted email (Outlook) and as plain text.
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const longDate = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
let briefAudience = 'leadership';
let briefSources = false;

export function briefingModel(audienceId = briefAudience) {
  const kb = state.kb;
  const p = state.project;
  const b = kb.reference.briefing;
  const aud = b.audiences.find((x) => x.id === audienceId) || b.audiences[0];
  const no = (id) => !!(p.answers[id] && p.answers[id].value === 'no');
  const forReader = (x) => !x.audiences || x.audiences.includes(aud.id);
  const ruledOut = (x) => !!(x.skipWhenNo && x.skipWhenNo.every(no));
  const envs = (p.meta.environments || []).filter((e) => e.alias);
  const primaries = envs.filter((e) => plannedRole(p, e) === 'primary').map((e) => e.alias);
  const when = [
    p.meta.windowStart
      ? (p.meta.windowEnd && p.meta.windowEnd !== p.meta.windowStart ? `We plan to make the change between ${longDate(p.meta.windowStart)} and ${longDate(p.meta.windowEnd)}.` : `We plan to make the change on ${longDate(p.meta.windowStart)}.`) + ' We will confirm the exact date and what to expect beforehand.'
      : 'We will share the planned date and what to expect before the change.',
    envs.length ? `It covers ${envs.length} Sentinel workspace${envs.length === 1 ? '' : 's'}${primaries.length === 1 ? `, with ${primaries[0]} planned as the primary workspace` : primaries.length > 1 ? `, with ${primaries.slice(0, -1).join(', ')} and ${primaries[primaries.length - 1]} planned as the primary workspaces of their tenants` : ''}.` : '',
    b.deadline,
  ].filter(Boolean).join(' ');
  const org = p.meta.organisation && aud.id !== 'client' ? ` for ${p.meta.organisation}` : '';
  return {
    audience: aud,
    subject: aud.subject,
    opening: `Microsoft is retiring the Azure portal experience for Microsoft Sentinel and moving it to the Microsoft Defender portal. ${b.intro}${aud.intro ? ` ${aud.intro}` : ''} Here is what it means${org}.`,
    openingShort: `Microsoft is retiring the Azure portal experience for Microsoft Sentinel and moving it to the Microsoft Defender portal.${aud.intro ? ` ${aud.intro}` : ''}`,
    inShort: b.inShort,
    changes: b.changes.filter(forReader).filter((x) => !ruledOut(x)),
    left: b.changes.filter(forReader).filter(ruledOut),
    same: b.same.filter(forReader),
    fallback: b.fallback,
    when,
    asksTitle: aud.asksTitle,
    asks: aud.asks,
    links: b.sources.map((id) => kb.sources.find((x) => x.id === id)).filter(Boolean),
    closing: b.closing,
    sign: [p.meta.operatorName, p.meta.operatorRole].filter(Boolean).join(', '),
  };
}

// level 0: the full email; 1: headlines and the asks (the leadership note); 2: headlines of the changes only, for the shortest links.
function briefingEmail(m, { level = 0 } = {}) {
  const short = level > 0;
  const text = [
    'Hello,', '',
    short ? m.openingShort : m.opening, '',
    `In short: ${m.inShort}`, '',
    short ? 'What changes:' : 'What changes, and what it means:',
    ...m.changes.flatMap((x, i) => (short ? [`${i + 1}. ${x.what}`] : [`${i + 1}. ${x.what}`, `   ${x.meaning}`, ''])),
    ...(short ? [''] : []),
    ...(short ? [] : ['What stays the same:', ...m.same.map((x) => `- ${x.what} ${x.meaning}`), '']),
    ...(short ? [] : ['If something goes wrong:', m.fallback.text, '']),
    'When:', m.when, '',
    ...(level > 1 ? [] : [`${m.asksTitle}:`, ...m.asks.map((x) => `- ${x}`), '']),
    ...(short ? [] : ['Read more (Microsoft Learn):', ...m.links.map((x) => `- ${x.title}: ${x.url}`), '']),
    m.closing, '',
    'Kind regards,', m.sign,
  ].join('\n');
  const html = short
    ? `<p>Hello,</p><p>${esc(m.openingShort)}</p><p><b>In short:</b> ${esc(m.inShort)}</p>`
      + `<p><b>What changes</b></p><ol>${m.changes.map((x) => `<li>${esc(x.what)}</li>`).join('')}</ol>`
      + `<p><b>When</b><br>${esc(m.when)}</p>`
      + (level > 1 ? '' : `<p><b>${esc(m.asksTitle)}</b></p><ul>${m.asks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`)
      + `<p>${esc(m.closing)}</p><p>Kind regards,<br>${esc(m.sign)}</p>`
    : `<p>Hello,</p><p>${esc(m.opening)}</p><p><b>In short:</b> ${esc(m.inShort)}</p>`
    + `<p><b>What changes, and what it means</b></p><ol>${m.changes.map((x) => `<li><b>${esc(x.what)}</b><br>${esc(x.meaning)}</li>`).join('')}</ol>`
    + `<p><b>What stays the same</b></p><ul>${m.same.map((x) => `<li><b>${esc(x.what)}</b> ${esc(x.meaning)}</li>`).join('')}</ul>`
    + `<p><b>If something goes wrong</b><br>${esc(m.fallback.text)}</p>`
    + `<p><b>When</b><br>${esc(m.when)}</p>`
    + `<p><b>${esc(m.asksTitle)}</b></p><ul>${m.asks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    + `<p><b>Read more (Microsoft Learn)</b></p><ul>${m.links.map((x) => `<li><a href="${esc(x.url)}">${esc(x.title)}</a></li>`).join('')}</ul>`
    + `<p>${esc(m.closing)}</p><p>Kind regards,<br>${esc(m.sign)}</p>`;
  return { subject: m.subject, text, html };
}

// An email preview, folded: the subject and size show; the full text opens on request.
let openEmails = new Set();
function emailFold(key, subject, meta, preview) {
  return h('details', { class: 'disclose email-fold', open: openEmails.has(key), ontoggle: (e) => { if (e.target.open) openEmails.add(key); else openEmails.delete(key); } },
    h('summary', null, icon('chevron', 'icon-sm'), h('span', null, h('strong', null, subject), h('span', { class: 'small muted' }, meta)), h('span', { class: 'small' }, 'Show the email')),
    preview);
}

export function briefingTool() {
  const kb = state.kb;
  const m = briefingModel();
  const mail = briefingEmail(m, { level: m.audience.concise ? 1 : 0 });
  const cite = (ids) => (ids || []).map((id) => kb.sources.find((x) => x.id === id)).filter(Boolean);
  const sourceLine = (ids) => (briefSources ? h('span', { class: 'brief-src' }, 'Source: ', ...cite(ids).flatMap((src, i) => [i ? ', ' : '', externalLink(src.url, src.title)])) : null);
  const concise = !!m.audience.concise;
  const point = (x) => h('li', null, h('strong', null, x.what), concise ? null : ' ', concise ? null : x.meaning, sourceLine(x.sources));
  const readers = h('fieldset', { class: 'choices brief-readers' }, h('legend', { class: 'small muted' }, 'Who is it for?'),
    kb.reference.briefing.audiences.map((x) => h('label', { class: ['choice', x.id === m.audience.id && 'selected'] },
      h('input', { type: 'radio', name: 'brief-reader', checked: x.id === m.audience.id, 'data-focus-key': `brief-reader-${x.id}`, onchange: () => { briefAudience = x.id; render(); } }),
      h('div', null, h('strong', null, x.label), h('p', { class: 'small' }, x.hint)))));
  return h('div', { class: 'tool' },
    readers,
    h('label', { class: 'check-line small brief-toggle' }, h('input', { type: 'checkbox', checked: briefSources, 'data-focus-key': 'brief-sources', onchange: (e) => { briefSources = e.target.checked; render(); } }), ' Show the Microsoft Learn source for each point (for you to check; not part of the email)'),
    emailFold(`brief-${m.audience.id}`, m.subject, `For ${m.audience.label.toLowerCase()}: ${m.changes.length} changes${concise ? ', headlines only' : ', each with what it means'}, about ${Math.max(1, Math.round(mail.text.split(/\s+/).length / 200))} minute${Math.round(mail.text.split(/\s+/).length / 200) > 1 ? 's' : ''} to read`,
      h('article', { class: 'email-preview brief-email', 'aria-label': `Email for ${m.audience.label}` },
        h('div', { class: 'email-subject' }, h('span', { class: 'muted' }, 'Subject: '), m.subject),
        h('p', null, 'Hello,'),
        h('p', null, concise ? m.openingShort : m.opening),
        h('p', { class: 'brief-short' }, h('strong', null, 'In short: '), m.inShort),
        h('h3', null, concise ? 'What changes' : 'What changes, and what it means'),
        h('ol', { class: 'brief-points' }, m.changes.map(point)),
        concise ? null : h('h3', null, 'What stays the same'),
        concise ? null : h('ul', { class: 'brief-points' }, m.same.map(point)),
        concise ? null : h('h3', null, 'If something goes wrong'),
        concise ? null : h('p', null, m.fallback.text, sourceLine(m.fallback.sources)),
        h('h3', null, 'When'),
        h('p', null, m.when),
        h('h3', null, m.asksTitle),
        h('ul', { class: 'bullets' }, m.asks.map((x) => h('li', null, x))),
        concise ? null : h('h3', null, 'Read more (Microsoft Learn)'),
        concise ? null : h('ul', { class: 'bullets' }, m.links.map((x) => h('li', null, externalLink(x.url, x.title)))),
        h('p', null, m.closing),
        h('p', null, 'Kind regards,', h('br'), m.sign || h('span', { class: 'muted' }, 'Your name, from Project setup')))),
    m.left.length ? h('p', { class: 'small muted' }, `Left out because you answered No in the questions: ${m.left.map((x) => `"${x.what.replace(/\.$/, '')}"`).join(', ')}.`) : null,
    emailActions(mail, { audit: 'briefing.copied', label: `Briefing for ${m.audience.label}`, short: [briefingEmail(m, { level: 1 }).text, briefingEmail(m, { level: 2 }).text] }),
    concise ? h('p', { class: 'small muted' }, 'Kept short for leadership: headlines and what we need from them. Choose SOC team for the version that explains each change.') : null,
    h('p', { class: 'small muted' }, 'The email uses your project name, window, workspaces and signature from Project setup. Edit it as you like before sending. The full list of changes is in ', h('a', { href: '#/knowledge/changes' }, 'Feature changes'), '.'));
}

// ───────── Transition window planner ─────────
const weeksText = ([a, b]) => (a === b ? `${a} week${a === 1 ? '' : 's'}` : `${a} to ${b} weeks`);
const addDays = (iso, days) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const winDraft = { id: '', base: '', v: {} };
let winEditing = '';

export function windowTool({ setupPage = false } = {}) {
  const p = state.project;
  const plan = state.kb.reference.planning;
  const base = JSON.stringify([p.meta.startDate, p.meta.windowStart, p.meta.windowEnd]);
  const dirtyNow = winDraft.id === p.id && JSON.stringify([winDraft.v.startDate, winDraft.v.windowStart, winDraft.v.windowEnd]) !== winDraft.base;
  if (winDraft.id !== p.id || (!dirtyNow && winDraft.base !== base)) { winDraft.id = p.id; winDraft.v = { startDate: p.meta.startDate || '', windowStart: p.meta.windowStart || '', windowEnd: p.meta.windowEnd || '' }; winDraft.base = base; }
  const v = winDraft.v;
  const profile = planProfile(p);
  const why = profileReasons(p);
  const chosenProfile = p.meta.planProfile || 'auto';
  const profileLabel = (id) => (plan.profiles.find((x) => x.id === id) || { label: id }).label;
  const testUsed = p.stages.test.availability === 'available' || (p.answers.test_env && p.answers.test_env.value === 'yes');
  const phases = plan.phases.filter((ph) => ph.id !== 'test' || testUsed).map((ph) => ({ ...ph, range: ph[profile] }));
  const before = phases.filter((ph) => ph.id !== 'hypercare');
  const weeksBefore = before.reduce((n, ph) => n + ph.range[1], 0);
  const after = phases.find((ph) => ph.id === 'hypercare');
  const today = new Date().toISOString().slice(0, 10);

  const barSlot = h('div');
  const planSlot = h('div');
  const msg = h('p', { class: 'field-error', role: 'alert', hidden: true });
  const invalid = () => !!(v.windowStart && v.windowEnd && v.windowEnd < v.windowStart);
  const inputs = {};
  const refresh = () => {
    const bad = invalid();
    msg.hidden = !bad;
    msg.textContent = bad ? 'The window must end on or after the day it starts.' : '';
    if (inputs.windowEnd) { inputs.windowEnd.dataset.pickerMin = v.windowStart || ''; inputs.windowEnd.setAttribute('aria-invalid', bad ? 'true' : 'false'); }
    barSlot.replaceChildren(saveBar(!bad && JSON.stringify([v.startDate, v.windowStart, v.windowEnd]) !== winDraft.base, save, discard, bad ? 'Fix the dates to save.' : 'Saved in Project setup.'));
    planSlot.replaceChildren(...planView());
  };
  const date = (key, label) => {
    const el = h('input', { type: 'date', value: v[key], 'data-focus-key': `win-${key}`, oninput: (e) => { v[key] = e.target.value; refresh(); } });
    inputs[key] = el;
    return field(label, el);
  };
  function planView() {
    const startBy = v.windowStart ? addDays(v.windowStart, -7 * weeksBefore) : '';
    const doneBy = (v.windowEnd || v.windowStart) ? addDays(v.windowEnd || v.windowStart, 7 * after.range[1]) : '';
    return [
      h('h3', null, 'How much time to plan'),
      h('div', { class: 'plan-profile' },
        h('span', { class: 'small' }, 'Ranges for', infoTip({ key: 'plan-profile', title: plan.profileInfo.title, practice: true }, h('ul', { class: 'bullets' }, plan.profileInfo.points.map((x) => h('li', null, x))))),
        h('div', { class: 'seg-group', role: 'group', 'aria-label': 'Planning profile' }, plan.profiles.map((x) => h('button', {
          type: 'button', class: ['seg-btn', chosenProfile === x.id && 'active'], 'aria-pressed': chosenProfile === x.id ? 'true' : 'false', 'data-focus-key': `plan-${x.id}`,
          onclick: () => mutate((pr) => setPlanProfile(pr, x.id)),
        }, x.id === 'auto' ? `${x.label}: ${profileLabel(suggestedProfile(p))}` : x.label)))),
      h('p', { class: 'small muted profile-why' }, chosenProfile !== 'auto' ? `You chose the ${profileLabel(profile).toLowerCase()} ranges.`
        : !why.known ? 'Not enough information yet, so the planner uses the standard ranges. Answer the questions or import the inventory, or pick the ranges that fit your team.'
          : `${plan[profile]}${why.reasons.length ? ` Based on: ${why.reasons.join(', ')}.` : ''}`),
      callout('caution', 'Example estimates only.', ' These ranges are typical examples from practice, not Microsoft guidance and not a commitment. Your own timeline can be shorter or longer: it depends on your environment, your team and your change process.'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('caption', { class: 'sr-only' }, 'Example time per phase'),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Phase'), h('th', { scope: 'col', class: 'num' }, 'Example time'))),
        h('tbody', null,
          ...before.map((ph) => h('tr', null, h('td', null, ph.label), h('td', { class: 'num' }, weeksText(ph.range)))),
          h('tr', null, h('td', null, plan.change), h('td', { class: 'num' }, '1 day')),
          h('tr', null, h('td', null, after.label), h('td', { class: 'num' }, weeksText(after.range)))))),
      v.windowStart && !invalid() ? h('ul', { class: 'bullets', style: { marginTop: '12px' } },
        h('li', null, 'With these example ranges, start Prepare by about ', h('strong', { class: 'tnum' }, startBy), startBy < today ? '. That date has passed: start now, or consider a later window.' : '.'),
        h('li', null, 'Expect to sign off around ', h('strong', { class: 'tnum' }, doneBy), doneBy > '2027-03-31' ? '. That is after 31 March 2027: consider an earlier window.' : ', comfortably before 31 March 2027.'))
        : h('p', { class: 'small' }, invalid() ? 'Fix the dates above to see when to start each phase.' : 'Enter your window above to see when to start each phase.'),
      h('p', { class: 'small' }, plan.changeDay),
      h('p', { class: 'small muted' }, plan.note),
    ];
  }
  function save() {
    if (invalid()) { toast('The window must end on or after the day it starts.', 'bad'); return; }
    mutate((pr) => { Object.assign(pr.meta, { startDate: v.startDate, windowStart: v.windowStart, windowEnd: v.windowEnd }); addAudit(pr, 'project.details', 'Planned transition window updated'); });
    winDraft.id = '';
    winEditing = '';
    savedPulse('Window saved');
    render();
  }
  function discard() { winDraft.id = ''; winEditing = ''; render(); }
  // The window was given during setup: show it, do not ask again. "Change the dates" opens the fields.
  const known = !setupPage && p.meta.windowStart && winEditing !== p.id && !dirtyNow;
  if (known) {
    refresh();
    return h('div', { class: 'tool' },
      h('div', { class: 'window-summary' }, icon('calendar', 'icon-sm'),
        h('div', null, h('strong', null, p.meta.windowEnd && p.meta.windowEnd !== p.meta.windowStart ? `Your window: ${longDate(p.meta.windowStart)} to ${longDate(p.meta.windowEnd)}` : `Your window: ${longDate(p.meta.windowStart)}`),
          h('div', { class: 'small muted' }, 'You entered it when you set up the project. Confirm it with whoever approves the change, then record that approval.')),
        btn('Change the dates', () => { winEditing = p.id; render(); const el = document.querySelector('[data-focus-key="win-windowStart"]'); if (el) el.focus(); }, { small: true, iconName: 'edit' })),
      planSlot);
  }
  const grid = h('div', { class: 'tool-grid' }, date('startDate', 'Project start'), date('windowStart', 'Window from'), date('windowEnd', 'Window to'));
  refresh();
  return h('div', { class: 'tool' }, grid, msg, barSlot, planSlot);
}

// ───────── Decision helpers ─────────
// A few targeted questions instead of a long read. The words, the approaches and the rules come from the step
// (`helper` in the knowledge base); src/core/decision-helper.js decides whether the step gives a verdict.
const helperDrafts = new Map(); // `${projectId}:${tool}` -> { base, start, subjects }
const blankSubject = (label = '') => ({ label, answers: {}, choice: '', person: '' });
const inventoryTenants = (p) => [...new Set((p.meta.environments || []).map((e) => (e.tenant || '').trim()).filter(Boolean))];
const valuesOf = (a) => (Array.isArray(a) ? a : a ? [a] : []);

function helperDraft(key, c) {
  const p = state.project;
  const saved = (p.meta.helpers || {})[key];
  const base = JSON.stringify(saved ? saved.subjects : null);
  const id = `${p.id}:${key}`;
  let d = helperDrafts.get(id);
  if (!d || (JSON.stringify(d.subjects) === d.start && d.base !== base)) {
    let subjects = saved ? JSON.parse(JSON.stringify(saved.subjects)) : [];
    if (!subjects.length && c.helper.per === 'tenant') subjects = inventoryTenants(p).map((t) => blankSubject(t));
    if (!subjects.length) subjects.push(blankSubject());
    d = { base, start: JSON.stringify(subjects), subjects };
    helperDrafts.set(id, d);
  }
  return d;
}

function setHelperAnswer(s, q, optionId, on) {
  if (!q.multi) { s.answers[q.id] = optionId; return; }
  // "None of these" excludes the other options, and the other way round.
  let vals = valuesOf(s.answers[q.id]).filter((v) => v !== optionId);
  if (on) vals = optionId === 'none' ? ['none'] : [...vals.filter((v) => v !== 'none'), optionId];
  if (vals.length) s.answers[q.id] = vals; else delete s.answers[q.id];
}

export function decisionHelperTool(key, c, ctx = { kb: state.kb }) {
  const helper = c && c.helper;
  if (!helper) return null;
  const p = state.project;
  const d = helperDraft(key, c);
  const saved = (p.meta.helpers || {})[key];
  const perTenant = helper.per === 'tenant';
  const dirty = () => JSON.stringify(d.subjects) !== d.start;
  const choiceOf = (s) => helper.choices.find((x) => x.id === s.choice);
  const barSlot = h('div');
  const refresh = () => barSlot.replaceChildren(saveBar(dirty(), save, discard, saved ? `Saved by ${saved.by}, ${formatDate(saved.at, true)}.` : 'Nothing saved yet.'));

  function save() {
    // Empty tenant cards are dropped; a card with answers needs the tenant's name.
    const keep = d.subjects.filter((s) => !perTenant || s.label.trim() || Object.keys(s.answers).length || s.choice || s.person.trim());
    if (perTenant && keep.some((s) => !s.label.trim())) { toast('Give each tenant a name (an alias is enough), or remove the card.', 'bad', 6000); return; }
    const detail = `${helper.decision}: ${keep.map((s) => `${s.label ? `${s.label.trim()}: ` : ''}${choiceOf(s) ? choiceOf(s).title : 'no choice yet'}`).join('; ') || 'cleared'}`;
    const res = mutate((pr) => setHelper(pr, key, keep, { detail, ref: c.id }));
    if (res && !res.ok) { toast(res.error, 'bad'); return; }
    helperDrafts.delete(`${p.id}:${key}`);
    savedPulse(keep.some((s) => s.choice) ? 'Saved. Record it as a decision when you are ready.' : 'Answers saved');
    render();
  }
  function discard() { helperDrafts.delete(`${p.id}:${key}`); render(); }
  function recordDecision(s) {
    if (dirty()) { toast('Save your changes first, then record the decision.', 'bad'); return; }
    const draft = decisionDraft(c, s, state.kb);
    if (draft) editRegisterItem(null, { type: 'decision', checkId: c.id, title: draft.title, description: draft.description });
  }

  // One side of an approach: lines from your answers first, then the listed points (those your answers confirm on top).
  const points = (title, iconName, side, listed) => {
    const mine = (x) => h('li', { class: 'helper-mine' }, h('span', { class: 'chip chip-accent' }, 'Your answers'), ' ', rich(x, ctx));
    const rows = [...side.mine.map(mine), ...listed.filter((x, i) => side.marked.includes(i)).map(mine), ...listed.filter((x, i) => !side.marked.includes(i)).map((x) => h('li', null, rich(x, ctx)))];
    return rows.length ? h('div', { class: 'helper-points' }, h('div', { class: 'helper-points-title' }, icon(iconName, 'icon-xs'), title), h('ul', null, ...rows)) : null;
  };

  const subjectBlock = (s, i) => {
    const ev = evaluateHelper(helper, s.answers);
    const fk = `hlp-${key}-${i}`;
    const question = (q) => {
      const vals = valuesOf(s.answers[q.id]);
      return h('fieldset', { class: 'helper-q' }, h('legend', null, rich(q.text, ctx)),
        q.hint ? h('p', { class: 'small muted' }, rich(q.hint, ctx)) : null,
        h('div', { class: 'helper-opts' }, q.options.map((o) => h('label', { class: ['helper-opt', vals.includes(o.id) && 'selected'] },
          h('input', { type: q.multi ? 'checkbox' : 'radio', name: `${fk}-${q.id}`, checked: vals.includes(o.id), 'data-focus-key': `${fk}-${q.id}-${o.id}`, onchange: (e) => { setHelperAnswer(s, q, o.id, e.target.checked); render(); } }),
          h('span', null, o.label)))));
    };
    const fit = ev.verdict && helper.choices.find((x) => x.id === ev.verdict);
    const findings = ev.answered === 0
      ? h('p', { class: 'small muted' }, 'Answer the questions to see what this step says for your situation.')
      : fit
        ? callout('info', `${ev.strength === 'requires' ? 'Your answers need' : 'For your answers, the guidance points to'}: ${fit.title}`, renderList(ev.reasons, ctx), h('p', { class: 'small' }, 'You still choose below. Both approaches are shown with their trade-offs.'))
        : callout('info', ev.split ? 'Your answers point both ways.' : ev.answered < ev.total ? 'No firm answer from this step yet.' : 'This step gives no reason to prefer one approach for your answers.', h('p', { class: 'small' }, ev.answered < ev.total ? `${ev.answered} of ${ev.total} questions answered. Compare the approaches side by side below, then choose.` : 'Compare the approaches side by side below, then choose.'));
    const choice = choiceOf(s);
    const savedSubject = !dirty() && saved && choice;
    const draft = savedSubject ? decisionDraft(c, s, state.kb) : null;
    const recorded = draft ? p.register.find((r) => r.checkId === c.id && r.type === 'decision' && r.title === draft.title) : null;
    const nameInput = (k, label, attrs, hint) => field(label, h('input', { type: 'text', value: s[k], 'data-focus-key': `${fk}-${k}`, oninput: (e) => { s[k] = e.target.value; refresh(); }, ...attrs }), hint ? { hint: rich(hint, ctx) } : {});
    return h('div', { class: ['helper-subject', perTenant && 'ws-card'] },
      perTenant ? h('div', { class: 'ws-card-head' }, h('strong', null, s.label || `Tenant ${i + 1}`),
        d.subjects.length > 1 ? h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove ${s.label || `tenant ${i + 1}`}`, onclick: () => { d.subjects.splice(i, 1); render(); } }, icon('trash', 'icon-sm')) : null) : null,
      perTenant ? h('div', { class: 'tool-grid two' }, nameInput('label', 'Tenant (alias)', { maxlength: '120', placeholder: 'For example: Contoso EU' }), helper.person && tenantConnected(p, s.label) ? h('p', { class: 'small muted' }, 'Its workspaces are already connected, so nobody needs to connect them.') : helper.person ? field(helper.person.label, personPicker({ value: s.person, label: helper.person.label, focusKey: `${fk}-person`, onChange: (v) => { s.person = v; refresh(); } }), helper.person.hint ? { hint: rich(helper.person.hint, ctx) } : {}) : null) : null,
      h('div', { class: 'helper-questions' }, helper.questions.map(question)),
      h('div', { class: 'helper-findings', 'aria-live': 'polite' }, findings, ev.notes.length ? h('div', null, h('h3', null, icon('info', 'icon-sm'), 'Good to know'), renderList(ev.notes, ctx)) : null),
      h('fieldset', { class: 'helper-choices' }, h('legend', null, helper.choiceText || 'Your choice'),
        h('div', { class: 'helper-compare' }, helper.choices.map((ch) => h('label', { class: ['choice', 'helper-choice', s.choice === ch.id && 'selected'] },
          h('input', { type: 'radio', name: `${fk}-choice`, checked: s.choice === ch.id, 'data-focus-key': `${fk}-choice-${ch.id}`, onchange: () => { s.choice = ch.id; render(); } }),
          h('div', null, h('strong', null, ch.title),
            ch.badge || ev.verdict === ch.id ? h('div', { class: 'item-chips' }, ch.badge ? h('span', { class: 'chip chip-info' }, ch.badge) : null, ev.verdict === ch.id ? h('span', { class: 'chip chip-accent' }, ev.strength === 'requires' ? 'Needed for your answers' : 'Fits your answers') : null) : null,
            h('p', { class: 'small' }, rich(ch.summary, ctx)),
            points('For', 'check', ev.byChoice[ch.id].pros, ch.pros || []),
            points('Against', 'alert', ev.byChoice[ch.id].cons, ch.cons || [])))))),
      choice && choice.todo && choice.todo.length ? h('div', null, h('h3', null, icon('check', 'icon-sm'), `What you do next: ${choice.title}`), renderList(choice.todo, ctx)) : null,
      savedSubject ? h('div', { class: 'helper-record' },
        icon('gate', 'icon-sm'),
        h('div', null, recorded ? h('strong', null, 'Recorded in the register') : h('strong', null, `Saved: ${choice.title}`),
          recorded ? h('div', { class: 'small' }, h('button', { type: 'button', class: 'linklike', onclick: () => editRegisterItem(recorded) }, recorded.title))
            : h('p', { class: 'small muted' }, 'Record it as a decision, so the register shows who decided and why. Your answers and the reasons are filled in for you.')),
        recorded ? btn('Record again', () => recordDecision(s), { small: true, kind: 'ghost' }) : btn('Record as a decision', () => recordDecision(s), { small: true, kind: 'primary', iconName: 'gate' }))
        : choice ? h('p', { class: 'small muted' }, 'Save your choice, then record it as a decision.') : null);
  };

  const missing = perTenant ? inventoryTenants(p).filter((t) => !d.subjects.some((s) => s.label.trim() === t)) : [];
  refresh();
  return h('div', { class: 'tool helper' },
    h('p', { class: 'small muted' }, rich(helper.intro, ctx)),
    helper.notes && helper.notes.length ? renderList(helper.notes, ctx, 'bullets small') : null,
    ...d.subjects.map(subjectBlock),
    perTenant ? h('div', { class: 'row-actions' },
      d.subjects.length < MAX_HELPER_SUBJECTS ? btn('Add a tenant', () => { d.subjects.push(blankSubject()); render(); }, { small: true, iconName: 'plus' }) : null,
      missing.length ? btn(`Add ${missing.length === 1 ? 'the tenant' : `the ${missing.length} tenants`} from your inventory`, () => { d.subjects.push(...missing.map((t) => blankSubject(t))); render(); }, { small: true, kind: 'ghost' }) : null) : null,
    barSlot);
}

// Ready texts for the teams involved: preview, then copy, download as an Outlook draft or open in the email app.
function readyTextBlock(key, audit) {
  const t = readyText(key);
  return h('div', { class: 'ready-text stack' },
    h('h3', null, t.label),
    emailFold(`ready-${key}`, t.subject, `${t.sections.length} short section${t.sections.length === 1 ? '' : 's'}`,
      h('article', { class: 'email-preview brief-email', 'aria-label': t.label },
        h('div', { class: 'email-subject' }, h('span', { class: 'muted' }, 'Subject: '), t.subject),
        h('p', null, 'Hello,'),
        ...t.sections.map((s) => h('div', null, h('h3', null, s.title), s.text ? h('p', null, s.text) : null, s.points.length ? h('ul', { class: 'bullets' }, s.points.map((x) => h('li', null, x))) : null)),
        t.closing ? h('p', null, t.closing) : null)),
    emailActions(t, { audit, label: t.label }));
}
export function commsTool() { return h('div', { class: 'tool stack' }, readyTextBlock('analystNotice', 'comms.copied'), readyTextBlock('liveNote', 'comms.copied')); }
export function changeTool() { return h('div', { class: 'tool stack' }, readyTextBlock('changeSummary', 'change.copied')); }

export const TOOLS = {
  workspaces: () => workspaceTool(), connection: () => workspaceTool({ show: 'connection' }), primary: () => primaryTool(), owners: () => ownersTool(), briefing: () => briefingTool(), window: () => windowTool(),
  mdc: (c, ctx) => decisionHelperTool('mdc', c, ctx), urbac: (c, ctx) => decisionHelperTool('urbac', c, ctx), tenants: (c, ctx) => decisionHelperTool('tenants', c, ctx),
  comms: () => commsTool(), change: () => changeTool(),
};
export const TOOL_TITLES = {
  workspaces: 'Your workspaces', connection: 'Connection state of your workspaces', primary: 'Choose the primary workspace', owners: 'Owners and approvers', briefing: 'Brief your stakeholders', window: 'Plan your window',
  mdc: 'Choose your connector approach', urbac: 'Decide on unified RBAC', tenants: 'Access model per tenant',
  comms: 'Ready texts for your teams', change: 'Change request summary',
};
export { same };
