---
description: 'Fix one bug caused by a wrong or incomplete architecture spec — backend first, then the docs — with a local review file and two approval gates.'
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Write
argument-hint: '<bug text | bug file> [architecture doc path] [extra context, e.g. "backend fixed in <commit>"]'
---

# /fix-arch-bug

Load `${CLAUDE_PLUGIN_ROOT}/skills/fix-arch-bug/SKILL.md` and follow it, passing `$ARGUMENTS`: the bug
(quoted text or a file), an optional architecture doc path, optional context. If the context names a
commit that already fixes the backend, the code stage is skipped and doc work is scoped to that commit.

Guarantees:

- **Gate A** — backend changes (contracts first, minimal, no refactoring) stay uncommitted until you
  approve the `git diff`.
- **Gate B** — proposed doc edits are written to `<docs-root>/sync/…-arch-fix-<date>.md` and applied only
  after you approve them.
- **Single defect** — unrelated drift is listed, never silently fixed; contract consumers are listed as
  follow-ups, client code is never edited.

Paths and check commands come from `.claude/toolkit.json`, `.claude/CLAUDE.md` and
`.claude/rules/`. Missing required input is asked for.

Not for requirement changes without a defect — use `/architect:sync-architecture`.

Optional: before declaring it done, have `/core:cove` verify "docs and contract match" (`cove-isolated` when the contract change is risky).
