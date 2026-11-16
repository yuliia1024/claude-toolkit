---
description: 'Create a REST endpoint end to end: DTO, controller, service, and test.'
argument-hint: '<METHOD /path> [description]'
---

# backend:endpoint

Endpoint to build: `$ARGUMENTS`.

1. Agree the contract with the user before coding: method, path, request body, response, and error cases.
2. Build it as DTO → controller → service, following `.claude/toolkit-rules/backend/`.
3. Cover the happy path plus one or more error cases with a test.
4. Execute the tests and share the outcome.
