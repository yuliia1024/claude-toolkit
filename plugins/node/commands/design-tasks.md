---
argument-hint: '<feature-name>'
description: 'Turn spec.md and analysis.md into tasks.md — an ordered plan of thin, end-to-end slices with contract work first.'
allowed-tools: AskUserQuestion, Bash, Glob, Grep, Read, Write
---

# /node:design-tasks

Step 3 of 5 in the backend feature flow (after requirements and exploration, before execution and review).

Feature: `$ARGUMENTS`.

## 0. Rules

Read `.claude/toolkit-rules/backend-node/` and `.claude/toolkit-rules/backend/` (plus `.claude/rules/`).

## 1. Inputs

Load both documents from `docs/specs/<feature-name>/`. Without `analysis.md`, send the user
to `/node:explore-codebase <feature-name>`. Ask the user to confirm the spec is approved and the
analysis is accurate before planning.

## 2. Planning principles

- **Slices, not layers.** Each task delivers one behaviour that works from HTTP to database and is
  testable on its own. "Write all repositories" is not a task.
- **Contract first.** When client and server share an API types package, slice 1 adds the types,
  enums and route constants there. Nothing that implements an endpoint comes before it.
- **Exact message text travels intact.** Copy any verbatim email or notification text from the spec
  into the plan unchanged, and attach it to the task that owns the triggering endpoint (or give it a
  task of its own).
- **Small enough to review.** If a slice touches more than roughly a dozen files, split it.

## 3. Write `docs/specs/<feature-name>/tasks.md`

```markdown
---
feature: <feature-name>
created: <YYYY-MM-DD>
total_tasks: <n>
status: TODO
---

# Plan — <feature-name>

## Context for implementers
Key precedents from analysis.md, plus pointers to the error-handling and REST rules (link, do not
restate).

## Slice 1 — Shared contract for return requests
Status: TODO
Outcome: request/response types, status enum and route constants for returns exist and are exported.
Touches:
- [ ] contracts package
Done when:
- [ ] types exported from the package entry point
- [ ] typecheck, lint and tests pass
Depends on: —

## Slice 2 — Customer opens a return request
Status: TODO
Outcome: POST creates a request in OPEN state for an order the caller owns.
Touches:
- [ ] schema / migration
- [ ] repository
- [ ] service (rules, errors)
- [ ] controller (API docs for every status it can return)
- [ ] audit entry (if the project audits writes)
- [ ] unit + e2e tests
Done when:
- [ ] <testable criteria from the spec>
- [ ] typecheck, lint and tests pass
Depends on: Slice 1

## Overview
| Slice | Outcome | Depends on |
```

The example slices above illustrate the format only; derive the real ones from the spec.

## 4. Hand-off

Report the number of slices and the order, and point out the critical path. Next:
`/node:execute-tasks <feature-name>`.
