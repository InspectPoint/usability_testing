---
name: track-events
description: Instrument an interactive prototype for clean event tracking — identify the meaningful controls, assign descriptive stable `data-track` labels, and generate a ready-to-paste prompt for Claude Design so the tags survive re-exports. Use when a usability test's click paths look noisy, or before running one, to get readable funnel data. Pairs with the usability-test-builder harness (its logger prefers `data-track`).
---

# Track Events

Makes a prototype's click/selection logging **clean and analysis-ready**. The usability-test harness records a click path per task by reading each control's label; when controls have nested descriptions or option lists, those labels get noisy (e.g. `"Start blankBuild everything from scratch…"`). This skill fixes that at the source by tagging the meaningful controls with a stable `data-track` value, which the harness's logger prefers over guessed text.

**Key constraint:** these prototypes are re-exported from Claude Design constantly, and repo edits get overwritten on the next export. So the **primary deliverable is a Claude Design prompt** that adds the tags in the design source (durable). Tagging the local files is only a stopgap.

## What it produces

1. **A Claude Design prompt** (the main output) — a copy-paste instruction that lists each element by its visible label / role / location and the exact `data-track` value to add. Paste it into Claude Design so the tags persist across every export.
2. **(Optional) local tags** — the same `data-track` attributes applied to the current prototype files, flagged as a stopgap that the next export will overwrite.

No harness change is needed per test: the `usability-test-builder` logger already prefers `data-track` → `aria-label` → a primary name/title child → own text.

## Steps

1. **Read the prototype** (the JSX/HTML the test uses) and list its interactive surfaces — buttons, links, tabs, toggles, steppers, dropdowns, list/option selections, save/submit controls.
2. **Select the funnel-critical controls — not everything.** Tag what matters for understanding the path: on-ramp choices, tab/step switches, add/create actions, key inputs/toggles/dropdowns, list selections, and every save/submit. Skip decorative, duplicative, or purely-navigational chrome.
3. **Assign a stable taxonomy.** Values are lowercase, namespaced by area, and **content-independent** (don't bake in a name that changes per item):
   - `onramp:blank` · `onramp:copy` · `onramp:recommended`
   - `tab:<name>` (e.g. `tab:questions`) · `path:system` · `path:non-system`
   - `field:add` · `field:kind` · `question:add` · `question:section-select` · `section:create-new`
   - `defaults:auto-include` · `defaults:qty-increase` · `defaults:qty-decrease`
   - `attach:<target>` · `attach:show-more` · `save:type` · `save:set` · `save:section`
   Keep one value per logical action; reuse the same value if the same action appears in multiple places.
4. **Generate the Claude Design prompt** — for each tagged element give its visible label/role and the `data-track` value, in a single paste-ready block. Tell Claude Design to add the attribute without changing anything else, and to keep the values stable on future edits.
5. **Offer the local stopgap** — optionally apply the tags to the current prototype files now (warn they'll be overwritten on the next export), so tracking is clean until the design re-exports with the tags baked in.
6. **Remind** the user the harness consumes `data-track` automatically — once the design has the tags, click paths read cleanly with no further work.

## Notes
- Favor fewer, well-named tags over exhaustive coverage — ~10–20 per flow is usually enough.
- Stable + descriptive + unique per action. Avoid values derived from copy that the design might reword.
- If the harness's `labelFor` is ever missing `data-track` preference, add it (prefer `data-track`, then `aria-label`, then a primary `__name`/`__title` child, then own text).
