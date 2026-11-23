---
name: trigger-backend-reliability
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
Our order webhook handler sometimes processes the same event twice and sometimes loses events when the DB is slow. How do we make it reliable — idempotency, retries, outbox?
