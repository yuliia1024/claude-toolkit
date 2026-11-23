---
name: trigger-ai-security
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
Our chatbot reads customer emails and can call a 'send_email' tool. A pentester says it's vulnerable to prompt injection. How do we threat-model and lock this down?
