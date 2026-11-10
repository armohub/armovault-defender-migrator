# Changelog

## 1.0.0, released on 10 November 2026

The first public release, published on GitHub Releases with `SHA256SUMS.txt`. It includes every change below.

## Sign-off, save reminders and the ArMoHub brand (6 November 2026)

### Version
- Knowledge base version `2026.11.06` (it was `2026.11.05`): the final sign-off has its own choices.

### Gates and conclusions
- The final sign-off offers Signed off, Signed off with accepted residual risks, Not signed off, or Decision deferred, with its own words ("Signed off by", "Record the sign-off"). A sign-off opens a celebration with a link to the final report; risks and a refusal need a reason.
- A stage whose gate was approved no longer reads "Incomplete" or "Unable to determine" because of steps that were done without proof. The gate's approval accepts them: they are listed as warnings ("done without proof; reviewed and accepted at the stage gate by ..."), never as verified.
- A test stage left out of your plan (the test rehearsal switched off) reads "Not part of your plan" instead of "Test stage not available".
- The route marker follows the gates: when a later stage's gate is approved, the earlier stages count as behind you, so a finished move shows the marker at the Defender end instead of at Prepare.

### Saving
- With manual saving, the top bar counts the minutes of unsaved work, and after ten minutes a reminder stays on screen until you save the package or choose "Remind me in 15 minutes". Recording a decision or finishing a mission suggests saving too.

### The ArMoHub brand ("Noir Champagne")
- The app, the reports and the ArMoHub website now look like one brand: Obsidian and Graphite with Ivory text, one champagne accent used as a signal (the route, the marker, the active page, the rule under a title, one italic word), Signal cyan for real figures only, and thin gold rules instead of boxes.
- Instrument Serif for headings and figures, Inter Tight for text, JetBrains Mono for labels, all embedded under the SIL Open Font License 1.1, with their licences in `dist/licenses/`. Mona Sans is removed.
- A new ArMo mark: the puzzle pieces locked inside a safe's dial, in the sidebar, the splash, the introduction, the reports and as an inline favicon.
- Primary buttons are Ivory on Obsidian (Obsidian on Ivory in the light theme); the light theme is Ivory paper with deep champagne.
- Reports carry a masthead (the mark, the product name and "By ArMoHub · armohub.ch"), serif titles, mono labels, a gold rule under the cover and above the footer, and a footer line with armohub.ch and the ArMoHub LinkedIn page. The printed page footer names ArMoHub and armohub.ch.
- The contrast test now also pins Signal figures, the primary button and champagne as large text, in both themes.

### The finale after the sign-off
- The big celebration ("You are in the Defender portal!", the route from the Azure portal to the Defender portal, the makers and the ArMoHub community) now comes when the move is signed off, the last step, and leads to the final report. Before, it came when the change was recorded as complete, a stage earlier, and the sign-off showed a smaller card.
- In Simplified mode, signing off in the last mission opened "The move is signed off" with "Mission complete" on top of it, so the finale was never seen. A celebration now never opens on top of another: the sign-off shows the finale alone.
- Finishing the last mission later, with the move signed off, also shows the finale.
- Recording the change as complete is now a milestone: "The change is complete", with one stage left, and **Next: validate everything**.
- The rules are in `celebrationFor` and `moveSignedOff` (`src/core/model.js`) and `holdsSignOff` (`src/core/missions.js`), with unit tests in `tests/unit/finale.test.mjs`.

### Inventory import on one screen
- The step that asks you to run the script (Inventory and export analytics rules) now holds the whole import under **Do it here**: download the script, copy the command, then drop every file of the inventory folder there, or choose them. The same panel is in the Simplified mission row and in setup.
- workspaces.json is read in any order, alone or with the inventory files. Before, inside a project, it filled in nothing when it was read before the inventory files, or when the workspaces were not in your list yet, and said "no workspace in your list was missing a subscription or resource group".
- One review replaces the dialog per file: every workspace with its subscription and resource group, "In scope", the name and the type, whether it is new or already in your project, the workspaces workspaces.json lists without a file, and the answers the import fills in for all the workspaces in scope (Yes and No, as in setup). An answer you typed that differs is shown and left unticked; one that already matches is not offered again.
- After **Import**, the panel says what changed, with links: the workspaces added or filled in (Project setup), the answers filled in (Your answers), the steps that got evidence, and how many steps your plan has now.
- New workspaces are added with their subscription, resource group and region; for workspaces you have, only empty values are filled in. Importing the same files again adds no second note, file or workspace, and says "Nothing new".
- **Import inventory results** on Stage 1 and on the Evidence page opens the same review on that step. The import logic is in `src/core/inventory-import.js`, shared by setup and the project, with unit tests in `tests/unit/inventory-import.test.mjs`.

