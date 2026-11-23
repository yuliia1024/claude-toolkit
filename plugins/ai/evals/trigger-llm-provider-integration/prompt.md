---
name: trigger-llm-provider-integration
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
We call OpenAI directly from five services. I want to be able to switch to Anthropic or a local model per feature without touching business code. How should the adapter layer look?
