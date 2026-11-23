---
name: trigger-llm-resilience
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
Our LLM calls sometimes hit 429s and timeouts mid-stream, and users see half answers. How should we handle retries, fallbacks, streaming interruptions and a per-user budget?