## Field feedback (5 November 2026)

### Version
- Knowledge base version `2026.11.05` (it was `2026.11.04`): the exact last-record query and the change outcome choices changed.

### Inventory script and import
- A workspace manager that is not set up (HTTP 404) counts as not used, not as a failed request; members are read only when it is on. The same goes for hunts. So the import can now answer the workspace manager question.
- Data connectors carry the title the portal shows (`connectorUiConfig.title`), and the evidence lists them by that title, a product name for known kinds, or the resource name, with the kind in brackets. Before, it showed only kinds such as GenericUI and StaticUI.
- workspaces.json, which the script writes next to the inventory files, fills in each workspace's subscription and resource group when you import it with them, in setup or later. Values you typed are kept.
- A warning no longer ends with "Not collected: ." when only the subscription lookup failed.

### Steps and missions
- In a mission row, a finding from the script unfolds under its proof: **Show what the script found** lists, for example, the connectors.
- A check with ready-to-run queries says so in its mission row, with their names and a link to Details.
- The exact last record per table query uses `withsource = SourceTable_`: some tables already have a TableName column, which made union fail with "column names TableName already exists".
- The change outcome (Record the execution outcome) offers Complete, Complete with documented exceptions, or Rolled back, instead of the go or no-go choices. Exceptions and rollbacks need a reason.
- A Stage 1 gate that says No-go, or is deferred, shows a warning on the Test and Transition pages, missions and steps; a No-go on the day of the change warns the change and after it; a rolled-back change warns Validate. Nothing is blocked.
- When the change is recorded as complete, a celebration marks the move: the route from the Azure portal to the Defender portal, congratulations, and links to the makers and the ArMoHub community on LinkedIn. Reduced motion shows it still.

### Setup, Project setup and reports
- Setup asks two numbered questions: how the plan should look (Simplified, suggested, or Detailed) and how much it should cover (Essentials, Recommended or Thorough, counted in steps out of 110).
- Project setup has one **Your plan** section: how the plan looks, how much it covers, the topics, and the switch for the good-practice extras, which says it only shows or hides the extras. The view switch is gone from the overview and stage pages.
- "Recommended extras" are called good-practice extras everywhere, so they are not mistaken for the Recommended steps.
- Reports list answered questions apart from questions not answered yet, and from questions the plan never asked, with the reason.

## Inventory and flow review (4 November 2026)

### Version
- Knowledge base version `2026.11.04` (it was `2026.11.03`): new questions logic, 18 new sources and a larger inventory script. The app version stays 1.0.0 until the release.

### Plan depth
- Setup asks how thorough the plan should be: **Essentials** (must-do steps only), **Recommended** (the default: must-do and recommended steps, and the good-practice extras) or **Thorough** (every step). It works on top of tailoring, so your answers and your inventory still decide what applies. Must-do steps always stay. Steps left out are set aside with the reason, never deleted. Change it at any time in Project setup.
- "Also include" switches, preset by the level: backups and baselines, a test rehearsal (the Test stage), and extra verification after the move. On keeps the topic's steps whatever their tag; off leaves its non-must steps out. Switching the rehearsal off skips the Test stage.
- Every step shows its tag: Must do, Recommended, Useful or Good practice. The working order stays.
- Questions are tagged Must answer, Important or Optional by the most important step they decide, asked in that order, and not asked when the plan keeps none of their steps. **Skip the optional questions** moves to the end; their steps stay in the plan until you answer. Essentials asks 3 of the 6 core questions in Simplified.
- Reports state the plan and how many steps it left out. Projects created before keep every step (Thorough, every topic on).
- The full checklist ignores the plan. The questionnaire tip no longer mentions auto-advance.

