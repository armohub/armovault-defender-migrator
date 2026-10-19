// End-to-end tests of the built single-file app, opened via file:// in the locally installed browser(s).
// Every http(s)/ws request is recorded; any request fails the run. Results: test-results/e2e-results.json
//   node tests/e2e/run-e2e.mjs [--channel msedge|chrome] [--headed]
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';

const args = process.argv.slice(2);
const channel = args.includes('--channel') ? args[args.indexOf('--channel') + 1] : 'msedge';
const headless = !args.includes('--headed');
const appFile = path.resolve('dist/ArMoHub-Defender-Migration-Assistant.html');
const appUrl = pathToFileURL(appFile).href;
const outDir = path.resolve('test-results');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'armohub-e2e-'));
fs.mkdirSync(outDir, { recursive: true });

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'); // valid 1×1 PNG
const pngPath = path.join(work, 'evidence-shot.png'); fs.writeFileSync(pngPath, PNG);
const fakePng = path.join(work, 'not-really.png'); fs.writeFileSync(fakePng, '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__xss=1"></svg>');
const bigFile = path.join(work, 'too-big.png'); fs.writeFileSync(bigFile, Buffer.concat([PNG, Buffer.alloc(16 * 1024 * 1024)]));
const garbage = path.join(work, 'garbage.zip'); fs.writeFileSync(garbage, Buffer.from('PK\x03\x04 this is not a real zip file at all'));
const foreignJson = path.join(work, 'foreign.json'); fs.writeFileSync(foreignJson, JSON.stringify({ hello: 'world' }));

const results = [];
const network = [];
const consoleErrors = [];
let stepNo = 0;
async function step(name, fn) {
  stepNo += 1;
  const t0 = Date.now();
  try { await fn(); results.push({ n: stepNo, name, ok: true, ms: Date.now() - t0 }); console.log(`  ✔ ${name}`); }
  catch (e) { results.push({ n: stepNo, name, ok: false, ms: Date.now() - t0, error: String(e && e.stack ? e.stack : e).slice(0, 2000) }); console.log(`  ✖ ${name}\n    ${String(e && e.message ? e.message : e).split('\n')[0]}`); }
}

const profile = path.join(work, 'profile');
async function launch() {
  const ctx = await chromium.launchPersistentContext(profile, { channel, headless, acceptDownloads: true, viewport: { width: 1400, height: 900 } });
  // Force the download fallback (the native "Save as" dialog of the File System Access API cannot be automated).
  await ctx.addInitScript(() => { try { delete window.showSaveFilePicker; window.showSaveFilePicker = undefined; } catch { /* ignore */ } });
  ctx.on('request', (r) => { const u = r.url(); if (/^(https?|wss?):/i.test(u)) network.push(u); });
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  return { ctx, page };
}

const dlg = (page) => page.locator('dialog[open]');
async function clickDlg(page, name) { await dlg(page).getByRole('button', { name, exact: true }).click(); }
async function go(page, hash) { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(150); }
async function chooseFile(page, trigger, file) {
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), trigger()]);
  await fc.setFiles(file);
}
async function download(page, trigger) {
  const [d] = await Promise.all([page.waitForEvent('download'), trigger()]);
  const p = path.join(work, d.suggestedFilename());
  await d.saveAs(p);
  return p;
}
async function a11yAudit(page) {
  return page.evaluate(() => {
    const problems = [];
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    for (const el of document.querySelectorAll('input, select, textarea')) {
      if (!visible(el) || el.type === 'hidden') continue;
      const id = el.id;
      const labelled = (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (!labelled) problems.push(`unlabelled ${el.tagName.toLowerCase()} ${el.type || ''} ${el.name || ''}`);
    }
    for (const el of document.querySelectorAll('button, a[href]')) {
      if (!visible(el)) continue;
      const name = (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title');
      if (!name) problems.push(`nameless ${el.tagName.toLowerCase()} ${el.className}`);
    }
    for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) problems.push('img without alt');
    if (!document.documentElement.lang) problems.push('missing lang');
    if (!document.querySelector('h1')) problems.push('no h1');
    if (!document.querySelector('main')) problems.push('no main landmark');
    return problems;
  });
}

console.log(`E2E on ${channel} (${headless ? 'headless' : 'headed'}) — ${appUrl}`);
let { ctx, page } = await launch();

await step('App loads from file:// with the welcome screen and a strict CSP', async () => {
  await page.goto(appUrl);
  await page.getByRole('heading', { name: 'ArMoHub Defender Migration Assistant' }).waitFor();
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /default-src 'none'/);
  assert.ok(!/unsafe-inline|unsafe-eval/.test(csp));
});

