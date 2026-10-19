# Contributing

Thank you for helping SOC teams move to the Defender portal safely. Accuracy matters more than volume.

## Ground rules for content (`content/`)

1. **Cite current Microsoft Learn pages.** Every step needs at least one source with a `supports` statement that says which claim the source backs. Add new sources to `content/sources.mjs` with `pageDate` (the date shown on the page), `updated` and `verified` (the date you read it).
2. **Never invent facts.** Do not invent table names, columns, portal paths, role names, API versions, cmdlets or expected results. If you cannot verify something, leave it out, or set `validation: 'needs-review'` and explain why in `caveats`.
3. **Label provenance honestly.**
   - `provenance: 'official'`: derived from Microsoft documentation.
   - `provenance: 'practice'`: your own good-practice advice. Never present practice as a Microsoft requirement.
4. **Keep snippets read-only.** Mark each one `status: 'verbatim'` (copied exactly from a cited page) or `status: 'composed'` (written from documented syntax). State `runIn`, `permissions` and `cost`. Version 1.0 accepts read-only snippets only.
5. **Flag steps that change configuration.** They must be tasks with `changesState: true`, with rollback guidance where it exists.
6. **Keep confidential and customer material out.** Do not contribute employer- or client-owned content, real tenant or workspace names, IDs, IP addresses, screenshots or tickets.
7. **Write to the style guide.** Follow [docs/content-style-guide.md](docs/content-style-guide.md):
   - plain, warm and verb-first; call the product "the assistant";
   - British spelling;
   - no long dashes (the em dash and the en dash);
   - no item codes such as PREP-SCOPE-01 in reading text: link to the step with `[[ITEM-ID]]` instead;
   - make every "record this" or "go there" a link (`[[go:...|label]]`) or an action (`[[do:...|label]]`);
   - steps are a string or `{ text, bullets, tip }`, nothing else.
8. **Check your work.** Run `npm run validate-kb`, `npm run test:unit` and `npm run research` (this regenerates the source register and coverage matrix), and commit the regenerated files. The validator enforces the mechanical writing rules (long dashes, bare item codes, the plain-words list, links, actions and step shapes), and the build fails on any violation.

## Code (`src/`)

- Vanilla JavaScript only, with no runtime dependencies.
- Insert all content with the `h()` helper (`textContent`). Never use `innerHTML`, `eval`, network APIs or remote resources. A static test enforces this.
- The only font is the embedded Mona Sans in `src/fonts/`. Do not add other font files or remote fonts: a unit test checks that the embedded typeface is the only font source.
- Text in the app follows the same style guide. A unit test rejects long dashes anywhere in `src/` and `content/`.
- Treat every imported file as hostile: validate it, cap it and sniff its type.
- Keep logic in `src/core` (pure and testable in Node) and DOM code in `src/ui`.
- Add unit tests for logic, and extend `tests/e2e/run-e2e.mjs` for flows.

## Re-verifying the knowledge base

Microsoft updates its pages often. Before each release, follow step B1 of [docs/release-checklist.md](docs/release-checklist.md).
