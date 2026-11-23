---
name: trigger-agent-architecture
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
I want a support assistant that can look up orders, issue refunds under $50 on its own, and hand anything bigger to a human. How should I structure the agent loop, tools and handoff?
