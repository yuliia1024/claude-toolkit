---
description: "First-time setup of review automation for this repo: survey where it is fragile, agree on reviewers with the user, and generate `.reviewer/` with briefs grounded in verified paths and house conventions."
allowed-tools: AskUserQuestion, Agent, Glob, Grep, Read, Bash, Edit, Write
argument-hint: "[security | backend | frontend | minimal]  (empty = full run)"
---

# /reviewer:init

Creates `.reviewer/` for the current repository. Load the setup skill — `SKILL.md` inside `${CLAUDE_PLUGIN_ROOT}/skills/reviewer-setup` — and carry out all
seven steps of its `:init` path.

`$ARGUMENTS` narrows the run: `security`, `backend`, `frontend`, or `minimal` (backbone + baseline only).

Non-negotiables while running it:

| Rule | Why |
|---|---|
| Survey before writing; every survey line has evidence | Briefs inherit the survey's accuracy |
| The user approves the set via `AskUserQuestion`; declines are logged in `.reviewer/README.md` | No surprise files; `:sync` won't re-ask |
| Classify new build vs established codebase first | In an established codebase, gaps against outside standards are migration work, not findings |
| Run the blocking gate — every cited path exists | A confidently wrong brief does more harm than a vague one |
| Write only to `.reviewer/`; no commit, push or MR | The user owns what gets committed |

Afterwards suggest `/reviewer:review` on a recent change to see the pipeline work.
