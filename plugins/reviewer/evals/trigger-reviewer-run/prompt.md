---
name: trigger-reviewer-run
tags: [trigger]
runs: 1
max_turns: 6
allowed_tools: [Skill, Read, Glob, Grep]
---
Run our project's committed review pipeline in .reviewer/ against my local diff and show me the findings.
