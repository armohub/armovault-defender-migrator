# Test-user walkthrough, 19 October 2026

A walkthrough of the 1.0 build as a team that wants to move Microsoft Sentinel to the Defender portal. It covers the feedback from the makers' own review, then every question of the questionnaire and the other features, run in Edge at 1440 by 900 on a fresh project and on the demo project.

## Feedback from the makers' review, and what changed

| Feedback | What changed |
|---|---|
| The route starts at "Azure portal", but Sentinel is what moves | The route now runs from "Sentinel in the Azure portal" to "Sentinel in the Defender portal", in the overview, the welcome page, the intro and the phone layout. |
| Version and makers sit at the bottom left | They now sit right under the ArMo logo, top left. |
| After all questions the overview still shows 0% | The route has a first stop, **Plan** (project setup and the questions). Progress is weighted by stage (Plan 10, Prepare 40, Test 10 when used, Transition 20, Validate 20), so finishing the questions shows real progress. |
| "Agree what changes and what does not" is a lot of reading and points elsewhere | The step now has a **Do it here** briefing: what changes, what stays the same, the deadline, and a ready-to-send email with Microsoft Learn links. Copy it into Outlook (formatted) or open it in the email app. |
| Only a "Next step" button at the bottom | Every step has **Leave for now** and **Next step** at the top right. |
| "Name an owner for each workstream": where? | One **Owners and approvers** form, in the step and in Project setup. Every step shows its workstream owner unless it has its own. Approver names are suggested wherever the assistant asks who decided. |
| Plan the window: how much time per stage? | A **window planner** in the step and in Project setup: typical time per phase (shorter or longer ranges depending on your answers), the date to start Prepare, and the expected sign-off date. Labelled as practical guidance, not Microsoft guidance. |
| Not every step needs evidence | **Not needed for us**, with a reason. The step can then pass, and reports say "Passed, evidence not needed" with the reason, name and date. |
| Inventory: why attach a file? | A **workspace inventory form** (alias, environment, subscription, resource group, region, owner, Defender portal state). It feeds Project setup, the primary workspace choice, the connection check and the reports. Importing the inventory script can add the workspace alias. |
| Running queries needs access some people don't have | Steps with queries gain **No query access? Use the portal** where Microsoft Learn documents a portal way. The workspace inventory now starts with the portal way. |
| "Date and who checked" links to notes, next to Owner and Due date | The record panel now says who set the status and when ("recorded for you"). Owner means responsible, due date means when it should be done. Record lists no longer ask for who and when. |
| Steps should not block each other | **Leave for now** parks a step as in progress and moves on. The suggested next step skips parked steps until nothing else is left, and the overview lists them under **Parked for later**. |
| Answering a question felt like a double click | The screen no longer redraws its slide-in animation when you answer. A soft **Answer recorded** notice fades in bottom right, and the next question follows after a short pause. |

## The questionnaire, question by question

All 35 questions were answered with a realistic mix. Findings:

- **Five questions changed nothing in the plan** although their "why we ask" suggested they did: already connected, test environment, separate test tenant, grouping dependency, unified RBAC.
  - The test environment answer now switches the optional Test stage on or off (with the answer recorded as the reason).
  - The other four now say honestly which step they inform, with a link to it.
- **"Not applicable" and "No" count the same.** The tile now says "Doesn't fit us. Counts as No".
- **Nine questions can be answered by the read-only inventory script** (Fusion, Microsoft incident creation rules, alert-only rules, Defender for Cloud, standalone connectors, automation rules, playbooks, watchlists, threat intelligence). Those questions, and the questionnaire start, now say so with a link.
- **Your workspace list hints at answers**: how many workspaces you listed, and whether any is connected.
- **One question bundled three ideas** (grouping, titles, reopening) with a vague subject. Rephrased: "Do processes, automation or reports rely on incident titles, alert grouping or reopened incidents?"
- The follow-up questions appear only when they apply (34 shown on the test run).

## Other features

- **Step pages:** the essentials come first (Do it here, Where, Steps, You're done when, What to record). Background is folded with a one-line preview: Why it matters, Before you start, Watch out, If it fails, Rollback, From the field, Sources. Scripts show their purpose and buttons; the details and long code open with one click.
- **Gate steps:** the decision form now leads the page as **Do it here**, instead of sitting at the bottom of the side panel.
- **Decisions and risks, Evidence:** the filters were two full-width boxes; they now sit in one compact row. Statuses are capitalised.
- **Reports:** show the workspace inventory, the planned primary, owners and approvers, and "evidence not needed" decisions.

## Still open: recommendations

1. **Tenants in the workspace list:** done. When you answer that you run several tenants, each workspace gets a tenant alias, and "one primary" is checked per tenant.
2. **Snapshot from the gate step:** done. The four gate steps now offer "Save a snapshot" right on the step.
3. **Fewer questions up front.** Consider offering the inventory script import before the questionnaire, so nine answers arrive pre-filled.
4. **Longest steps:** done. The Defender for Cloud connector choice, unified RBAC and the multi-tenant access model now lead with a decision helper under **Do it here**: three, five and two questions (the last per tenant), both approaches side by side, a verdict only where the step gives one, and **Record as a decision** with the reasons filled in.
5. **Templates.** Decision and risk records could offer short templates (for example "Approved by, on, conditions").
