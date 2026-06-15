# Inspect Point — Usability Testing

A standalone site for hosting unmoderated usability-test prototypes for the Inspect Point
design team. **Completely separate from the Inspect Point product codebase** — its own repo,
its own deployment, no shared code.

Live at: https://inspectpoint.github.io/usability_testing

## How it works

- `index.html` — a front page with a client-side **access-code gate** and a list of available tests.
- Each test lives in its own subfolder (e.g. `component-setup/`) and is a self-contained prototype
  wrapped with the unmoderated test harness (task prompts, click/time/success logging, end survey).

## ⚠️ About the access code

The gate is **client-side only** — it keeps casual visitors out, but it is *not* real security.
Don't host anything sensitive here; these are UI prototypes shown to invited participants.
Test results are sent to a separate Google Sheet / form, never stored in this repo.

## Changing the access code

The gate compares a SHA-256 hash, so the plain code is never stored in the files. To change it:
1. Compute the hash of your new code: `printf '%s' "yourNewCode" | shasum -a 256`
2. Replace the `STORED_HASH` value near the bottom of `index.html` with the new hash.
3. Commit and push.

## Adding a new test

1. Drop the test's self-contained folder alongside `component-setup/`.
2. Add a `<li>` linking to it in the "Available tests" list in `index.html`.
3. Commit and push.

Built with the `usability-test-builder` skill.
