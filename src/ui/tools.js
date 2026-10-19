// "Do it here" tools: the forms a step needs, right inside the step, so information is entered once
// and reused everywhere it is needed (project setup, other steps, reports).
import { h, icon, toast, field, copyText, savedPulse, externalLink } from './dom.js';
import { state, mutate } from '../app/store.js';
import { render } from './shell.js';
import { setEnvironments, setWorkstreamOwners, setApprovers, DEFENDER_STATES, ENV_KINDS, workstreamKey, knownPeople, addAudit } from '../core/model.js';
import { btn, callout } from './components.js';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Names the project already knows, offered as suggestions in every name field.
export function peopleList() {
  return h('datalist', { id: 'people-list' }, knownPeople(state.project).map((n) => h('option', { value: n })));
}

function saveBar(dirty, onSave, onDiscard, savedText) {
  return h('div', { class: 'tool-bar' },
    h('span', { class: 'small muted' }, dirty ? 'Changes not saved yet.' : savedText),
    dirty ? btn('Discard', onDiscard, { kind: 'ghost', small: true }) : null,
    h('button', { type: 'button', class: 'btn btn-primary btn-sm', disabled: !dirty, onclick: onSave }, icon('check', 'icon-sm'), 'Save'));
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
  const inp = (row, key, label, attrs = {}) => field(label, h('input', { type: 'text', value: row[key] || '', maxlength: '200', list: key === 'owner' ? 'people-list' : null, oninput: (e) => { row[key] = e.target.value; refresh(); }, ...attrs }));
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
    show === 'connection' && ans ? callout('info', `In the questions you answered: ${ans.value === 'yes' ? 'Yes, a workspace is already connected' : ans.value === 'no' ? 'No workspace is connected yet' : ans.value === 'unknown' ? 'I don\'t know yet' : 'Not applicable'}.`, ' Confirm it here for each workspace.') : null,
    h('p', { class: 'small muted' }, 'One list for the whole project. What you enter here also appears in Project setup, in the steps that need it, and in your reports. No secrets: names, aliases and IDs only.'),
    ...cards,
    btn('Add a workspace', () => { rows.push(blankEnv()); render(); }, { small: true, iconName: 'plus' }));
  const barSlot = h('div');
  function refresh() { barSlot.replaceChildren(saveBar(JSON.stringify(rows) !== envDraft.base, save, discard, `${(state.project.meta.environments || []).length} workspace(s) saved.`)); }
  function save() {
    const res = mutate((pr) => setEnvironments(pr, rows));
    if (res && !res.ok) { toast(res.error, 'bad', 7000); return; }
    envDraft.id = '';
    savedPulse('Workspaces saved');
    render();
  }
  function discard() { envDraft.id = ''; render(); }
  refresh();
  wrap.appendChild(barSlot);
  if (dirty) refresh();
  return wrap;
}

// Planned primary workspace (a decision, separate from what is connected today).
export function primaryTool() {
  const p = state.project;
  const envs = (p.meta.environments || []).filter((e) => e.alias);
  if (!envs.length) return h('div', { class: 'tool' }, callout('info', 'Add your workspaces first.', ' ', h('a', { href: '#/item/PREP-TOP-01' }, 'Inventory your workspaces'), ', then come back to choose the primary one.'));
  const choose = (alias) => mutate((pr) => { pr.meta.plannedPrimary = alias; addAudit(pr, 'project.primary', alias ? `Planned primary workspace: ${alias}` : 'Planned primary workspace cleared'); });
  return h('div', { class: 'tool' },
    h('fieldset', { class: 'choices' }, h('legend', { class: 'small muted' }, 'Which workspace should be primary?'),
      envs.map((e) => h('label', { class: ['choice', p.meta.plannedPrimary === e.alias && 'selected'] },
        h('input', { type: 'radio', name: 'planned-primary', checked: p.meta.plannedPrimary === e.alias, onchange: () => { choose(e.alias); savedPulse('Primary workspace recorded'); } }),
        h('div', null, h('strong', null, e.alias), h('p', { class: 'small' }, [e.kind, e.region, (DEFENDER_STATES.find((d) => d.id === e.defender) || {}).label].filter(Boolean).join(', ')))))),
    p.meta.plannedPrimary ? h('p', { class: 'small muted' }, 'Recorded as your planned primary workspace. Record who approved it with the decision button in the steps below.') : null);
}

