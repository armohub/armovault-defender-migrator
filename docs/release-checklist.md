# Release checklist

## Versioning

- **App:** semantic versioning in `src/brand.js` (`APP_VERSION`) and `package.json`. Pre-releases use `-rc.N`.
- **Knowledge base:** a date-based version in `content/kb.mjs` (`KB_META.version`, for example `2026.10.19-rc1`), plus `lastReviewed`. Content-only updates bump the KB version and the app patch version.
- **Project schema:** an integer `schemaVersion`. Bump it only with a migration in `src/core/schema.js`.

## B. Engineering release checklist (every release)

1. **Knowledge base re-verification** (critical items first):
   - Re-fetch the main pages: `move-to-defender`, `microsoft-sentinel-defender-portal`, `microsoft-sentinel-onboard`, `workspaces-defender-portal`, `automation`, `exclude-analytics-rules-correlation`.
   - Update `pageDate`, `updated` and `verified` in `content/sources.mjs`.
   - Review items whose sources changed, and the open questions in `research/open-questions-and-conflicts.md`.
   - Bump `KB_META.version` and `lastReviewed`.
2. `npm ci` (build tools only).
3. `npm run validate-kb` → 0 errors.
4. `npm run research` → regenerates the source register and coverage matrix; commit the changes.
5. `npm run test:unit` → all pass.
6. `npm run build` → `dist/ArMoHub-Defender-Migration-Assistant.html`, `dist/kb.json`, `dist/tools/Get-ArMoSentinelInventory.ps1`, `dist/SHA256SUMS.txt`.
7. `npm run test:e2e` and `npm run test:e2e:chrome` → all pass; 0 network requests; 0 console errors.
8. **Manual checks** (see [test-results.md](test-results.md) → "Not tested"): FS Access "Save as…" in headed Edge and Chrome; interactive print to PDF; Narrator walkthrough of the core journey; light and dark theme contrast.
9. Run the inventory script mock test (`tests/tools/mock-inventory-run.ps1`). For releases that change the script, run it against a lab tenant.
10. Update `CHANGELOG.md`, `docs/test-results.md` and the version numbers.
11. Create the release archive: `ArMoHub-Defender-Migration-Assistant-<version>.zip` containing the HTML file, `tools/`, `SHA256SUMS.txt`, `README.md` and `LICENSE`. Publish the SHA-256 checksums with the release notes.
12. Hosted demo: upload the same HTML file. Link to it with `?demo=1` to open the demo directly.
13. Tag the release (only after gate A is approved, for public releases).

## C. Known limitations to state in release notes

- Offline guided and import mode only; no connected mode.
- Supported on current Edge and Chrome on Windows; other browsers untested.
- Snippets and the inventory script are documented and mock-tested, but not yet validated against a live tenant by the authors.
- Browser storage is unencrypted, shared by local HTML files, and best effort. Packages are unencrypted.
- English only.
- The knowledge base reflects Microsoft documentation as of its review date.
