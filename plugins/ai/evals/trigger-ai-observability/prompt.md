---
name: trigger-ai-observability
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
Our LLM feature in production is getting slower and pricier and we can't tell why. What should we trace and log per request, and how do we avoid logging customer PII in prompts?