// ───────── Owners and approvers ─────────
const APPROVER_ROLES = ['Change advisory board', 'Data protection and compliance', 'Identity and access management', 'Ticketing (ITSM) owner', 'SOC lead', 'Security architect'];
const ownDraft = { id: '', base: '', owners: {}, approvers: [] };
function ownersDraft() {
  const p = state.project;
  const base = JSON.stringify([p.meta.workstreamOwners || {}, p.meta.approvers || []]);
  const dirty = ownDraft.id === p.id && JSON.stringify([ownDraft.owners, ownDraft.approvers]) !== ownDraft.base;
  if (ownDraft.id !== p.id || (!dirty && ownDraft.base !== base)) {
    ownDraft.id = p.id;
    ownDraft.owners = { ...(p.meta.workstreamOwners || {}) };
    ownDraft.approvers = (p.meta.approvers || []).map((a) => ({ ...a }));
    if (!ownDraft.approvers.length) ownDraft.approvers = APPROVER_ROLES.slice(0, 5).map((role) => ({ role, name: '' }));
    ownDraft.base = JSON.stringify([ownDraft.owners, ownDraft.approvers]);
  }
  return ownDraft;
}

export function ownersTool() {
  const kb = state.kb;
  const d = ownersDraft();
  const barSlot = h('div');
  const refresh = () => barSlot.replaceChildren(saveBar(JSON.stringify([d.owners, d.approvers]) !== d.base, save, discard, 'Saved. Steps without their own owner show their workstream owner.'));
  const row = (stage, ws) => {
    const key = workstreamKey(stage.id, ws.id);
    return h('div', { class: 'owner-row' }, h('label', { for: `own-${key}` }, ws.title),
      h('input', { id: `own-${key}`, type: 'text', list: 'people-list', maxlength: '200', placeholder: 'Name or team', value: d.owners[key] || '', 'data-focus-key': `own-${key}`, oninput: (e) => { d.owners[key] = e.target.value; refresh(); } }));
  };
  const stageBlock = (stage, open) => {
    const list = kb.workstreams.filter((w) => w.stage === stage.id);
    const set = list.filter((w) => (d.owners[workstreamKey(stage.id, w.id)] || '').trim()).length;
    return h('details', { class: 'owner-stage disclose', open },
      h('summary', null, icon('chevron', 'icon-sm'), stage.short, h('span', { class: 'small muted tnum' }, ` ${set} of ${list.length} assigned`)),
      stage.id !== 'prepare' ? h('div', { class: 'row', style: { margin: '8px 0' } }, btn('Use the Prepare owners where the area matches', () => {
        for (const w of list) { const k = workstreamKey(stage.id, w.id); const from = d.owners[workstreamKey('prepare', w.id)]; if (from && !d.owners[k]) d.owners[k] = from; }
        render();
      }, { small: true, kind: 'ghost' })) : null,
      h('div', { class: 'owner-grid' }, list.map((w) => row(stage, w))));
  };
  const approvers = h('div', { class: 'owner-grid' }, d.approvers.map((a, i) => h('div', { class: 'approver-row' },
    h('input', { type: 'text', list: 'role-list', 'aria-label': `Approver role ${i + 1}`, value: a.role, maxlength: '200', placeholder: 'Role', oninput: (e) => { a.role = e.target.value; refresh(); } }),
    h('input', { type: 'text', list: 'people-list', 'aria-label': `Approver name ${i + 1}`, value: a.name, maxlength: '200', placeholder: 'Name', oninput: (e) => { a.name = e.target.value; refresh(); } }),
    h('button', { type: 'button', class: 'btn-icon', 'aria-label': `Remove approver ${i + 1}`, onclick: () => { d.approvers.splice(i, 1); render(); } }, icon('trash', 'icon-sm')))));
  function save() {
    mutate((pr) => { setWorkstreamOwners(pr, d.owners); setApprovers(pr, d.approvers.filter((a) => a.role.trim() && a.name.trim())); });
    ownDraft.id = '';
    savedPulse('Owners and approvers saved');
    render();
  }
  function discard() { ownDraft.id = ''; render(); }
  refresh();
  return h('div', { class: 'tool' },
    h('datalist', { id: 'role-list' }, APPROVER_ROLES.map((r) => h('option', { value: r }))),
    h('h3', null, 'Who owns each workstream'),
    h('p', { class: 'small muted' }, 'Type a name once per workstream. Every step in that workstream shows this owner, unless you set a different owner on the step itself.'),
    ...kb.stages.map((s, i) => stageBlock(s, i === 0)),
    h('h3', null, 'Who approves the change'),
    h('p', { class: 'small muted' }, 'These names are suggested wherever the assistant asks who decided or approved something.'),
    approvers,
    btn('Add an approver', () => { d.approvers.push({ role: '', name: '' }); render(); }, { small: true, iconName: 'plus' }),
    barSlot);
}

