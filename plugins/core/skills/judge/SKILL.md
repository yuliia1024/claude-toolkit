---
name: judge
description: 'Review a change with four independent reviewers running in parallel (correctness, security, spec fit, design/simplicity) and fold their reports into one verdict: PASS, CHANGES_REQUESTED or NEEDS_HUMAN. Read-only; never edits, commits or merges.'
---

# Judge — four-reviewer panel

One reviewer catches one kind of mistake. This skill gives the same diff to four reviewers with
non-overlapping briefs, runs them at once, and merges what they report. It is the engine behind
`/core:judge` and can act as the reviewing side of an agent-to-agent handoff.

The panel only reads and reports. Fixes belong to whoever produced the change.

## Inputs

**The change.** Resolve `$ARGUMENTS` into a concrete diff:

| Argument | How to get the diff |
| --- | --- |
| nothing / "working tree" | `git diff` plus `git diff --staged` |
| branch name | `git diff <default-branch>...<branch>` |
| folder | changed files under it, against the default branch |
| PR/MR reference | fetch via the connected platform CLI or MCP (read-only) |

Read the full touched files, not only the hunks. If the target is ambiguous, ask with
AskUserQuestion.

**The yardsticks.** Look their locations up in `.claude/toolkit.json` and `CLAUDE.md`; do not
assume paths:

- requirements for the feature (numbered requirements, acceptance criteria) and any API contract or
  data model it must honour;
- the project's security rules and threat notes, if any;
- the project constitution (`CONSTITUTION.md`), the simplicity rule in `.claude/rules/shared/`, and
  the rules for the area being changed.

## Reviewer briefs

Launch all four with the Agent tool in a single message. Each gets the diff, the touched files and
only the yardsticks relevant to its brief. Tell each reviewer to assume defects exist, to search
until it has looked properly, and to cite `file:line` for every point.

**Correctness** — Does it work for every input it can receive? Empty and oversized input, nulls,
boundaries, ordering and concurrency, retries, partial failure, error paths that swallow or mislabel
errors, state that can end up inconsistent.

**Security** — Who can call this and with what? Missing or wrong authorization, injection of any
kind, untrusted input reaching queries, shells, templates or outbound URLs, secrets in code or logs,
unsafe parsing, sensitive data in responses. Map anything found to the relevant OWASP Top 10 entry.

**Spec fit** — For each requirement and acceptance criterion: implemented, partly implemented, or
missing? Does the request/response shape match the contract? Are documented states, transitions and
error cases all handled? Every point names the requirement it concerns.

**Design and simplicity** — Does the change respect module boundaries and ownership? Does it follow
existing patterns and the constitution? Flag speculative abstraction, new dependencies without need,
hidden side effects, tight coupling and unreachable code.

Each reviewer returns:

```
brief: correctness | security | spec | design
call: PASS | BLOCK | ESCALATE
points:
  - level: blocker | major | minor
    at: path/to/file.ts:42
    problem: <what is wrong>
    impact: <why it matters>
    remedy: <suggested change>
```

An empty `points` list is acceptable only if the reviewer says what it checked.

## Merging

1. Remove duplicates across briefs. Keep the clearest wording and note which briefs raised it —
   independent agreement raises confidence.
2. Overall verdict:
   - any `BLOCK` → **CHANGES_REQUESTED**
   - else any `ESCALATE` → **NEEDS_HUMAN**
   - else → **PASS**
3. Sort remaining points blocker → major → minor.
4. Optional: run contested or high-impact points through `/core:cove` and drop those that fail.

## Output

A short human summary, then a machine-readable block compatible with `review_result.v1`:

```
verdict: PASS | CHANGES_REQUESTED | NEEDS_HUMAN
lenses:
  - lens: correctness | security | spec | design
    verdict: PASS | BLOCK | ESCALATE
    findings:
      - { severity, file, line, what, why, fix }
summary: <single sentence: the required changes, or "ready to merge">
```

Close with the single most important fix.

## Limits

- No edits, commits, merges or PR comments.
- Every point is anchored to a location; general impressions are not findings.
- Yardsticks come from project config, never from guesses.
- NEEDS_HUMAN hands the decision to a person.
