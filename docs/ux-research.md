# UX research brief: guided, premium and credible

Date: 2026-10-19. Constraints: offline single file, vanilla JS and CSS, Web Animations API, View Transitions in Chromium with a plain fallback. [n] refers to the source list.

## 1. One question per screen

Evidence

- GOV.UK starts every form with one thing per page: it helps focus, error recovery and small screens. Each page has a Back link, the legend as heading, and Continue. Allow "I do not know" where valid, say why you ask, and only show a total you can rely on [1][2][3].
- Progress bars don't reliably cut drop-off. Across 32 experiments, constant bars had no significant effect, slow-to-fast bars raised breakoff and fast-to-slow bars lowered it [7]. Credited head-start progress increases persistence [8].
- 14% of users abandon when a field is required with no reason given [9].
- Auto-advance after selection is a change of context unless users are told first (WCAG 3.2.2) [34]. Typeform-style letter shortcuts [29] must be switchable off, remappable or focus-scoped (WCAG 2.1.4) [36].
- "Check answers": a summary list with a Change link per row that returns to the summary [4].

Recommendations for our app

- One question per screen in 6 themed sections of 4 to 8 questions. Easy scoping questions first, so early progress feels fast.
- Start screen: "35 questions in 6 sections, about 8 minutes. You can stop and come back." Show project set-up as already done.
- Progress: caption "Section 2 of 6: Data connectors", a 6-segment bar filling within each section, and "3 of 6" for the section. Never "1 of 35". Branching may shrink the total, never grow it.
- Answers: 4 tiles on native radios, at least 56 px tall, with key hints 1 to 4.
- Auto-advance 350 ms after a click or shortcut, never on arrow keys (they move selection in a radio group). Explain it up front; remembered toggle "Move to the next question automatically" (default on). Continue stays visible.
- Shortcuts: 1 to 4 answer, Enter continues, active only while focus is in the question card, off switch in Settings. Each question is a history entry, so browser Back works.
- "I don't know" keeps related items in scope and adds a register action, "Find out: ...". "Skip for now" is separate and shows as "Not answered".
- "Why we ask": one-sentence hint, no links. Expander "What this changes" ("Affects 6 Transition items").
- Section break screen: name, one sentence, "5 questions, about 1 minute", "Start section". No timer.
- End: check answers by section, then "Build my plan". Show real, itemised steps ("Matching 35 answers to 109 items", "14 marked not applicable", "3 find-out actions added"), 300 to 400 ms per line, 1,800 ms max, Skip visible. Then a results screen with counts and one button: "Start Prepare: P-01 ...".
- Timings: selection feedback 120 ms; question exit 150 ms, enter 250 ms (fade plus 12 px rise); section screen 400 ms.

## 2. After the questionnaire: the next best action

Evidence

- Empty states should show status, teach, and link straight to the task [13].
- GOV.UK task lists group tasks into stages, start names with verbs, use few statuses (Not yet started, In progress, Completed, Cannot start yet) and quieten completed rows [5].
- What appears first signals importance; more than 2 disclosure levels hurts usability [14].
- Push tutorials interrupt and are forgotten; dismissable, re-findable contextual help works better [15]. Buttons should name the next action [16]. Restore state on relaunch [20].

Recommendations for our app

- Overview opens with a "Next up" card with one primary action: the first in-scope, unblocked, unfinished item in the earliest open stage, plus a one-line reason ("Needed before the Prepare gate"). At most 3 "Also ready" items below.
- Path strip: Set up, Tailor, Prepare, Test (optional), Transition, Validate, Report, with GOV.UK-style statuses. Gates show "Cannot start yet" until prerequisites are done.
- In a stage: 5 to 9 themed groups, only the current one expanded, others showing "4 of 7 done". Default filter "To do"; not applicable items behind a filter.
- Focus mode on items: steps and evidence only, then "Complete and go to P-08". Esc leaves.
- Welcome screen on reopen: "Continue where you left off: P-07 Check connector health".
- Empty states (register, evidence, reports): one sentence, one button, one "Learn more".
- Demo: persistent, distinctly coloured banner, "You're exploring a demo with fictional data", with "Exit demo" at its right and in the menu. Exit confirms once, then returns to welcome.
- No forced tour. Offer a 3-step "Show me around" once, re-openable from Help.

## 3. Premium feel without gimmicks

Evidence

