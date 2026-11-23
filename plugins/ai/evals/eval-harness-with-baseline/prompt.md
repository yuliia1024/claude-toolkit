---
name: eval-harness-with-baseline
tags: [quality]
runs: 1
max_turns: 25
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep, Bash, Edit, Write]
---
We're about to start tweaking the ticket-classification prompt in src/classifyTicket.ts and need an eval for it first, so we can tell whether a change helps or hurts. Set that up. I don't have real tickets to hand — make up realistic ones. There's no model API key in this environment.
