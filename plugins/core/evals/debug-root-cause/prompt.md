---
name: debug-root-cause
tags: [quality]
runs: 1
max_turns: 20
timeout_seconds: 420
allowed_tools: [Skill, Read, Glob, Grep, Bash, Edit, Write]
---
Support ticket SUP-881: a guest booked 9–11 March and was charged for one night instead of two. Someone added a test for it and `npm test` is now red. Every other stay we've checked looks fine. Debug this and fix it properly.
