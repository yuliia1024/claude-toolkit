---
argument-hint: '<feature-name>'
description: 'Map the existing backend code a feature will touch — conventions, neighbouring modules, constraints — into docs/specs/<name>/analysis.md. Describes what exists; proposes nothing.'
allowed-tools: Bash, Glob, Grep, Read
---

# /node:explore-codebase

Step 2 of 5 in the backend feature flow: it reads the approved spec and feeds `design-tasks`.

Feature: `$ARGUMENTS` (ask if empty).

This step is descriptive. Record how the codebase works today; leave solutions to `design-tasks`.

## 0. Rules

Read `.claude/toolkit-rules/backend-node/` and `.claude/toolkit-rules/backend/` (and project rules
under `.claude/rules/`).

## 1. Start from the spec

Open `docs/specs/<feature-name>/spec.md`. If it is missing, stop and suggest
`/node:define-requirements <feature-name>`. Note the nouns (entities) and verbs (operations) it uses —
they are your search terms.

## 2. Tools

If a symbol-aware MCP such as Serena is connected, prefer `get_symbols_overview`, `find_symbol` and
`find_referencing_symbols` to plain text search; fall back to Grep/Glob otherwise.

## 3. Questions to answer

**Shape of the backend**
- Which layers exist and where (controllers, services, repositories, providers, mappers)?
- What does the folder layout of a typical module look like? Quote real paths.

**Closest precedents**
- Pick two or three existing features most similar to this one. For each: module path, controller,
  service, repository, DTOs, tests. These become the reference implementations.

**What this feature touches**
- Entities and tables involved, services that will grow, events or jobs that react to changes.

**Errors**
- Where error codes are defined, how the error response is built, whether a new group of codes is
  needed.

**API style**
- Pagination, sorting and filtering mechanics; API doc decorators; response wrappers.

**Audit and logging**
- How comparable write endpoints record what happened; existing action enums or field lists.

**Tests**
- Where unit and e2e tests for the precedents live; helpers and seed utilities they use.

## 4. Write `docs/specs/<feature-name>/analysis.md`

```markdown
# Analysis — <feature-name>

## Layer map
| Layer | Location | Notes |

## Reference implementations
- <feature>: <paths> — why it is a good model

## Files to know
| Read to understand | Likely to change |

## Constraints
- technical limits, invariants, shared code that must stay compatible

## Questions for design
```

## 5. Hand-off

Summarise: files examined, precedents chosen, constraints recorded. Next:
`/node:design-tasks <feature-name>`.