### Inventory script
- Run with no parameters, it finds every Sentinel workspace you can read (`-Discover` still works). Before, it asked for a subscription and a workspace and saw only that one.
- The alias is the workspace name unless you give one, so an imported file never shows as `armohub-inventory`. Older files without a name ask you to type it.
- It also collects, with GET requests only: customer-managed keys, UEBA and entity analytics, workspace manager, repositories, bookmarks and hunts, workbooks and playbooks installed from the content hub, Logic Apps that use the Microsoft Sentinel connector (and whether they use ServiceNow or Jira), role assignments as counts, the tenant as a short fingerprint, Lighthouse delegation, the Azure cloud, and data connectors from both API versions. Every part records whether it was collected, and a part that fails does not stop the others. Inventory files are schema version 2; version 1 files still import.
- Tested against mocks: one workspace (every part, a refused part, the name), several workspaces, and discovery (tenant fingerprints, shared names, refused checks).

### Answers from the import
- The import can suggest answers to 28 of the 35 questions, up from 9. Yes when any workspace in scope shows it. No, for the 12 questions that allow it, only when every workspace in scope was read for that part and none has it. Setup shows each suggestion with Yes or No and why.
- The workspace list answers several workspaces, several tenants, a test workspace and whether it is in a separate tenant. Workspaces from different tenants get tenant labels.

### Fixes from an independent review of these changes
- A Logic App with empty parameters no longer stops the script under Windows PowerShell 5.1 (a property lookup that is safe on empty objects).
- Version 1 inventory files no longer suggest No for Insider Risk Management or standalone connectors: they read the stable connector list, which lacks those kinds.
- "More than one workspace in this tenant" gets No only when every workspace in scope has a tenant fingerprint. A failed subscription lookup is tried again for the next workspace.
- Service principals count as holding Sentinel access by what their role allows (Owner, Contributor, Reader, custom roles with Sentinel or Log Analytics actions), not only by the role name.
- Customer-managed keys are suggested as Yes only: a key added after onboarding may not show in the onboarding state, and a wrong No would set aside a must-do step.
- When no Sentinel playbook is found in the Logic Apps you can read, the evidence says so, with the permission caveat.
- "Keep the full plan" records no answer, and the connection check offers Focus on checking again while every production workspace is connected. Reports leave out gates that are set aside.

### Setup and questions
- How to start is one choice: Simplified or Detailed. Both tailor the plan. Under Detailed, "Skip the questions and show all 110 steps" keeps the full checklist.
- Choosing an answer no longer moves on by itself. Next, or Enter, moves on. The "Move on after Yes or No" switch and setting are gone.

### Connection check
- A workspace marked connected, secondary, needs a primary in the same tenant; saving says so.
- "Is any workspace already connected?" follows what you mark.
- When every production workspace is connected, a dialog offers **Focus on checking**. It sets aside, with that reason, the steps for connecting: who connects and their roles, the transition window, and Transition before and during the change. The checks on what changed, the checks after the change and Validate stay. It comes back if a workspace is marked as not connected.
- The tenant card no longer asks who connects a tenant whose workspaces are all connected.

### Missions
- In Simplified, Details opens the step inside its mission: the breadcrumb names the mission, the mission's progress and the overall progress stay on screen, and the buttons are Back to the mission and Next in this mission (then the next mission).
- The journey rail shows done and total for every mission, and the questions still open in it.

## Onboarding and guidance review (29 October 2026)

### Version
- Knowledge base version `2026.11.03` (it was `2026.10.26`), because the guidance, the sources (now 127) and the embedded inventory script changed. The app version stays 1.0.0 until the release.

### Setup
- The wizard has five steps. **Timing** restates that Sentinel is available only in the Defender portal after 31 March 2027, with the days left.
- **Your workspaces** is its own step: run the inventory script and import its files, or type the names in (an explainer says where to find them). Imported workspaces are listed with their region and counts; you tick the ones in scope and rename them if you like. The answers the import can give are shown, ticked, for you to confirm, and the questions show which answers came from the inventory.
- The inventory script has a `-Discover` mode. It lists the subscriptions you can read, their Log Analytics workspaces and their Microsoft Sentinel onboarding state (GET requests only, from documented REST APIs), writes `workspaces.json` and one inventory file per workspace. Inventory files now carry the workspace region. Tested against a mock (`tests/tools/mock-inventory-discover.ps1`).
  - Workspaces in different resource groups that share a name each get their own alias and file (`law-soc`, `law-soc-2`, ...), and a warning says so. Before, the run stopped with "same file name" after writing `workspaces.json`.
  - A workspace whose Sentinel check fails (for example HTTP 403, no access) is named in a warning and in the summary at the end, instead of being skipped silently. If nothing is found, the message says how many workspaces could not be checked. HTTP 404 still means "no Sentinel" (not yet confirmed against a live tenant). The mock covers both cases.