// ───────── Stakeholder briefing ─────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function briefingEmail() {
  const kb = state.kb;
  const p = state.project;
  const b = kb.reference.briefing;
  const links = b.sources.map((id) => kb.sources.find((s) => s.id === id)).filter(Boolean);
  const org = p.meta.organisation || 'our organisation';
  const windowLine = p.meta.windowStart ? `We plan to make the change between ${p.meta.windowStart}${p.meta.windowEnd ? ` and ${p.meta.windowEnd}` : ''}. We will confirm the exact date and what to expect beforehand.` : 'We will share the planned date and what to expect before the change.';
  const sign = [p.meta.operatorName, p.meta.operatorRole].filter(Boolean).join(', ');
  const text = [
    'Hello,',
    '',
    `Microsoft is moving the Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal. ${b.deadline} Here is what this means for ${org}.`,
    '',
    'What changes:',
    ...b.changes.map((x) => `- ${x}`),
    '',
    'What stays the same:',
    ...b.same.map((x) => `- ${x}`),
    '',
    windowLine,
    '',
    'Read more (Microsoft Learn):',
    ...links.map((s) => `- ${s.title}: ${s.url}`),
    '',
    'If you have questions or depend on Sentinel in a way we should know about, please reply to this email.',
    '',
    'Kind regards,',
    sign || '',
  ].join('\n');
  const html = `<p>Hello,</p><p>Microsoft is moving the Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal. ${esc(b.deadline)} Here is what this means for ${esc(org)}.</p>`
    + `<p><b>What changes</b></p><ul>${b.changes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    + `<p><b>What stays the same</b></p><ul>${b.same.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    + `<p>${esc(windowLine)}</p><p><b>Read more (Microsoft Learn)</b></p><ul>${links.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul>`
    + `<p>If you have questions or depend on Sentinel in a way we should know about, please reply to this email.</p><p>Kind regards,<br>${esc(sign)}</p>`;
  return { subject: b.subject, text, html };
}

async function copyRich(text, html) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      return true;
    }
  } catch { /* fall back to plain text */ }
  return copyText(text);
}

export function briefingTool() {
  const kb = state.kb;
  const b = kb.reference.briefing;
  const mail = briefingEmail();
  const mailto = `mailto:?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.text)}`;
  const links = b.sources.map((id) => kb.sources.find((s) => s.id === id)).filter(Boolean);
  return h('div', { class: 'tool' },
    h('div', { class: 'brief-cols' },
      h('div', { class: 'brief-col' }, h('h3', null, icon('refresh', 'icon-sm'), 'What changes'), h('ul', { class: 'bullets' }, b.changes.map((x) => h('li', null, x)))),
      h('div', { class: 'brief-col' }, h('h3', null, icon('check', 'icon-sm'), 'What stays the same'), h('ul', { class: 'bullets' }, b.same.map((x) => h('li', null, x))))),
    h('p', { class: 'small' }, h('strong', null, 'Deadline: '), b.deadline, ' The full list is in ', h('a', { href: '#/knowledge/changes' }, 'Feature changes'), '.'),
    h('h3', null, 'Ready-to-send email'),
    h('p', { class: 'small muted' }, 'Copy it into Outlook, or open it in your email app. It uses your project name, window and signature from Project setup. Edit it as you like before sending.'),
    h('div', { class: 'email-preview', tabindex: '0', 'aria-label': 'Email preview' },
      h('div', { class: 'email-subject' }, h('span', { class: 'muted' }, 'Subject: '), mail.subject),
      h('pre', { class: 'email-body' }, mail.text)),
    h('div', { class: 'row-actions' },
      h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: async () => { const ok = await copyRich(mail.text, mail.html); if (ok) savedPulse('Email copied. Paste it into Outlook.'); else toast('Copy failed. Select the text and copy it by hand.', 'bad'); } }, icon('copy', 'icon-sm'), 'Copy email'),
      h('button', { type: 'button', class: 'btn btn-sm', onclick: async () => { const ok = await copyText(mail.subject); if (ok) savedPulse('Subject copied'); } }, 'Copy subject'),
      h('a', { class: 'btn btn-sm', href: mailto }, icon('external', 'icon-sm'), 'Open in email app')),
    h('p', { class: 'small muted' }, 'Sources: ', ...links.flatMap((s, i) => [i ? ', ' : '', externalLink(s.url, s.title)])));
}

// ───────── Transition window planner ─────────
function isLarger(p) {
  const yes = (id) => p.answers[id] && p.answers[id].value === 'yes';
  return yes('multi_workspace') || yes('multi_tenant') || yes('playbooks') || yes('itsm') || (p.meta.environments || []).length > 2;
}
const addDays = (iso, days) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const winDraft = { id: '', base: '', v: {} };

