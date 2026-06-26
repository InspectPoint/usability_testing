---
name: track-events
description: Guided walkthrough to instrument a prototype for clean event tracking — pick the controls that matter, assign stable `data-track` labels, and generate a Claude Design prompt. IMPORTANT - the tags must be added in Claude Design by hand and the prototype re-exported; this skill cannot edit Claude Design for you. Use when usability-test click paths look noisy, or before a test, to get readable funnel data. Pairs with the usability-test-builder harness, whose logger prefers `data-track`.
---

# Track Events

Makes a prototype's click/selection logging clean and analysis-ready. The usability-test harness records a click path per task; without tags it guesses labels from text and gets noisy (e.g. `"Start blankBuild everything from scratch…"`). Tagging the controls that matter with a stable `data-track` value fixes that — the harness's logger prefers `data-track` over guessed text.

> ⚠️ **Read this first — there is a manual step this skill cannot do for you.**
> Claude Design is the source of truth, and **every export overwrites local edits.** So the tags have to be added **inside Claude Design, by you**, and the prototype re-exported. This skill *writes the exact prompt to paste into Claude Design and integrates the result when you bring it back* — but it cannot open Claude Design, apply the tags there, or export. Plan for one round-trip: **generate prompt → you paste it into Claude Design → re-export → bring it back here.**

## How it fits together
- The harness logger order is: `data-track` → `aria-label` → a primary `__name`/`__title` child → own text. So **tagging is incremental, not all-or-nothing** — untagged controls still log a decent label. Only tag the ambiguous, funnel-critical ones.
- Once tags live in the design, they're self-maintaining: every future export keeps them, and the dashboard paths read as tag values with zero further work.

## Walkthrough — follow these steps with the person

**Step 1 — Point me at the prototype and the flow.**
Tell me which prototype (the files the test uses) and which flow we care about. I'll read the interactive elements and list the **funnel-critical, ambiguous** ones worth tagging — not everything (see Scalability rules).

**Step 2 — Confirm the tag list.**
I'll show each proposed control with its `data-track` value using the standard taxonomy below. You adjust/approve. Keep it lean (~10–20 per flow).

**Step 3 — I generate the Claude Design prompt.**
You'll get one paste-ready block listing each element (by visible label / role / location) and its exact `data-track` value, with instructions to add only the attribute and keep values stable.

**Step 4 — ⚠️ YOU do this part manually.**
- Open this prototype in **Claude Design**.
- **Paste the prompt** from Step 3 and let Claude Design apply the `data-track` attributes.
- **Re-export / download** the updated prototype.
- I cannot do any of Step 4 — it happens in Claude Design, outside this environment.

**Step 5 — Bring it back; I integrate it.**
Drop the new export in your Downloads and tell me the filename. I'll diff it against the current files, pull in the changed prototype files (preserving the harness + Test.html), commit, push, deploy, and **verify the `data-track` tags actually landed** (I'll grep a few). If any are missing, we loop Step 4 for just those.

**Step 6 — Confirm clean paths.**
Do a quick run (use a throwaway `?pid`), then check the dashboard — the path should read like `onramp:blank → path:system → save:type`. Clear that throwaway result before real participants.

## Scalability rules (keep it lean and consistent)
- **Tag only what's ambiguous and funnel-critical** — on-ramps, tab/step switches, add/create actions, key toggles/steppers/dropdowns, list selections, and every save/submit. Skip decorative or self-explanatory controls; the harness already labels those cleanly.
- **Reuse the standard taxonomy** (below) on every test so names stay consistent test-to-test and analysis is comparable. Don't invent per-test schemes.
- **One value per logical action**, lowercase, namespaced, and **content-independent** (never bake in a name/label the design might reword).
- **Don't re-tag what's already tagged** — if a prior test instrumented shared components, keep those values.

## Standard taxonomy (namespaces)
- `onramp:` — how a flow starts (`onramp:blank`, `onramp:copy`, `onramp:recommended`)
- `tab:` / `step:` — top tabs or wizard steps (`tab:questions`, `step:defaults`)
- `path:` — branching choices (`path:system`, `path:non-system`)
- `field:` / `question:` / `section:` — content actions (`field:add`, `question:add`, `question:section-select`, `section:create-new`)
- `defaults:` — settings (`defaults:auto-include`, `defaults:qty-increase`)
- `attach:` — placement/targets (`attach:building`, `attach:show-more`)
- `save:` — every save/submit (`save:type`, `save:set`, `save:section`)
- `pick:` — selecting from a list/picker (`recommended:pick`, `copy:pick`)

## Notes
- If the harness's `labelFor` ever lacks `data-track` preference, fix it there (prefer `data-track` → `aria-label`/`title` → primary `__name`/`__title` child → own text).
- There is currently **no way to make Claude Design emit `data-track` automatically** — the manual round-trip in Steps 4–5 is required each time the design changes those controls. Tagging early (and not re-wording the controls) keeps re-trips rare.
