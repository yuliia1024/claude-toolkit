---
argument-hint: '[--worktrees] [--branches] [--artifacts] [--all] [--dry-run]'
description: 'Reclaim disk from parallel runs: stale worktrees, merged local branches, regenerable build/test output. Inventory with sizes first; removes only approved items.'
allowed-tools: AskUserQuestion, Bash, Glob, Read, Skill
---

# /core:cleanup

Scope: `$ARGUMENTS`. With no switches the command only reports.

| Switch | Scope |
| --- | --- |
| `--worktrees` | worktrees left by parallel runs, then `git worktree prune` |
| `--branches` | merged local branches (default branch and current branch excluded) |
| `--artifacts` | git-ignored, regenerable output: coverage, reports, traces, caches, builds |
| `--all` | all three |
| `--dry-run` | inventory only, whatever else is passed |

Why it exists: each parallel task gets a whole worktree plus its own dependency install. Interrupted
runs leave them behind, and they accumulate silently.

Load `${CLAUDE_PLUGIN_ROOT}/skills/cleanup/SKILL.md` and follow its phases.

Hard limits:

- inventory before deletion, always — size, branch, dirty files, local-only commits;
- a dirty worktree or one with unpushed commits is removed only after the user sees what will be
  lost and explicitly agrees (`--force` is irreversible);
- unmerged branches and the current branch are never deleted;
- do not run while a parallel flow is active;
- never touch tracked files, `.env*`, or paths outside the repo and its worktrees.

See also the `shared/worktree-hygiene.md` rule.
