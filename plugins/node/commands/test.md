---
argument-hint: '<file | feature> (empty: ask)'
description: 'Add backend tests for a file or feature, covering expected behaviour, edge inputs and failure paths in the project''s existing test style.'
allowed-tools: Bash, Edit, Glob, Grep, Read, Write
---

# /node:test

Target: `$ARGUMENTS`. A path means that file; a feature name means the code that implements it;
nothing means ask.

Testing conventions are in the backend rules — read `.claude/toolkit-rules/backend-node/` and
`.claude/toolkit-rules/backend/` (plus `.claude/rules/`) first.

## Understand the unit

Read the code: what it promises, its inputs, collaborators and failure modes. Read the tests that
already exist next to it and note what they miss.

## Choose cases

| Group | Examples |
| --- | --- |
| Expected use | the main inputs and the results callers rely on |
| Edges | empty collections, zero and maximum values, optional fields absent, boundary dates |
| Failures | invalid input, missing records, conflicts, forbidden callers, collaborator errors |

Cover the paths that would hurt most if broken before the rest.

## Write

- Arrange / act / assert, one behaviour per test.
- Names read as sentences: `rejects a shipment when the address is incomplete`, or the project's own
  pattern if it differs.
- Place files and mock collaborators the way existing tests do; fake external services rather than
  calling them.
- Assert on observable behaviour, not private details. Tests must not depend on each other's order.

## Run

Run the relevant test commands from `CLAUDE.md` (unit, e2e or integration as appropriate) plus lint
and typecheck. Report which cases were added and anything still uncovered.
