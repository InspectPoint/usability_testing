# Results dashboard (internal)

A read-only dashboard for viewing usability-test results — both **holistically** (all tests
rolled up) and **per project** (drill into one test). Internal-only by design.

## It's already live (Inspect Point)

The dashboard is deployed and running on Fly.io — **you do not need to set it up per test**:

- **Dashboard:** `https://inspectpoint-usability-results.fly.dev/` — protected by a login
  (username + password). Credentials are shared with the team privately, not stored here.
- **Results endpoint (where the harness posts):** `https://inspectpoint-usability-results.fly.dev/api/results`

To add a test to it: in the test's `usability-test.js`, point `RESULTS_ENDPOINT` at that endpoint
(already the template default) and give the test a distinct `TEST_NAME`. That's it — the dashboard
picks it up automatically.

## The data model that makes both views work

Every test posts to **one shared server**, and each session carries a `TEST_NAME`. That single
tagged dataset is the whole trick:
- **Per-project view** = filter to one `TEST_NAME`.
- **Holistic view** = everything together.

So the rule is: **reuse the one endpoint across all tests**, with a distinct, stable `TEST_NAME`
each. Don't stand up a new server per test — that breaks the holistic roll-up.

## How "internal-only" works

The Fly app serves the dashboard (and the raw results export) behind **HTTP Basic Auth** — a
username/password kept as Fly *secrets*, never in the code. The `POST /api/results` endpoint is
intentionally open so anonymous participants can submit; the dashboard and `GET /api/results` are
locked. Change the login anytime with `fly secrets set DASH_USER=… DASH_PASS=…` then `fly deploy`.

## Standing up a *new* server (only if you ever need a separate one)

The full app is bundled in `assets/results-server/` (zero-dependency Node: `server.js`,
`dashboard.html`, `Dockerfile`, `fly.toml`, `README.md`). To deploy a fresh instance, follow that
folder's `README.md`: install `flyctl` → `fly auth login` → `fly apps create` (in the right org) →
`fly volumes create` → `fly secrets set` the login → `fly deploy`. Then point tests at the new
`/api/results` URL. Verify locally first (`node server.js`, POST a sample, open the dashboard).

## What the dashboard shows

- **Overview:** total tests, total sessions, overall task-completion rate, average ease; plus a
  table of every test with sessions, completion bar, avg ease, and last-result date. Click a row
  to drill in.
- **Per test:** sessions, completion rate, and an average for each numeric survey question; a
  by-task table (completion %, avg time, avg clicks); and every open-text answer listed with the
  participant id.

It adapts automatically: any number of tasks, and any survey questions (numeric survey answers are
averaged as ratings; text answers are listed as responses). No code changes needed per test.

## Google alternative (legacy)

If a setup ever can't use the Fly server, a Google Apps Script dashboard exists too
(`assets/results-dashboard.gs.txt` + the receiver `assets/google-sheet-receiver.gs.txt`), deployed
org-only for internal access. Note the Workspace anonymous-access gotcha in
`references/harness-and-hosting.md` — it's why Inspect Point uses the Fly server for collection.
