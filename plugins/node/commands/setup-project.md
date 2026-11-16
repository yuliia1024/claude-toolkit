---
description: 'Fit a starter-kit Node backend to this project: choose providers via environment settings and remove only the integrations the project will not use.'
allowed-tools: AskUserQuestion, Bash, Edit, Glob, Grep, Read, Write
---

# /node:setup-project

For backends generated from a starter kit where integrations are switched by environment variables.
The aim is a configured project, not a pruned one: prefer flipping a setting over deleting code.

## Before anything

Read every file in `.claude/toolkit-rules/backend-node/` (and `.claude/rules/backend-node/` if the
project has its own). Then inspect the starter itself — `.env.example`, the config module, optional
modules — and drop any question below that the starter does not support.

## Interview

Collect all answers first; change nothing until the summary is approved.

**Identity and access**
- Service name
- Sign-in: JWT with social login · JWT only · none

**Integrations**
- Background work: BullMQ · SQS · none
- Outgoing mail: SMTP · SES · none
- File storage: S3-compatible · none
- Error tracking: Sentry · none

**Runtime and API**
- Container setup: full compose stack · app only · none
- API docs: Swagger/OpenAPI · none
- WebSockets: yes · no
- Rate limiting: yes · no
- Deletion: soft delete · hard delete

## Confirm

Print a table of the choices and the files each will touch. Wait for an explicit go-ahead.

## Apply

1. Update `.env.example` and the configuration wiring for the selected providers.
2. For answers that switch something on or pick a provider, change configuration only.
3. Delete code only for integrations answered "none", and remove their env keys and module imports
   with them.
4. Run typecheck, lint and tests (commands from `CLAUDE.md`) and report the results.
