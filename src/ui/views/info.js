// Knowledge & sources, Settings & data, About & disclaimer.
import { h, icon, toast, modal, confirmDialog, field, saveBlob, pickFile, externalLink, readBlobBytes } from '../dom.js';
import { state, updateSettings, setStorageMode, clearEverything, deleteBrowserProject, settingsExportBlob, importSettings, closeProject, autosaveEnabled } from '../../app/store.js';
import { route, render, go } from '../shell.js';
import { confirmLeaveProject } from '../actions.js';
import { pageHead, btn, linkBtn, callout, critBadge, provenanceChip, validationChip, kv } from '../components.js';
import { BRAND, APP_VERSION } from '../../brand.js';
import { DISCLAIMER_FULL, DISCLAIMER_SHORT } from '../../core/report.js';
import { formatDate, bytesLabel, groupBy } from '../../core/util.js';
import { storageEstimate } from '../../core/storage.js';

const kTab = { tab: 'about', query: '' };

route('knowledge', ({ params }) => {
  const kb = state.kb;
  if (params[0]) kTab.tab = params[0];
  const tabs = [['about', 'About this knowledge base'], ['changes', 'Feature changes'], ['portal', 'Portal map'], ['dates', 'Key dates'], ['terms', 'Terminology'], ['catalogue', 'All items'], ['coverage', 'Coverage'], ['sources', `Sources (${kb.sources.length})`]];
  const srcLinks = (ids) => h('span', { class: 'small' }, ...ids.flatMap((id, i) => { const s = kb.sources.find((x) => x.id === id); return [i ? ' · ' : '', s ? externalLink(s.url, s.title) : id]; }));
  let body;
  switch (kTab.tab) {
    case 'changes':
      body = h('div', null, h('p', null, 'What changes when a workspace is connected to the Defender portal, as documented by Microsoft.'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Feature'), h('th', { scope: 'col' }, 'Change'), h('th', { scope: 'col' }, 'Sources'))),
          h('tbody', null, kb.reference.featureChanges.map((f) => h('tr', null, h('td', null, h('strong', null, f.feature)), h('td', null, f.change), h('td', null, srcLinks(f.sources)))))));
      break;
    case 'portal':
      body = h('div', null, h('p', null, 'Where Sentinel pages from the Azure portal are found in the Defender portal (Microsoft quick reference).'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Azure portal'), h('th', { scope: 'col' }, 'Defender portal'))), h('tbody', null, kb.reference.portalMap.map(([a, d]) => h('tr', null, h('td', null, a), h('td', null, d))))),
        h('p', null, 'Sources: ', srcLinks(kb.reference.portalMapSources)));
      break;
    case 'dates':
      body = h('ul', { class: 'timeline' }, kb.reference.keyDates.map((d) => h('li', null, h('span', { class: 'mono' }, d.date), h('div', null, h('p', null, d.event), srcLinks(d.sources)))));
      break;
    case 'terms':
      body = h('dl', { class: 'terms' }, ...kb.reference.terminology.flatMap((t) => [h('dt', null, t.term), h('dd', null, t.meaning, ' ', srcLinks(t.sources))]));
      break;
    case 'catalogue': {
      const q = kTab.query.toLowerCase();
      const items = kb.checks.filter((c) => !q || `${c.id} ${c.title} ${c.objective}`.toLowerCase().includes(q));
      body = h('div', null, h('label', { class: 'search' }, icon('search', 'icon-sm'), h('span', { class: 'sr-only' }, 'Search items'), h('input', { type: 'search', value: kTab.query, placeholder: 'Search all items', 'data-focus-key': 'kb-search', oninput: (e) => { kTab.query = e.target.value; render(); } })),
        ...kb.stages.map((s) => h('section', null, h('h2', null, `Stage ${s.number} · ${s.title}`), h('ul', { class: 'list' }, items.filter((c) => c.stage === s.id).map((c) => h('li', { class: 'list-row' }, h('div', null, state.project ? h('a', { href: `#/item/${c.id}` }, h('span', { class: 'mono small' }, c.id), ' ', c.title) : h('span', null, h('span', { class: 'mono small' }, c.id), ' ', c.title), h('div', { class: 'small muted' }, c.objective)), h('div', { class: 'item-chips' }, critBadge(c.criticality), provenanceChip(c), validationChip(c))))))));
      break;
    }
    case 'coverage': {
      const rows = kb.workstreams.map((w) => {
        const items = kb.checks.filter((c) => c.stage === w.stage && c.workstream === w.id);
        return h('tr', null, h('td', null, (kb.stages.find((s) => s.id === w.stage) || {}).short), h('td', null, w.title), h('td', { class: 'num' }, String(items.length)), h('td', { class: 'num' }, String(items.filter((c) => c.provenance === 'official').length)), h('td', { class: 'num' }, String(items.filter((c) => c.provenance === 'practice').length)), h('td', { class: 'num' }, String(items.filter((c) => c.validation === 'needs-review').length)), h('td', { class: 'num' }, String(items.reduce((n, c) => n + c.snippets.length, 0))));
      });
      body = h('div', null, h('p', null, 'How the knowledge base covers each workstream. "Needs review" items contain statements where Microsoft sources conflict or are ambiguous; the uncertainty is shown on the item.'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, ...['Stage', 'Workstream', 'Items', 'From Microsoft docs', 'Practical guidance', 'Needs review', 'Snippets'].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', null, rows)),
        h('p', { class: 'small muted' }, 'A full coverage matrix and the open questions register are kept in the project repository (research/).'));
      break;
    }
    case 'sources':
      body = h('div', null, h('p', null, 'Every Microsoft Learn page cited by this knowledge base, with the page date shown on the page and the date it was last read for this release. Links need internet and open only when you click them.'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, ...['Title', 'Page date', 'Updated', 'Verified'].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', null, kb.sources.map((s) => h('tr', null, h('td', null, externalLink(s.url, s.title)), h('td', null, s.pageDate), h('td', null, s.updated || '—'), h('td', null, s.verified))))));
      break;
    default:
      body = h('div', { class: 'stack' }, kv([['Version', kb.meta.version], ['Last reviewed', kb.meta.lastReviewed], ['Items', String(kb.checks.length)], ['Questions', String(kb.questions.length)], ['Sources', String(kb.sources.length)], ['Snippets', String(Object.keys(kb.snippets).length)]]),
        h('h2', null, 'Scope'), h('p', null, kb.meta.scope), h('h2', null, 'Method'), h('p', null, kb.meta.method), h('h2', null, 'Limitations'), h('ul', null, kb.meta.limitations.map((l) => h('li', null, l))),
        h('h2', null, 'How to read provenance'), h('ul', null,
          h('li', null, provenanceChip({ provenance: 'official' }), ' derived from current Microsoft Learn documentation; each item lists its sources and what they support.'),
          h('li', null, provenanceChip({ provenance: 'practice' }), ' practical guidance from the makers — useful good practice, not a Microsoft requirement.'),
          h('li', null, validationChip({ validation: 'needs-review' }), ' Microsoft sources conflict or are ambiguous; the item explains the uncertainty.')));
  }
  return h('div', { class: 'page' }, pageHead('Knowledge & sources', `Knowledge base ${kb.meta.version}, reviewed ${kb.meta.lastReviewed}.`),
    h('nav', { class: 'tabs', 'aria-label': 'Knowledge sections' }, tabs.map(([id, label]) => h('a', { href: `#/knowledge/${id}`, class: ['tab', kTab.tab === id && 'active'], 'aria-current': kTab.tab === id ? 'page' : null }, label))),
    h('div', { class: 'card' }, body));
});

route('settings', () => {
  const s = state.settings;
  const info = state.ui.storageInfo;
  const radio = (name, value, label, current, onChange) => h('label', { class: 'check-line' }, h('input', { type: 'radio', name, value, checked: current === value, onchange: () => onChange(value) }), ` ${label}`);
  const storagePanel = h('section', { class: 'card' }, h('h2', null, 'Project saving'),
    h('fieldset', { class: 'stack' }, h('legend', { class: 'sr-only' }, 'Project saving'),
      radio('storage', 'none', 'Autosave off — I save project packages myself (default)', s.storageMode, async (v) => { await setStorageMode(v); toast('Autosave turned off. Remember to save project packages.', 'info'); }),
      radio('storage', 'browser', 'Autosave in this browser (IndexedDB on this computer)', s.storageMode, async (v) => { await setStorageMode(v); toast('Autosave in this browser is on.', 'good'); })),
    !state.ui.idbOk ? callout('bad', 'Browser storage is not available here.', ' Autosave cannot work in this browser. Use project packages.') : null,
    s.storageMode === 'browser' ? callout('caution', 'About browser storage.', ' Unencrypted, in this browser profile only; shared with other local HTML files opened in this browser; can be removed by clearing browsing data or under disk pressure. Keep saving project packages for backups.') : callout('info', 'Autosave is off.', ' Your work exists only in this tab until you choose "Save project package". The app warns before you close the tab with unsaved changes.'),
    info ? h('p', { class: 'small muted' }, `This app's browser storage: ${bytesLabel(info.usage)} used. Persistent storage granted by the browser: ${info.persisted ? 'yes' : 'no (best effort — may be cleared under storage pressure)'}.`) : null);
  const prefs = h('section', { class: 'card' }, h('h2', null, 'Preferences'),
    h('div', { class: 'grid-2' },
      field('Theme', h('select', { onchange: (e) => updateSettings({ theme: e.target.value }) }, [['system', 'Follow system'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => h('option', { value: v, selected: s.theme === v }, l)))),
      field('Density', h('select', { onchange: (e) => updateSettings({ density: e.target.value }) }, [['comfortable', 'Comfortable'], ['compact', 'Compact']].map(([v, l]) => h('option', { value: v, selected: s.density === v }, l))))),
    h('p', { class: 'small muted' }, `Preferences are remembered in this browser's local storage${state.ui.localStorageOk ? '' : ' — currently unavailable, so they last only for this session'}. They contain no project data.`),
    h('p', { class: 'small muted' }, 'A plain HTML file cannot silently read or write a settings file on disk at start-up; browsers block this for security. Use export/import below to move preferences between browsers or computers.'),
    h('div', { class: 'row-actions' },
      btn('Export preferences file', () => saveBlob(settingsExportBlob(), `${BRAND.fileStem}-preferences.json`, { description: 'JSON', accept: { 'application/json': ['.json'] } }), { small: true, iconName: 'download' }),
      btn('Import preferences file', async () => {
        const [f] = await pickFile({ accept: '.json,application/json' });
        if (!f) return;
        if (f.size > 100000) { toast('That file is too large to be a preferences file.', 'bad'); return; }
        try { const obj = JSON.parse(new TextDecoder().decode(await readBlobBytes(f))); if (!obj || obj.schema !== 'armohub.dma.settings') throw new Error('Not a preferences file from this app.'); importSettings(obj); toast('Preferences imported.', 'good'); } catch (e) { toast(e.message || 'Could not read the file.', 'bad'); }
      }, { small: true, iconName: 'upload' })));
  const browserData = h('section', { class: 'card' }, h('h2', null, 'Data stored in this browser'),
    state.ui.browserProjects.length ? h('ul', { class: 'list' }, state.ui.browserProjects.map((r) => h('li', { class: 'list-row' }, h('div', null, h('strong', null, r.name || 'Untitled'), h('div', { class: 'small muted' }, `Updated ${formatDate(r.updatedAt, true)} · ${bytesLabel(r.bytes)} data (plus attachments)`)),
      state.project && state.project.id === r.id ? h('span', { class: 'small muted' }, 'Open now — close it to delete') : btn('Delete', async () => { if (await confirmDialog({ title: 'Delete from this browser?', message: `"${r.name}" and its attachments will be removed from this browser's storage. Saved project packages are not affected.`, confirmLabel: 'Delete', danger: true })) { try { await deleteBrowserProject(r.id); toast('Deleted.', 'info'); } catch (e) { toast(e.message, 'bad'); } } }, { small: true, kind: 'ghost' })))) : h('p', { class: 'muted' }, 'No projects are stored in this browser.'),
    h('div', { class: 'danger-zone' }, h('h3', null, 'Reset'), h('p', { class: 'small' }, 'Remove every project, attachment and preference this app stored in this browser. Project packages saved as files are not affected.'),
      btn('Delete all app data in this browser…', async () => {
        const inp = h('input', { type: 'text', autocomplete: 'off' });
        const ok = await modal({ title: 'Delete all app data in this browser?', body: h('div', { class: 'stack' }, h('p', null, 'This permanently deletes all projects, evidence files and preferences stored by this app in this browser profile, and closes the open project. It cannot be undone.'), field('Type DELETE to confirm', inp)), actions: [{ label: 'Cancel', value: false }, { label: 'Delete everything', kind: 'danger', value: () => (inp.value === 'DELETE' ? true : (toast('Type DELETE to confirm.', 'bad'), null)) }] });
        if (ok) { try { await clearEverything(); toast('All app data in this browser was deleted.', 'info'); go('#/welcome'); } catch (e) { toast(e.message, 'bad', 9000); } }
      }, { kind: 'danger', small: true })));
  const projectPanel = state.project ? h('section', { class: 'card' }, h('h2', null, 'Current project'),
    h('p', { class: 'small' }, autosaveEnabled() ? 'Autosaved in this browser.' : 'Not autosaved.'),
    btn('Close project', async () => {
      if (!(await confirmLeaveProject())) return;
      closeProject(); go('#/welcome');
    }, { small: true })) : null;
  return h('div', { class: 'page narrow' }, pageHead('Settings & data', 'Where your data lives, and how to control it.'), storagePanel, projectPanel, prefs, browserData);
});

route('about', () => h('div', { class: 'page narrow' },
  pageHead('About & disclaimer', `${BRAND.productName} · version ${APP_VERSION} · knowledge base ${state.kb.meta.version}`),
  h('section', { class: 'card' }, h('h2', null, 'In short'), h('p', null, DISCLAIMER_SHORT)),
  h('section', { class: 'card' }, h('h2', null, 'Full disclaimer'), h('ul', null, DISCLAIMER_FULL.map((d) => h('li', null, d))),
    h('p', null, 'Microsoft, Microsoft Sentinel, Microsoft Defender and related names are trademarks of the Microsoft group of companies and are used here only to describe the products this tool helps with. No Microsoft logos are used.')),
  h('section', { class: 'card' }, h('h2', null, 'Privacy and network behaviour'),
    h('ul', null,
      h('li', null, 'The downloaded app is a single HTML file. It contains a Content-Security-Policy that forbids all network connections (connect-src \'none\') and all remote scripts, styles, fonts and images. The browser enforces this; the tests for each release verify that no request leaves the app.'),
      h('li', null, 'No account, telemetry, analytics, auto-update or cloud backend. Links to Microsoft documentation open in a new tab only when you click them.'),
      h('li', null, 'Project data stays in this browser tab, in this browser\'s storage if you enable autosave, and in project packages you save. Packages are not encrypted.'),
      h('li', null, 'If you use the hosted demo on a website, the website itself is delivered over the internet; the app still makes no further requests once loaded.'))),
  h('section', { class: 'card' }, h('h2', null, 'Why there is no connected mode yet'),
    h('p', null, 'Live read-only checks would require Microsoft Entra sign-in from the app. Microsoft Entra only accepts https or localhost redirect addresses, and the Microsoft authentication library for browsers cannot complete sign-in from a page opened as a local file. Doing it safely needs a small local launcher, an app registration created in your own tenant, explicit admin consent for read-only permissions, and tokens kept in memory only.'),
    h('p', null, 'Rather than weaken the offline guarantee, this release provides read-only queries and scripts you run yourself with your own tools, and lets you attach their results as evidence. Connected mode is on the roadmap as a separate, clearly labelled option.')),
  h('section', { class: 'card makers' },
    h('div', { class: 'makers-avatars', 'aria-hidden': 'true' }, BRAND.makers.map((m) => h('span', { class: 'avatar' }, m.initials))),
    h('div', null, h('h2', null, `Built by ${BRAND.makers.map((m) => m.name).join(' & ')}`),
      h('p', null, `${BRAND.brandName} is an independent project and is not affiliated with, sponsored or endorsed by Microsoft or by any employer or client.`),
      BRAND.contactUrl ? h('a', { href: BRAND.contactUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Get in touch with the makers') : h('p', { class: 'small muted' }, 'Contact details and profiles will be added with the public release.'),
      h('p', { class: 'small muted' }, 'Licence: to be confirmed before public release (see the repository release checklist).')))));
