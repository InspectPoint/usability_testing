# Usability-test results server (Fly.io)

A tiny Node app that collects unmoderated usability-test results and serves the internal
dashboard. Recommended by IT as the place to host this (vs. a third-party form tool).

## What it does

- `POST /api/results` — receives a finished test session (open, so anonymous participants can
  submit; this is what the test harness's `RESULTS_ENDPOINT` points at).
- `GET /api/results` — returns all results as JSON (Basic Auth — internal only).
- `GET /` — the dashboard: holistic overview + per-test drill-down (Basic Auth — internal only).

Data is stored as one JSON line per session in `DATA_FILE`, on a Fly **volume** so it survives
restarts.

## Run locally

```
DASH_USER=admin DASH_PASS=test DATA_FILE=./data/results.jsonl node server.js
# dashboard: http://localhost:8080/  (login admin / test)
```

## Deploy to Fly.io (one-time, needs a Fly account)

1. Install the CLI: `brew install flyctl`
2. Sign in / sign up: `fly auth login` (or `fly auth signup`)
3. From this folder, create the app: `fly launch --no-deploy` (accept the name in `fly.toml`,
   or let it pick one and update `fly.toml`).
4. Create the data volume: `fly volumes create results_data --size 1 --region iad`
5. Set the dashboard login (kept out of the code as secrets):
   `fly secrets set DASH_USER=yourname DASH_PASS='a-long-passphrase'`
6. Deploy: `fly deploy`
7. Your URLs:
   - Dashboard: `https://<app-name>.fly.dev/`  (sign in with the user/pass from step 5)
   - Results endpoint (goes in the test harness): `https://<app-name>.fly.dev/api/results`

## Point a test at it

In the test's `usability-test.js`, set:
`var RESULTS_ENDPOINT = "https://<app-name>.fly.dev/api/results";`

The harness POSTs each finished session there; the dashboard shows them grouped by `TEST_NAME`.

## Notes

- The POST endpoint is intentionally open (anonymous participants must reach it) — same as any
  form endpoint. The dashboard and the raw results are protected by Basic Auth.
- To export, open `GET /api/results` (signed in) — it returns JSON of every session.
