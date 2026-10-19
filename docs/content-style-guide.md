# Content style guide

How every word in the ArMo MS Defender Migration Assistant is written. It applies to the knowledge base in `content/`, to text in the app (`src/`), and to the docs. `node scripts/validate-kb.mjs` checks the mechanical rules on every build.

## 1. Voice

We write like an experienced colleague sitting next to you: calm, warm, plain and precise.

- Talk to the reader as **you**. Talk about the product as **the assistant**, not "this tool".
- Lead with the verb: "Check", "Open", "Decide", "Record". The first words say what to do.
- One idea per sentence. Aim for 25 words or fewer. The validator warns above 40.
- Short paragraphs, then bullets. If a sentence lists three or more things, make it a bullet list.
- British English spelling, as in the existing content (organisation, behaviour, prioritise).
- Contractions are fine (you'll, don't, it's). They make the text human.
- Say what something means for the reader, not just what it is.
- Never guess and never add facts. Every fact, date, number, portal path, role name and limitation in the source text stays. If you cannot say it more simply without changing the meaning, keep the original wording.

### Never use

- **Long dashes** (the em dash and the en dash). Use a comma, a colon, a full stop or brackets instead. Ranges are written "5 to 10 minutes". The validator rejects both characters everywhere.
- **Item codes** such as PREP-SCOPE-01 in reading text. People read titles, not codes. Link to the step instead (see section 3). The validator rejects bare codes.
- **Inline numbered lists** like "(1) ... (2) ...". Use bullets.
- **Words that sound machine-written.** The validator rejects: seamless, leverage, utilise, delve, robust, streamline, cutting-edge, game-changer, empower, holistic, synergy, paradigm, "in order to". Plain alternatives: smooth, use, use, look into, reliable, simplify, new, big change, let, complete, (drop it), model, to.
- Hype, exclamation marks in guidance, "simply", "just", "obviously", "please note".

### Quotes from Microsoft

Microsoft wording that is quoted (inside quotation marks) stays exactly as Microsoft wrote it. If a quote contains a long dash, either quote only the part without the dash, or paraphrase it without quotation marks. Keep the source reference.

## 2. What each field is for

Each guided step (a "check" in the code) is shown as one page. Write each field for the place it appears.

| Field | Shown as | How to write it |
|---|---|---|
| `title` | The page heading and every link to the step | The ask, verb first, plain text, no markup, ideally under 70 characters. "Set the transition window well before 31 March 2027". |
| `objective` | The lead line under the heading | One or two sentences: what you do and what you end up with. Under 35 words. |
| `why` | "Why it matters" | A string, or a list of 2 to 4 short bullets when there are several reasons. |
| `roles`, `prerequisites` | "Before you start" | Lists. Name the exact role. |
| `where` | "Where" path chips | `at(portal, path)`. Path segments separated by " > ", exact menu names, no markup. |
| `when` | "When" | One short sentence. |
| `steps` | Numbered steps | One action per step. Use the object form when a step has sub-items or a tip (see below). Keep every fact. |
| `expected` | "You're done when" | The observable end state, one or two sentences. |
| `interpret` | "If you see / What it means" table | `outcome(seen, meaning)`. Meaning starts with what it means, then what to do. |
| `record` | "What to record" | Each entry says what to record **and where in the assistant**, with a link or action. |
| `evidence` | "Evidence that proves it" | What proves the step, with the action that attaches it. |
| `remediation` | "If it fails" | What to do, verb first. |
| `rollback` | "Rollback" | What to do, verb first. |
| `caveats` | "Watch out" | Uncertainties and limits. Keep every one. |
| `practiceNotes` | "From the field" | Practical guidance from the makers. Not Microsoft guidance. |
| `applicabilityNote` | Under "Does this apply to you?" | One sentence. |

### Step shapes

A step is either a plain string or an object:

```js
steps: [
  'Sign in to https://security.microsoft.com.',
  {
    text: 'Brief stakeholders on four facts, quoting the sources:',
    bullets: [
      'After 31 March 2027, Sentinel is only available in the Defender portal.',
      'Your log data stays in Log Analytics.',
    ],
    tip: 'Share the [[go:knowledge:changes|feature changes list]] before the meeting.',
  },
],
```

Allowed keys: `text` (required), `bullets` (list of strings), `tip` (one string). Nothing else.

### Decision helpers (`helper`)

A decision step with a long read can carry a small helper under **Do it here** (`tool: 'mdc'`, `'urbac'` or `'tenants'`, with `helper` on the same step). The reader answers a few questions and sees both approaches side by side.

- **Restate, never add.** Every question, approach, point and rule restates a fact from the same step (steps, why, caveats, interpret) or its cited sources. If the step gives no basis for a verdict, add no `recommends` or `requires` rule: the helper then shows the trade-offs side by side and says so.
- `questions`: `{ id, text, hint?, multi?, options: [{ id, label }] }`. Ask what the reader knows about their environment, in their words. Offer a "Not checked yet" or "Not sure yet" option.
- `choices`: `{ id, title, summary, badge?, pros, cons, todo }`. `todo` is what the reader does next for that approach, verb first.
- `rules`: `{ when: { questionId: [optionIds] }, kind, on?, point?, say }`. `kind` is `requires` (the step states that the answer needs this approach), `recommends` (the step or Microsoft recommends it for that answer), `pro`, `con`, or `note` (applies whatever you choose, no `on`). `point` marks the listed pro or con that the answer confirms, so it is not repeated. Write `say` to the reader ("You need row-level access...").
- `notes` are shown above the questions; `person` adds a name field (used per tenant).
- The validator checks that every rule names a real question, answer, approach and point.

Steps with a helper say so in their text: "Answer the questions in **Do it here**...", and keep the `[[do:add-decision|...]]` action for readers who prefer to write the decision themselves.

## 3. Links and actions

The assistant is the place where the work happens. Whenever text tells the reader to go somewhere or record something, make it clickable. Four kinds of markup are allowed inside any reading text (not in `title` and not in `where` paths):

| Markup | Becomes | Example |
|---|---|---|
| `**text**` | Bold | `**Primary** workspace` |
| `[[ITEM-ID]]` | A link to that step, shown with the step's title | `Use the list from [[PREP-TOP-01]].` |
| `[[ITEM-ID\|label]]` | A link to that step with your own words | `Use [[PREP-TOP-01\|your workspace inventory]].` |
| `[[go:TARGET\|label]]` | A link to a page of the assistant | `[[go:window\|Project setup > Planned transition window]]` |
| `[[do:ACTION\|label]]` | A button that does it right on the step page | `[[do:add-decision\|Add the decision to the register]]` |

Labels are required for `go:` and `do:`, and must never contain an item code. `do:` is only allowed in step content (it acts on the step being viewed). `do:record-gate` is only valid on gate steps.

### Page targets (`go:`)

| Target | Page |
|---|---|
| `project` | Project setup (name, organisation, your name and role, start date, notes) |
| `window` | Project setup, the Planned transition window fields |
| `environments` | Project setup, the environment aliases list |
| `questionnaire` | The tailoring questions, one per screen |
| `answers` | Your answers, all on one page, to review or change |
| `overview` | The project overview with the next step and the route |
| `stage:prepare`, `stage:test`, `stage:transition`, `stage:validate` | A stage and its steps |
| `register` | The register of decisions, risks, issues, actions and exceptions |
| `evidence` | All evidence in the project |
| `reports` | Reports and snapshots |
| `report:prepare`, `report:test`, `report:transition`, `report:validate`, `report:final` | One report |
| `knowledge:changes`, `knowledge:portal`, `knowledge:dates`, `knowledge:terms`, `knowledge:sources` | Feature changes, the portal map, key dates, terminology, sources |
| `settings` | Storage, theme, export and import |
| `about` | Version, knowledge base version, disclaimer, the makers |

### Actions (`do:`)

| Action | What the button does |
|---|---|
| `add-decision` | Opens a new decision in the register, linked to this step |
| `add-risk` | Opens a new risk in the register, linked to this step |
| `add-issue` | Opens a new issue in the register, linked to this step |
| `add-action` | Opens a new action in the register, linked to this step |
| `add-exception` | Opens a new exception (risk acceptance) in the register, linked to this step |
| `add-note` | Adds an observation note as evidence on this step |
| `add-screenshot` | Attaches a screenshot as evidence on this step |
| `add-file` | Attaches a file (CSV, JSON, PDF, text) as evidence |
| `add-link` | Adds a link as evidence |
| `set-owner` | Moves focus to this step's Owner field |
| `set-due` | Moves focus to this step's Due date field |
| `write-notes` | Moves focus to this step's Notes field |
| `record-gate` | Moves focus to the gate decision form (gate steps only) |
| `import-inventory` | Opens the import of the inventory script results |
| `download-inventory-script` | Downloads the read-only inventory script |

### Where things live in the assistant

Use this to point people to the right place:

- **Project setup** holds the project name, organisation, your name and role, start date, the planned transition window, environment aliases and project notes.
- **Every step page** has "Your record": status, owner, due date, notes, evidence (screenshot, observation note, link, file), and follow-ups (action, risk, issue, exception, decision) that are linked to the step. Gate steps also have the gate decision form.
- **The register** lists every decision, risk, issue, action and exception across the project.
- **Reports** are built from your records. Snapshots of a report are taken on the Reports page.
- **Knowledge** has the feature changes, portal map, key dates, terminology and sources.

## 4. Before and after

### A bulky step becomes a structured one

Before:

> Brief stakeholders with these facts, quoting the sources: (1) "After March 31, 2027, Microsoft Sentinel will no longer be supported in the Azure portal and will be available only in the Microsoft Defender portal." (2) Connecting a workspace does not change how Sentinel stores log data in Log Analytics. (3) Microsoft states the transition has no extra cost; billing continues for Sentinel consumption. (4) Behaviour changes include: incidents generated by the Defender XDR engine, the Fusion rule disabled, ...

After:

```js
{
  text: 'Brief your stakeholders on these facts and quote the sources:',
  bullets: [
    '"After March 31, 2027, Microsoft Sentinel will no longer be supported in the Azure portal and will be available only in the Microsoft Defender portal."',
    'Connecting a workspace does not change how Sentinel stores log data in Log Analytics.',
    'Microsoft states the transition has no extra cost. Billing for Sentinel use continues as today.',
    'Some behaviour changes: the Defender XDR engine creates incidents, the Fusion rule is turned off, Microsoft incident creation rules are deactivated, automation and playbooks change, and Defender XDR data policies apply to Sentinel data used in the Defender portal.',
  ],
  tip: 'The [[go:knowledge:changes|feature changes list]] covers every behaviour change in one place.',
},
```

### Telling people where to record something

Before:

> Record the target transition window in the project setup (Planned transition window).
> Record the decision and approver in the register.

After:

```js
'Enter the target window in [[go:window|Project setup > Planned transition window]].',
'[[do:add-decision|Add the decision to the register]], with the approver\'s name.',
```

### Replacing item codes

Before:

> List candidate workspaces from PREP-TOP-01.
> Compensating controls: complete baselines (PREP-CON-04/05) and staged automation updates (TRN-04).

After:

```js
'Start from [[PREP-TOP-01|your workspace inventory]].',
{ text: 'Apply the compensating controls:', bullets: ['[[PREP-CON-04]]', '[[PREP-CON-05]]', '[[TRN-04]]'] },
```

### Record entries

Before:

```js
record: ['Planned window', 'Approver', 'Known freeze periods'],
```

After:

```js
record: [
  'The planned window, in [[go:window|Project setup]]',
  'Who approved it: [[do:add-decision|add the decision]] with their name',
  'Known freeze periods, in [[do:write-notes|this step\'s notes]]',
],
```

## 5. Checklist before you finish a file

- `node scripts/validate-kb.mjs --only "<your item prefix>"` reports 0 errors for your items.
- Every item ID, stage, workstream, order, kind, criticality, provenance, confidence, validation, applicability, dependsOn, snippets, testable and changesState value is unchanged.
- Every source reference is still there. `supports` text keeps its meaning (only dashes and code mentions change).
- Every fact, date, number, portal path, role name, caveat and quote is still there.
- Every "record this", "add to the register", "see step X", "in the project setup" is a link or an action.
