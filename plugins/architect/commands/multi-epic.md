---
description: "Coordinate 2–4 independent backend features in parallel — readiness survey, scheduled doc fixes, a worktree + branch per feature, per-terminal runbooks, overlap hotspots and a landing order."
allowed-tools: Agent, Bash, Read, Grep, Glob, Edit, Write, WebFetch
argument-hint: '<feature slugs or folders, space/comma separated | "status"> [--waves]'
---

# Multi-epic

`$ARGUMENTS`: 2–4 feature slugs or folders under the docs root (`orders payments`), or `status` to
re-inspect a running fan-out. Optional `--waves`.

Load `${CLAUDE_PLUGIN_ROOT}/skills/multi-epic/SKILL.md` and follow it. In short:

1. **Survey** every feature in parallel: architecture present, wave plan present, existing material,
   and track — backend features go to `/architect:implement`, anything with frontend or infra/ops work is
   left to a person.
2. **Analyse independence** and show it before changing anything: shared surface, hard vs soft
   dependencies, hotspots with an owner each, shared building blocks assigned to one owner, landing order.
3. **Fan out only after a yes**: seed `{progress-root}/_cross-epic/`, create one worktree per feature on a
   `<type>/<feature-slug>` branch (e.g. `feat/orders`) cut from the base branch, and print a runbook per
   terminal — install → doc fixes via create-architecture / create-tasks → implement → port override →
   sync protocol.
4. **One branch, one PR per feature by default** (implement runs with `single-branch`). `--waves` switches
   each feature to implement's per-task branches with stacked wave PRs.
5. **`status`** re-checks worktrees, drift against the base branch, pending rebases and hotspot
   collisions without modifying anything.

The coordinator stays in the main checkout and writes no product code. Docs root, install command and base
branch: see `CLAUDE.md`, `.claude/toolkit.json`, and the git-workflow rule under `.claude/rules/shared/`.
