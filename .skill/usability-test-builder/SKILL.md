---
name: usability-test-builder
description: Turn an interactive prototype (a Claude-built HTML/JS prototype, an exported design bundle, or any client-side web prototype) into a self-contained, unmoderated usability test, with scenario-based tasks, click/time/success logging (including instrumenting the prototype with `data-track` for clean click-paths), and an end survey baked right into the page. Use this whenever someone wants to user-test, usability-test, or put a prototype in front of users without a live facilitator, including setting up an unmoderated test, wrapping a prototype with tasks and a survey, measuring whether users can complete flows, testing a clickable prototype remotely, or running a prototype through usability testing. Trigger even if the person does not say unmoderated. If they have a prototype and want to see if people can use it on their own, this is the skill. Built for a 2-person fire-and-life-safety design team (Inspect Point) but works for any prototype.
user-invocable: true
---

# Usability-test builder

Help a designer turn an interactive prototype into an unmoderated usability test that runs
on its own: a participant opens one link, works through tasks one at a time, answers a short
survey, and the results (task success, time, clicks, click-path, survey answers) are captured
without anyone watching.

The output is the **original prototype, untouched**, plus a thin harness layer that overlays
task prompts and logging. You assemble it; the participant experiences a guided test.

## Who you're talking to

Likely a UX designer with little or no coding background. Explain anything technical in plain
language, define terms the first time, and confirm before doing anything hard to reverse. Show
what will change and where. Prefer the safe, obvious path over the clever one. The *participants*
are end users (e.g. fire inspectors, office admins) — write everything they'll read in their
plain language, never in product jargon.

## The workflow

Work through these in order. Don't skip step 1 — a test with no decision behind it produces
findings nobody acts on.

### 1. Pin the decision

