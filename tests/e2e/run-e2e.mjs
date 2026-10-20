// End-to-end tests of the built single-file app, opened via file:// in the locally installed browser(s).
// Every http(s)/ws request is recorded; any request fails the run. Results: test-results/e2e-results-<channel>.json
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
const appFile = path.resolve('dist/ArMo-MS-Defender-Migration-Assistant.html');
const appUrl = pathToFileURL(appFile).href;
const outDir = path.resolve('test-results');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'armo-e2e-'));
fs.mkdirSync(outDir, { recursive: true });

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'); // valid 1x1 PNG
const pngPath = path.join(work, 'evidence-shot.png'); fs.writeFileSync(pngPath, PNG);
const fakePng = path.join(work, 'not-really.png'); fs.writeFileSync(fakePng, '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__xss=1"></svg>');
const bigFile = path.join(work, 'too-big.png'); fs.writeFileSync(bigFile, Buffer.concat([PNG, Buffer.alloc(16 * 1024 * 1024)]));
const garbage = path.join(work, 'garbage.zip'); fs.writeFileSync(garbage, Buffer.from('PK\x03\x04 this is not a real zip file at all'));
const foreignJson = path.join(work, 'foreign.json'); fs.writeFileSync(foreignJson, JSON.stringify({ hello: 'world' }));

const WELCOME = 'Move Microsoft Sentinel to the Defender portal, one clear step at a time.';
const ITEM_CODE = /\b(?:PREP|TEST|TRN|VAL)-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/;

const results = [];
const network = [];
const consoleErrors = [];
let stepNo = 0;
async function step(name, fn) {
  stepNo += 1;
  const t0 = Date.now();
  try { await fn(); results.push({ n: stepNo, name, ok: true, ms: Date.now() - t0 }); console.log(`  ok   ${name}`); }
  catch (e) { results.push({ n: stepNo, name, ok: false, ms: Date.now() - t0, error: String(e && e.stack ? e.stack : e).slice(0, 2000) }); console.log(`  FAIL ${name}\n       ${String(e && e.message ? e.message : e).split('\n')[0]}`); }
}

const profile = path.join(work, 'profile');
async function launch() {
  const ctx = await chromium.launchPersistentContext(profile, { channel, headless, acceptDownloads: true, viewport: { width: 1400, height: 900 } });
  // Force the download fallback (the native "Save as" dialog of the File System Access API cannot be automated).
  await ctx.addInitScript(() => { try { delete window.showSaveFilePicker; window.showSaveFilePicker = undefined; } catch { /* ignore */ } });
  ctx.on('request', (r) => { const u = r.url(); if (/^(https?|wss?):/i.test(u)) network.push(u); });
  const page = ctx.pages()[0] || await ctx.newPage();
  watch(page);
  return { ctx, page };
}
function watch(page) {
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
}

const dlg = (page) => page.locator('dialog[open]');
async function clickDlg(page, name) { await dlg(page).getByRole('button', { name, exact: true }).click(); }
async function go(page, hash) { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(180); }
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
const btn = (page, name) => page.getByRole('button', { name, exact: true });
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
// Item codes are references for support, never reading text: only the small footer line of a step may show one.
async function visibleCodes(page) {
  return page.evaluate((src) => {
    const re = new RegExp(src);
    const main = document.getElementById('main').cloneNode(true);
    for (const el of main.querySelectorAll('.item-foot, .code, pre, select')) el.remove();
    const side = document.querySelector('.sidebar').innerText;
    const m = (main.innerText + '\n' + side).match(re);
    return m ? m[0] : null;
  }, ITEM_CODE.source);
}

console.log(`E2E on ${channel} (${headless ? 'headless' : 'headed'}), ${appUrl}`);
let { ctx, page } = await launch();

await step('First launch plays the introduction with its six promises; it can be skipped', async () => {
  await page.goto(appUrl);
  const intro = page.getByRole('dialog', { name: /Welcome to the ArMo MS Defender Migration Assistant/ });
  await intro.waitFor();
  assert.equal(await page.locator('.intro .intro-stations .station').count(), 6);
  for (const t of ['No internet needed', 'Processed on this device', 'Your data stays with you', 'Grounded in Microsoft Learn', 'Built by practitioners', 'Open for review']) await page.locator('.intro-stations').getByText(t).waitFor();
  await page.locator('.intro').getByText('Built to make your migration journey easy.', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Skip intro', 'Skip intro has focus from the start');
  await btn(page, 'Skip intro').click();
  await page.getByRole('heading', { name: WELCOME }).waitFor();
  await page.waitForSelector('.intro', { state: 'detached' });
});

await step('The welcome page has a strict CSP; the intro does not return on the next start', async () => {
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /font-src data:/);
  assert.ok(!/unsafe-inline|unsafe-eval|https?:/.test(csp));
  await page.reload();
  await page.getByRole('heading', { name: WELCOME }).waitFor();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.intro').count(), 0);
  const font = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px "Mona Sans"'); });
  assert.equal(font, true, 'embedded typeface is available offline');
});

