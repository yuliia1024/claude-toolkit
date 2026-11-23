---
name: trigger-backend-engineering
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
I'm building a framework-agnostic backend module for subscriptions. How should I draw the boundaries between domain logic, persistence and the HTTP layer, and handle failures?
