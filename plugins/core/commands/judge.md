---
argument-hint: "<diff | branch | folder | PR> [notes]"
description: 'Four parallel reviewers (correctness, security, spec fit, design/simplicity) examine a change and produce one verdict: PASS, CHANGES_REQUESTED or NEEDS_HUMAN. Read-only.'
allowed-tools: Agent, AskUserQuestion, Bash, Glob, Grep, Read
---

# /core:judge

Review target: `$ARGUMENTS` — working-tree diff, branch, folder or PR, plus optional notes for the
reviewers.

Load `${CLAUDE_PLUGIN_ROOT}/skills/judge/SKILL.md` and follow it.

In short:

- four reviewers, each with a narrow brief, run concurrently on the same diff:
  correctness · security · spec fit · design and simplicity;
- every finding cites a file and line;
- results merge into one verdict, emitted in `review_result.v1` shape so the panel can serve as the
  reviewer in an agent handoff;
- requirement, contract and rule locations come from `.claude/toolkit.json` / `CLAUDE.md`;
- nothing is edited, committed or merged.