- NN/g: most motion 100 to 400 ms; simple feedback about 100 ms; dialogs 200 to 300 ms; enter slightly longer than exit; 500 ms drags; ease-out by default [10].
- Apple: purposeful, brief motion; none on frequent interactions; cancellable; never make people wait [19]. Launch instantly; a splash belongs at the start of onboarding [20].
- Material 3: standard cubic-bezier(0.2, 0, 0, 1); emphasized decelerate (0.05, 0.7, 0.1, 1) to enter; emphasized accelerate (0.3, 0, 0.8, 0.15) to exit [21]. Fluent: short stagger offsets, more motion for important elements [22]. CSS linear() approximates springs, cross-browser since December 2023 [27].
- No indicator under 1 s; looped 2 to 10 s; percent-done above 10 s; skeletons only for full-page content [11][12]. Show-delay 150 to 300 ms, minimum visible 300 to 500 ms; animate transform and opacity; keep motion interruptible [24].
- Itemised work shown to the user raises perceived value; a blind bar doesn't [26]. Delight only works on top of usability, and forced delight risks serious brands [17].

Recommendations for our app

- Motion tokens:
  - --dur-1 100 ms: press, radio, checkbox
  - --dur-2 150 ms: hover, small exits, "Saved"
  - --dur-3 250 ms: question and card enter, accordion
  - --dur-4 350 ms: page change, dialog enter (exit 200 ms)
  - --dur-5 500 ms: milestones only
  - --ease-standard cubic-bezier(0.2, 0, 0, 1); --ease-enter cubic-bezier(0.05, 0.7, 0.1, 1); --ease-exit cubic-bezier(0.3, 0, 0.8, 0.15); --ease-spring a linear() curve with at most 3% overshoot, ticks and badges only.
- Translate 8 to 16 px, scale from 0.98, no full-screen slides. Press: scale 0.97.
- Stagger 40 ms for the first 6 items (240 ms cap); the rest appear together.
- Page changes: View Transitions crossfade plus 12 px rise, 250 to 350 ms.
- Worth doing: answer tick (120 ms); item complete (tick 250 ms, progress ring 400 ms); evidence chip in (250 ms); "Saved" (fade 150 ms, hold 2,000 ms). No motion on table rows.
- Celebrate substance: stage complete and gate approved get a 500 ms ring plus a summary ("Prepare complete: 28 items, 14 evidence files, 2 accepted risks") and the next action. One understated burst only at "Migration validated".
- Loading: local actions are instant, so no fake spinners. Import, integrity check and report build: 150 ms show-delay, 400 ms minimum, step text such as "Checking file 3 of 12".
- Intro: first run only, 5 one-line scenes, under 5,000 ms total: "Works offline", "Processed on this device", "Your data stays with you", "Built on Microsoft guidance by experienced practitioners", "Open, readable code". "Skip intro" focused from 0 ms; Esc or Enter skips; "Replay intro" in About. Later launches go straight to "Continue where you left off".

## 4. Writing

Evidence

- GOV.UK: plain English, 25 words per sentence at most [6]. People scan; the first 2 words of a heading should carry the gist; bullets for steps [18].
- Microsoft: fewer words, contractions, sentence case, no full stop on headings, start with a verb, cut "you can" and "there is" [23].
- Known AI tells: delve, robust, leverage, crucial, pivotal, showcase, foster; "not just X, it's Y"; reflexive threes; Title Case; mechanical bold; emoji; promotional tone; em dash overuse [31]. Readers now treat heavy em dash use as a sign of AI, so it costs trust whatever the evidence [32].

Recommendations for our app

- Item template: Title (verb first, 8 words max); Why it matters (1 sentence); Steps (numbered, one action each, 20 words max); Done when (1 to 3 checks); Evidence to keep; Query (with a one-line purpose); Source (Microsoft Learn link). Background behind "More detail".
- Sentences average 15 to 20 words, 25 max. Paragraphs 3 sentences max; lists become bullets.
- Headings and buttons: sentence case, no full stop, keyword first ("Check connector health", "Save gate decision"). No "Next", "Submit" or "Click here".
- Tone: a calm senior colleague. Specific, never hyped; numerals ("3 risks"); exact Microsoft names; no exclamation marks.
- Banned: em and en dashes (use a colon, comma, parentheses or full stop, and "to" for ranges); delve, seamless, robust, leverage, unlock, empower, elevate, game-changing; "It's not just X"; "Let's dive in"; emoji; Title Case. Bold once per section at most. A content lint fails the build.
- Reports lead with the bottom line for CISOs: status, top 3 risks, decision needed.

## 5. Accessibility

Recommendations for our app

