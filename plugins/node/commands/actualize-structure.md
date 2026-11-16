---
argument-hint: '[path | module] [--all] [--report-only]'
description: 'Align backend files with the project naming and layout rules (suffixes, constant files, permitted comments, one concern per file) using only moves, renames and import updates. --report-only lists findings without changing anything.'
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Skill, Write
---

# /node:actualize-structure

`$ARGUMENTS` selects the scope:

| Input | Covers |
| --- | --- |
| nothing | changed files in the working tree and on the branch, within the backend paths — recommended |
| path or module | that subtree |
| `--all` | every backend path in `.claude/toolkit.json`; work is split per module |
| `--report-only` | stop after the findings report |

The procedure — detectors, exception handling, pass order and report template — is in
`${CLAUDE_PLUGIN_ROOT}/skills/actualize-backend-structure/SKILL.md`. Load it and follow it; this
command exists to give it a short name and to make two checkpoints mandatory:

1. **Findings before changes.** Present findings grouped by pass, each citing its rule, and list
   what was skipped on purpose. `--report-only` ends here.
2. **Green after every pass.** One commit per pass, cheapest first, each followed by typecheck, lint
   and tests (plus the e2e suite if pushes depend on it). A failing pass is repaired or reverted before
   the next.

What this command will not do:

- change behaviour, routes, guards, transactions or the contracts package (contract changes ship
  separately, first);
- move business logic out of controllers — that is listed as a decision for a refactor;
- edit spec files beyond their import paths;
- introduce a suffix the naming rule does not list, unless that rule gains the row in the same commit;
- commit to the default branch or push.
