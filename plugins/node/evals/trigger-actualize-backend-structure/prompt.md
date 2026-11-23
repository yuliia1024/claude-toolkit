---
name: trigger-actualize-backend-structure
tags: [trigger]
runs: 1
max_turns: 6
allowed_tools: [Skill, Read, Glob, Grep]
---
Our NestJS backend files are a mess: wrong suffixes, constants scattered in services, commented-out code. Bring the file structure back in line with our conventions.
