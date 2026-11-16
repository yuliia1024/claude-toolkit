---
description: 'Apply a requirement change to an existing architecture: classify each difference, edit only the owning blocks and shared specs, log it, and report affected task briefs.'
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, WebFetch, Write
argument-hint: '<changed-requirement: file | text> [feature-slug] [extra context]'
---

# /sync-architecture

Load `${CLAUDE_PLUGIN_ROOT}/skills/sync-architecture/SKILL.md` and follow it for `$ARGUMENTS`. Without a
feature slug, the skill finds the feature by the requirement link in each README and confirms it with you.

Key behaviour:

1. Validator baseline first, so pre-existing errors aren't mistaken for new ones.
2. A complete diff table (added / modified / dropped / resolved / same), each row mapped to its owning
   block by role — before any file is touched.
3. Edits in a fixed order: shared specs → overview rows → index blocks → narrative blocks → README →
   change log. Numbers and anchors stay stable; human edits and assumptions are preserved.
4. One change-log row per difference, citing the requirement version.
5. Task briefs classified untouched / stale / invalid / missing; already-built scope becomes a follow-up,
   not a doc rewrite.
6. Validator again; zero new errors.

Edits to another feature's architecture wait for your explicit approval. Requirement sources are
read-only; paths come from `.claude/toolkit.json` / `CLAUDE.md`.

Next: `/architect:create-tasks` if briefs need re-planning, or `/architect:fix-arch-bug` if shipped code
now contradicts the requirement.