await step('CSP blocks a deliberate network request from the page (defence verified in-browser)', async () => {
  const blocked = await page.evaluate(async () => { try { await fetch('https://example.com/should-be-blocked'); return false; } catch { return true; } });
  assert.equal(blocked, true);
  network.splice(0); // the attempted request above is reported by the browser even though CSP blocked it; reset the log
  consoleErrors.splice(0); // and the CSP violation messages it produced
});

await step('Welcome passes basic accessibility checks; skip link works by keyboard', async () => {
  assert.deepEqual(await a11yAudit(page), []);
  // The skip link is the first focusable element and becomes visible when focused.
  const first = await page.evaluate(() => { const f = document.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'); return f && f.textContent; });
  assert.match(first, /Skip to content/);
  await page.evaluate(() => document.querySelector('.skip').focus());
  assert.ok(await page.evaluate(() => document.querySelector('.skip').getBoundingClientRect().left >= 0), 'skip link visible on focus');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
});

await step('Demo: clearly labelled, and "Exit demo" returns to the start, ready for your own project', async () => {
  await btn(page, 'Try the demo').click();
  await page.locator('.next-panel').waitFor();
  await page.getByText('You are exploring a demo.').waitFor();
  assert.equal(await visibleCodes(page), null, 'no item codes on the overview');
  await btn(page, 'Exit demo').click();
  await dlg(page).getByText('Leave the demo?').waitFor();
  await clickDlg(page, 'Leave the demo');
  await page.getByRole('heading', { name: WELCOME }).waitFor();
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.textContent.trim()), 'Start my project');
  assert.equal(await page.locator('.project-chip').count(), 0, 'no project open after leaving the demo');
});

await step('Create a tailored project with browser autosave', async () => {
  await btn(page, 'Start my project').click();
  await page.getByLabel('Project or customer label').fill('E2E transition <b>bold?</b>');
  await page.getByLabel(/^Your name/).fill('E2E Operator');
  await page.getByLabel('Your role (optional)').fill('Tester');
  await btn(page, 'Continue').click();
  await page.getByLabel('Workspace alias').first().fill('E2E-PROD');
  await btn(page, 'Continue').click();
  await page.getByText('Autosave in this browser', { exact: true }).click();
  await page.getByText('The data is not encrypted.', { exact: false }).waitFor();
  await btn(page, 'Continue').click();
  await page.getByText('Tailor the plan to my environment (recommended)').click();
  await btn(page, 'Create my project').click();
  await page.getByText('Please confirm the responsibility statement').waitFor();
  await page.getByLabel(/I understand this assistant gives guidance only/).check();
  await btn(page, 'Create my project').click();
  await page.getByRole('heading', { name: 'A few questions to tailor your plan' }).waitFor();
  // user text is rendered as text, not markup
  assert.equal(await page.locator('.project-chip-name').textContent(), 'E2E transition <b>bold?</b>');
});

