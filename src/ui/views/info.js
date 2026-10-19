// Knowledge and sources, Settings and data, About.
import { h, icon, toast, modal, confirmDialog, field, saveBlob, pickFile, externalLink, readBlobBytes } from '../dom.js';
import { state, updateSettings, setStorageMode, clearEverything, deleteBrowserProject, settingsExportBlob, importSettings, closeProject, autosaveEnabled } from '../../app/store.js';
import { route, render, go } from '../shell.js';
import { confirmLeaveProject } from '../actions.js';
import { pageHead, btn, linkBtn, callout, critBadge, provenanceChip, validationChip, kv } from '../components.js';
import { BRAND, APP_VERSION } from '../../brand.js';
import { DISCLAIMER_FULL, DISCLAIMER_SHORT } from '../../core/report.js';
import { formatDate, bytesLabel, groupBy } from '../../core/util.js';
import { storageEstimate } from '../../core/storage.js';
import { rich, plain } from '../rich.js';
import { thanksLine, makersStrip } from './start.js';

const kTab = { tab: 'about', query: '' };

route('knowledge', ({ params }) => {
  const kb = state.kb;
  if (params[0]) kTab.tab = params[0];
  const tabs = [['about', 'About this knowledge base'], ['changes', 'Feature changes'], ['portal', 'Portal map'], ['dates', 'Key dates'], ['terms', 'Terminology'], ['catalogue', 'All steps'], ['coverage', 'Coverage'], ['sources', `Sources (${kb.sources.length})`]];
  const srcLinks = (ids) => h('span', { class: 'small' }, ...ids.flatMap((id, i) => { const s = kb.sources.find((x) => x.id === id); return [i ? ', ' : '', s ? externalLink(s.url, s.title) : id]; }));
  let body;
  switch (kTab.tab) {
    case 'changes':
      body = h('div', null, h('p', null, 'What changes when a workspace is connected to the Defender portal, as documented by Microsoft.'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Feature'), h('th', { scope: 'col' }, 'Change'), h('th', { scope: 'col' }, 'Sources'))),
          h('tbody', null, kb.reference.featureChanges.map((f) => h('tr', null, h('td', null, h('strong', null, f.feature)), h('td', null, rich(f.change, { kb })), h('td', null, srcLinks(f.sources)))))));
      break;
    case 'portal':
      body = h('div', null, h('p', null, 'Where each Sentinel page of the Azure portal lives in the Defender portal, from Microsoft\'s quick reference.'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Azure portal'), h('th', { scope: 'col' }, 'Defender portal'))), h('tbody', null, kb.reference.portalMap.map(([a, d]) => h('tr', null, h('td', null, a), h('td', null, d))))),
        h('p', null, 'Sources: ', srcLinks(kb.reference.portalMapSources)));
      break;
    case 'dates':
      body = h('ul', { class: 'timeline' }, kb.reference.keyDates.map((d) => h('li', null, h('time', null, d.date), h('div', null, h('p', null, rich(d.event, { kb })), srcLinks(d.sources)))));
      break;
    case 'terms':
      body = h('dl', { class: 'terms' }, ...kb.reference.terminology.flatMap((t) => [h('dt', null, t.term), h('dd', null, rich(t.meaning, { kb }), ' ', srcLinks(t.sources))]));
      break;
    case 'catalogue': {
      const q = kTab.query.toLowerCase();
      const items = kb.checks.filter((c) => !q || `${c.title} ${plain(c.objective, kb)}`.toLowerCase().includes(q));
      body = h('div', null, h('label', { class: 'search' }, icon('search', 'icon-sm'), h('span', { class: 'sr-only' }, 'Search all steps'), h('input', { type: 'search', value: kTab.query, placeholder: 'Search all steps', 'data-focus-key': 'kb-search', oninput: (e) => { kTab.query = e.target.value; render(); } })),
        ...kb.stages.map((s) => h('section', null, h('h2', { style: { marginTop: '22px' } }, s.title), h('ul', { class: 'list' }, items.filter((c) => c.stage === s.id).map((c) => h('li', { class: 'list-row' }, h('div', null, state.project ? h('a', { href: `#/item/${c.id}` }, c.title) : h('strong', null, c.title), h('div', { class: 'small muted' }, plain(c.objective, kb))), h('div', { class: 'item-chips' }, critBadge(c.criticality), provenanceChip(c), validationChip(c))))))));
      break;
    }
    case 'coverage': {
      const rows = kb.workstreams.map((w) => {
        const items = kb.checks.filter((c) => c.stage === w.stage && c.workstream === w.id);
        return h('tr', null, h('td', null, (kb.stages.find((s) => s.id === w.stage) || {}).short), h('td', null, w.title), h('td', { class: 'num' }, String(items.length)), h('td', { class: 'num' }, String(items.filter((c) => c.provenance === 'official').length)), h('td', { class: 'num' }, String(items.filter((c) => c.provenance === 'practice').length)), h('td', { class: 'num' }, String(items.filter((c) => c.validation === 'needs-review').length)), h('td', { class: 'num' }, String(items.reduce((n, c) => n + c.snippets.length, 0))));
      });
      body = h('div', null, h('p', null, 'How the knowledge base covers each workstream. "Sources differ" marks steps where Microsoft pages conflict or are unclear; the step explains the uncertainty.'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, ...['Stage', 'Workstream', 'Steps', 'From Microsoft docs', 'Practical guidance', 'Sources differ', 'Snippets'].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', null, rows)),
        h('p', { class: 'small muted' }, 'A full coverage matrix and the open questions register are kept in the project repository (research/).'));
      break;
    }
    case 'sources':
      body = h('div', null, h('p', null, 'Every Microsoft Learn page cited by this knowledge base, with the page date shown on the page and the date it was last read for this release. Links need internet and open only when you click them.'),
        h('table', { class: 'table' }, h('thead', null, h('tr', null, ...['Title', 'Page date', 'Updated', 'Verified'].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', null, kb.sources.map((s) => h('tr', null, h('td', null, externalLink(s.url, s.title)), h('td', null, s.pageDate), h('td', null, s.updated || ''), h('td', null, s.verified))))));
      break;
    default:
      body = h('div', { class: 'stack' }, kv([['Version', kb.meta.version], ['Last reviewed', kb.meta.lastReviewed], ['Steps', String(kb.checks.length)], ['Questions', String(kb.questions.length)], ['Sources', String(kb.sources.length)], ['Snippets', String(Object.keys(kb.snippets).length)]]),
        h('h2', null, 'Scope'), h('p', null, rich(kb.meta.scope, { kb })), h('h2', null, 'Method'), h('p', null, rich(kb.meta.method, { kb })), h('h2', null, 'Limitations'), h('ul', { class: 'bullets' }, kb.meta.limitations.map((l) => h('li', null, rich(l, { kb })))),
        h('h2', null, 'How to read the labels'), h('ul', { class: 'bullets' },
          h('li', null, provenanceChip({ provenance: 'official' }), ' based on current Microsoft Learn documentation. Each step lists its sources and what they support.'),
          h('li', null, provenanceChip({ provenance: 'practice' }), ' practical guidance from the makers: good practice, not a Microsoft requirement.'),
          h('li', null, validationChip({ validation: 'needs-review' }), ' Microsoft sources conflict or are unclear. The step explains the uncertainty.')));
  }
  return h('div', { class: 'page' }, pageHead('Knowledge and sources', `Everything the assistant knows, with its sources. Knowledge base ${kb.meta.version}, reviewed ${kb.meta.lastReviewed}.`),
    h('nav', { class: 'tabs', 'aria-label': 'Knowledge sections' }, tabs.map(([id, label]) => h('a', { href: `#/knowledge/${id}`, class: ['tab', kTab.tab === id && 'active'], 'aria-current': kTab.tab === id ? 'page' : null }, label))),
    h('div', { class: 'card' }, body));
});

route('settings', () => {
  const s = state.settings;
  const info = state.ui.storageInfo;
  const radio = (name, value, label, current, onChange) => h('label', { class: 'check-line' }, h('input', { type: 'radio', name, value, checked: current === value, onchange: () => onChange(value) }), ` ${label}`);
  const storagePanel = h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Saving your project'),
    h('fieldset', { class: 'stack' }, h('legend', { class: 'sr-only' }, 'Project saving'),
      radio('storage', 'none', 'I save project packages myself (default)', s.storageMode, async (v) => { await setStorageMode(v); toast('Autosave turned off. Remember to save project packages.', 'info'); }),
      radio('storage', 'browser', 'Autosave in this browser, on this computer', s.storageMode, async (v) => { await setStorageMode(v); toast('Autosave in this browser is on.', 'good'); })),
    !state.ui.idbOk ? callout('bad', 'Browser storage is not available here.', ' Autosave cannot work in this browser. Use project packages.') : null,
    s.storageMode === 'browser' ? callout('caution', 'About browser storage.', ' Not encrypted, and kept in this browser profile only. Other local HTML files opened in this browser can read it, and clearing browsing data or low disk space can remove it. Keep saving project packages as backups.') : callout('info', 'Autosave is off.', ' Your work exists only in this tab until you choose "Save package". The assistant warns you before you close the tab with unsaved changes.'),
    info ? h('p', { class: 'small muted' }, `Browser storage used by the assistant: ${bytesLabel(info.usage)}. Persistent storage granted by the browser: ${info.persisted ? 'yes' : 'no, best effort only (it may be cleared when disk space runs low)'}.`) : null);
  const prefs = h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Preferences'),
    h('div', { class: 'grid-2' },
      field('Motion', h('select', { onchange: (e) => updateSettings({ motion: e.target.value }) }, [['system', 'Follow my system setting'], ['reduced', 'Reduce motion']].map(([v, l]) => h('option', { value: v, selected: s.motion === v }, l)))),
      field('Questions', h('select', { onchange: (e) => updateSettings({ autoAdvance: e.target.value === 'on' }) }, [['on', 'Move on after Yes or No'], ['off', 'Stay until I press Next']].map(([v, l]) => h('option', { value: v, selected: (s.autoAdvance ? 'on' : 'off') === v }, l)))),
      field('Theme', h('select', { onchange: (e) => updateSettings({ theme: e.target.value }) }, [['dark', 'Dark'], ['light', 'Light'], ['system', 'Follow my system']].map(([v, l]) => h('option', { value: v, selected: s.theme === v }, l)))),
      field('Density', h('select', { onchange: (e) => updateSettings({ density: e.target.value }) }, [['comfortable', 'Comfortable'], ['compact', 'Compact']].map(([v, l]) => h('option', { value: v, selected: s.density === v }, l))))),
    h('p', { class: 'small muted' }, `Preferences are remembered in this browser's local storage${state.ui.localStorageOk ? '' : ', which is unavailable right now, so they last only for this session'}. They contain no project data.`),
    h('p', { class: 'small muted' }, 'A local HTML file cannot read or write a settings file on disk by itself; browsers block that for your security. Export and import preferences to move them between browsers or computers.'),
    h('div', { class: 'row-actions' },
      btn('Export preferences file', () => saveBlob(settingsExportBlob(), `${BRAND.fileStem}-preferences.json`, { description: 'JSON', accept: { 'application/json': ['.json'] } }), { small: true, iconName: 'download' }),
      btn('Replay the introduction', () => window.dispatchEvent(new CustomEvent('armo:intro')), { small: true, iconName: 'play' }),
      btn('Import preferences file', async () => {
        const [f] = await pickFile({ accept: '.json,application/json' });
        if (!f) return;
        if (f.size > 100000) { toast('That file is too large to be a preferences file.', 'bad'); return; }
        try { const obj = JSON.parse(new TextDecoder().decode(await readBlobBytes(f))); if (!obj || obj.schema !== 'armohub.dma.settings') throw new Error('This is not a preferences file from this assistant.'); importSettings(obj); toast('Preferences imported.', 'good'); } catch (e) { toast(e.message || 'Could not read the file.', 'bad'); }
      }, { small: true, iconName: 'upload' })));
  const browserData = h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Data stored in this browser'),
    state.ui.browserProjects.length ? h('ul', { class: 'list' }, state.ui.browserProjects.map((r) => h('li', { class: 'list-row' }, h('div', null, h('strong', null, r.name || 'Untitled'), h('div', { class: 'small muted' }, `Updated ${formatDate(r.updatedAt, true)}, ${bytesLabel(r.bytes)} of data plus attachments`)),
      state.project && state.project.id === r.id ? h('span', { class: 'small muted' }, 'Open now. Close it to delete it.') : btn('Delete', async () => { if (await confirmDialog({ title: 'Delete from this browser?', message: `"${r.name}" and its attachments will be removed from this browser's storage. Saved project packages are not affected.`, confirmLabel: 'Delete', danger: true })) { try { await deleteBrowserProject(r.id); toast('Deleted.', 'info'); } catch (e) { toast(e.message, 'bad'); } } }, { small: true, kind: 'ghost' })))) : h('p', { class: 'muted' }, 'No projects are stored in this browser.'),
    h('div', { class: 'danger-zone' }, h('h3', null, 'Reset'), h('p', { class: 'small' }, 'Remove every project, attachment and preference the assistant stored in this browser. Project packages saved as files are not affected.'),
      btn('Delete all data in this browser', async () => {
        const inp = h('input', { type: 'text', autocomplete: 'off' });
        const ok = await modal({ title: 'Delete all data in this browser?', body: h('div', { class: 'stack' }, h('p', null, 'This permanently deletes all projects, evidence files and preferences the assistant stored in this browser profile, and closes the open project. It cannot be undone.'), field('Type DELETE to confirm', inp)), actions: [{ label: 'Cancel', value: false }, { label: 'Delete everything', kind: 'danger', value: () => (inp.value === 'DELETE' ? true : (toast('Type DELETE to confirm.', 'bad'), null)) }] });
        if (ok) { try { await clearEverything(); toast('All data in this browser was deleted.', 'info'); go('#/welcome'); } catch (e) { toast(e.message, 'bad', 9000); } }
      }, { kind: 'danger', small: true })));
  const projectPanel = state.project ? h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Current project'),
    h('p', { class: 'small' }, autosaveEnabled() ? 'Autosaved in this browser.' : 'Not autosaved.'),
    btn('Close project', async () => {
      if (!(await confirmLeaveProject())) return;
      closeProject(); go('#/welcome');
    }, { small: true })) : null;
  return h('div', { class: 'page narrow' }, pageHead('Settings and data', 'Where your data lives, and how you control it.'), storagePanel, projectPanel, prefs, browserData);
});

route('about', () => h('div', { class: 'page narrow' },
  pageHead('About', `${BRAND.productName}, version ${APP_VERSION}, knowledge base ${state.kb.meta.version}.`,
    btn('Replay the introduction', () => window.dispatchEvent(new CustomEvent('armo:intro')), { iconName: 'play', small: true })),
  makersStrip(),
  h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'In short'), h('p', null, DISCLAIMER_SHORT)),
  h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Your data is yours'),
    h('ul', { class: 'bullets' },
      h('li', null, 'The assistant is one HTML file. Its Content-Security-Policy forbids every network connection (connect-src \'none\') and every remote script, style, font and image. Your browser enforces this, and each release is tested to confirm no request leaves the file.'),
      h('li', null, 'No account, telemetry, analytics, automatic updates or cloud. Links to Microsoft documentation open in a new tab only when you click them.'),
      h('li', null, 'Your project stays in this tab, in this browser if you turn autosave on, and in the project packages you save. Packages are not encrypted.'),
      h('li', null, 'The typeface (Mona Sans, SIL Open Font License) is built into the file, so nothing is downloaded.'),
      h('li', null, 'Every line of the code is readable in this file. Any doubts? Open it in a text editor and review it.'))),
  h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Why there is no live connection to your tenant'),
    h('p', null, 'Live read-only checks would need Microsoft Entra sign-in from the assistant. Entra accepts only https or localhost redirect addresses, and the Microsoft sign-in library for browsers cannot finish sign-in from a page opened as a local file. Doing it safely needs a small local launcher, an app registration in your own tenant, admin consent for read-only permissions, and tokens kept in memory only.'),
    h('p', null, 'Rather than weaken the offline promise, the assistant gives you read-only queries and a script to run with your own tools, and lets you attach the results as evidence.')),
  h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'Full disclaimer'), h('ul', { class: 'bullets' }, DISCLAIMER_FULL.map((d) => h('li', null, d))),
    h('p', { class: 'small muted' }, 'Microsoft, Microsoft Sentinel, Microsoft Defender, Azure and related names are trademarks of the Microsoft group of companies. "MS" in the product name refers to these Microsoft products only to describe what the assistant helps with. No Microsoft logos are used.')),
  h('section', { class: 'card' }, h('h2', { class: 'card-title' }, 'The makers'),
    h('p', null, `${BRAND.brandName} is an independent project by ${BRAND.makers.map((m) => m.name).join(' and ')}. It is not affiliated with, sponsored or endorsed by Microsoft or by any employer or client.`),
    thanksLine('If the assistant helped you, consider thanking'),
    h('p', { class: 'small muted' }, 'Licence: to be confirmed by the makers before publication.'))));
