---
name: trigger-database-engineering
tags: [trigger]
runs: 1
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
---
Our Postgres query for the orders dashboard takes 8 seconds. How should I design indexes and possibly restructure the schema? Also, how do we migrate safely?