- **How to start** gives the real numbers: Simplified asks the core questions now and the rest inside the missions; Detailed asks all questions up front in sections. The question intro lists only the sections, or in Simplified the questions, that are actually asked.

### Questions
- While the setup questions are open, the left pane shows only the setup progress and one way out, "Leave the questions for later". The overview then shows how many questions are still open, with **Continue the questions**.
- The inventory hint no longer appears in the questions once the inventory was offered during setup.
- Mission questions have an explainer: where to find the answer and why it is asked.

### Missions
- An attached proof shows on the check straight away: thumbnails for screenshots, who added it and when, and a way to remove it. The buttons then read "Add another".
- Every check has **Show me how, step by step**: where to go, the numbered steps and what you should see, taken from the full step.
- A journey rail beside the mission shows the progress across all missions, with a milestone per stage. Finishing a mission, and finishing a stage, is celebrated, with the next mission one click away. Reduced motion shows the card without animation.

### Records and tools
- Person lists offer everyone the project knows, with their role, and **Add a new person** records a new name with a role for every other list.
- Items added from a step open a short form with labels that fit (for example "What was decided" and "Decided by"); type, severity and status sit under "More options". Compensating controls have their own form: the restriction that does not carry over, and what you do instead.
- The briefing and ready-to-send emails are folded until you open them. The leadership email is a short note: headlines, the window and what is needed from them.
- The window planner shows the window entered at setup instead of asking again. Its ranges are marked as example estimates. The suggested ranges say why, say when there is not enough information yet, and one sign of a larger environment on its own no longer moves the plan to the longer ranges.

### Guidance checked against Microsoft Learn (29 October 2026)
- Every portal path was compared with current Learn pages. "System > Permissions > Microsoft Defender XDR > Roles" is correct; the guidance now adds that System is near the bottom of the navigation pane, other names Learn uses for it, the direct link and the Security Administrator requirement.
- "Owner must have no conditions" is explained: what a condition on a role assignment is, and how to see it in the Condition column.
- The cloud check names the right pages (feature support per cloud, advanced hunting), says what to look for, and cites the feature support page for the 21Vianet retirement. GCC High and DoD portal addresses, the Sentinel Reader caveat for the workspace check, the GDAP contradiction for unified RBAC and examples for standalone connector content were added.
- 74 more checks have an explainer (ⓘ) that says in plain words what the check means, what to look for and why, written only from that check's own content and sources. Four checks have clearer wording, for example "resource-context access" is now explained.
- New sources: feature support per cloud, Defender XDR for US Government, conditions on role assignments, alert schema differences, and the three REST APIs used by `-Discover`.

## 1.0.0: first complete build (2026-10-19)

The first public version, released as one final version. There are no release candidates or pilot stages. It replaces the internal release candidate 0.9.0-rc.1, which was never published.

### Name and build

- New name: **ArMo MS Defender Migration Assistant** (brand ArMo). It was called "ArMoHub Defender Migration Assistant".
- Knowledge base version `2026.10.26` (the content changed after the reviews of 19, 20 and 26 October; see below).
- The build writes `dist/ArMo-MS-Defender-Migration-Assistant.html`, `dist/kb.json`, `dist/tools/Get-ArMoSentinelInventory.ps1`, `dist/licenses/MonaSans-OFL.txt` and `dist/SHA256SUMS.txt`.
- Project packages are named `armo-dma-<project>-<date>.zip`. Exports and the preferences file use the same `armo-dma` prefix.
- Internal schema identifiers (`armohub.dma.project`, `armohub.dma.settings`) are unchanged on purpose, for compatibility.

### Do it here: work inside the steps

