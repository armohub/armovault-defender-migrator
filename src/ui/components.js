// Reusable presentational components.
import { h, icon, externalLink } from './dom.js';
import { tierOf, TIERS } from '../core/depth.js';
import { statusById } from '../core/model.js';

export const STAGE_ICONS = { prepare: 'prepare', test: 'test', transition: 'transition', validate: 'validate' };

const STATUS_ICON = { not_started: 'circle', in_progress: 'half', passed: 'check', not_verified: 'question', failed: 'x', blocked: 'block', needs_review: 'alert', not_applicable: 'minus' };

export function statusPill(status, { short = true } = {}) {
  const s = statusById(status);
  return h('span', { class: ['pill', `pill-${s.tone}`], title: s.label }, icon(STATUS_ICON[status] || 'circle', 'icon-xs'), short ? s.short : s.label);
}

export function critBadge(c) {
  return h('span', { class: ['badge', `badge-${c}`], title: `Criticality: ${c}` }, c);
}

// Warnings from a gate that did not say go, for the stages after it. They inform; nothing is blocked.
export function gateWarningCallouts(warnings) {
  if (!warnings || !warnings.length) return null;
  return h('div', { class: 'stack gate-warnings' }, warnings.map((w) => callout(w.level === 'bad' ? 'bad' : w.level === 'caution' ? 'caution' : 'info', w.title, ' ', w.text, ' ', h('a', { href: `#/item/${w.gateId}` }, 'Open the decision'))));
}

// A step's tag: Must do, Recommended, Useful or Good practice.
const TIER_BADGE = { must: 'critical', recommended: 'high', useful: 'medium', extra: 'low' };
export function tierBadge(check) {
  const t = tierOf(check);
  return h('span', { class: ['badge', `badge-${TIER_BADGE[t]}`, 'tier-badge'], title: `${TIERS[t]} (criticality: ${check.criticality})` }, TIERS[t]);
}

export function kindChip(kind) {
  const label = { check: 'Check', task: 'Task', decision: 'Decision', gate: 'Gate' }[kind] || kind;
  return h('span', { class: 'chip chip-kind' }, label);
}

export function applicabilityChip(app) {
  if (!app) return null;
  if (app.value === 'unknown') return h('span', { class: 'chip chip-caution', title: app.reasons.join('\n') }, icon('question', 'icon-xs'), 'Applicability uncertain');
  if (app.value === 'not_applicable') return h('span', { class: 'chip chip-muted', title: app.reasons.join('\n') }, app.source === 'plan' ? 'Left out by your plan' : 'Not applicable to your answers');
  if (app.source === 'override') return h('span', { class: 'chip chip-info', title: app.reasons.join('\n') }, 'Applies (reviewer decision)');
  return null;
}

export function provenanceChip(c) {
  return c.provenance === 'official'
    ? h('span', { class: 'chip chip-accent', title: 'Based on current Microsoft Learn documentation (see the sources).' }, icon('shield', 'icon-xs'), 'Microsoft documentation')
    : h('span', { class: 'chip chip-info', title: 'Practical guidance from the makers of this assistant, not a Microsoft requirement.' }, icon('user', 'icon-xs'), 'Practical guidance');
}

export function validationChip(c) {
  if (c.validation === 'needs-review') return h('span', { class: 'chip chip-caution', title: 'Microsoft sources conflict or are unclear for part of this step. See "Watch out".' }, icon('alert', 'icon-xs'), 'Sources differ');
  return null;
}

export function progressBar(counts, { label } = {}) {
  const total = counts.inScope || 0;
  const segs = [
    ['passed', 'good'], ['not_verified', 'caution'], ['failed', 'bad'], ['blocked', 'bad-2'], ['needs_review', 'caution-2'], ['in_progress', 'info'],
  ];
  const bar = h('div', { class: 'progress', role: 'img', 'aria-label': label || `${counts.assessed || 0} of ${total} in-scope items assessed` });
  if (total > 0) {
    for (const [k, tone] of segs) {
      const n = counts[k] || 0;
      if (n) bar.appendChild(h('span', { class: ['seg', `seg-${tone}`], style: { width: `${(n / total) * 100}%` }, title: `${statusById(k).short}: ${n}` }));
    }
  }
  return bar;
}

export function conclusionBadge(assessment) {
  const tone = { ready: 'good', ready_with_exceptions: 'caution', undetermined: 'neutral', not_ready: 'bad', skipped: 'muted' }[assessment.level] || 'neutral';
  const ic = { ready: 'check', ready_with_exceptions: 'alert', undetermined: 'question', not_ready: 'x', skipped: 'minus' }[assessment.level] || 'question';
  return h('span', { class: ['conclusion', `conclusion-${tone}`] }, icon(ic, 'icon-sm'), assessment.label);
}