- Honour prefers-reduced-motion and add a "Reduce motion" setting [33][22]. Under reduce: fades of 150 ms or none, a static intro, skipTransition() on View Transitions [28], no stagger or bursts.
- No flashing more than 3 times a second; motion over 5 s needs pause or stop [37].
- On step change, move focus to the new heading (tabindex="-1"), which tested best with screen reader users; never reset to the page top [30]. Sticky bars must not cover focus [38].
- One polite role="status" region for "Answer saved", "Section 2 complete" and plan-building steps; role="alert" only for errors [35]. Keep the progress caption in the focused heading group so it's read once. Native progress element with aria-valuetext "12 of 35 questions answered".
- Auto-advance and shortcuts: explained first, switchable off, never on arrow keys, focus-scoped [34][36]. No time limits.
- Contrast: text 4.5:1, large text 3:1; borders, focus rings, progress fill and selected tiles 3:1 [39]. Status uses icon plus word, never colour alone. Build the palette so steps 5 apart pass 4.5:1 [25].
- Targets at least 24 by 24 px [40]. Focus ring 2 px solid, 2 px offset, via :focus-visible.
- Don't re-ask what set-up captured (WCAG 3.3.7).

## Sources

1. GOV.UK Design System, Question pages: https://design-system.service.gov.uk/patterns/question-pages/
2. GOV.UK Service Manual, Structuring forms: https://www.gov.uk/service-manual/design/form-structure
3. GOV.UK Design Notes, One thing per page: https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/
4. GOV.UK Design System, Check answers: https://design-system.service.gov.uk/patterns/check-answers/
5. GOV.UK Design System, Complete multiple tasks: https://design-system.service.gov.uk/patterns/complete-multiple-tasks/
6. Inside GOV.UK, Why 25 words is our limit: https://insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit/
7. Villar et al. (2013), Where Am I? Progress indicators meta-analysis: https://research.google/pubs/where-am-i-a-meta-analysis-of-experiments-on-the-effects-of-progress-indicators-for-web-surveys/
8. Nunes and Dreze (2006), The Endowed Progress Effect: https://ideas.repec.org/a/oup/jconrs/v32y2006i4p504-512.html
9. Baymard, Explain why the phone field is required: https://baymard.com/blog/explain-phone-number-field
10. NN/g, Executing UX Animations: https://www.nngroup.com/articles/animation-duration/
11. NN/g, Progress Indicators: https://www.nngroup.com/articles/progress-indicators/
12. NN/g, Skeleton Screens 101: https://www.nngroup.com/articles/skeleton-screens/
13. NN/g, Empty States in Complex Applications: https://www.nngroup.com/articles/empty-state-interface-design/
14. NN/g, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
15. NN/g, Onboarding Tutorials vs. Contextual Help: https://www.nngroup.com/articles/onboarding-tutorials/
16. NN/g, Wizards: https://www.nngroup.com/articles/wizards/
17. NN/g, A Theory of User Delight: https://www.nngroup.com/articles/theory-user-delight/
18. NN/g, F-Shaped Pattern of Reading: https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
19. Apple HIG, Motion: https://developer.apple.com/design/human-interface-guidelines/motion
20. Apple HIG, Launching: https://developer.apple.com/design/human-interface-guidelines/launching
21. Material 3, Easing and duration: https://m3.material.io/styles/motion/easing-and-duration/tokens-specs (values: https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
22. Fluent 2, Motion: https://fluent2.microsoft.design/motion
23. Microsoft Writing Style Guide, Top 10 tips: https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice
24. Vercel, Web Interface Guidelines: https://vercel.com/design/guidelines
25. Stripe, Designing accessible color systems: https://stripe.com/blog/accessible-color-systems
26. Buell and Norton (2011), The Labor Illusion: https://pubsonline.informs.org/doi/10.1287/mnsc.1110.1376
27. MDN, linear() easing: https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear
28. MDN, View Transition API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
29. Typeform Help, Letters on answers: https://share.typeform.com/help/a/show-or-hide-the-letters-on-answers-in-your-form-12814361189396/
30. Gatsby (Marcy Sutton), Accessible client-side routing user testing: https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing
31. Wikipedia, Signs of AI writing: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
32. Rolling Stone, Are Em Dashes Really a Sign of AI Writing?: https://www.rollingstone.com/culture/culture-features/chatgpt-hypen-em-dash-ai-writing-1235314945/
33. WCAG 2.2, 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
34. WCAG 2.2, 3.2.2 On Input: https://www.w3.org/WAI/WCAG22/Understanding/on-input.html
35. WCAG 2.2, 4.1.3 Status Messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
36. WCAG 2.2, 2.1.4 Character Key Shortcuts: https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html
37. WCAG 2.2, 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
38. WCAG 2.2, 2.4.11 Focus Not Obscured: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
39. WCAG 2.2, 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
40. WCAG 2.2, 2.5.8 Target Size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
