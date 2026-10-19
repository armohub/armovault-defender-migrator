# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- SOC analysts and engineers, SOC managers, security architects, migration owners, consultants, and CISO-level stakeholders.
- They are moving their Microsoft Sentinel experience from the Azure portal to the Microsoft Defender portal before Azure portal support ends after 31 March 2027.
- They need one clear path from readiness to sign-off, with evidence they can show to a change board.
- Users range from first-timers following instructions to engineers who want the exact query, path and permission.

## Product Purpose

- A guided, evidence-based migration companion. It tells each user what applies to their environment, what to do next, exactly where to do it, and how to prove it worked.
- It produces stakeholder-ready reports.
- Success means a team completes the transition calmly and knows at every moment what the next step is.

## Positioning

- Runs entirely offline from one readable HTML file: no account, no backend, no telemetry, enforced by the browser.
- Every step is grounded in current Microsoft Learn documentation, with dates. Conflicting Microsoft guidance is flagged rather than hidden.
- "Done" is never confused with "verified": a pass requires evidence.
- Built by practitioners Arno and Moise.

## Operating Context

- Windows desktops; Microsoft Edge or Google Chrome.
- Opened from a downloaded file. It will be shared with the global community through LinkedIn.
- Users work alongside the Azure portal, the Defender portal, Log Analytics, Cloud Shell and their change process.
- Projects are saved as package files and handed between colleagues.

## Capabilities and Constraints

- Vanilla JavaScript and CSS only. One self-contained file with a strict Content-Security-Policy (no network). No external libraries, fonts or assets at runtime.
- Persistence: in-memory work, opt-in browser autosave, and project packages (.zip).
- 35-question tailoring; four stages (Prepare, optional Test, Transition, Validate); 109 guided items.
- Register, gates, reports printable to PDF, snapshots, and a read-only inventory script import.
- **Released as a single final version (1.0)**, not in public stages. No connected mode inside the product: by design it never contacts the customer's tenant.

## Brand Commitments

- **Product name:** ArMo MS Defender Migration Assistant. Brand: ArMo / ArMoHub (website armohub.ch).
- **Makers:** Arno (https://www.linkedin.com/in/arnoyan) and Moise (https://www.linkedin.com/in/m-aub/). Users are invited to thank them on LinkedIn.
- **Voice:** human, warm, confident and plain-spoken. No em dashes. Item reference codes are hidden from reading text.
- Not affiliated with or endorsed by Microsoft. Microsoft names are used factually only, with no Microsoft logos.

## Evidence on Hand

- A synthetic demo project ("Lakeview Logistics (fictional)").
- No customer testimonials, logos, metrics or case studies exist; none may be invented.

## Product Principles

1. Always show the next step and where to do it.
2. Never imply readiness without evidence.
3. The user's data stays with the user.
4. Structure beats prose: short, scannable, actionable guidance.
5. Premium, calm craft that respects a professional audience.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast, full keyboard operation, focus management on screen changes, and respect for `prefers-reduced-motion` and `prefers-reduced-transparency`.