Get the user to name what the test will help them decide ("decide whether layout A or B works
better for scheduling," "decide if techs understand the new labels"). If they can't, ask. This
shapes which flow to test and how tasks are worded. See `references/best-practices.md` §1.

### 2. Locate and run the prototype

Find the prototype files (a folder of HTML/CSS/JS, an exported design bundle, or a Claude
artifact). Get it running locally so you can see it and confirm it works before building on it:
serve the folder (`python3 -m http.server`) and open it. Read the prototype's main HTML and the
scripts it imports so you understand the flows and — crucially — what happens on screen when an
action succeeds (a toast, a confirmation screen, a URL change). That success moment becomes each
task's completion signal.

**Then instrument it for clean tracking (once per prototype).** Check whether the prototype's key
controls carry `data-track` attributes. If they do, you're set — the harness logs clean labels and
you move on. If not, this is the moment to add them: identify the funnel-critical controls, generate
a prompt for Claude Design to tag them, and have the user apply it there and re-export — **the tags
must live in the design, because every export overwrites local edits.** This makes click-paths
readable for *this* test and every future one (so it's a once-per-prototype step, not per-test).
Full walkthrough, the standard taxonomy, and the manual round-trip are in `references/event-tracking.md`.

### 3. Define the tasks (interview the user)

Ask the user **which functions or flows they want participants to complete**. For each, write a
realistic, scenario-based task in the participant's own words — not UI labels. Aim for 2–4 tasks.
Then, for each task, decide its **success signal** (how the harness detects completion) by
matching what you saw in step 2 to a detection type. The full task-writing rules and the
success-signal options are in `references/best-practices.md` §2 and
`references/harness-and-hosting.md`. Read both before writing tasks.

Confirm the task wording with the user — they know the domain and their users.

### 4. Define the survey

Propose a short post-test survey: a Single Ease Question, a comprehension probe in open text
(this catches wrong mental models that task-success alone hides), and a neutral "anything
unexpected?" question. Offer to add a confidence rating. Keep it to 3–4 neutral, non-leading
questions. Rules and rationale in `references/best-practices.md` §3. Let the user adjust wording.

### 5. Build the test page

- Copy `assets/usability-test.template.js` into the prototype's folder as `usability-test.js`.
- Edit only its CONFIG block: `RESULTS_ENDPOINT` (leave `""` for now), `TEST_NAME` (a short, stable
  label for this test — it tags every result row so the dashboard can show this test alone AND roll
  it up with the others), `BRAND`, the success-toast selector if used, `TASKS`, and `SURVEY` —
  translating steps 3–4 into config.
- **Never edit the original prototype.** Make a copy of its HTML named `<Name> — Test.html` and
  add `<script src="usability-test.js"></script>` as the last line before `</body>`.
- Detailed wiring instructions: `references/harness-and-hosting.md`.

### 6. Verify it end to end

Serve locally and click through the whole flow as if you were a participant: intro → each task →
survey → thank-you. Confirm every task's success signal actually fires when you really complete
the action, and that the captured data row looks right (it's in `localStorage` and downloadable
on the last screen). Always pilot once yourself — one broken task wording wastes every real
participant. Share a screenshot/summary as proof, don't ask the user to verify manually.

### 7. Results routing and hosting

For Inspect Point this is mostly already wired:
- **Where results land — the shared Fly.io server (default).** The harness template already points
  `RESULTS_ENDPOINT` at `https://inspectpoint-usability-results.fly.dev/api/results`. Every test
  reuses that one endpoint; just give each a distinct `TEST_NAME`. No per-test backend setup. (Why
  not Google: the Workspace anonymous-access gotcha — see `references/harness-and-hosting.md`.)
- **Hosting the test page** — it lives on the team's standalone GitHub Pages site
  (`inspectpoint.github.io/usability_testing`, behind an access-code gate): drop the test's folder
  in and add it to the test list. (For a one-off, Netlify Drop also works.)

If results ever can't use the Fly server, `references/harness-and-hosting.md` covers alternatives.
Leaving `RESULTS_ENDPOINT = ""` makes results download as a file — fine for a quick local trial.

### 8. Results dashboard (internal)

The internal dashboard is **already live** at `https://inspectpoint-usability-results.fly.dev/`
(behind a team login) and shows results per-project and rolled up holistically. Nothing to set up
per test: because every test posts to the one shared server tagged with `TEST_NAME`, a new test
appears in the dashboard automatically once results come in. Just confirm the test's `TEST_NAME` is
distinct and stable. Details (the data model, internal-access, and how to stand up a *separate*
server if ever needed) are in `references/dashboard.md`.

## After the test runs

When results come back, analyze by severity × frequency and read the three data lenses
(completion/time/clicks, click-paths, SEQ/open-text). See `references/best-practices.md` §5. If the
dashboard is set up, it surfaces these automatically per test and across all tests.

## Bundled resources

- `assets/usability-test.template.js` — the harness. Config-driven tasks + survey; success
  detection by toast / selector / text / manual. Copy and edit the CONFIG block only.
- `assets/results-server/` — the live results server app (zero-dependency Node: `server.js`,
  `dashboard.html`, `Dockerfile`, `fly.toml`, `README.md`). Already deployed for Inspect Point;
  bundled here so a separate instance can be stood up if ever needed. Receives POSTs and serves the
  internal dashboard (holistic + per-test). See `references/dashboard.md`.
- `assets/google-sheet-receiver.gs.txt` + `assets/results-dashboard.gs.txt` — legacy Google Apps
  Script receiver + dashboard, kept only as a fallback if the Fly server can't be used. (Subject to
  the Workspace anonymous-access gotcha.)
- `references/event-tracking.md` — instrumenting a prototype with `data-track` for clean
  click-paths: the standard taxonomy, the Claude Design prompt, and the manual round-trip. Read
  during step 2 (once per prototype).
- `references/best-practices.md` — decision-first, task-writing rules, survey design, participant
  count, analysis. Read before steps 3–4.
- `references/harness-and-hosting.md` — customizing the harness, choosing success signals,
  assembling the page, results routing (incl. the Workspace gotcha), and hosting. Read before
  steps 5–7.
- `references/dashboard.md` — the shared-sheet data model, internal-only setup, what the dashboard
  shows, and local verification. Read before step 8.
