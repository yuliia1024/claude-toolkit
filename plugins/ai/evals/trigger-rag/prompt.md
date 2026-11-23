---
name: trigger-rag
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
We have ~40k internal PDF manuals and want a support bot that answers questions from them with citations. How should I chunk, index and retrieve them?