- Steps carry the form they need, under **Do it here**: a stakeholder briefing with a ready-to-send email (copy formatted into Outlook, or open in the email app), owners and approvers per workstream, a window planner with typical durations (practical guidance, labelled as such), the workspace inventory, the connection state of each workspace, and the primary workspace choice. The same forms appear in Project setup, so information is entered once and reused in steps and reports.
- Decision helpers on the three longest decisions: the Defender for Cloud connector approach, unified RBAC for Sentinel, and the multi-tenant access model (one card per tenant). You answer a few questions and see both approaches side by side with what your answers mean for each. The helper names an approach only where the step's own content gives a basis (for example, row-level access requires unified RBAC). Saved choices travel with the project and its packages, and **Record as a decision** opens the register decision with the choice, reasons, trade-offs and answers filled in.
- Gate steps lead with the decision form, and can save a report snapshot right on the step.
- Every step has **Leave for now** and **Next step** at the top. Parked steps never block the next suggestion and are listed on the overview under **Parked for later**.
- **Not needed for us**: a team can record, with a reason, that a step needs no evidence. The step can then pass, and reports show "Passed, evidence not needed" with the reason, name and date.
- Steps that use queries or scripts show **No query access? Use the portal** where Microsoft Learn documents a portal way (41 steps, with 14 new sources).
- Step pages show the essentials first and fold the background (why it matters, prerequisites, watch-outs, sources) with a one-line preview. Script cards show their purpose first; details and long code open on request.
- The record panel says who set the status and when, so record lists no longer ask for it.
- Owners set per workstream appear on every step of that workstream, and known names are suggested in owner and decision fields.
- The questionnaire's test environment answer switches the optional Test stage on or off. Questions that the inventory script can answer say so, and your workspace list hints at answers. A soft "Answer recorded" notice replaces the flash after each answer.

### Simplified mode, from the dry run (26 October)

The dry run found the assistant overwhelming: even a small organisation got 73 steps written like audit documents. Simplified mode keeps every check, proof and decision, and changes how much there is to read and how the work is organised.

- **Two ways to work.** The new-project wizard asks "How do you want to work?":
  - **Simplified** (the default): missions with short checklists.
  - **Detailed**: the full step pages as before.

  A switch on the overview and in Project setup changes it any time. Records stay the same, and the audit log notes the switch. Projects saved before this change open in Detailed.
- **Missions.** Each workstream is a mission with an action title, such as "Get automation ready", and a progress bar. The overview lists the missions of each stage and leads with **Continue** to the next one.
- **Short checklists.** Every one of the 110 checks has a short form: an action title, at most three "do this" points and one line on what counts as proof. The full step stays one click away under **Details**.
- **Proof in one move.** Paste a screenshot (Ctrl+V) anywhere on a mission page, or drop a file on the open check. A copy that also carries text, from Excel or OneNote for example, still pastes as text into a field. The usual safety checks apply. Where a form in the assistant completes the check, **Use my entries as proof** attaches a note generated from those entries, labelled as such in the assistant and in reports.
- **Fewer questions up front.** Simplified asks six questions before the plan exists. Every other question appears in the missions it affects; answering No there sets the related checks aside, with the reason.
- **Good practice, apart.** Nine checks that Microsoft does not require for the move are now "recommended extras", for example the watchlist inventory and the post-transition review. They sit at the bottom of their mission, can be hidden, and never affect progress or readiness. This applies in both modes, so a stage whose only open items are extras now reaches its conclusion. Turning on auditing and health monitoring stays needed: the Validate checks for rules and automation use its data.
- **Ready texts** for the teams involved: a notice to analysts, a "we're live" note and a change request summary, next to the stakeholder briefing. Each can be copied for Outlook, downloaded as an Outlook draft (.eml) or opened in the email app.
- **Owners, lighter.**
  - Simplified asks only who approves the change. Each mission has an optional owner field.
  - Detailed asks first whether you want to record owners.
- **Stage pages** list their missions in Simplified, and show a progress bar per workstream in Detailed.
- **Decisions from the row:** decision checks have a **Record decision** button that opens the register with the step filled in.
- **Clearer question:** "Do any internal or company policies, or regulations, limit where security data may be stored or processed?"

### From a comparison with public migration guides (26 October)

We compared the assistant with four public resources on the same move (a field guide, a helper script, and two blog posts) and added what they cover that we did not. Every fact below comes from Microsoft Learn; the two practical tips are labelled as the makers' guidance.