await step('CSP blocks a deliberate network request from the page (defence verified in-browser)', async () => {
  const blocked = await page.evaluate(async () => { try { await fetch('https://example.com/should-be-blocked'); return false; } catch { return true; } });
  assert.equal(blocked, true);
  network.splice(0); // the attempted request above is reported by the browser even though CSP blocked it; reset the log
  consoleErrors.splice(0); // and the CSP violation messages it produced
});

await step('Welcome screen passes basic accessibility checks; skip link works by keyboard', async () => {
  assert.deepEqual(await a11yAudit(page), []);
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.textContent);
  assert.match(focused, /Skip to content/);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
});

await step('Create a tailored project with browser autosave', async () => {
  await page.getByRole('button', { name: 'Start a new project' }).click();
  await page.getByLabel('Project or customer label').fill('E2E transition <b>bold?</b>');
  await page.getByLabel('Your name (operator)').fill('E2E Operator');
  await page.getByLabel('Your role (optional)').fill('Tester');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Alias').first().fill('E2E-PROD');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Autosave in this browser', { exact: true }).click();
  await page.getByText('Know what browser storage means.').waitFor();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Tailor the checklist to my environment').click();
  await page.getByRole('button', { name: 'Create project' }).click();
  assert.ok(await page.getByText('Please confirm the responsibility statement').isVisible(), 'disclaimer must be required');
  await page.getByLabel(/I understand that this tool is guidance only/).check();
  await page.getByRole('button', { name: 'Create project' }).click();
  await page.getByRole('heading', { name: 'Environment questionnaire' }).waitFor();
  // user text is rendered as text, not markup
  assert.equal(await page.locator('.sidebar-project-name').textContent(), 'E2E transition <b>bold?</b>');
});

await step('Questionnaire: Yes / No / I don\'t know drive applicability; unknown keeps items in scope', async () => {
  await page.locator('input[name="q-multi_workspace"][value="unknown"]').check();
  await page.locator('input[name="q-defender_xdr"][value="yes"]').check();
  await go(page, '#/questionnaire/data');
  await page.locator('input[name="q-mdc"][value="no"]').check();
  await go(page, '#/questionnaire/automation');
  await page.locator('input[name="q-automation_rules"][value="yes"]').check();
  await go(page, '#/item/PREP-TOP-02');
  await page.getByText('Uncertain — needs investigation.').waitFor();
  await go(page, '#/item/PREP-CON-02');
  await page.getByText('Does not apply based on your answers.').waitFor();
  await go(page, '#/stage/prepare');
  await page.getByRole('button', { name: /Not applicable/ }).click();
  await page.getByText('PREP-CON-02').first().waitFor();
  await page.getByRole('button', { name: /In scope/ }).click();
});

await step('"Passed" requires evidence; assertion-only is recorded as "Not verified"', async () => {
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('button[role="radio"][title^="Passed"]').click();
  await dlg(page).getByText('Evidence required').waitFor();
  await clickDlg(page, 'Record as not verified');
  await page.locator('button[role="radio"][aria-checked="true"][title^="Done — not verified"]').waitFor();
});

await step('Add an observation note and a screenshot; then mark Passed — verified', async () => {
  await page.getByRole('button', { name: 'Observation' }).click();
  await dlg(page).getByLabel('Title').fill('Kick-off briefing held');
  await dlg(page).getByLabel('Observation').fill('Briefed SOC, IAM and compliance on <script>window.__xss=1</script> facts.');
  await clickDlg(page, 'Add note');
  await chooseFile(page, () => page.getByRole('button', { name: 'Screenshot' }).click(), pngPath);
  await dlg(page).getByLabel(/checked this attachment/).check();
  await clickDlg(page, 'Add evidence');
  await page.locator('.evidence-item img.thumb').first().waitFor();
  await page.waitForFunction(() => { const i = document.querySelector('.evidence-item img.thumb'); return i && i.naturalWidth === 1; }, null, { timeout: 10000 });
  await page.locator('button[role="radio"][title^="Passed"]').click();
  await page.locator('button[role="radio"][aria-checked="true"][title^="Passed"]').waitFor();
  assert.equal(await page.evaluate(() => window.__xss), undefined, 'injected text must not execute');
});

