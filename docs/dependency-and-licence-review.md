# Dependency inventory and licence review

## Runtime (what ships to users)

**None.** The released HTML file contains only this project's own code, styles, knowledge base and icons:
- System fonts only (Segoe UI / system-ui, Cascadia Mono / Consolas). No font files are bundled or downloaded.
- The icons are simple SVG paths drawn for this project.
- The ZIP reader/writer, CSV writer and hashing are this project's code, using browser built-ins (`CompressionStream`, `crypto.subtle`).
- PDF output uses the browser's own print engine.

## Build and test tools (not shipped)

| Package | Version | Licence | Purpose |
|---|---|---|---|
| esbuild | 0.28.2 | MIT | Bundles `src/` and `content/` into one script at build time |
| playwright-core | 1.64.1 | Apache-2.0 | Drives the locally installed Edge and Chrome for prototypes and end-to-end tests (no browser download) |

Verified with `npm ls --all`. playwright-core has no npm dependencies. esbuild's only installed dependency is its optional platform binary package `@esbuild/win32-x64` 0.28.2 (MIT); the other platform packages are optional and not installed.

## Libraries evaluated but not used

From research note 04; sizes are gzip.

| Library | Licence | Size | Why not used |
|---|---|---|---|
| @azure/msal-browser 5.x | MIT | ~72 KB | Cannot complete sign-in from `file://`; connected mode deferred |
| jsPDF | MIT | ~132 KB | Browser print-to-PDF gives better typography and selectable text with no dependency |
| pdfmake | MIT (+ Roboto fonts, OFL-1.1) | ~292 KB + 469 KB fonts | Same; large |
| pdf-lib | MIT | ~207 KB | Unmaintained since 2021 |
| fflate | MIT | ~13 KB | Native `CompressionStream` suffices |
| JSZip | MIT or GPL-3.0 (dual) | ~28 KB | Same |

## Content and third-party material

- **Microsoft documentation** is cited by URL with short paraphrases. Verbatim content is limited to:
  - the retirement statement quote;
  - Microsoft sample queries (marked "Verbatim Microsoft sample", each linked to its source page).

  Confirm the attribution approach before choosing a licence. Microsoft Learn content is generally available under Microsoft's documentation terms; code samples in Microsoft docs are commonly MIT-licensed. Verify the licence statement on the specific pages, or replace verbatim samples with composed equivalents if in doubt.
- **Microsoft product names** are used descriptively. No Microsoft logos or screenshots are included; the demo "screenshots" are generated mock-ups labelled as such.

## Suggested open-source licence (for owner decision)

| Option | Pros | Cons |
|---|---|---|
| **Apache-2.0 for code** (recommended) | Permissive; explicit patent grant and contributor terms; NOTICE file for attribution; common in security tooling | Slightly longer licence text; NOTICE handling |
| MIT for code | Shortest and simplest; very widely understood | No explicit patent grant |
| **CC BY 4.0 for the knowledge base** (`content/`, `docs/`, `research/`) (recommended alongside either) | Lets others reuse the guidance with attribution; suits documentation | Mixing licences needs a clear README section |

**Caveats.**
- The makers choose the licence.
- Do not add a `LICENSE` file until then. A repository without one is "all rights reserved" by default, which is the safe state while private.
