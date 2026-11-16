---
name: reviewer-setup
description: Generates or maintains a project-specific MR review pipeline in `.reviewer/` — surveys the repo for risk, lets the user choose reviewers from a catalog, and writes briefs that cite verified paths and house rules. Backs :init, :sync and :add-agent. It builds reviewers; reviewing a diff is :review.
---

# reviewer-setup

Builds `.reviewer/`: a coordinator that knows where this repo is fragile, a handful of reviewers aimed at
those spots, and a judge that strips out false alarms. It does not review code itself — for that use
`/reviewer:review` (runs the generated pipeline), a stack's `review-changes`, or `/core:judge`.

## Entry points

| Command | Precondition | Scope |
|---|---|---|
| `:init` | no `.reviewer/` yet | full survey, full catalog, generate everything |
| `:sync` | `.reviewer/` exists | re-survey, diff against what exists, propose patches |
| `:add-agent` | `.reviewer/` exists | add one or more reviewers, touch nothing else except wiring and the coordinator |

## The standard to hold

A brief is useful because it is **specific** ("`src/orders/totals.ts` is the only place rounding may
happen") and only tolerable if it is **true**. A brief that sends a reviewer to a file that does not exist
is worse than a vague one — it is just as unhelpful and shows nobody checked. Hence step 6: every path,
symbol and convention a brief mentions is confirmed before the file is written.

## Inputs

- the repository, read-only during the survey;
- `.claude/toolkit.json`, `.claude/CLAUDE.md`, `.claude/CONSTITUTION.md`, `.claude/rules/**` when
  present;
- the existing `.reviewer/` for `:sync` and `:add-agent`;
- `$ARGUMENTS` — optional focus (`security`, `backend`, `frontend`, `minimal`) or, for `:add-agent`, a
  catalog name or a free-text concern.

## Procedure

### Step 1 — Classify the project

Decide whether this is a **new build** or an **established codebase**, because the two need opposite
reviewers. Announce the decision with its signals.

- *New build:* little history, starter-kit layout, recently synced `.claude/rules/`, few real modules. The
  survey leans on rules, docs and the intended stack; reviewers enforce the standards being adopted.
- *Established codebase:* real history, home-grown conventions, often a `CONSTITUTION.md`. The survey leans
  on the code as it is; reviewers enforce the conventions the team actually keeps.

The rule for established codebases: **a gap against an external standard is migration backlog, not a
review comment.** Reviewers that nag about a team's settled style get muted, and their real findings go
with them. Every brief generated for an established codebase states this boundary.

Mixed signals (a starter kit with some real code): show both readings and ask.

### Step 2 — Survey

Follow `risk-map.md` — six probes, read-only, each line backed by evidence. Do not shortcut it; everything
after depends on it. Keep the evidence next to each line for step 6.

### Step 3 — Score the catalog

Go through `agent-catalog.md` and give every entry a verdict — **take**, **maybe** or **skip** — justified in
one line by survey evidence. Then look for **discovered** reviewers (catalog section *Finding discovered reviewers*);
each must name a defect no selected reviewer would catch.

Print the proposal before asking anything:

```
Project: established codebase — 3 years of history, CONSTITUTION.md present

TAKE         origin       because
  coordinator  fitted       routes into src/orders, src/payouts
  correctness  fitted       src/orders/totals.ts: 37 changes / 11 repair commits
  contracts    fitted       public REST API + separately deployed worker
  claims       stock        useful everywhere
  authz        fitted       routes resolve account_id from the URL
  money        discovered   amounts are integer cents in 40 files; 2 use floats (refunds.ts:52)
MAYBE
  migrations   fitted       migrations/ exists, 4 changes in a year
  performance  fitted       ORM present, no recorded N+1 incident
SKIP
  every frontend reviewer — the repo has no UI
```

### Step 4 — Let the user decide

Nothing is generated from an unreviewed set. Ask with `AskUserQuestion`, **in English regardless of the
conversation language** — the answers shape committed files the whole team reads. Put the evidence in each
option's `description`, so the user is deciding rather than guessing. Never offer more than four options per
question; always include an explicit opt-out in multi-selects; skip groups the stack does not have.

**Q1 — Whose rules (established codebase only, ask first).**
Options: *Project conventions only* (recommended) · *Project conventions; shared-standard gaps as
informational* · *Enforce shared standards* (only if the team has agreed to migrate).

**Q2 — The set.**
Options: *Use the TAKE list* (recommended) · *Use it and review the MAYBE list* · *Remove some first* ·
*Show all 28 with scores*.

**Q3 — Extras (only if asked for; multi-select, one question per group, at most four per call).**
Groups: data (`migrations`, `data-integrity`, `background-jobs`) · security (`authz`,
`secrets-and-config`) · around the change (`rules-conformance`, `tests`, `regression-scope`) · runtime
(`performance`, `observability`) · frontend (`accessibility`, `ui-state`, `i18n`) · frontend build
(`design-fidelity`, `bundle-size`) · hygiene (`dependencies`, `docs-drift`, `dead-code`) · discovered (the
survey's own proposals). Each question ends with *None*. Example description: *"migrations/ exists but moved
4 times in a year — contracts may be enough."*

**Q4 — Budget (one call, three questions).**
- *Size:* 6–8 reviewers (recommended) · 9–12 (wider, roughly half again the tokens, more overlap to police)
  · baseline only (coordinator, correctness, contracts, claims, judge).
- *Models:* Opus throughout (recommended where findings involve arithmetic) · Opus for coordinator and
  judge, Sonnet for reviewers · Sonnet throughout (cheapest; expect the judge to discard more).
- *Trigger:* review every MR (recommended wherever output leaves the system) · skip under 10 lines · skip
  under 50 lines · custom floor and ceiling.

Whatever is chosen for the trigger, write the reason as a comment beside it in `pipeline.yml`.

**Record refusals.** Every reviewer the user turned down goes into `.reviewer/README.md` under a
`## Declined` heading as `- <name> — <reason> (<date>)`. `:sync` and `:add-agent` read that list; asking
twice teaches people to stop reading proposals.

### Step 5 — Write briefs and wiring

Follow `agent-authoring.md`. One file per reviewer under `.reviewer/agents/`. How much is generated depends
on origin:

| Origin | Approach |
|---|---|
| stock | Start from the catalog definition; substitute only the facts it needs (commands, folders) and the "hands off" cross-references for the chosen set. |
| fitted | Derive it from the survey: each "where to look first" bullet pairs a verified path with why it matters. No survey hit for the concern → keep the brief general and state that no hotspot turned up. |
| discovered | Build from the evidence that produced it and record that evidence in the file so a later reader can re-check it. Name it for what it protects. |

Reviewer briefs are independent: generate them in parallel (one Agent each) from the shared survey. Write
`coordinator.md` **last**, since it summarises the others' territory.

Then write `pipeline.yml` per `pipeline-schema.md`: entry → coordinator (router) → reviewers → judge
(filter) → report (sink), acyclic, every step linked.

### Step 6 — Gate (blocking)

Fix and re-run until all pass. Never present a pipeline that fails one.

- [ ] Every path cited in any brief exists (glob each one).
- [ ] Every convention cited can be shown in code.
- [ ] Every `brief:` in `pipeline.yml` resolves to a file.
- [ ] Every step is reachable from `entry`; every reviewer links to the judge; no cycles; no unlinked steps.
- [ ] `name` is unique across briefs; exactly one brief has `role: router`.
- [ ] Every reviewer brief has a **Hands off** section.
- [ ] No secrets, tokens, internal hostnames or client names anywhere in `.reviewer/`.
- [ ] Established codebase: no brief treats a project convention as a defect.

### Step 7 — Hand over

Show the file tree, one line per brief, and the graph. Write `.reviewer/README.md` with: generation date,
base commit, survey highlights, the `## Declined` list, and how to adjust things (`:review`, hand edits,
`:sync`, `:add-agent`).

Point out that `.reviewer/` belongs **in the repo it reviews**, loaded from the MR's source branch, so a
review change ships in the same MR as the code change that motivated it. A central, shared pipeline could
not name any project's paths.

## Variants

**`:sync`.** Start with a path check on the existing briefs (cheap; often the whole answer). Re-run the
survey, then sort differences into *stale* (cited thing no longer true), *uncovered* (new risk, no reviewer)
and *unearned* (reviewer whose risk is gone). Propose each change with evidence and wait for approval.
Briefs are expected to be hand-edited: propose the smallest patch, show conflicts side by side, never
regenerate a brief wholesale. A previously declined reviewer comes back only with fresh evidence, explained.
`--dry-run` stops after the report.

**`:add-agent`.** Read `.reviewer/README.md` and pipeline comments first. The newcomer must name a defect
the current set misses; if an existing brief already owns the concern, suggest sharpening it instead.
Survey only the concern at hand. Add the step and its two links, update neighbouring "hands off" sections
and the coordinator, run the gate.

## Output

```
.reviewer/
├── pipeline.yml        graph and trigger
├── agents/
│   ├── coordinator.md  routing note only, no findings
│   └── <reviewer>.md   one per chosen concern
└── README.md           provenance, declined reviewers, how to adjust
```

Writes go only to `.reviewer/`. No commits, pushes or merge requests.

## Guardrails

- Nothing is written before the user approves a set.
- No invented paths, symbols, thresholds or conventions. If unsure, write the general version.
- Hand-edited briefs are patched, never silently replaced.
- Everything in `.reviewer/` is committed and team-visible.
- `pipeline.yml` uses the keys in `pipeline-schema.md`; anything a hosted runner needs beyond them is
  mapped separately and marked unconfirmed.
- Do not generate declined reviewers, or reviewers the survey gives no evidence for.

## References

- `risk-map.md` — the survey (step 2)
- `agent-catalog.md` — the 28 candidates and how to find discovered ones (step 3)
- `agent-authoring.md` — brief structure and header (step 5)
- `pipeline-schema.md` — `pipeline.yml` keys and topology (step 5)
