// Prototype P2: can a File System Access handle be obtained, written, stored in IndexedDB and reused after restart on file://?
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
const pageUrl = pathToFileURL(path.resolve('prototypes/p2-fsaccess/index.html')).href;
const out = {};
for (const channel of ['msedge']) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p2-')); const proj = path.join(dir, 'project.json'); fs.writeFileSync(proj, '{"v":1}');
  const launch = (headless) => chromium.launchPersistentContext(path.join(dir, 'profile'), { channel, headless, offline: true });
  let ctx = await launch(true); let page = await ctx.newPage(); await page.goto(pageUrl);
  let chooserFired = false;
  page.on('filechooser', async (fc) => { chooserFired = true; try { await fc.setFiles(proj); } catch (e) { out.setFilesError = e.message; } });
  await page.click('#open'); await page.waitForTimeout(2500);
  out.chooserFired = chooserFired; out.log = await page.evaluate(() => window.log);
  out.fileOnDiskAfter = fs.readFileSync(proj, 'utf8');
  await ctx.close();
  ctx = await launch(true); page = await ctx.newPage(); await page.goto(pageUrl);
  out.afterRestart = await page.evaluate(() => window.checkStored());
  await ctx.close();
}
console.log(JSON.stringify(out, null, 2));
fs.writeFileSync('prototypes/p2-fsaccess-results.json', JSON.stringify(out, null, 2));