export function windowTool() {
  const p = state.project;
  const plan = state.kb.reference.planning;
  const base = JSON.stringify([p.meta.startDate, p.meta.windowStart, p.meta.windowEnd]);
  const dirtyNow = winDraft.id === p.id && JSON.stringify([winDraft.v.startDate, winDraft.v.windowStart, winDraft.v.windowEnd]) !== winDraft.base;
  if (winDraft.id !== p.id || (!dirtyNow && winDraft.base !== base)) { winDraft.id = p.id; winDraft.v = { startDate: p.meta.startDate || '', windowStart: p.meta.windowStart || '', windowEnd: p.meta.windowEnd || '' }; winDraft.base = base; }
  const v = winDraft.v;
  const larger = isLarger(p);
  const testUsed = p.stages.test.availability === 'available' || (p.answers.test_env && p.answers.test_env.value === 'yes');
  const phases = plan.phases.filter((ph) => ph.id !== 'test' || testUsed).map((ph) => ({ ...ph, range: larger ? ph.larger : ph.smaller }));
  const before = phases.filter((ph) => ph.id !== 'hypercare');
  const weeksBefore = before.reduce((a, ph) => a + ph.range[1], 0);
  const after = phases.find((ph) => ph.id === 'hypercare');
  const today = new Date().toISOString().slice(0, 10);
  const startBy = v.windowStart ? addDays(v.windowStart, -7 * weeksBefore) : '';
  const doneBy = (v.windowEnd || v.windowStart) ? addDays(v.windowEnd || v.windowStart, 7 * after.range[1]) : '';
  const barSlot = h('div');
  const refresh = () => barSlot.replaceChildren(saveBar(JSON.stringify([v.startDate, v.windowStart, v.windowEnd]) !== winDraft.base, save, discard, 'Saved in Project setup.'));
  const date = (key, label) => field(label, h('input', { type: 'date', value: v[key], 'data-focus-key': `win-${key}`, oninput: (e) => { v[key] = e.target.value; refresh(); }, onchange: () => render() }));
  function save() {
    if (v.windowStart && v.windowEnd && v.windowEnd < v.windowStart) { toast('The window ends before it starts. Check the dates.', 'bad'); return; }
    mutate((pr) => { Object.assign(pr.meta, { startDate: v.startDate, windowStart: v.windowStart, windowEnd: v.windowEnd }); addAudit(pr, 'project.details', 'Planned transition window updated'); });
    winDraft.id = '';
    savedPulse('Window saved');
    render();
  }
  function discard() { winDraft.id = ''; render(); }
  refresh();
  return h('div', { class: 'tool' },
    h('div', { class: 'tool-grid' }, date('startDate', 'Project start'), date('windowStart', 'Window from'), date('windowEnd', 'Window to')),
    barSlot,
    h('h3', null, 'How much time to plan'),
    h('p', { class: 'small muted' }, larger ? plan.larger : plan.smaller),
    h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Phase'), h('th', { scope: 'col', class: 'num' }, 'Typical time'))),
      h('tbody', null,
        ...before.map((ph) => h('tr', null, h('td', null, ph.label), h('td', { class: 'num' }, `${ph.range[0]} to ${ph.range[1]} weeks`))),
        h('tr', null, h('td', null, plan.change), h('td', { class: 'num' }, '1 day')),
        h('tr', null, h('td', null, after.label), h('td', { class: 'num' }, `${after.range[0]} to ${after.range[1]} weeks`))))),
    v.windowStart ? h('ul', { class: 'bullets', style: { marginTop: '12px' } },
      h('li', null, 'To reach your window with time to spare, start Prepare by ', h('strong', { class: 'tnum' }, startBy), startBy < today ? '. That date has passed: start now, or consider a later window.' : '.'),
      h('li', null, 'Expect to sign off around ', h('strong', { class: 'tnum' }, doneBy), doneBy > '2027-03-31' ? '. That is after 31 March 2027: consider an earlier window.' : ', comfortably before 31 March 2027.'))
      : h('p', { class: 'small' }, 'Enter your window above to see when to start each phase.'),
    h('p', { class: 'small muted' }, plan.note));
}

export const TOOLS = { workspaces: () => workspaceTool(), connection: () => workspaceTool({ show: 'connection' }), primary: primaryTool, owners: ownersTool, briefing: briefingTool, window: windowTool };
export const TOOL_TITLES = { workspaces: 'Your workspaces', connection: 'Connection state of your workspaces', primary: 'Choose the primary workspace', owners: 'Owners and approvers', briefing: 'Brief your stakeholders', window: 'Plan your window' };
export { same };
