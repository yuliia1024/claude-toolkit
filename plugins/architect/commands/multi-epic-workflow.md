---
description: 'Hand 2+ independent backend features to the shipped Workflow script — survey, doc repair, wave-by-wave builds in isolated worktrees, a sceptical bridge-contract review, then overlaps and a landing order. Hands-on alternative: /architect:multi-epic.'
argument-hint: "<feature slugs or folders, space/comma separated> [--base <branch>]"
---

# Multi-epic, unattended

`/architect:multi-epic` prepares worktrees and leaves implementation to people in separate terminals.
This command instead lets the Workflow tool run everything: agents survey, repair, build and review
each feature on their own.

## Invocation

Parse feature slugs or folders and an optional `--base <branch>` from `$ARGUMENTS`, then:

```
Workflow({
  scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/multi-epic.mjs",
  args: { epics: ["order-delivery", "billing"], baseBranch: "main" }
})
```

A bare array, or `{ features: [...] }`, works too. Requires Claude Code dynamic workflows (research
preview, enabled in `/config`).

## Stages

| Stage | Who | Result |
|---|---|---|
| Survey | one read-only agent per feature | buildable or not, track (`backend` / `manual` / `unclear`), gaps, waves with what each delivers, predicted footprint |
| Repair | one agent per non-buildable feature | missing architecture / task docs written — documentation only |
| Build | one worktree-isolated agent per wave | waves run in order inside a feature, features run concurrently; each wave commits to its own branch |
| Challenge | one sceptical reviewer per feature | `handoff.v1` event, bridge validator if present, decision `ship` / `hold` / `escalate` |
| Landing | one synthesis agent | paths touched by several features, duplicate new files ("twins"), landing order narrowest → widest |

Features with frontend or infra/ops work are marked `manual` in Survey, skipped afterwards, and returned
for a person to handle.

### Branches

The script names every branch before building, using the git-workflow convention
`<type>/<short-kebab-summary>`: the type comes from the wave's kind (`feat`, `fix`, `test`, …), the summary
from what the wave delivers — never a number or ticket key. The first wave of a feature becomes
`feat/{feature}-contracts`; later waves read like `feat/courier-eta-endpoint` or `test/order-delivery-e2e`.
Names are unique across all features (a numeric suffix on clashes), and an agent that finds the name
already taken in the repo picks the next suffix and reports it. Each wave forks from the previous wave's
branch, so a feature's last branch contains all of it.

### What every Build agent is told

The predicted footprints and owned shared paths from Survey, the list of sibling branches (readable
locally — worktrees share one object store), to `git grep` siblings before creating anything reusable,
to consume or leave a TODO instead of duplicating, and to only append on paths another feature owns.

### Review is fail-closed

The reviewer may read and run checks but never edit, merge or push. If
`tooling/agent-loop-bridge/validate.py` exists and rejects the handoff, the decision cannot be `ship`.

## Output to relay

Pass the returned summary to the user as is: survey table, `manual` features, which features were
repaired, branches per feature, each decision (call out every `hold` and `escalate` with its must-fix
items), overlaps, twins and the landing order.

## Without dynamic workflows

Fall back to `/architect:multi-epic`: same survey, overlap and ordering logic, but worktrees are created
after confirmation and each terminal's runbook is executed by a person.