await step('Unsafe and oversized evidence files are rejected', async () => {
  await chooseFile(page, () => page.getByRole('button', { name: 'Screenshot' }).click(), fakePng);
  await page.getByText(/unsupported or unsafe file type/).waitFor();
  await chooseFile(page, () => page.getByRole('button', { name: 'File' }).click(), bigFile);
  await page.getByText(/larger than 15.0 MB/).waitFor();
  assert.equal(await page.locator('.evidence-item').count(), 2);
});

await step('Failed status requires a rationale; exception with named acceptance is recorded', async () => {
  await go(page, '#/item/PREP-AUT-01');
  await page.locator('button[role="radio"][title="Failed"]').click();
  await dlg(page).getByLabel('Rationale').fill('Five rules use the Incident provider condition.');
  await clickDlg(page, 'Save');
  await page.locator('button[role="radio"][aria-checked="true"][title="Failed"]').waitFor();
  await page.getByRole('button', { name: 'Record exception' }).click();
  await dlg(page).getByLabel('Title').fill('PREP-AUT-01: accept until redesign');
  await dlg(page).getByLabel('Accepted by').fill('CISO Example');
  await dlg(page).getByLabel('Their role').fill('CISO');
  await dlg(page).getByLabel('Rationale and compensating controls').fill('Monitor automation health daily until fixed.');
  await clickDlg(page, 'Add');
  await page.getByText('accepted by CISO Example').waitFor();
});

await step('Changing an answer warns about the plan change and preserves records', async () => {
  await go(page, '#/questionnaire/automation');
  await page.locator('input[name="q-automation_rules"][value="no"]').check();
  await dlg(page).getByText('This answer changes your plan').waitFor();
  await dlg(page).getByText(/no longer apply/).waitFor();
  await clickDlg(page, 'OK');
  await go(page, '#/item/PREP-AUT-01');
  await page.getByText('Does not apply based on your answers.').waitFor();
  await page.locator('button[role="radio"][aria-checked="true"][title="Failed"]').waitFor();
  await go(page, '#/questionnaire/automation');
  await page.locator('input[name="q-automation_rules"][value="yes"]').check();
  if (await dlg(page).count()) await clickDlg(page, 'OK');
});

await step('Gate decision needs a typed decision maker', async () => {
  await go(page, '#/item/PREP-PLN-05');
  await page.locator('.gate-form select').selectOption('go_with_exceptions');
  await page.getByRole('button', { name: 'Record decision' }).click();
  await page.getByText('Record who made the decision.').waitFor();
  await page.locator('.gate-form').getByLabel('Decided by').fill('SOC Lead Example');
  await page.locator('.gate-form').getByLabel('Rationale').fill('Proceed with the automation exception.');
  await page.getByRole('button', { name: 'Record decision' }).click();
  await page.getByText(/Recorded: Go with documented exceptions/).waitFor();
});

await step('Optional test stage can be skipped with a reason', async () => {
  await go(page, '#/stage/test');
  await page.getByRole('button', { name: 'No — skip with reason' }).click();
  await dlg(page).getByLabel('Reason').fill('No non-production tenant exists.');
  await clickDlg(page, 'Save');
  await page.getByText('Test stage marked unavailable.').waitFor();
  await go(page, '#/overview');
  await page.getByText('Test stage not available').first().waitFor();
});

await step('Import read-only inventory results as labelled evidence and confirmed suggestions', async () => {
  await go(page, '#/stage/prepare');
  await chooseFile(page, () => page.getByRole('button', { name: 'Import inventory results' }).click(), path.resolve('samples/sample-inventory.json'));
  await dlg(page).getByText('Suggested questionnaire answers').waitFor();
  await dlg(page).getByLabel(/Fusion \(Advanced multistage attack detection\) rule enabled\?/).check();
  await clickDlg(page, 'Import selected');
  await go(page, '#/item/PREP-DET-03');
  await page.locator('.evidence-item strong', { hasText: 'Imported inventory: 1 Microsoft incident creation rule' }).waitFor();
  await page.locator('.evidence-item .small', { hasText: 'imported' }).first().waitFor();
  await go(page, '#/item/PREP-DET-02');
  await page.getByText('Applies.').waitFor();
});

await step('Every main view renders without errors and passes basic accessibility checks', async () => {
  for (const h of ['#/overview', '#/stage/prepare', '#/stage/transition', '#/stage/validate', '#/item/TRN-10', '#/register', '#/evidence', '#/reports', '#/knowledge/sources', '#/knowledge/coverage', '#/settings', '#/about']) {
    await go(page, h);
    const problems = await a11yAudit(page);
    assert.deepEqual(problems, [], `${h}: ${problems.join('; ')}`);
  }
});

