// Entry point. The knowledge base is bundled into this file at build time (file:// pages cannot fetch local JSON).
import { KB } from '../content/kb.mjs';
import { initStore, state } from './app/store.js';
import { startShell, go } from './ui/shell.js';
import './ui/views/start.js';
import './ui/views/work.js';
import './ui/views/records.js';
import './ui/views/reports.js';
import './ui/views/info.js';
import { startDemo } from './ui/actions.js';

async function boot() {
  await initStore(KB);
  startShell();
  const params = new URLSearchParams(location.search);
  if ((params.get('demo') === '1' || location.hash === '#/demo') && !state.project) startDemo();
  else if (!location.hash) go(state.project ? '#/overview' : '#/welcome');
}

boot().catch((e) => {
  const el = document.getElementById('app');
  el.textContent = `The app could not start: ${e && e.message ? e.message : e}`;
});
