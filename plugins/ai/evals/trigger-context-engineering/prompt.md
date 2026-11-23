---
name: trigger-context-engineering
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
Long conversations with our assistant start forgetting early instructions and costs explode as history grows. How should we manage history, retrieved docs and tool outputs in the context window?
