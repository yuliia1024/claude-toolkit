---
argument-hint: '<feature-name>'
description: 'Implement the slices in tasks.md one after another; each must pass typecheck, lint and tests before the next begins.'
allowed-tools: Bash, Edit, Glob, Grep, Read, Write
---

# /node:execute-tasks

Step 4 of 5 in the backend feature flow: the plan from `design-tasks` becomes code; `review-changes` follows.

Feature: `$ARGUMENTS`.

## 0. Rules and plan check

Read `.claude/toolkit-rules/backend-node/` and `.claude/toolkit-rules/backend/` (plus `.claude/rules/`).
Open `docs/specs/<feature-name>/tasks.md`; if it is missing, point to `/node:design-tasks`.

Shared API types package present, but slice 1 is not about it? Stop and reorder the plan first.

## 1. Loop over slices

Take the first slice with `Status: TODO`.

**a. Start** — set it to `IN PROGRESS` and tell the user which slice you are on.

**b. Build** — follow the reference implementations named in `analysis.md` and the naming rules in
`CLAUDE.md`. Reuse existing helpers before writing new ones.

**c. Verbatim text** — when the slice carries exact message text, place it in the project's template
location as-is and substitute placeholders mechanically from the mapping. Then re-read it against the
spec: nothing reworded, added or dropped.

**d. Self-review** against the rules before running gates:

| Area | Check |
| --- | --- |
| Errors | thrown through the project's error envelope; codes come from the shared enum, never string literals |
| Validation | every request DTO field validated; multi-rule checks collect all failures; field vs. body errors placed correctly |
| Persistence | unique/constraint violations translated in the repository; parent records checked in the service |
| API docs | every status the endpoint can return is documented |
| Structure | business rules in services; long entity assembly in mappers; no `as unknown as T` |
| Audit | where writes are audited, the audit row is committed atomically with the change |

**e. Gates** — run typecheck, lint and tests for the affected project using the commands in
`CLAUDE.md` (e.g. `pnpm nx run orders:test` or `npm run test`). All must pass. Fix and rerun until
they do.

**f. Close** — set `Status: DONE`, tick the "Done when" boxes, and post a one-line progress update.

**Blocked?** Set `Status: BLOCKED`, write the reason under the slice, and ask the user how to proceed.

## 2. Database changes

Generate and run migrations with the project's scripts (see `package.json`). Applied migrations are
immutable — correct them with a follow-up migration.

## 3. Wrap-up

Report slices completed (`done / total`), files created and modified, and the final gate results.
If the work is not on a branch yet, create one following `rules/shared/git-workflow.md`, e.g.
`feat/customer-return-requests` — the name describes the change only, with no ticket or task numbers.
Then suggest `/node:review-changes <branch>`.
