---
argument-hint: '[source-branch] [target-branch]'
description: 'Pre-merge review of backend changes against the project rules — contract, errors, data access, layering, tests, comments, dependencies. Every finding is challenged before it is reported and ranked by severity. Never modifies code.'
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Skill, Write
---

# /node:review-changes

Last step of the backend feature flow, and usable on its own for any backend change.
It reviews; it does not fix. `$ARGUMENTS`: optional source and target branches.

## 1. Yardsticks

- Rules: `.claude/toolkit-rules/backend-node/`, `.claude/toolkit-rules/backend/` and project rules in
  `.claude/rules/` — read the ones relevant to the changed files. Each finding cites the rule file it
  is based on.
- Project facts: `CLAUDE.md` and `.claude/toolkit.json` (backend paths, commands).
- If present: `rules/shared/git-workflow.md` and `rules/shared/post-change-validation.md`.

## 2. What is under review

| Arguments | Diff |
| --- | --- |
| none | uncommitted work: `git status --short`, `git diff HEAD`, plus untracked files |
| `<source>` | `git diff <default>...<source>` (default = `main`, or `develop` if that is the integration branch) |
| `<source> <target>` | `git diff <target>...<source>` |

Keep only backend files (the configured backend paths and the contracts package). If the diff also
contains frontend code, say so and leave it for a frontend review.

With a symbol-aware MCP (e.g. Serena), follow changes beyond the diff: callers of a modified service
method, consumers of a renamed export.

## 3. Review checklist

**Contract** (when a contracts package exists)
- New DTOs implement the shared request/response types; new routes, enums and error codes are added
  to the package and exported.
- Adding an enum member breaks exhaustive maps (`Record<Status, …>`) elsewhere; those updates belong
  in this change.

**Errors and validation**
- All errors use the project's envelope; codes come from the enum, not literals or interpolated
  strings; field-level and body-level errors are distinguished.
- Database constraint errors are translated at the repository; every request DTO field is validated.

**Data access**
- State changes are conditional updates (`UPDATE … WHERE status = :expected`, check affected rows),
  not read-then-write.
- A write and its audit record share one transaction.
- Paginated queries order by a unique tiebreaker.
- Money and decimal values keep their precision end to end.
- Irreversible migrations say so in their `down`.

**API documentation** — every status reachable from the endpoint's call chain is documented.

**Layering** — business rules in services, authorization not duplicated, mapping logic in mappers,
no `as unknown as T`.

**Tests** — existing specs affected by the change are updated, not just supplemented; an assertion
that would pass against broken code is a finding.

**Comments** — explain non-obvious reasons; TODOs state a concrete next step and follow the project
format.

**Dependencies** — any new package is called out as a design decision, even when justified.

For large diffs, give each checklist group to its own sub-agent and merge the results.

## 4. Challenge the findings

Treat the draft list as hypotheses. Run it through `/core:cove` in list form and, for each item,
answer the question that would disprove it by reading code:

- Is this already handled elsewhere in the call chain?
- Is the flagged code reachable at all?
- Does the "missing" test exist under another name or file?
- Does the suggested fix contradict a recorded decision (ADR or decision log, if the project has one)?

Remove disproved items. Keep uncertain ones with the doubt stated.

## 5. Run the checks

Typecheck, lint and tests for the affected projects (commands from `CLAUDE.md`), plus the e2e suites
the diff reaches if the project has them. Anything you could not run is listed as NOT-RUN with the
reason — never implied to be green.

## 6. Report

Write `<reports dir>/review-<branch-or-worktree>.md` (`reports.dir` in `.claude/toolkit.json`,
default `docs/reviews/`). It is committed, so later reviews of the same branch can compare.

```markdown
# Backend review — <branch> → <target> — <date>

Decision: APPROVE | REQUEST CHANGES | BLOCK
Findings: <blocking> blocking · <important> important · <minor> minor

## Blocking
- **<title>** — `path/file.ts:120` — rule: `backend/error-handling.md`
  Problem: … Impact: … Suggested change: …

## Important
## Minor

## Checks
| Command | Result |
| --- | --- |
| typecheck | pass |
| e2e (orders) | NOT-RUN — database container unavailable |

## Not reviewed
<files or concerns outside this review>
```

Severity guide:

| Level | Typical findings |
| --- | --- |
| Blocking | security hole, missing or wrong authorization, data loss risk, breaking API change, unguarded state transition, write without its audit record (when audited), unhandled failure on a critical path, secret in the diff |
| Important | missing validation or tests, wrong error shape, endpoint without e2e coverage, pagination without tiebreaker, undocumented responses, N+1 on a read path, swallowed error, unjustified dependency, performance problem |
| Minor | style, mapper extraction, double casts, comment tidiness, small optimisations |

Always state what was not reviewed; silence reads as "covered".
