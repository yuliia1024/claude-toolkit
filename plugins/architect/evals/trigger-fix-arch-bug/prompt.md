---
name: trigger-fix-arch-bug
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
QA found that invoices filtered by due date return wrong results, and the root cause is that our architecture spec defined the filter incorrectly. Fix the backend and the spec together.
