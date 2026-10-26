// Proof by paste or drop. Files go through the normal evidence intake, so every safety check applies.
import { state } from '../app/store.js';
import { ingestFiles } from './actions.js';
import { filesFromTransfer, shouldTakePaste } from '../core/paste.js';

export { filesFromTransfer, shouldTakePaste };

const report = () => { /* the intake shows its own messages */ };

// One listener for the whole page: on a mission, a file paste goes to the open check, wherever the
// focus is (right after arriving it is on the page title). Not while a dialog is open.
let pasteBound = false;
function bindPagePaste() {
  if (pasteBound) return;
  pasteBound = true;
  document.addEventListener('paste', (e) => {
    if (!location.hash.startsWith('#/mission/') || document.querySelector('dialog[open]')) return;
    const row = document.querySelector('.crow.open[data-check-id]');
    const check = row && state.kb.checks.find((c) => c.id === row.dataset.checkId);
    if (!check || !shouldTakePaste(e)) return;
    e.preventDefault();
    ingestFiles(check, filesFromTransfer(e.clipboardData)).catch(report);
  });
}

// Drop files on one open check row.
export function bindProofTarget(element, check) {
  bindPagePaste();
  element.dataset.checkId = check.id;
  element.addEventListener('dragover', (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { e.preventDefault(); element.classList.add('drop-ready'); } });
  element.addEventListener('dragleave', () => element.classList.remove('drop-ready'));
  element.addEventListener('drop', (e) => {
    const files = filesFromTransfer(e.dataTransfer);
    element.classList.remove('drop-ready');
    if (!files.length) return;
    e.preventDefault();
    ingestFiles(check, files).catch(report);
  });
}
