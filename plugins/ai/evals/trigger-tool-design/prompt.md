---
name: trigger-tool-design
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
I'm defining function-calling tools for an agent that manages user accounts (lookup, update email, delete). How should the schemas, validation and authorization work?
