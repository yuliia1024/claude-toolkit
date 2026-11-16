---
argument-hint: 'symptom, error message or reproduction steps'
description: 'Fix a backend bug at its cause: reproduce, locate, prove the cause, make the smallest change, and add a test that fails without the fix.'
allowed-tools: Bash, Edit, Glob, Grep, Read, Write
---

# /node:bugfix

Report: $ARGUMENTS

Read the backend rules first: `.claude/toolkit-rules/backend-node/`, `.claude/toolkit-rules/backend/`
and any project rules in `.claude/rules/`.

## Reproduce

Write down expected vs. actual behaviour and the steps that trigger it. If the report is vague, ask:
which environment, how often, what changed recently, any logs or request ids. Aim for a failing test
or a scripted request that shows the bug.

## Locate

Follow the request path from the entry point (controller, consumer, job) inward. A symbol-aware MCP
helps here if available. Check which tests cover this path and why they did not catch it.

## Prove the cause

List candidate causes, then confirm or eliminate each one with evidence (a log line, a debugger
value, a targeted test). Stop when one cause fully explains the symptom; a plausible story is not
proof.

## Fix

- Make the smallest change that removes the cause. No unrelated refactoring in the same diff.
- Consider other callers of the code you change.
- Add a regression test that fails on the old code and passes on the new.

## Verify

Run the project's typecheck, lint and tests (see `CLAUDE.md`). Confirm the original reproduction now
behaves correctly. Summarise: cause, change, test added, check results.

If the fix gets its own branch, name it per `rules/shared/git-workflow.md`, e.g.
`fix/duplicate-refund-on-retry` — describing the change, with no ticket numbers.
