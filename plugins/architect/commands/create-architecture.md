---
description: 'Design a feature''s backend architecture from a spec: a folder of small role-tagged blocks, specs centralised in api-contract/ and data-model/, grounded in the existing code.'
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, WebFetch, Write
argument-hint: '<spec: file | text> [extra context]'
---

# /create-architecture

Load `${CLAUDE_PLUGIN_ROOT}/skills/create-architecture/SKILL.md` and follow it for `$ARGUMENTS`.

You should end up with:

| Output | Notes |
|---|---|
| `{docs-root}/{feature-slug}/README.md` | overview, scope, assumptions, Block Index with a Role per block, Dependency Map (required — `create-tasks` derives waves from it) |
| numbered block files | entity index, endpoint index, business logic, validation codes, non-functional, realtime (only if needed), change log |
| `{docs-root}/api-contract/{feature-slug}.md` | endpoint specs (written here and nowhere else) |
| `{docs-root}/data-model/{feature-slug}.md` | entity schemas (single home); the overview carries the global ERD |
| `_impact.md` | overlapping features, links both ways, proposed edits (applied only after approval) |

How it gets there: project rules and code survey first; one agent per file in parallel, with the main
thread assembling the README and shared overview rows; `scripts/validate-architecture.mjs` must report
no errors before you present the result.

Docs root, shared-contract package and requirements location come from `.claude/toolkit.json` /
`CLAUDE.md`. A requirements source is optional; when given it is only read.

Next: `/architect:create-tasks {docs-root}/{feature-slug}/`.
