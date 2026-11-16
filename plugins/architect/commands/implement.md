---
description: 'Build a feature''s task plan: contracts first, then each wave in parallel worktrees with a branch and PR per slice, closed by a local whole-feature unit + e2e check.'
allowed-tools: Agent, Bash, Read, Grep, Glob, Edit, Write
argument-hint: '<feature-slug | tasks folder | next | all | id range> [modifiers: single-branch, stacked, sequential, no e2e, dry run, target <branch>]'
---

# Implement

`$ARGUMENTS` selects what to build from the plan `/architect:create-tasks` wrote (`next`, `all`, an id,
a range, a task folder or a feature slug) plus optional modifiers.

Load `${CLAUDE_PLUGIN_ROOT}/skills/implement/SKILL.md` and follow it. Key points:

- **Contracts slice first, alone**; nothing else starts until it is committed. Later waves run one after
  another, the slices within a wave concurrently.
- **Each slice: its own agent, worktree, branch and PR.** Branch names follow
  `.claude/rules/shared/git-workflow.md` — `<type>/<what-it-does>`, e.g. `feat/order-delivery-contracts`,
  `feat/courier-eta-endpoint`, `test/order-delivery-e2e` — computed up front, unique, and free of task
  numbers or ticket keys (same for commits and PR text).
- **Whole-feature check** on a local-only `chore/verify-{feature-slug}` branch: full typecheck, lint, unit,
  coverage thresholds and e2e. e2e that cannot run is reported as `NOT-RUN`, never as green.
- **Environment probe before building**: runtime pin, task-runner health (fall back to direct tools),
  worktree health (fall back to sequential), container availability, plan-mode guard for spawned agents.

Commands, the contracts package and git conventions come from `.claude/toolkit.json`, `CLAUDE.md`
and the git-workflow rule. Local commits per slice are expected; pushing and opening PRs wait for the
user's explicit yes and are run by the user.
