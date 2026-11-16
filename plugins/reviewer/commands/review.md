---
description: "Run the committed `.reviewer/` pipeline on a local diff — coordinator, reviewers in parallel, judge — and print what a CI runner would post. Read-only; never posts. Without a pipeline, use a stack's review-changes for a generic pass."
allowed-tools: Read, Bash, Glob, Grep, Agent
argument-hint: "[range e.g. HEAD~1 | main...HEAD] [only <ids>] [raw] [trace]"
---

# /reviewer:review

Local dry run of this project's own review pipeline. Use it to trial a new or edited pipeline, or to get the
project's reviewers on your branch before pushing.

Load the run skill — `SKILL.md` inside `${CLAUDE_PLUGIN_ROOT}/skills/reviewer-run` — and follow it.

Arguments: a commit range (if absent, uncommitted plus branch changes since forking from the default
branch); `only <ids>` to run a subset while tuning a brief; `raw` to skip the judge and see unfiltered output; `trace` to show which brief
ran on which paths.

Behaviour in short:

1. Validate the graph; any broken `brief:` path, cycle, unlinked step or reviewer bypassing the judge stops
   the run and names the step.
2. Respect `trigger` bounds; require the project's own gate (lint/typecheck/tests) to be green first.
3. Coordinator alone → reviewers concurrently and isolated → judge, with a logged reason for every removal.
4. Print findings and a run summary; a failed step is reported as failed, never as "no findings".

Never edits code or `.reviewer/`, never posts comments. Requires `.reviewer/` — otherwise run
`/reviewer:init`.
