---
name: trigger-llm-app-patterns
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
For a feature that extracts invoice fields from uploaded PDFs, should I use a single LLM call with structured output, a fixed workflow, or an agent? Help me pick the architecture.
