---
argument-hint: '<feature-name> | "short description of the feature"'
description: 'Write the requirements document for a backend feature at docs/specs/<name>/spec.md — the input for the explore, design, execute and review steps.'
allowed-tools: AskUserQuestion, Bash, Glob, Grep, Read, Write
---

# /node:define-requirements

Opens the five-step backend feature flow; every later step (exploration, planning, execution,
review) reads the spec written here.

Feature: `$ARGUMENTS`. If empty, ask which feature to specify.

## 0. Rules

Read every file under `.claude/toolkit-rules/backend-node/` and `.claude/toolkit-rules/backend/`
(plus project rules in `.claude/rules/` if present). Endpoint naming, error format and pagination in
the spec must already follow them.

## 1. Interview

Ask, in one round, and accept "skip" for any item:

- What problem does this solve, and for whom?
- Which existing documents, tickets or designs describe it? (links are enough)
- Known constraints: deadlines, integrations, data volumes, compliance.
- What is explicitly not part of this feature?

**Verbatim content.** If the source material contains exact message text — emails, notifications,
dialogs, with subject/body and placeholders — copy it into the spec exactly as given. Do not polish
it; edits at this stage silently drop fields. If the feature clearly sends messages but no text was
supplied, ask for it rather than writing your own.

## 2. Write `docs/specs/<feature-name>/spec.md`

Use a kebab-case folder name. Structure:

```markdown
---
feature: <feature-name>
created: <YYYY-MM-DD>
status: DRAFT
---

# <Feature title>

## Context
Why this exists, who uses it, links to sources.

## Stories
### S1 — <title>
<role> needs <capability> because <benefit>.
Acceptance:
- Given …, when …, then …

## Requirements
| ID | Requirement | Priority (must/should/could) |
| --- | --- | --- |
| R1 | … | must |

## Endpoints
| Method | Path | Success | Purpose |
| --- | --- | --- | --- |
List endpoints also state: pagination style, sort keys, filters, response envelope.

## Failure cases
| Situation | HTTP status | Error code (from the project's error catalogue) |
| --- | --- | --- |

## Audit trail
Which write operations are recorded and with which fields (if the project audits writes).

## Quality attributes
Performance targets, authorization model, data retention.

## Not included

## Open questions
```

Example of a filled requirement row, for a warehouse feature: `| R3 | A picker can mark a pick list
as short when stock is missing; the list moves to SHORT and the supervisor is notified | must |`.

## 3. Review

Give the user the file path and ask them to check stories, acceptance criteria and scope. Do not
continue until they approve; then set `status: APPROVED`.

Next: `/node:explore-codebase <feature-name>`.
