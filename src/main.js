// Entry point. The knowledge base is bundled into this file at build time (file:// pages cannot fetch local JSON).
import { KB } from '../content/kb.mjs';
import { initStore, state, updateSettings } from './app/store.js';
import { startShell, go } from './ui/shell.js';
import { showSplash, hideSplash, playIntro } from './ui/intro.js';
import './ui/views/start.js';
import './ui/views/questionnaire.js';
import './ui/views/work.js';
import './ui/views/item.js';
import './ui/views/project.js';
import './ui/views/records.js';
import './ui/views/reports.js';
import './ui/views/info.js';
import { startDemo } from './ui/actions.js';

// Replays the introduction on request (About page).
window.addEventListener('armo:intro', async () => {
  await playIntro({ sourceCount: KB.sources.length });
});

async function boot() {
  document.body.dataset.motion = 'system';
  showSplash();
  await initStore(KB);
  document.body.dataset.theme = state.settings.theme;
  document.body.dataset.motion = state.settings.motion;
  startShell();
  const params = new URLSearchParams(location.search);
  const wantsDemo = params.get('demo') === '1' || location.hash === '#/demo';
  if (!wantsDemo && !location.hash) go(state.project ? '#/overview' : '#/welcome');
  if (!state.settings.introSeen && !wantsDemo) {
    await hideSplash({ minMs: 0 });
    await playIntro({ sourceCount: KB.sources.length });
    updateSettings({ introSeen: true }, { silent: true });
  } else {
    await hideSplash();
  }
  if (wantsDemo && !state.project) startDemo();
  const title = document.getElementById('page-title');
  if (title) title.focus({ preventScroll: true });
}

boot().catch((e) => {
  const el = document.getElementById('app');
  el.textContent = `The app could not start: ${e && e.message ? e.message : e}`;
  hideSplash({ minMs: 0 });
});
