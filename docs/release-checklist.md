# Release checklist

The ArMo MS Defender Migration Assistant is released as one final version, **1.0.0**. There are no release candidates or pilot stages.

## Versioning

- **App:** semantic versioning in `src/brand.js` (`APP_VERSION`) and `package.json` (`version`). The two must match. Each published version is final.
- **Knowledge base:** a date-based version in `content/kb.mjs` (`KB_META.version`, `2026.10.20` for 1.0), plus `lastReviewed`. Content-only updates bump the knowledge base version and the app patch version.
- **Project schema:** an integer `schemaVersion`. Bump it only with a migration in `src/core/schema.js`.
- **Internal identifiers** (`armohub.dma.project`, `armohub.dma.settings` and the related keys) stay as they are, for compatibility. Do not rename them as part of a release.

## B. Engineering release checklist (every release)

1. **Re-verify the knowledge base** (critical items first):
   - Re-read the main pages: `move-to-defender`, `microsoft-sentinel-defender-portal`, `microsoft-sentinel-onboard`, `workspaces-defender-portal`, `automation`, `exclude-analytics-rules-correlation`.
   - Update `pageDate`, `updated` and `verified` in `content/sources.mjs`.
   - Review items whose sources changed, and the open questions in `research/open-questions-and-conflicts.md`.
   - Bump `KB_META.version` and `lastReviewed`.
2. `npm ci` (build tools only).
3. `npm run validate-kb` reports 0 errors. It checks integrity and the writing rules of [content-style-guide.md](content-style-guide.md): no long dashes, no bare item codes, valid links and actions, valid step shapes.
4. `npm run research` regenerates the source register and coverage matrix. Commit the changes.
5. `npm run test:unit`: all pass, including `tests/unit/copy-and-ux.test.mjs`.
6. Check that `package.json` `version` matches `APP_VERSION` in `src/brand.js`.
7. `npm run build` writes:
   - `dist/ArMo-MS-Defender-Migration-Assistant.html`
   - `dist/kb.json`
   - `dist/tools/Get-ArMoSentinelInventory.ps1`
   - `dist/licenses/MonaSans-OFL.txt`
   - `dist/SHA256SUMS.txt` (checksums of the four files above)
8. `npm run test:e2e` and `npm run test:e2e:chrome`: all pass, with 0 network requests and 0 console errors. Both runs must be against the build you are releasing. Check `test-results/e2e-results-msedge.json` and `test-results/e2e-results-chrome.json` name `ArMo-MS-Defender-Migration-Assistant.html`.
9. **Manual checks** (see [test-results.md](test-results.md), "Not tested"):
   - File System Access "Save as" in headed Edge and Chrome;
   - interactive print to PDF, on white, with page numbers;
   - a Narrator walkthrough of the introduction, the questionnaire and one step page;
   - the introduction with Windows animation effects turned off, and with **Reduce motion** in Settings;
   - light and dark theme contrast.
10. Run the inventory script mock test (`tests/tools/mock-inventory-run.ps1`). For releases that change the script, run it against a lab tenant.
11. Update `CHANGELOG.md`, `docs/test-results.md` and the version numbers.
12. Create the release archive `ArMo-MS-Defender-Migration-Assistant-<version>.zip` with the HTML file, `kb.json`, `tools/`, `licenses/`, `SHA256SUMS.txt`, `README.md` and, once chosen, `LICENSE`. Keep `licenses/MonaSans-OFL.txt` with every copy of the HTML file. Publish the SHA-256 checksums with the release notes.
13. Hosted demo (optional): upload the same HTML file. Link to it with `?demo=1` to open the demo straight away.
14. Tag the release only after gate A is approved.

## C. Known limitations to state in the release notes

- Offline guidance and import only. No connected mode.
- Supported on current Edge and Chrome on Windows. Other browsers are not tested.
- The snippets and the inventory script are checked against documentation and tested against a mock, but the makers have not yet run them against a live tenant.
- Browser storage is not encrypted, is shared by local HTML files, and is best effort. Packages are not encrypted.
- English only.
- The knowledge base reflects Microsoft documentation as of its review dates (2026-10-19, and 2026-10-20 for three pages added that day, for 1.0).
