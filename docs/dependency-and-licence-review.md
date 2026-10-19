# Dependency inventory and licence review

This review lists everything that ships to users, everything used to build and test, and the licence questions the makers still need to decide. It identifies questions to check; it does not make legal determinations.

## Runtime (what ships to users)

**No runtime libraries.** The released HTML file contains this project's own code, styles, knowledge base and icons, plus **one bundled third-party asset: the Mona Sans typeface.**

- The icons are simple SVG paths drawn for this project.
- The ZIP reader and writer, the CSV writer and the hashing are this project's code, using browser built-ins (`CompressionStream`, `crypto.subtle`).
- PDF output uses the browser's own print engine.
- Fallback and code fonts are system fonts that are not bundled: Segoe UI Variable Text, Segoe UI and system-ui for text, and Cascadia Mono, Cascadia Code, Consolas and Courier New for code.

### Bundled third-party asset: Mona Sans

| | |
|---|---|
| Asset | Mona Sans typeface (variable font, weight and width axes) |
| Version | 2.000 (from the name table of the font files) |
| Authors | The Mona Sans Project Authors (https://github.com/github/mona-sans), a GitHub project |
| Copyright notice | "Copyright 2022 The Mona Sans Project Authors (https://github.com/github/mona-sans), with Reserved Font Name "Mona"" |
| Licence | SIL Open Font License, Version 1.1 (OFL-1.1) |
| Files in the repository | `src/fonts/MonaSans-latin.woff2` (98,124 bytes) and `src/fonts/MonaSans-latin-ext.woff2` (32,800 bytes), with the licence text in `src/fonts/OFL.txt` |
| How it ships | `scripts/build.mjs` embeds both files in the stylesheet as `data:` URLs (`font-src data:` in the CSP). Nothing is downloaded at runtime. |
| Licence text in the release | `dist/licenses/MonaSans-OFL.txt`, listed in `dist/SHA256SUMS.txt` |
| Shown to users | The About page names the typeface and its licence |

**What the OFL asks for** (a summary of conditions 1 to 5 in `src/fonts/OFL.txt`; read the licence itself for the exact terms):
- The font may be bundled, embedded and redistributed with software, provided each copy contains the copyright notice and the licence.
- The font may not be sold by itself.
- A Modified Version may not use the Reserved Font Name ("Mona") without written permission from the copyright holder. This applies to the primary font name as presented to users.
- The authors' names may not be used to promote a Modified Version, except to acknowledge their contribution.
- The font stays under the OFL. Documents made with it, such as the PDF reports, are not covered by that requirement.

**Open points for the makers**:
- **Where the files came from.** The two `.woff2` files (Latin and Latin Extended subsets, weight and width axes) are taken unchanged from the npm package `@fontsource-variable/mona-sans` version 5.3.0 (licence field OFL-1.1), which redistributes the upstream Mona Sans release. Confirm this provenance is acceptable.
- **Subsets and the Reserved Font Name.** The OFL counts "changing formats" and removing components as a Modified Version. Confirm that shipping these subsets under the name "Mona Sans" is acceptable under condition 3, for example by checking the upstream distribution terms or the OFL FAQ.
- **The HTML file shared on its own.** Resolved in the build: the full OFL text, with the copyright notice, is embedded in a comment at the top of the HTML file's stylesheet, so it travels with every copy. The release also keeps it beside the file in `dist/licenses/MonaSans-OFL.txt`.

## Build and test tools (not shipped)

| Package | Version | Licence | Purpose |
|---|---|---|---|
| esbuild | 0.28.2 | MIT | Bundles `src/` and `content/` into one script at build time |
| playwright-core | 1.64.1 | Apache-2.0 | Drives the locally installed Edge and Chrome for the prototypes and end-to-end tests (no browser download) |

Checked with `npm ls --all`. playwright-core has no npm dependencies. esbuild's only installed dependency is its optional platform binary package `@esbuild/win32-x64` 0.28.2 (MIT). The other platform packages are optional and not installed.

## Libraries evaluated but not used

From research note 04. Sizes are gzip.

| Library | Licence | Size | Why not used |
|---|---|---|---|
| @azure/msal-browser 5.x | MIT | ~72 KB | Cannot complete sign-in from `file://`; connected mode deferred. The P4 spike in `prototypes/p4-connected/` vendors it for testing only; it is not shipped. |
| jsPDF | MIT | ~132 KB | Browser print to PDF gives better typography and selectable text with no dependency |
| pdfmake | MIT (+ Roboto fonts, OFL-1.1) | ~292 KB + 469 KB fonts | Same reason; large |
| pdf-lib | MIT | ~207 KB | Unmaintained since 2021 |
| fflate | MIT | ~13 KB | Native `CompressionStream` is enough |
| JSZip | MIT or GPL-3.0 (dual) | ~28 KB | Same reason |

## Content and third-party material

- **Microsoft documentation** is cited by URL with short paraphrases. Verbatim content is limited to:
  - the retirement statement quote;
  - Microsoft sample queries (marked "Microsoft sample, unchanged", each linked to its source page).

  Confirm the attribution approach before choosing a licence. Microsoft Learn content is generally available under Microsoft's documentation terms, and code samples in Microsoft docs are commonly MIT-licensed. Check the licence statement on the specific pages, or replace verbatim samples with composed equivalents if in doubt.
- **Microsoft product names** are used to describe what the assistant helps with. No Microsoft logos or screenshots are included; the demo "screenshots" are generated mock-ups labelled as such.
- **Trademarks.** Microsoft, Microsoft Sentinel, Microsoft Defender and Azure are trademarks of the Microsoft group of companies. The assistant is independent and is not affiliated with or endorsed by Microsoft. Whether "MS" in the product name is acceptable under Microsoft's trademark guidelines is a decision for the makers.

## Choosing a licence (pending, for the makers to decide)

**No licence has been chosen yet.** The options below are suggestions to help the makers decide. Nothing here is a decision.

| Option | Pros | Cons |
|---|---|---|
| Apache-2.0 for code | Permissive; explicit patent grant and contributor terms; NOTICE file for attribution; common in security tooling | Longer licence text; NOTICE handling |
| MIT for code | Shortest and simplest; very widely understood | No explicit patent grant |
| CC BY 4.0 for the knowledge base (`content/`, `docs/`, `research/`), alongside either code licence | Lets others reuse the guidance with attribution; suits documentation | Mixing licences needs a clear README section |

**Caveats.**
- The makers choose the licence.
- Whatever licence the code gets, Mona Sans stays under the OFL (condition 5). The README should say so once a licence is chosen.
- Do not add a `LICENSE` file until then. A repository without one is "all rights reserved" by default, which is the safe state while it is private.
