# Dependency inventory and licence review

This review lists everything that ships to users, everything used to build and test, and the licence questions the makers still need to decide. It identifies questions to check; it does not make legal determinations.

## Runtime (what ships to users)

**No runtime libraries.** The released HTML file contains this project's own code, styles, knowledge base, icons and the ArMo mark, plus **three bundled third-party assets: the Instrument Serif, Inter Tight and JetBrains Mono typefaces** of the ArMoHub brand.

- The icons and the ArMo mark (the puzzle pieces in a safe's dial) are SVG drawn for this project.
- The ZIP reader and writer, the CSV writer and the hashing are this project's code, using browser built-ins (`CompressionStream`, `crypto.subtle`).
- PDF output uses the browser's own print engine.
- Fallback fonts are system fonts that are not bundled: Iowan Old Style and Georgia for the serif, Segoe UI Variable Text, Segoe UI and system-ui for text, Cascadia Mono and Consolas for labels and code.

### Bundled third-party assets: the brand typefaces

| | Instrument Serif | Inter Tight | JetBrains Mono |
|---|---|---|---|
| Use | Headings and figures (regular and italic) | Reading text (variable weight) | Labels, data and code (variable weight) |
| Version (from the name table) | 1.000 | 3.004 | 2.211 |
| Copyright notice | "Copyright 2022 The Instrument Serif Project Authors (https://github.com/Instrument/instrument-serif)" | "Copyright 2022 The Inter Project Authors (https://github.com/rsms/inter-tight)" | "Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)" |
| Reserved Font Name | None declared | None declared | None declared |
| Licence | SIL Open Font License, Version 1.1 (OFL-1.1) | OFL-1.1 | OFL-1.1 |
| Files in the repository | `InstrumentSerif-latin.woff2` (21,032 bytes), `InstrumentSerif-latin-ext.woff2` (11,604), `InstrumentSerif-italic-latin.woff2` (22,128), `InstrumentSerif-italic-latin-ext.woff2` (12,384); licence `OFL-InstrumentSerif.txt` | `InterTight-latin.woff2` (44,872 bytes), `InterTight-latin-ext.woff2` (89,800); licence `OFL-InterTight.txt` | `JetBrainsMono-latin.woff2` (40,404 bytes), `JetBrainsMono-latin-ext.woff2` (15,196); licence `OFL-JetBrainsMono.txt` |
| Licence text in the release | `dist/licenses/InstrumentSerif-OFL.txt` | `dist/licenses/InterTight-OFL.txt` | `dist/licenses/JetBrainsMono-OFL.txt` |

- **How they ship.** `scripts/build.mjs` embeds all eight files in the stylesheet as `data:` URLs (`font-src data:` in the CSP). Nothing is downloaded at runtime. The three licence texts, with their copyright notices, are embedded in a comment at the top of the HTML file's stylesheet, so they travel with every copy, and the release keeps them beside the file in `dist/licenses/`, listed in `dist/SHA256SUMS.txt`.
- **Shown to users.** The About page names the typefaces and their licence.

**What the OFL asks for** (a summary of conditions 1 to 5 in the licence files; read the licence itself for the exact terms):
- The fonts may be bundled, embedded and redistributed with software, provided each copy contains the copyright notice and the licence.
- The fonts may not be sold by themselves.
- A Modified Version may not use a Reserved Font Name without permission. None of the three declares one.
- The authors' names may not be used to promote a Modified Version, except to acknowledge their contribution.
- The fonts stay under the OFL. Documents made with them, such as the PDF reports, are not covered by that requirement.

**Open point for the makers**:
- **Where the files came from.** The `.woff2` files are the Latin and Latin Extended subsets served by the Google Fonts CSS2 API, saved unchanged on 6 November 2026; the licence texts are the `OFL.txt` files of the three families in the google/fonts repository on GitHub. Confirm this provenance is acceptable, or replace the files with the upstream releases.

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
- Whatever licence the code gets, the three typefaces stay under the OFL (condition 5). The README should say so once a licence is chosen.
- Do not add a `LICENSE` file until then. A repository without one is "all rights reserved" by default, which is the safe state while it is private.