- **Will we lose any logs? No.** A new recommended extra, **Review which Defender XDR tables you stream into Sentinel**, opens with that answer before any instruction: reviewing changes nothing, and if you later stop streaming a table, the data already in Sentinel stays until its retention ends. The ⓘ explains the rest: Defender keeps its own data for 30 days in advanced hunting, alerts and incidents keep flowing to Sentinel at no cost, and Sentinel only sees what you stream, so keep any table that Sentinel rules, workbooks or hunting queries use. A read-only Usage query lists the billable Defender tables. Two new Microsoft Learn sources: data retention in a Log Analytics workspace, and the Entra roles with Defender XDR access.
- **Fewer incidents is expected.** The validation and the after-connection checks say that the Defender portal merges related alerts into one incident, so you compare alerts per rule with your baseline, not the number of incidents. The tolerance step asks for the same measure.
- **Default access.** Mapping access now includes a review of who holds the Entra roles that reach Defender data by default (Global Administrator, Security Administrator, Security Operator, Global Reader, Security Reader).
- **Practical tips, labelled.** Connect on a Tuesday to Thursday morning, never on a Friday or before a holiday. Use the time until 31 March 2027 to let analysts practise in the Defender portal.
- **Explainers.** An ⓘ button opens a short explainer where a reader could hesitate: on ten checks (for example "Do we lose multistage detection?"), on what counts as proof, on the recommended extras, on the Simplified or Detailed switch and on the window planner. On a check, a one-line answer stands in plain view before "Do this"; the details open on request, close with Escape or a click elsewhere, and stay inside the window on a small screen.
- **A small-team plan.** The window planner suggests ranges from your answers and workspace list (small team, standard or larger), with an ⓘ on how it picks, and lets you choose another. Your choice travels with the project.
- **Several workspaces in one run.** The inventory script takes a list of workspaces (`-WorkspacesFile`) and writes one file per workspace. A workspace that fails does not stop the others, and the list is checked before any request. **Import inventory results** takes several files at once, with one dialog per workspace and **Skip this file**. The script is now version 1.0.0 and still sends GET requests only.

### Changes from the review on 20 October

- **Dates:** typing a date no longer redraws the page, so the screen stays put and the digits land where you type them. A click opens the calendar. The window's end date must be on or after its start: the calendar greys out earlier days, a message explains the problem and Save waits until it is fixed. The same check runs in the new-project wizard.
- **Owners:** each workstream has a lead, and under **More people and step owners** you add the other people involved with what they cover (for example "timeline"), and give a step its own owner. Steps name everyone in their workstream, and reports list the lead and the others.
- **Briefing:** rewritten for the person who reads it. Choose the reader (security leadership, the SOC team, or a client of a service provider) and the email adapts its subject, opening and requests. Each change says what it is and what it means: for example, Microsoft incident creation rules detect nothing themselves, so no detection is lost when they are turned off. Points that your answers rule out are left out, and the email names your window, workspaces and planned primary. The email-app link opens a shorter version when the full one would be too long.
- **Several production workspaces:** the primary workspace choice is now made per tenant, and every other workspace shows as secondary with what that means (its rules keep running, its incidents appear in the same queue, its alerts are not correlated with Defender XDR). The primary workspace step explains how to place rules when production is split because of the analytics rule limit (512 enabled scheduled rules per workspace), with three new Microsoft Learn sources.

### New look

- A graphite "console" design. Dark by default, with a light theme in Settings. Reports always print on white.
- The route: one line from "Sentinel in the Azure portal" to "Sentinel in the Defender portal", with a first **Plan** stop (project setup and questions), a stop for each of the four stages and a "You are here" marker. Progress is weighted by stage, so finishing the questions already shows progress.
- The Mona Sans typeface (SIL Open Font License 1.1, by The Mona Sans Project Authors), embedded as `data:` URLs. The Content-Security-Policy now allows `font-src data:` and still blocks every network request (`default-src 'none'`, `connect-src 'none'`). The licence text ships in `dist/licenses/`.
- Loading overlays while a project opens, a package is packed or the demo is prepared.
- Motion respects the system's reduced-motion setting, and a new **Reduce motion** setting turns it down inside the assistant.

### A guided start