let pdfPath;
await step('Readiness report renders and produces a multi-page A4 PDF offline', async () => {
  await go(page, '#/report/prepare');
  await page.getByRole('heading', { name: 'Preparation and readiness report' }).waitFor();
  assert.ok(await page.getByText('SOC Lead Example').count() > 0, 'gate decision maker appears');
  assert.ok(await page.getByText('CISO Example').count() > 0, 'exception acceptance appears');
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  pdfPath = path.join(outDir, `report-prepare-${channel}.pdf`);
  fs.writeFileSync(pdfPath, pdf);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert.ok(pdf.length > 20000 && pages >= 3, `pdf bytes ${pdf.length}, pages ${pages}`);
});

await step('Snapshot is saved, listed and verified by its fingerprint', async () => {
  await page.getByRole('button', { name: 'Save snapshot' }).click();
  await dlg(page).getByLabel('Note (optional)').fill('Stage 1 gate');
  await clickDlg(page, 'Save snapshot');
  await go(page, '#/reports');
  await page.getByRole('link', { name: 'Preparation and readiness report' }).first().click();
  await page.getByText('Fingerprint matches').waitFor();
});

let pkgPath;
await step('Save project package (.zip) with evidence', async () => {
  await go(page, '#/overview');
  pkgPath = await download(page, () => page.getByRole('button', { name: 'Save project package' }).click());
  assert.match(path.basename(pkgPath), /^armohub-dma-.*\.zip$/);
  assert.ok(fs.statSync(pkgPath).size > 2000);
});

await step('Exports: JSON data, checklist CSV, register CSV and evidence index CSV', async () => {
  await go(page, '#/reports');
  const j = await download(page, () => page.getByRole('button', { name: 'Export JSON' }).click());
  const obj = JSON.parse(fs.readFileSync(j, 'utf8'));
  assert.equal(obj.schema, 'armohub.dma.project');
  const c = await download(page, () => page.getByRole('button', { name: 'Export CSV' }).click());
  const csv = fs.readFileSync(c, 'utf8');
  assert.ok(csv.startsWith('﻿stage,workstream,id'));
  await go(page, '#/register');
  const r = await download(page, () => page.getByRole('button', { name: 'Export CSV' }).click());
  assert.match(fs.readFileSync(r, 'utf8'), /CISO Example/);
  await go(page, '#/evidence');
  const e = await download(page, () => page.getByRole('button', { name: 'Export evidence index (CSV)' }).click());
  assert.match(fs.readFileSync(e, 'utf8'), /evidence-shot\.png/);
});

await step('Browser autosave survives a full browser restart (project and screenshot restored)', async () => {
  await page.waitForTimeout(1200);
  await ctx.close();
  ({ ctx, page } = await launch());
  await page.goto(appUrl);
  await page.locator('.sidebar-project-name').waitFor();
  assert.equal(await page.locator('.sidebar-project-name').textContent(), 'E2E transition <b>bold?</b>');
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('button[role="radio"][aria-checked="true"][title^="Passed"]').waitFor();
  await page.waitForFunction(() => { const i = document.querySelector('.evidence-item img.thumb'); return i && i.naturalWidth === 1; }, null, { timeout: 10000 });
});

await step('Malformed, foreign and tampered files are refused without changing anything', async () => {
  await go(page, '#/welcome');
  await chooseFile(page, () => page.getByRole('button', { name: 'Open a project package' }).click(), garbage);
  await dlg(page).getByText('This file could not be opened').waitFor();
  await clickDlg(page, 'OK');
  await chooseFile(page, () => page.getByRole('button', { name: 'Open a project package' }).click(), foreignJson);
  await dlg(page).getByText(/not an ArMoHub Defender Migration Assistant project/).waitFor();
  await clickDlg(page, 'OK');
  // tamper with project.json inside the saved package (keep the zip valid, break the manifest hash)
  const { readZip, createZip } = await import(pathToFileURL(path.resolve('src/core/zip.js')).href);
  const entries = await readZip(new Uint8Array(fs.readFileSync(pkgPath)));
  const pj = JSON.parse(new TextDecoder().decode(entries.get('project.json')));
  pj.checks['PREP-AUT-01'].status = 'passed';
  const tampered = await createZip([...entries].map(([name, data]) => ({ name, data: name === 'project.json' ? JSON.stringify(pj) : data })));
  const tamperedPath = path.join(work, 'tampered.zip');
  fs.writeFileSync(tamperedPath, Buffer.from(await tampered.arrayBuffer()));
  await chooseFile(page, () => page.getByRole('button', { name: 'Open a project package' }).click(), tamperedPath);
  await dlg(page).getByText(/does not match the hash/).waitFor();
  await clickDlg(page, 'OK');
  assert.equal(await page.locator('.sidebar-project-name').textContent(), 'E2E transition <b>bold?</b>', 'current project untouched');
});

