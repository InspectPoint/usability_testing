# Event tracking — clean click-paths via `data-track`

The harness logs a click path per task by reading each control's label. Untagged controls with nested description/option text log noisily (e.g. `"Start blankBuild everything from scratch…"`). Tagging the controls that matter with a stable `data-track` value fixes it — the logger's order is `data-track` → `aria-label`/`title` → a primary `__name`/`__title` child → own text.

**Cadence: once per prototype, not once per test.** Once the tags live in Claude Design, every future test of that prototype inherits clean paths automatically. So in the workflow you just *check*: if the prototype's key controls already have `data-track`, you're done — move on. If not, do the round-trip below. Tagging is also **incremental** — untagged controls still get a decent fallback label, so only tag the ambiguous, funnel-critical ones.

> ⚠️ **There is a manual step that cannot be done from here.** Claude Design is the source of truth, and **every export overwrites local edits**, so the tags must be added **inside Claude Design, by the user**, and the prototype re-exported. This skill writes the exact prompt and integrates the result — but it cannot open Claude Design, apply tags there, or export. Plan for one round-trip: generate prompt → user pastes into Claude Design → re-export → bring it back.

## Walkthrough (guide the user)

1. **Scan the prototype.** Read the interactive elements; check whether the key controls already carry `data-track`. If well-covered, skip to building the test.
2. **Pick the controls to tag.** List the funnel-critical, ambiguous ones — on-ramps, tab/step switches, add/create actions, key toggles/steppers/dropdowns, list selections, and every save/submit. Not everything. ~10–20 per flow.
3. **Confirm the list + values** with the user, using the standard taxonomy below.
4. **Generate the Claude Design prompt** — one paste-ready block listing each element (by visible label / role / location) and its exact `data-track` value, instructing Claude Design to add *only* the attribute and keep values stable.
5. **⚠️ User does this manually:** open the prototype in Claude Design, paste the prompt, let it apply the tags, re-export/download.
6. **Bring it back; integrate + verify (carefully).** Diff the new export, pull in the changed files (preserving the harness + Test.html), commit/push/deploy. **Do not rely on a literal-string grep** to confirm tags — they're often applied as JSX expressions or a shared `track` prop, e.g. `data-track={track}`, `data-track={mode === 'blank' ? 'onramp:blank' : …}`, or computed `data-track={`attach:${id}`}`. So searching for `data-track="value"` gives false negatives, and computed values (like `attach:building`) never string-match at all. Instead: grep for `data-track` in **any** form (both `data-track="` and `data-track={`) to confirm the control is wired, and **prove it in the running prototype** — open the test, click the control, and check the click-path entry reads as the tag. A quick practice pass is the real verification. Only loop step 5 if a control genuinely isn't wired.

## Scalability rules
- **Tag only ambiguous, funnel-critical controls.** The fallback labels handle the obvious ones.
- **Reuse one standard taxonomy** across every test so analysis is comparable. Don't invent per-test schemes.
- **One value per logical action**, lowercase, namespaced, **content-independent** (never bake in copy the design might reword).
- **Don't re-tag** components a prior test already instrumented.

## Standard taxonomy (namespaces)
- `onramp:` — how a flow starts (`onramp:blank`, `onramp:copy`, `onramp:recommended`)
- `tab:` / `step:` — top tabs or wizard steps (`tab:questions`, `step:defaults`)
- `path:` — branching choices (`path:system`, `path:non-system`)
- `field:` / `question:` / `section:` — content actions (`field:add`, `question:add`, `question:section-select`, `section:create-new`)
- `defaults:` — settings (`defaults:auto-include`, `defaults:qty-increase`)
- `attach:` — placement/targets (`attach:building`, `attach:show-more`)
- `save:` — every save/submit (`save:type`, `save:set`, `save:section`)
- `pick:` — selecting from a list/picker (`recommended:pick`, `copy:pick`)

## Verification gotcha
`data-track` can be a literal attribute **or** a JSX expression / shared `track` prop that only resolves at runtime (`data-track={track}`, ternaries, computed `` `attach:${id}` `` values). The harness reads the rendered DOM attribute, so prop/expression tags work perfectly — but they will **not** show up in a naive `grep 'data-track="…"'`, and dynamic values never match their final form in source. Always confirm against the **running** prototype (or grep for `data-track` in any form), never a literal-string search of the file — that produces false "missing tag" reports.

## Note
There is currently **no way to make Claude Design emit `data-track` automatically** — the manual round-trip is required whenever those controls are first added or reworded. Tag early and avoid rewording tagged controls to keep re-trips rare. (The harness already prefers `data-track`; no harness change is needed per test.)
