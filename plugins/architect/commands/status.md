---
description: 'Read-only progress check: per feature, which pipeline stage it reached (from the progress folder) and the command that continues it.'
allowed-tools: Bash, Glob, Grep, Read
argument-hint: '[feature-slug]'
---

# /status

Load `${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md` and follow it. With a feature slug in `$ARGUMENTS`,
show that feature in detail; without one, list every feature still in flight.

The answer is always three things: what is done, where it lives, what to run next.

That skill also defines the tracking files every pipeline command maintains under `{progress-root}`
(default `docs/progress/`, next to the architecture docs):

| File | Nature | Contents |
|---|---|---|
| `{feature-slug}/progress.md` | current state, fully rewritten each time (before and after long work) | plain-language state and four-step table, what's needed from the reader; folded technical part with the resume command, branches, worktrees, commits/PRs, gate results |
| `{feature-slug}/worklog.md` | append-only history | a dated entry for each milestone: a summary a stakeholder can read, links to docs, and a folded table of branch, worktree fate, commit/PR, code paths and gate results |
| `README.md` | index | one row per feature |

Behaviour: read-only — it may only *offer* (and do on an explicit yes) creating a missing `progress.md`
from derived state or rebuilding the index. A feature with no progress file still appears, reconstructed from
evidence (task markers, `_pr/` bodies, branches, worktrees) and labelled `(derived)`. Resume paths,
branches and worktrees are checked to still exist, and the recommendation is corrected if not.

Next: whatever the resume line says — usually `/architect:implement {tasks-folder}`.