await step('Questionnaire: one question per screen, keys 1 to 4, auto-advance after Yes or No only', async () => {
  await btn(page, 'Start the questions').click();
  await page.waitForURL(/#\/questionnaire\/q\/onboarded_any$/);
  await page.locator('.answer-tile').first().waitFor();
  assert.equal(await page.locator('.answer-tile').count(), 4);
  await page.keyboard.press('2'); // No
  await page.waitForURL(/#\/questionnaire\/q\/multi_workspace$/, { timeout: 4000 });
  await page.keyboard.press('3'); // I don't know yet: no auto-advance, follow-up appears
  await page.waitForTimeout(700);
  assert.match(page.url(), /multi_workspace$/);
  await page.getByLabel('What needs finding out').fill('Ask the platform team');
  await btn(page, 'Add a "find out" action to the register').click();
  await page.getByText('A "find out" action for this question is in the').waitFor();
  await go(page, '#/questionnaire/q/defender_xdr');
  await page.locator('[data-answer="yes"]').click();
  await go(page, '#/questionnaire/q/mdc');
  await page.locator('[data-answer="no"]').click();
  await go(page, '#/questionnaire/q/automation_rules');
  await page.locator('[data-answer="yes"]').click();
  await page.waitForTimeout(500);
  await page.getByText('Why we ask').first().waitFor();
});

await step('Building the plan shows real counts, then the guided overview says where to start', async () => {
  await go(page, '#/questionnaire/done');
  await page.getByText('steps apply', { exact: false }).first().waitFor();
  await btn(page, 'Build my plan').click();
  await page.locator('.next-panel').waitFor({ timeout: 6000 });
  await page.getByText('Your plan is ready.').waitFor();
  await page.getByRole('heading', { name: 'Start here' }).waitFor();
  const pct = Number((await page.locator('.journey-figure .big').textContent()).replace(/\D/g, ''));
  assert.ok(pct >= 1, `answering questions shows progress (got ${pct}%)`);
  await page.locator('.route-stop', { hasText: 'Plan' }).waitFor();
  await page.locator('.guide li.now').first().waitFor();
  await page.getByRole('link', { name: 'Start this step' }).waitFor();
  await btn(page, 'Why this one?').click();
  await page.locator('#why-next').waitFor();
  assert.equal(await visibleCodes(page), null);
});

await step('Applicability: "I don\'t know yet" keeps steps in scope; "No" sets steps aside with a reason', async () => {
  await go(page, '#/item/PREP-TOP-02');
  await page.getByText('Not sure yet: your answers leave this open, so it stays in your plan.').waitFor();
  await go(page, '#/item/PREP-CON-02');
  await page.getByText('Set aside: your answers say this does not apply.').waitFor();
  await go(page, '#/stage/prepare');
  await page.getByRole('button', { name: /^Set aside/ }).click();
  await page.locator('a[href="#/item/PREP-CON-02"]').waitFor();
  await page.getByRole('button', { name: /^Your steps/ }).click();
  assert.equal(await visibleCodes(page), null, 'no item codes on the stage page');
});

await step('Step page: cross-references are links, and "do it here" buttons act on the step', async () => {
  await go(page, '#/item/PREP-SCOPE-03');
  assert.equal(await visibleCodes(page), null, 'no item codes in step guidance');
  await page.locator('.steps').getByRole('button', { name: 'Add the decision to the register' }).click();
  await dlg(page).getByRole('heading', { name: 'New decision' }).waitFor();
  await dlg(page).getByLabel('Title').fill('Window approved for November');
  await clickDlg(page, 'Add');
  await page.locator('.register-actions').getByText('Decision: Window approved for November').waitFor();
  // The window is planned right in the step, and the planner reacts to it.
  await page.locator('#do-it-here').getByLabel('Window from').fill('2026-11-17');
  await page.locator('#do-it-here').getByLabel('Window to').fill('2026-11-19');
  await page.locator('#do-it-here').getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('#do-it-here').getByText('start Prepare by', { exact: false }).waitFor();
  // The record list links to the same fields in Project setup.
  await page.locator('.g-section').getByRole('link', { name: 'Project setup' }).first().click();
  await page.waitForURL(/#\/project\/window$/);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('#sec-window')), true, 'focus lands in the window section');
  assert.equal(await page.locator('#sec-window').getByLabel('Window from').inputValue(), '2026-11-17');
  await go(page, '#/item/PREP-SCOPE-03');
  const owner = page.locator('[data-focus-key="owner-PREP-SCOPE-03"]');
  await owner.fill('Change manager');
  await page.locator('.nav-card.next').waitFor();
  await page.locator('[data-focus-key="next-step-top"]').waitFor();
});

await step('Cancel closes a dialog without saving; a check on the input keeps it open', async () => {
  await go(page, '#/item/PREP-SCOPE-03');
  const follow = page.locator('.register-actions');
  const linked = await follow.locator('.list-row').count();
  await follow.getByRole('button', { name: 'Decision', exact: true }).click();
  await dlg(page).getByRole('heading', { name: 'New decision' }).waitFor();
  // An empty title is refused and the dialog stays open.
  await clickDlg(page, 'Add');
  await page.getByText('Please enter a title.').waitFor();
  assert.equal(await dlg(page).count(), 1, 'the check keeps the dialog open');
  await dlg(page).getByLabel('Title').fill('Typed, then cancelled');
  await clickDlg(page, 'Cancel');
  await dlg(page).waitFor({ state: 'detached' });
  assert.equal(await page.locator('dialog[open]').count(), 0, 'Cancel closes the register dialog');
  assert.equal(await follow.locator('.list-row').count(), linked, 'nothing was added to the register');
  // The status reason and the evidence waiver also close on Cancel and change nothing.
  const status = await page.locator('.status-opt[aria-checked="true"]').getAttribute('data-focus-key');
  await page.locator('.status-opt[title^="Failed"]').click();
  await dlg(page).getByLabel('Reason').fill('Cancelled on purpose');
  await clickDlg(page, 'Cancel');
  await dlg(page).waitFor({ state: 'detached' });
  assert.equal(await page.locator('.status-opt[aria-checked="true"]').getAttribute('data-focus-key'), status, 'the status is unchanged');
  await btn(page, 'Not needed for us').click();
  await dlg(page).getByLabel('Reason').fill('Cancelled on purpose');
  await clickDlg(page, 'Cancel');
  await dlg(page).waitFor({ state: 'detached' });
  assert.equal(await page.locator('.waiver').count(), 0, 'no waiver was recorded');
  await btn(page, 'Not needed for us').waitFor();
});

await step('Do it here: owners flow into steps, workspaces into reports, briefing email copies, "Leave for now" moves on', async () => {
  await go(page, '#/item/PREP-SCOPE-02');
  await page.locator('input[id="own-prepare:access"]').fill('IAM team');
  await page.locator('#do-it-here').getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(200);
  await go(page, '#/item/PREP-ACC-01');
  assert.equal(await page.locator('[data-focus-key="owner-PREP-ACC-01"]').getAttribute('placeholder'), 'IAM team');
  await go(page, '#/item/PREP-TOP-01');
  await page.locator('#do-it-here').getByRole('button', { name: 'Add a workspace' }).click();
  await page.locator('[data-focus-key="env-alias-1"]').fill('E2E-PROD-NEU');
  await page.locator('#do-it-here').getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(200);
  await go(page, '#/project/environments');
  await page.locator('#sec-environments').getByText('E2E-PROD-NEU').first().waitFor();
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('#do-it-here').getByRole('heading', { name: 'What stays the same' }).waitFor();
  await page.locator('#do-it-here').getByRole('button', { name: 'Copy email' }).waitFor();
  assert.match(await page.locator('#do-it-here a', { hasText: 'Open in email app' }).getAttribute('href'), /^mailto:\?subject=/);
  await btn(page, 'Leave for now').click();
  await page.waitForURL(/#\/item\/PREP-SCOPE-02$/);
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('button[role="radio"][aria-checked="true"][title^="In progress"]').waitFor();
});

await step('Dates: typing never redraws the page, and the window cannot end before it starts', async () => {
  await go(page, '#/item/PREP-SCOPE-03');
  const tool = page.locator('#do-it-here');
  const from = tool.getByLabel('Window from');
  const to = tool.getByLabel('Window to');
  await from.fill('2026-12-05');
  const kept = await from.evaluate((el) => { el.dataset.e2eMark = '1'; return true; });
  await to.fill('2026-12-01');
  assert.ok(kept && (await from.getAttribute('data-e2e-mark')) === '1', 'the date field was not redrawn while typing');
  await tool.getByText('The window must end on or after the day it starts.').waitFor();
  assert.equal(await tool.getByRole('button', { name: 'Save', exact: true }).isDisabled(), true);
  assert.equal(await to.getAttribute('aria-invalid'), 'true');
  await to.fill('2026-12-12');
  assert.equal(await tool.getByText('The window must end on or after the day it starts.').isVisible(), false);
  const discard = tool.getByRole('button', { name: 'Discard' });
  if (await discard.count()) await discard.click();
});

await step('Owners: a lead per workstream, more people with what they cover, and a step of its own', async () => {
  await go(page, '#/item/PREP-SCOPE-02');
  const tool = page.locator('#do-it-here');
  await tool.getByLabel('Scope, governance and timeline: lead').fill('E2E Lead');
  await tool.locator('.ws-owner').first().locator('details.ws-more > summary').click();
  await tool.locator('.ws-owner').first().getByRole('button', { name: 'Add a person' }).click();
  await page.keyboard.type('E2E Planner');
  await tool.getByLabel('Scope, governance and timeline: what person 1 covers').fill('timeline');
  await tool.locator('[id="own-step-PREP-SCOPE-03"]').fill('E2E Planner');
  await tool.getByRole('button', { name: 'Save', exact: true }).last().click();
  await page.waitForTimeout(200);
  await go(page, '#/item/PREP-SCOPE-03');
  assert.equal(await page.locator('[data-focus-key="owner-PREP-SCOPE-03"]').inputValue(), 'E2E Planner');
  await go(page, '#/item/PREP-SCOPE-01');
  await page.getByText('Also in this workstream: E2E Planner (timeline).').waitFor();
});

await step('Briefing: one email per reader, and each change says what it means', async () => {
  await go(page, '#/item/PREP-SCOPE-01');
  const tool = page.locator('#do-it-here');
  await tool.getByRole('heading', { name: 'If something goes wrong' }).waitFor();
  await tool.getByText('In short:').waitFor();
  assert.equal(await tool.getByText('A few investigation features work differently.').count(), 0, 'the SOC-only point is not in the leadership email');
  await tool.locator('label.choice', { hasText: 'SOC team' }).click();
  await tool.getByText('A few investigation features work differently.').waitFor();
  assert.match(await tool.locator('.email-subject').textContent(), /what changes for the SOC/);
  await tool.locator('label.choice', { hasText: 'A client we serve' }).click();
  await tool.getByText('As your security service provider, we plan and run this move with you.', { exact: false }).waitFor();
  const href = await tool.locator('a', { hasText: 'Open in email app' }).getAttribute('href');
  assert.ok(href.length <= 2000, `mailto link is ${href.length} characters`);
  await tool.locator('label.choice', { hasText: 'Security leadership' }).click();
});

await step('Several workspaces: one primary per tenant, the others shown as secondary with what that means', async () => {
  await go(page, '#/item/PREP-TOP-02');
  const tool = page.locator('#do-it-here');
  const first = tool.locator('label.choice').first();
  await first.click();
  await first.locator('.chip', { hasText: 'Primary' }).waitFor();
  const roles = await tool.locator('label.choice .chip').allTextContents();
  assert.equal(roles.filter((x) => x === 'Primary').length, 1, 'exactly one primary');
  assert.ok(roles.filter((x) => x === 'Secondary').length >= 1);
  await tool.getByText('Its alerts are not correlated with Defender XDR data, or with other workspaces.').waitFor();
});

await step('Decision helper: a verdict only where the step gives one, and the saved choice is recorded as a decision', async () => {
  await go(page, '#/item/PREP-ACC-03');
  const tool = page.locator('#do-it-here');
  await tool.getByText('Answer the questions to see what this step says for your situation.').waitFor();
  // Limitations alone are trade-offs side by side, not a verdict.
  await tool.locator('[data-focus-key="hlp-urbac-0-nonhuman-yes"]').click();
  await tool.getByText('No firm answer from this step yet.').waitFor();
  await tool.locator('.helper-mine', { hasText: 'It does not support service principal assignments.' }).waitFor();
  await tool.locator('[data-focus-key="hlp-urbac-0-rowlevel-yes"]').click();
  await tool.getByText('Your answers need: Activate unified RBAC per workspace, after the transition').waitFor();
  await tool.locator('[data-focus-key="hlp-urbac-0-choice-activate"]').click();
  await tool.getByText('Save your choice, then record it as a decision.').waitFor();
  await tool.getByRole('button', { name: 'Save', exact: true }).click();
  await tool.getByRole('button', { name: 'Record as a decision' }).click();
  await dlg(page).getByRole('heading', { name: 'New decision' }).waitFor();
  assert.equal(await dlg(page).getByLabel('Title').inputValue(), 'Unified RBAC for Sentinel: Activate unified RBAC per workspace, after the transition');
  const desc = await dlg(page).getByLabel('Description').inputValue();
  assert.match(desc, /Why:\n- You need row-level access/);
  assert.match(desc, /Do service principals or managed identities have Sentinel roles\? Yes/);
  await clickDlg(page, 'Add');
  await tool.getByText('Recorded in the register').waitFor();
  await page.locator('.register-actions').getByText('Decision: Unified RBAC for Sentinel: Activate unified RBAC per workspace, after the transition').waitFor();
  assert.deepEqual(await a11yAudit(page), []);
  assert.equal(await visibleCodes(page), null);
});

await step('"Not needed for us" lets a step pass and the report says why', async () => {
  await go(page, '#/item/PREP-TOP-01');
  await btn(page, 'Not needed for us').click();
  await dlg(page).getByLabel('Reason').fill('The inventory entered here is the record.');
  await clickDlg(page, 'Record the decision');
  await page.locator('.waiver').getByText('No evidence needed for us').waitFor();
  await page.locator('button[role="radio"][title^="Passed"]').click();
  await page.locator('button[role="radio"][aria-checked="true"][title^="Passed"]').waitFor();
  await go(page, '#/report/prepare');
  await page.locator('.report').getByText('Passed, evidence not needed').first().waitFor();
  await page.locator('.report').getByText('The inventory entered here is the record.', { exact: false }).first().waitFor();
  await page.locator('.report').getByText('E2E-PROD-NEU').first().waitFor();
});

await step('"Passed" requires evidence; your word only is recorded as "Not verified"', async () => {
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('button[role="radio"][title^="Passed"]').click();
  await dlg(page).getByText('Passed needs evidence').waitFor();
  await clickDlg(page, 'Done, not verified');
  await page.locator('button[role="radio"][aria-checked="true"][title^="Done, not verified"]').waitFor();
});

await step('Add an observation note and a screenshot; then mark Passed, verified', async () => {
  await btn(page, 'Observation').click();
  await dlg(page).getByLabel('Title').fill('Kick-off briefing held');
  await dlg(page).getByLabel('Observation').fill('Briefed SOC, IAM and compliance on <script>window.__xss=1</script> facts.');
  await clickDlg(page, 'Add note');
  await chooseFile(page, () => btn(page, 'Screenshot').click(), pngPath);
  await dlg(page).getByLabel(/checked this attachment/).check();
  await clickDlg(page, 'Add evidence');
  await page.locator('.evidence-item img.thumb').first().waitFor();
  await page.waitForFunction(() => { const i = document.querySelector('.evidence-item img.thumb'); return i && i.naturalWidth === 1; }, null, { timeout: 10000 });
  await page.locator('button[role="radio"][title^="Passed"]').click();
  await page.locator('button[role="radio"][aria-checked="true"][title^="Passed"]').waitFor();
  assert.equal(await page.evaluate(() => window.__xss), undefined, 'injected text must not execute');
});

await step('Unsafe and oversized evidence files are rejected', async () => {
  await chooseFile(page, () => btn(page, 'Screenshot').click(), fakePng);
  await page.getByText(/unsupported or unsafe file type/).waitFor();
  await chooseFile(page, () => btn(page, 'File').click(), bigFile);
  await page.getByText(/larger than 15.0 MB/).waitFor();
  assert.equal(await page.locator('.evidence-item').count(), 2);
});

await step('Failed status requires a reason; exception with named acceptance is recorded', async () => {
  await go(page, '#/item/PREP-AUT-01');
  await page.locator('button[role="radio"][title^="Failed"]').click();
  await dlg(page).getByLabel('Reason').fill('Five rules use the Incident provider condition.');
  await clickDlg(page, 'Save');
  await page.locator('button[role="radio"][aria-checked="true"][title^="Failed"]').waitFor();
  await page.locator('.register-actions').getByRole('button', { name: 'Exception', exact: true }).click();
  await dlg(page).getByLabel('Title').fill('Accept until the redesign');
  await dlg(page).getByLabel('Accepted by').fill('CISO Example');
  await dlg(page).getByLabel('Their role').fill('CISO');
  await dlg(page).getByLabel('Rationale and compensating controls').fill('Monitor automation health daily until fixed.');
  await clickDlg(page, 'Add');
  await page.getByText('accepted by CISO Example').waitFor();
});

await step('Changing an answer explains the plan change and keeps records', async () => {
  await go(page, '#/answers');
  await page.locator('[data-focus-key="all-automation_rules-no"]').click();
  await dlg(page).getByText('This answer changes your plan').waitFor();
  await dlg(page).getByText(/no longer apply/).waitFor();
  await clickDlg(page, 'Got it');
  await go(page, '#/item/PREP-AUT-01');
  await page.getByText('Set aside: your answers say this does not apply.').waitFor();
  await page.locator('button[role="radio"][aria-checked="true"][title^="Failed"]').waitFor();
  await go(page, '#/answers');
  await page.locator('[data-focus-key="all-automation_rules-yes"]').click();
  await page.waitForTimeout(200);
  if (await dlg(page).count()) await clickDlg(page, 'Got it');
});

await step('Gate decision needs a typed decision maker', async () => {
  await go(page, '#/item/PREP-PLN-05');
  await page.locator('.gate-form select').selectOption('go_with_exceptions');
  await btn(page, 'Record the decision').click();
  await page.getByText('Record who made the decision.').waitFor();
  await page.locator('.gate-form').getByLabel('Decided by').fill('SOC Lead Example');
  await page.locator('.gate-form').getByLabel('Why').fill('Proceed with the automation exception.');
  await btn(page, 'Record the decision').click();
  await page.getByText(/Recorded: Go with documented exceptions/).waitFor();
});

await step('Optional test stage can be skipped with a reason; the route shows it as skipped', async () => {
  await go(page, '#/stage/test');
  await btn(page, 'No, skip with a reason').click();
  await dlg(page).getByLabel('Reason').fill('No non-production tenant exists.');
  await clickDlg(page, 'Save');
  await page.getByText('Test stage skipped.').waitFor();
  await go(page, '#/overview');
  await page.locator('.route-stop.skipped').waitFor();
});

await step('Import read-only inventory results as labelled evidence and confirmed suggestions', async () => {
  await go(page, '#/stage/prepare');
  await chooseFile(page, () => btn(page, 'Import inventory results').click(), path.resolve('samples/sample-inventory.json'));
  await dlg(page).getByText('Suggested questionnaire answers').waitFor();
  await dlg(page).getByLabel(/Fusion \(Advanced multistage attack detection\)/).check();
  await clickDlg(page, 'Import selected');
  await go(page, '#/item/PREP-DET-03');
  await page.locator('.evidence-item strong', { hasText: 'Imported inventory: 1 Microsoft incident creation rule' }).waitFor();
  await page.locator('.evidence-item .small', { hasText: 'imported' }).first().waitFor();
  await go(page, '#/item/PREP-DET-02');
  await page.locator('.item-chips').waitFor();
});

await step('Every main view renders without errors, passes basic accessibility checks and hides item codes', async () => {
  for (const h of ['#/overview', '#/stage/prepare', '#/stage/transition', '#/stage/validate', '#/item/TRN-10', '#/item/PREP-DET-01', '#/item/PREP-CON-02', '#/item/PREP-TOP-05', '#/project', '#/answers', '#/questionnaire/q/multi_tenant', '#/register', '#/evidence', '#/reports', '#/knowledge/changes', '#/knowledge/catalogue', '#/knowledge/sources', '#/knowledge/coverage', '#/settings', '#/about']) {
    await go(page, h);
    const problems = await a11yAudit(page);
    assert.deepEqual(problems, [], `${h}: ${problems.join('; ')}`);
    assert.equal(await visibleCodes(page), null, `${h} shows an item code`);
    assert.equal(await page.getByText('Something went wrong').count(), 0, `${h} failed to render`);
  }
});

let pdfPath;
await step('Readiness report renders and produces a multi-page A4 PDF offline', async () => {
  await go(page, '#/report/prepare');
  await page.getByRole('heading', { name: 'Preparation and readiness report' }).waitFor();
  assert.ok(await page.getByText('SOC Lead Example').count() > 0, 'gate decision maker appears');
  assert.ok(await page.getByText('CISO Example').count() > 0, 'exception acceptance appears');
  assert.equal(await page.evaluate((src) => new RegExp(src).test(document.querySelector('.report').innerText), ITEM_CODE.source), false, 'no item codes in the report');
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  pdfPath = path.join(outDir, `report-prepare-${channel}.pdf`);
  fs.writeFileSync(pdfPath, pdf);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert.ok(pdf.length > 20000 && pages >= 3, `pdf bytes ${pdf.length}, pages ${pages}`);
});

await step('Snapshot is saved, listed and verified by its fingerprint', async () => {
  await btn(page, 'Save snapshot').click();
  await dlg(page).getByLabel('Note (optional)').fill('Readiness gate');
  await clickDlg(page, 'Save snapshot');
  await go(page, '#/reports');
  await page.getByRole('link', { name: 'Preparation and readiness report' }).first().click();
  await page.getByText('Fingerprint matches').waitFor();
});

let pkgPath;
await step('Save project package (.zip) with evidence', async () => {
  await go(page, '#/overview');
  pkgPath = await download(page, () => page.locator('.topbar').getByRole('button', { name: 'Save package' }).click());
  assert.match(path.basename(pkgPath), /^armo-dma-.*\.zip$/);
  assert.ok(fs.statSync(pkgPath).size > 2000);
});

await step('Exports: JSON data, checklist CSV, register CSV and evidence index CSV', async () => {
  await go(page, '#/reports');
  const j = await download(page, () => btn(page, 'Export JSON').click());
  const obj = JSON.parse(fs.readFileSync(j, 'utf8'));
  assert.equal(obj.schema, 'armohub.dma.project');
  const c = await download(page, () => btn(page, 'Export CSV').click());
  const csv = fs.readFileSync(c, 'utf8');
  assert.ok(csv.startsWith('﻿stage,workstream,id'));
  await go(page, '#/register');
  const r = await download(page, () => btn(page, 'Export CSV').click());
  assert.match(fs.readFileSync(r, 'utf8'), /CISO Example/);
  await go(page, '#/evidence');
  const e = await download(page, () => btn(page, 'Export evidence index (CSV)').click());
  assert.match(fs.readFileSync(e, 'utf8'), /evidence-shot\.png/);
});

await step('Browser autosave survives a full browser restart (project and screenshot restored)', async () => {
  await page.waitForTimeout(1200);
  await ctx.close();
  ({ ctx, page } = await launch());
  await page.goto(appUrl);
  await page.locator('.project-chip-name').waitFor();
  assert.equal(await page.locator('.project-chip-name').textContent(), 'E2E transition <b>bold?</b>');
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('button[role="radio"][aria-checked="true"][title^="Passed"]').waitFor();
  await page.waitForFunction(() => { const i = document.querySelector('.evidence-item img.thumb'); return i && i.naturalWidth === 1; }, null, { timeout: 10000 });
  await go(page, '#/item/PREP-ACC-03');
  assert.equal(await page.locator('[data-focus-key="hlp-urbac-0-choice-activate"]').isChecked(), true, 'the helper choice survives the restart');
});

await step('Malformed, foreign and tampered files are refused without changing anything', async () => {
  await go(page, '#/welcome');
  await chooseFile(page, () => btn(page, 'Open a saved project').click(), garbage);
  await dlg(page).getByText('This file could not be opened').waitFor();
  await clickDlg(page, 'OK');
  await chooseFile(page, () => btn(page, 'Open a saved project').click(), foreignJson);
  await dlg(page).getByText(/not an ArMo MS Defender Migration Assistant project/).waitFor();
  await clickDlg(page, 'OK');
  // tamper with project.json inside the saved package (keep the zip valid, break the manifest hash)
  const { readZip, createZip } = await import(pathToFileURL(path.resolve('src/core/zip.js')).href);
  const entries = await readZip(new Uint8Array(fs.readFileSync(pkgPath)));
  const pj = JSON.parse(new TextDecoder().decode(entries.get('project.json')));
  pj.checks['PREP-AUT-01'].status = 'passed';
  const tampered = await createZip([...entries].map(([name, data]) => ({ name, data: name === 'project.json' ? JSON.stringify(pj) : data })));
  const tamperedPath = path.join(work, 'tampered.zip');
  fs.writeFileSync(tamperedPath, Buffer.from(await tampered.arrayBuffer()));
  await chooseFile(page, () => btn(page, 'Open a saved project').click(), tamperedPath);
  await dlg(page).getByText(/does not match the hash/).waitFor();
  await clickDlg(page, 'OK');
  assert.equal(await page.locator('.project-chip-name').textContent(), 'E2E transition <b>bold?</b>', 'current project untouched');
});

await step('Delete browser data, then reopen from the package: statuses, evidence, snapshot and audit intact', async () => {
  await go(page, '#/settings');
  await btn(page, 'Delete all data in this browser').click();
  await dlg(page).getByLabel('Type DELETE to confirm').fill('DELETE');
  await clickDlg(page, 'Delete everything');
  await page.getByRole('heading', { name: WELCOME }).waitFor();
  await chooseFile(page, () => btn(page, 'Open a saved project').click(), pkgPath);
  await dlg(page).getByText('Integrity checks passed.').waitFor();
  await clickDlg(page, 'Open project');
  await page.locator('.project-chip-name').waitFor();
  await go(page, '#/item/PREP-SCOPE-01');
  await page.locator('button[role="radio"][aria-checked="true"][title^="Passed"]').waitFor();
  await page.waitForFunction(() => { const i = document.querySelector('.evidence-item img.thumb'); return i && i.naturalWidth === 1; }, null, { timeout: 10000 });
  await go(page, '#/item/PREP-AUT-01');
  await page.getByText('accepted by CISO Example').waitFor();
  await go(page, '#/item/PREP-ACC-03');
  assert.equal(await page.locator('[data-focus-key="hlp-urbac-0-rowlevel-yes"]').isChecked(), true, 'helper answers come back from the package');
  await page.locator('#do-it-here').getByText('Recorded in the register').waitFor();
  await go(page, '#/reports');
  await page.getByText('Readiness gate').waitFor();
});

await step('About replays the introduction on request', async () => {
  await go(page, '#/about');
  await page.getByText('If the assistant helped you, consider thanking').waitFor();
  assert.equal(await page.locator('a[href="https://www.linkedin.com/in/arnoyan"]').count() > 0, true);
  assert.equal(await page.locator('a[href="https://www.linkedin.com/in/m-aub/"]').count() > 0, true);
  await page.locator('.page-head').getByRole('button', { name: 'Replay the introduction' }).click();
  await page.locator('.intro').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForSelector('.intro', { state: 'detached' });
});

await step('Full-checklist project without autosave warns about unsaved work', async () => {
  await go(page, '#/settings');
  await btn(page, 'Close project').click();
  if (await dlg(page).count()) await clickDlg(page, 'Discard changes and continue');
  await btn(page, 'Start my project').click();
  await page.getByLabel('Project or customer label').fill('Full checklist project');
  await page.getByLabel(/^Your name/).fill('Second Operator');
  await btn(page, 'Continue').click();
  await btn(page, 'Continue').click();
  await page.getByText('I save project packages myself (default)', { exact: true }).click();
  await btn(page, 'Continue').click();
  await page.getByText('Show me the full checklist').click();
  await page.getByLabel(/I understand this assistant gives guidance only/).check();
  await btn(page, 'Create my project').click();
  await page.locator('.next-panel').waitFor();
  await page.locator('.topbar').getByText('Not saved yet').waitFor();
  await go(page, '#/stage/prepare');
  const all = await page.getByRole('button', { name: /^All/ }).textContent();
  const inScope = await page.getByRole('button', { name: /^Your steps/ }).textContent();
  assert.equal(inScope.replace(/\D/g, ''), all.replace(/\D/g, ''), 'full checklist: everything in scope');
  let sawBeforeUnload = false;
  page.once('dialog', async (d) => { sawBeforeUnload = d.type() === 'beforeunload'; await d.dismiss(); });
  await page.close({ runBeforeUnload: true });
  await new Promise((r) => setTimeout(r, 800));
  assert.equal(sawBeforeUnload, true);
});

await step('Demo opens by link with fictional data, and the final report renders', async () => {
  page = await ctx.newPage();
  watch(page);
  await page.goto(`${appUrl}?demo=1`);
  await page.getByText('You are exploring a demo.').waitFor();
  await go(page, '#/report/final');
  await page.getByText('DEMO, FICTIONAL DATA. Not a record of any real organisation.').waitFor();
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  fs.writeFileSync(path.join(outDir, `report-final-demo-${channel}.pdf`), pdf);
  assert.ok(pdf.length > 20000);
});

await step('Reduced motion: the introduction shows everything at once and the app stays usable', async () => {
  const c2 = await chromium.launch({ channel, headless });
  const p2 = await c2.newPage({ reducedMotion: 'reduce' });
  watch(p2);
  await p2.goto(appUrl);
  await p2.locator('.intro').waitFor();
  await p2.waitForTimeout(200);
  const op = await p2.evaluate(() => getComputedStyle(document.querySelector('.intro-end')).opacity);
  assert.equal(op, '1', 'final message visible immediately');
  await p2.getByRole('button', { name: "Let's begin" }).click();
  await p2.getByRole('heading', { name: WELCOME }).waitFor();
  await c2.close();
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
