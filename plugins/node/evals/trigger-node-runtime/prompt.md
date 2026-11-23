---
name: trigger-node-runtime
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
Our Node.js service's event loop lag spikes to 2s when we parse large CSV uploads, and graceful shutdown drops in-flight requests. How do we fix this?