- A first-run introduction of about four seconds. It shows six promises (no internet needed, processed on this device, your data stays with you, grounded in Microsoft Learn with 118 pages, built by practitioners, open for review) and closes with "Your data is yours." and the makers' quote, "Built to make your migration journey easy." It can be skipped, focus starts on **Skip intro**, and reduced motion shows everything at once. Replay it from About or Settings. Later starts show a short splash.
- A welcome page, then a four-step new-project wizard.
- The questionnaire now shows one question per screen:
  - six sections with section progress;
  - answers by click or keys 1 to 4, and Enter for the next question;
  - an optional move to the next question after Yes or No (a setting);
  - "Why we ask" and "Where to find the answer" on every question;
  - "I don't know yet" keeps steps in the plan and can add a "find out" action to the register;
  - an end screen with real counts, then a short "Building your plan" sequence.
- A **Your answers** page shows every answer on one page for review.

### Guided overview and step pages

- The overview leads with your next step, with **Start this step** and **Why this one?**. It also shows the route, a **Start here** checklist from setup to the final report, **Needs your attention** and key dates.
- Step pages:
  - item codes are hidden from the reading text (a small reference line stays at the bottom);
  - steps are structured, with bullets and tips;
  - references to other steps and pages are links;
  - inline buttons act on the step: add a decision, risk, issue, action or exception to the register, linked to the step; add evidence; jump to the owner, due date, notes or gate form; import inventory results or download the inventory script;
  - **Previous step** and **Next step** cards at the bottom.
- Project setup is now a page (`#/project`). Links can open it at the planned transition window or the workspaces section.
- **Cancel** closes a dialog without saving. In the nine dialogs that ask for a reason or details (register items, status and applicability reasons, **Not needed for us**, evidence details, observation notes, links and the test environment reason) it used to do nothing, and only Escape or the close button worked.

### Demo and thanks

- The demo shows a banner and an **Exit demo** button. Leaving it returns you to the start page, ready for your own project.
- A thanks note with links to the makers' LinkedIn profiles appears on the welcome page, on About, and when the final report is complete.

### Guidance text

- All guidance was rewritten in a human voice under [docs/content-style-guide.md](docs/content-style-guide.md).
- `scripts/validate-kb.mjs` enforces the rules: no long dashes, no bare item codes, valid links and actions, and valid step shapes. The build fails on any violation.
- The knowledge base has 109 steps, 35 questions, 118 Microsoft Learn sources (115 verified on 2026-10-19, 3 on 2026-10-20), 32 read-only snippets, and 13 steps marked "Needs review".

### Tests

- New unit test file `tests/unit/copy-and-ux.test.mjs`. It checks that:
  - there are no long dashes in the app source, styles or knowledge base;
  - the knowledge base passes every writing rule, and the validator catches the mistakes it should;
  - guidance that sends you somewhere is a link or an action;
  - new settings have safe defaults and are validated;
  - the brand name and version match the 1.0 release;
  - the embedded typeface ships with its licence and is the only font source.
- The end-to-end suite now has 31 steps. New steps cover the introduction, leaving the demo, the questionnaire's keys and auto-advance, building the plan, links and actions on step pages, hidden item codes, replaying the introduction and reduced motion. See [docs/test-results.md](docs/test-results.md) for the recorded runs.

### Unchanged

- Offline only, enforced by the browser. No account, backend or telemetry.
- No connected mode. The assistant never contacts your tenant.
- Evidence rules, register, gates, reports, snapshots, project packages and the read-only inventory script work as before.

## 0.9.0-rc.1 (2026-10-19, release candidate, never published)

- First complete guided workflow: Prepare (62 items), optional Test (11), the Transition runbook (17) and Validate (19), with a 35-question tailoring questionnaire and three-valued applicability.
- Knowledge base `2026.10.19-rc1`: 101 Microsoft Learn sources verified on 2026-10-19 and 32 read-only snippets.
- Evidence (screenshots, notes, links, files) with type sniffing and limits; register; gate decisions; audit log.
- Reports (preparation, test, execution, validation, final) with print to PDF and SHA-256 snapshots.
- Project packages (.zip) with an integrity manifest; JSON and CSV exports; preferences export and import.
- Opt-in browser autosave (IndexedDB), an unsaved-work warning and "delete all".
- Read-only inventory script and import-based assistance.
- Single-file build with a strict CSP (no network) and a synthetic demo project.
- An independent code and security review. Its 22 findings were fixed and covered by regression tests.
