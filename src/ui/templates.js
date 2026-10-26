// Ready texts, and the three ways to send any of them: formatted copy, Outlook draft, email app.
import { h, icon, toast, copyText, savedPulse, saveBlob } from './dom.js';
import { state, mutate } from '../app/store.js';
import { addAudit, plannedRole } from '../core/model.js';
import { buildEml, emlFileName } from '../core/eml.js';

const longDate = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function copyRich(text, html) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      return true;
    }
  } catch { /* fall back to plain text */ }
  return copyText(text);
}

// Email apps cut long mailto links, so a long text opens as the first shorter version that fits.
const MAILTO_LIMIT = 2000;
export function mailtoFor(texts, subject) {
  const links = texts.map((t) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(t)}`);
  const i = links.findIndex((x) => x.length <= MAILTO_LIMIT);
  return i === 0 ? { href: links[0], short: false } : { href: links[i < 0 ? links.length - 1 : i], short: true };
}

// audit: the audit action recorded when the text is copied or downloaded (used by "Use my entries as proof").
export function emailActions(mail, { audit, label, short = [] } = {}) {
  const record = (how) => { if (audit) mutate((p) => addAudit(p, audit, `${label || mail.subject} ${how}`)); };
  const mt = mailtoFor([mail.text, ...short], mail.subject);
  return h('div', { class: 'stack email-actions' },
    h('div', { class: 'row-actions' },
      h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: async () => { const ok = await copyRich(mail.text, mail.html); if (ok) { record('copied'); savedPulse('Email copied. Paste it into Outlook.'); } else toast('Copy failed. Select the text and copy it by hand.', 'bad'); } }, icon('copy', 'icon-sm'), 'Copy email'),
      h('button', { type: 'button', class: 'btn btn-sm', onclick: async () => { const res = await saveBlob(new Blob([buildEml(mail)], { type: 'message/rfc822' }), emlFileName(mail.subject), { description: 'Email draft', accept: { 'message/rfc822': ['.eml'] } }); if (res !== 'cancelled') record('downloaded as an Outlook draft'); } }, icon('download', 'icon-sm'), 'Download as Outlook draft'),
      h('a', { class: 'btn btn-sm', href: mt.href }, icon('external', 'icon-sm'), 'Open in email app')),
    h('p', { class: 'small muted' }, 'Copy email keeps formatting and links for Outlook. The Outlook draft (.eml) opens as a new message in Outlook for Windows; other mail apps may open it as a received message, so use Copy email there. ', mt.short ? 'Open in email app starts a shorter version, because email apps limit how long a link can be.' : ''));
}

// Builds a ready text from the knowledge base and the project. Placeholders with no value are left out.
export function readyText(key) {
  const kb = state.kb;
  const p = state.project;
  const t = kb.reference.readyTexts[key];
  const envs = (p.meta.environments || []).filter((e) => e.alias);
  const primaries = envs.filter((e) => plannedRole(p, e) === 'primary').map((e) => e.alias);
  const fill = {
    window: p.meta.windowStart ? (p.meta.windowEnd && p.meta.windowEnd !== p.meta.windowStart ? `between ${longDate(p.meta.windowStart)} and ${longDate(p.meta.windowEnd)}` : `on ${longDate(p.meta.windowStart)}`) : '',
    workspaces: envs.length ? `(${envs.map((e) => e.alias).join(', ')})` : '',
    primary: primaries.length ? `, with ${primaries.join(' and ')} as primary` : '',
    approvers: (p.meta.approvers || []).map((a) => `${a.role}: ${a.name}`).join('; '),
    lead: (p.meta.workstreamOwners || {})['prepare:operations'] || p.meta.operatorName || 'the SOC lead',
  };
  const sub = (s) => String(s || '').replace(/\{(\w+)\}/g, (all, k) => fill[k] || '').replace(/\s+([.,])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  const sections = t.sections.map((s) => ({ title: s.title, text: sub(s.text), points: (s.points || []).map(sub) })).filter((s) => s.text || s.points.length);
  const sign = [p.meta.operatorName, p.meta.operatorRole].filter(Boolean).join(', ');
  const closing = sub(t.closing);
  const text = ['Hello,', '', ...sections.flatMap((s) => [`${s.title}:`, ...(s.text ? [s.text] : []), ...s.points.map((x) => `- ${x}`), '']), ...(closing ? [closing, ''] : []), 'Kind regards,', sign].join('\n');
  const html = `<p>Hello,</p>${sections.map((s) => `<p><b>${esc(s.title)}</b>${s.text ? `<br>${esc(s.text)}` : ''}</p>${s.points.length ? `<ul>${s.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`).join('')}${closing ? `<p>${esc(closing)}</p>` : ''}<p>Kind regards,<br>${esc(sign)}</p>`;
  return { subject: t.subject, label: t.label, text, html, sections, closing };
}