export function pageHead(title, lede, ...actions) {
  return h('div', { class: 'page-head' },
    h('div', { class: 'page-head-text' }, h('h1', { tabindex: '-1', id: 'page-title' }, title), lede ? h('p', { class: 'lede' }, lede) : null),
    actions.length ? h('div', { class: 'page-actions' }, ...actions) : null);
}

export function callout(tone, title, ...body) {
  const ic = { info: 'info', caution: 'alert', bad: 'alert', good: 'check' }[tone] || 'info';
  return h('div', { class: ['callout', `callout-${tone}`], role: tone === 'bad' ? 'alert' : null }, icon(ic, 'icon-sm'), h('div', null, title ? h('strong', null, title) : null, ...body));
}

export function emptyState(title, text, action) {
  return h('div', { class: 'empty' }, h('p', { class: 'empty-title' }, title), text ? h('p', { class: 'muted' }, text) : null, action || null);
}

export function sourceLine(kb, ref) {
  const s = kb.sources.find((x) => x.id === ref.id);
  if (!s) return h('li', null, ref.id);
  return h('li', { class: 'source' },
    externalLink(s.url, s.title),
    h('div', { class: 'small muted' }, `${s.publisher} · page date ${s.pageDate}${s.updated ? ` · updated ${s.updated}` : ''} · verified ${s.verified}`),
    ref.supports ? h('div', { class: 'small' }, 'Supports: ', ref.supports) : null);
}

export function btn(label, onclick, { kind, iconName, small, title, disabled, type = 'button', id } = {}) {
  return h('button', { type, id, class: ['btn', kind && `btn-${kind}`, small && 'btn-sm'], onclick, title, disabled, 'data-focus-key': `btn:${label}` }, iconName ? icon(iconName, 'icon-sm') : null, label);
}

export function linkBtn(label, href, { kind, iconName, small } = {}) {
  return h('a', { href, class: ['btn', kind && `btn-${kind}`, small && 'btn-sm'] }, iconName ? icon(iconName, 'icon-sm') : null, label);
}

export function kv(pairs) {
  return h('dl', { class: 'kv' }, ...pairs.filter(Boolean).flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v == null || v === '' ? h('span', { class: 'muted' }, 'Not set') : v)]));
}

export function daysUntil(dateIso) {
  const ms = new Date(`${dateIso}T00:00:00Z`).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

// An ⓘ that opens a short explanation next to what it explains. A click, Enter or Space opens it;
// Escape, a second click or a click elsewhere closes it. "key" keeps focus on it across redraws.
const openTips = new Set();
let tipsBound = false;
function closeTip(tip) {
  const b = tip.querySelector('.info-btn');
  const panel = tip.querySelector('.info-pop');
  if (b) b.setAttribute('aria-expanded', 'false');
  if (panel) panel.hidden = true;
  openTips.delete(tip);
}
function bindTips() {
  if (tipsBound) return;
  tipsBound = true;
  document.addEventListener('click', (e) => { for (const t of [...openTips]) if (!t.isConnected || !t.contains(e.target)) closeTip(t); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !openTips.size) return;
    for (const t of [...openTips]) { closeTip(t); const b = t.querySelector('.info-btn'); if (b && b.isConnected) b.focus(); }
  });
}
export function infoTip({ key, title, practice = false, label }, ...content) {
  bindTips();
  const id = `tip-${key}`;
  const panel = h('div', { class: 'info-pop', id, role: 'note', hidden: true },
    h('strong', { class: 'info-title' }, title),
    ...content,
    practice ? h('p', { class: 'info-practice' }, 'Practical guidance from the makers, not Microsoft guidance.') : null);
  const wrap = h('span', { class: 'info-tip' });
  const button = h('button', {
    type: 'button', class: 'info-btn', 'aria-expanded': 'false', 'aria-controls': id, 'aria-label': label || `More about: ${title}`, title: label || title, 'data-focus-key': `info-${key}`,
    onclick: (e) => {
      e.stopPropagation();
      if (button.getAttribute('aria-expanded') === 'true') { closeTip(wrap); return; }
      for (const t of [...openTips]) closeTip(t);
      // Keep the panel inside the window: as wide as fits, shifted left when the ⓘ is near the right edge.
      const r = button.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 24);
      panel.style.width = `${width}px`;
      panel.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - width - 12)) - r.left}px`;
      button.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      openTips.add(wrap);
    },
  }, icon('info', 'icon-sm'));
  wrap.append(button, panel);
  return wrap;
}

// A step's explainer from its short form: the lead in plain view (reassurance first), the rest behind an ⓘ.
export function stepExplainer(info, key) {
  if (!info) return null;
  const tip = infoTip({ key, title: info.title, practice: !!info.practice }, h('ul', { class: 'bullets' }, info.points.map((x) => h('li', null, x))));
  return info.lead
    ? h('p', { class: 'explain-lead' }, icon('shield', 'icon-sm'), h('span', null, info.lead), tip)
    : h('p', { class: 'explain-lead plain' }, h('span', { class: 'small muted' }, info.title), tip);
}

