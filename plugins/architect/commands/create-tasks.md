---
description: 'Slice an architecture folder into wave-ordered backend task briefs: contracts first and alone, cohesive slices after, each brief linking the docs instead of copying them.'
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Write
argument-hint: '<architecture-folder | text> [extra context]'
---

# /create-tasks

Load `${CLAUDE_PLUGIN_ROOT}/skills/create-tasks/SKILL.md` and follow it for `$ARGUMENTS` — preferably the
folder `/architect:create-architecture` produced.

Expect in `{docs-root}/{feature-slug}/tasks/`:

- `01-contracts-and-validations.md` — always present, alone in wave 1, a dependency of every other task.
- One brief per cohesive slice, about 100 lines, linking `api-contract`, `data-model` and block anchors
  (blocks resolved through the Role column, never by number).
- `README.md` with the Tasks table, Parallel Waves and Dependency Graph — written by the main thread from
  the per-brief agents' manifests; `/architect:implement` schedules from it.

`scripts/validate-architecture.mjs` must pass (wave order, index ↔ files, Scope values, anchors) before
the plan is shown. Docs root and shared-contract package come from `.claude/toolkit.json` /
`CLAUDE.md`.

Next: `/architect:implement next`.