await step('Delete browser data, then reopen from the package: statuses, evidence, snapshot and audit intact', async () => {
  await go(page, '#/settings');
  await page.getByRole('button', { name: 'Delete all app data in this browser…' }).click();
  await dlg(page).getByLabel('Type DELETE to confirm').fill('DELETE');
  await clickDlg(page, 'Delete everything');
  await page.getByRole('heading', { name: 'ArMoHub Defender Migration Assistant' }).waitFor();
  await chooseFile(page, () => page.getByRole('button', { name: 'Open a project package' }).click(), pkgPath);
  await dlg(page).getByText('Integrity checks passed.').waitFor();
  await clickDlg(page, 'Open project');
  await page.locator('.sidebar-project-name').waitFor();
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('button[role="radio"][aria-checked="true"][title^="Passed"]').waitFor();
  await page.waitForFunction(() => { const i = document.querySelector('.evidence-item img.thumb'); return i && i.naturalWidth === 1; }, null, { timeout: 10000 });
  await go(page, '#/item/PREP-AUT-01');
  await page.getByText('accepted by CISO Example').waitFor();
  await go(page, '#/reports');
  await page.getByText('Stage 1 gate').waitFor();
});

await step('Full-checklist project without autosave warns about unsaved work', async () => {
  await go(page, '#/settings');
  await page.getByRole('button', { name: 'Close project' }).click();
  if (await dlg(page).count()) await clickDlg(page, 'Close without saving');
  await page.getByRole('button', { name: 'Start a new project' }).click();
  await page.getByLabel('Project or customer label').fill('Full checklist project');
  await page.getByLabel('Your name (operator)').fill('Second Operator');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Autosave off (default) — save project packages yourself', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Show me the full checklist').click();
  await page.getByLabel(/I understand that this tool is guidance only/).check();
  await page.getByRole('button', { name: 'Create project' }).click();
  await page.getByRole('heading', { name: 'Full checklist project' }).waitFor();
  await page.getByText('Unsaved changes — not stored anywhere yet').waitFor();
  await go(page, '#/stage/prepare');
  const all = await page.getByRole('button', { name: /^All/ }).textContent();
  const inScope = await page.getByRole('button', { name: /^In scope/ }).textContent();
  assert.equal(inScope.replace(/\D/g, ''), all.replace(/\D/g, ''), 'full checklist: everything in scope');
  let sawBeforeUnload = false;
  page.once('dialog', async (d) => { sawBeforeUnload = d.type() === 'beforeunload'; await d.dismiss(); });
  await page.close({ runBeforeUnload: true });
  await new Promise((r) => setTimeout(r, 800));
  assert.equal(sawBeforeUnload, true);
});

await step('Demo project loads with fictional data and the final report renders', async () => {
  page = await ctx.newPage();
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  await page.goto(`${appUrl}?demo=1`);
  await page.getByText('Demo project — fictional data.').waitFor();
  await go(page, '#/report/final');
  await page.getByText('DEMO — FICTIONAL DATA. Not a record of any real organisation.').waitFor();
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  fs.writeFileSync(path.join(outDir, `report-final-demo-${channel}.pdf`), pdf);
  assert.ok(pdf.length > 20000);
});

await step('No network request was made during the whole run, and no console errors occurred', async () => {
  assert.deepEqual(network, []);
  assert.deepEqual(consoleErrors.filter((e) => !/Failed to load resource: net::ERR_FILE_NOT_FOUND/.test(e)), []);
});

await ctx.close();
const summary = { channel, headless, app: path.basename(appFile), ranAt: new Date().toISOString(), passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
fs.writeFileSync(path.join(outDir, `e2e-results-${channel}.json`), JSON.stringify(summary, null, 2));
console.log(`\n${summary.passed} passed, ${summary.failed} failed (${channel})`);
fs.rmSync(work, { recursive: true, force: true });
process.exit(summary.failed ? 1 : 0);
