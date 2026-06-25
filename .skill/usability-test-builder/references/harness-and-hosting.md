# Wiring up the harness, results, and hosting

Companion to `assets/usability-test.template.js`. Read this when customizing the harness,
choosing success signals, routing results, or putting the test online.

## Customizing the harness

The template has one CONFIG block at the top. Everything below it is the engine — leave
it alone. Edit only:

- `RESULTS_ENDPOINT` — where finished sessions POST to (see "Results routing"). Leave `""`
  to have results download as a file instead.
- `BRAND` — primary/accent colors and app name shown on the intro and banner.
- `SUCCESS_TOAST_SELECTOR` — only matters if you use `success: { type: "toast" }`. Set it
  to the prototype's confirmation-toast CSS class (find it by reading the prototype's code).
- `TASKS` — one entry per task. Scenario text in the participant's words; `success` rule.
- `SURVEY` — the post-test questions, data-driven (`scale` or `text`).

## Picking a success signal per task

Read the prototype's code (or click through it) to find what changes on success, then pick:

| Signal in the prototype | Use | Example |
|---|---|---|
| A confirmation toast/snackbar | `{ type: "toast", match: /created/i }` | "Item created" toast appears |
| A success screen/element appears | `{ type: "selector", match: ".confirmation-screen" }` | a receipt/confirmation div renders |
| Specific text appears anywhere | `{ type: "text", match: "Booking confirmed" }` | a heading or banner |
| No reliable signal | `{ type: "manual" }` | participant taps "I've finished this step" |

`toast` and `selector` watch the page for newly-added matching elements; `text` scans the
page's visible text. When unsure, start with `manual` — it always works — and upgrade to an
automatic signal once you've confirmed what the prototype does on success.

## Assembling the test page

1. **Never edit the original prototype.** Make a copy of its HTML named `<Name> — Test.html`.
2. Drop `usability-test.js` (your edited copy of the template) next to the prototype files.
3. Add this as the **last** line before `</body>` in the copied HTML:
   `<script src="usability-test.js"></script>`
   It must load after the prototype's own scripts; the harness waits for the prototype to
   render before showing the intro.

## Verifying it works before sharing

Serve the folder locally (`python3 -m http.server`) and click through the whole flow:
intro → each task → survey → thank-you. Confirm each task's success signal actually fires
(complete the real action and watch the harness advance). Then check the captured data —
the finished session is in `localStorage` (key `iput_…`) and downloadable on the last screen.
One bad task wording wastes every participant, so always pilot once yourself first.

## Results routing — where the data lands

The harness POSTs the finished session as JSON. **Inspect Point's live destination is the
shared Fly.io results server** — this is the default and the recommended path:

- **Inspect Point results server (DEFAULT, already live)** — set
  `RESULTS_ENDPOINT = "https://inspectpoint-usability-results.fly.dev/api/results"` (already the
  template default). Every test posts here; the internal dashboard at the same host shows results
  grouped by `TEST_NAME`. **There is one shared server for all tests — do not stand up a new one
  per test.** Just reuse the endpoint and give each test a distinct `TEST_NAME`. The dashboard
  login is shared with the team privately. To stand up a *separate* server (e.g. another org), the
  full app is bundled in `assets/results-server/` — see `references/dashboard.md`.
- **No endpoint** — leave `RESULTS_ENDPOINT = ""`. Each participant's session downloads as a JSON
  file on the thank-you screen. Fine for a quick local trial with a colleague.
- **Google Sheet / form service (legacy alternative)** — only if you ever can't use the Fly
  server. A Google Apps Script receiver is in `assets/google-sheet-receiver.gs.txt`, but note the
  Workspace gotcha below — it's why Inspect Point moved to the Fly server.

### Why not a Google Sheet (the Workspace gotcha — context)

A **company Google Workspace account** (e.g. `@company.com`) often **blocks anonymous access to
Apps Script web apps**, even when the deployment says "Who has access: Anyone." The signature: the
link works in *your* signed-in browser, but an anonymous/incognito visitor (every participant) gets
a Google **"Error" / "Page Not Found"** page. This is an org admin policy, not a misconfiguration.
Inspect Point hit exactly this, so results now go to the self-hosted Fly server instead, which
accepts anonymous POSTs by design. (If you ever do try a Google/other endpoint, test it from an
**incognito window** before sending it to participants.)

## Hosting the test page publicly

Participants need a public URL (not a file on your machine). Easiest no-account option:
**Netlify Drop** (drag the project folder onto the page, get a link). Other options: GitHub
Pages, or any static host. The prototype must be fully client-side (HTML/CSS/JS, CDN libs) —
these harness-wrapped prototypes are.

## Apps Script receiver (reference)

The `doPost` receiver that flattens a session into one sheet row lives at
`assets/google-sheet-receiver.gs.txt`. It auto-creates the header row and appends one row
per participant (timestamps, per-task completion/time/clicks/path, and survey answers).
