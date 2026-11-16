---
description: 'Check whether the architecture docs still describe the code — both directions, including stale [PROPOSED] tags — and propose low-cost reconciliations. Report first; never edits code.'
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Write
argument-hint: '[feature-slug …] [--docs-to-code | --code-to-docs] [notes]'
---

# /audit-architecture

Load `${CLAUDE_PLUGIN_ROOT}/skills/audit-architecture/SKILL.md` and follow it. `$ARGUMENTS` optionally
narrows the features and the direction (both by default).

Why: the architecture is written against the code once; nothing else re-checks it. This command finds

- **phantoms** — documented endpoints/tables missing from the code, and `[PROPOSED — not in code]` tags
  left on things that shipped;
- **undocumented** code — routes, tables, enums with no architecture, which a later design run would
  otherwise duplicate or contradict;
- **divergences** where both exist but disagree, and **unknowns** it cannot decide.

It reads the documented side from `scripts/validate-architecture.mjs --inventory`, normalises paths and
names before comparing, never declares absence from a single empty search, and leaves the "which side is
wrong" call to you. Output is `{docs-root}/_audit-{date}.md`; only approved doc edits are applied,
cheapest first. Code locations come from `.claude/toolkit.json` / `CLAUDE.md` and are listed in the
report.

Next: `/architect:sync-architecture` for requirement-driven doc changes, `/architect:fix-arch-bug` when
code and spec genuinely conflict.
