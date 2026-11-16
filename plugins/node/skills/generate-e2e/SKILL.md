---
name: generate-e2e
description: 'Write API-level end-to-end or integration tests for a backend controller or route, modelled on the project''s newest existing e2e specs and on what the code actually does. Use when asked for e2e, integration or API tests of a controller, endpoint or route.'
argument-hint: '<controller | route path> [notes]'
user-invocable: true
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Write
---

# E2E tests for a backend endpoint

Input: `$ARGUMENTS` — a controller name or a route path. Empty or `all`: list the controllers and ask
which one to cover.

## A. Learn the house style

This matters more than anything else in the skill.

1. Read the backend rules (`.claude/toolkit-rules/backend-node/`, `.claude/toolkit-rules/backend/`,
   `.claude/rules/`) for test conventions, the error response format and the role model.
2. Find the most recently maintained e2e specs. Read them together with every helper they import,
   the e2e test config and its global setup file.
3. Write down how they: start the application, reset or isolate the database, replace external
   services, obtain auth tokens, and name tests. Your specs reuse exactly that. Do not build a new
   harness and do not copy patterns from outdated specs.

## B. Understand the target

Locate the controller (by name, or by searching for the route). Read it, the contracts it exposes,
the services it calls, the entities involved, and the guards and roles that protect it.

## C. Plan the cases

For each endpoint, list method, path, required auth, success status and error statuses. Then plan:

| Group | What to assert |
| --- | --- |
| Success | status, body shape, persisted side effects |
| Validation | each invalid field yields the project's error format with the right code |
| Access | unauthenticated → 401; each role without permission → 403 |
| Missing / conflicting | not found, duplicate, invalid state transition |
| Lists | pagination, sorting and filters behave as documented |

Decide e2e versus integration by the project's convention and place files where similar specs live.
Identify the seed data each case needs and use the existing seed helpers.

## D. Write

Mirror the reference specs: same bootstrap, cleanup, overrides, token helpers and naming. Build
request paths from route constants when the project has them. Example names for a warehouse API:
`returns 404 when the bin does not exist`, `forbids a picker from closing a wave`.

## E. Verify

1. Lint with autofix, then run only the new specs with the project's e2e command.
2. If the project tracks endpoint coverage, confirm the new endpoints are counted. If they are not,
   the request path probably does not match the route pattern — check interpolation and constants.
3. Report: endpoints covered, cases written, and gaps left open.

## Principles

- The project's existing patterns override any generic template.
- Assert the real error envelope, not just the status code.
- Access-control and failure cases are as important as success cases.
- Reuse helpers and seeds; do not duplicate them.
