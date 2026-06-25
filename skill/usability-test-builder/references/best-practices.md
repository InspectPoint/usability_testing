# Usability-test best practices (tasks & survey)

Grounded in Nielsen Norman Group guidance and Erika Hall's *Just Enough Research*.
This is the quality bar for an unmoderated test, where there's no facilitator to
rescue a confused participant — so the tasks and survey have to carry all the weight.

## 1. Pin the decision first

Never start until you can finish this sentence: **"We're running this test to decide ___."**
Examples: "decide whether to ship layout A or B for the scheduling screen," or "decide
whether technicians understand the new deficiency labels without training."

The decision drives everything — which flows to test, how tasks are worded, what the
survey asks. If the user can't name it, ask. Don't proceed on a vague "see if it's usable."

## 2. Writing tasks (the part that makes or breaks an unmoderated test)

Aim for **2–4 tasks**. More than that and quality/attention drops.

Two flavors:
- **Specific task** — a concrete goal with a clear finish line. "A customer calls asking
  when their next inspection is due — find out and tell them." Most tasks are this kind.
- **Exploratory task** — open-ended, no defined endpoint. "Look around this screen and tell
  us what you think you could do here." Use at most one, usually first.

Rules (each exists for a reason):
- **Use the participant's real-world language, never UI labels.** Say "set up a new kind of
  component so inspectors can log it," not "click New component type." Naming the button
  turns the test into a reading-comprehension check instead of a design test.
- **One goal per task, with a clear endpoint.** Split compound asks into separate tasks.
- **Don't reveal the path.** If the wording hints where to click, the finding is worthless.
- **Make it concrete.** "Schedule an inspection for next Tuesday," not "try out scheduling."
- **Give realistic context.** A short scenario ("A customer just called and…") puts the
  participant in a real frame of mind and produces realistic behavior.

For each task, also decide the **success signal** — the observable thing that means
"done" (a confirmation toast, a success screen, a URL change, specific text appearing).
This is what the harness watches for. If there's no reliable signal, the harness falls
back to a participant-tapped "I've finished this step" button — fine, but the auto-signal
is better data.

## 3. Writing the survey

Post-task self-report. Keep it short (3–4 questions) and neutral. The most common mistake
is embedding an assumption — "why was that confusing?" presumes confusion. Ask "how was
that for you?" instead.

A reliable default set:
- **Single Ease Question (SEQ):** "Overall, how easy or hard was it to [do the tasks]?"
  on a 1–5 (or 1–7) scale. This is a standard, comparable usability metric.
- **Comprehension probe (open text):** "In your own words, what was this screen for?" or
  "…how did [X] and [Y] relate?" This measures *understanding*, which task success alone
  can't reveal — someone can finish a task and still hold a wrong mental model.
- **Surprise/expectation (open text):** "Did anything work differently than you expected?
  If so, what?" Neutral phrasing that surfaces friction without leading.
- **Confidence (optional scale):** "How confident are you that you did the tasks correctly?"

Question hygiene: open-ended over yes/no; ask about what happened, not hypotheticals;
one question at a time; no leading premises ("most people find this easy — do you?").

## 4. How many participants

Start with **5**, analyze after each session, stop early if the pattern is obvious. Five
users surfaces ~85% of usability problems; pooling more has diminishing returns. Prefer
**3 rounds of 5** (fix and retest between rounds) over one big round.

## 5. Analyzing results

Prioritize findings by **severity × frequency**: things that block task completion and
hit many participants get fixed first. A clean way to read the harness output:
- **Task completion rate** + **time on task** + **click count** → where the design fights people.
- **Click paths** → *how* people went wrong (wrong turns, dead ends, backtracking).
- **SEQ + open-text** → the felt experience and mental-model gaps.

The fuller method reference (screeners, facilitation, affinity mapping, severity tiers)
lives at `~/user-research-script-guide.md` if a deeper study is needed.
