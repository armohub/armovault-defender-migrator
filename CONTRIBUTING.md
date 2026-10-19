# Contributing

Thank you for helping SOC teams transition safely. Accuracy matters more than volume.

## Ground rules for content (`content/`)

1. **Cite current Microsoft Learn pages.** Every item needs at least one source with a `supports` statement saying which claim the source backs. Add new sources to `content/sources.mjs` with `pageDate` (the ms.date shown on the page), `updated` and `verified` (the date you read it).
2. **No invented facts.** Do not invent table names, columns, UI paths, role names, API versions, cmdlets or expected results. If you cannot verify something, leave it out or set `validation: 'needs-review'` and explain why in `caveats`.
3. **Label provenance honestly.**
   - `provenance: 'official'` — derived from Microsoft documentation.
   - `provenance: 'practice'` — your own good-practice advice. Never present practice as a Microsoft requirement.
4. **Snippets are read-only.** Mark each one `status: 'verbatim'` (copied exactly from a cited page) or `status: 'composed'` (written from documented syntax). State `runIn`, `permissions` and `cost`. Release 1 accepts read-only snippets only.
5. **State-changing steps** must be tasks with `changesState: true`, with rollback guidance where it exists.
6. **No confidential or customer material.** Do not contribute employer- or client-owned content, real tenant or workspace names, IDs, IPs, screenshots or tickets.
7. Run `npm run validate-kb`, `npm run test:unit` and `npm run research` (this regenerates the source register and coverage matrix), and commit the regenerated files.

## Code (`src/`)

- Vanilla JavaScript only; no runtime dependencies.
- Insert all content with the `h()` helper (`textContent`). Never use `innerHTML`, `eval`, network APIs or remote resources. A static test enforces this.
- Treat every imported file as hostile: validate, cap and sniff it.
- Keep logic in `src/core` (pure and testable in Node), and DOM code in `src/ui`.
- Add unit tests for logic, and extend `tests/e2e/run-e2e.mjs` for flows.

## Re-verifying the knowledge base

Microsoft updates its pages frequently. Before each release, follow section B1 of [docs/release-checklist.md](docs/release-checklist.md).
