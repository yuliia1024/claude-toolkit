---
name: fix-arch-bug
description: 'Close one bug whose root cause is a wrong or incomplete architecture spec: fix the backend first, then correct the local architecture docs to match. A local review file and two approval gates come before any doc edit. Input is a single QA finding or bug description; plain backend bugs go to node:bugfix.'
---

# fix-arch-bug

Some defects exist because the code faithfully followed a spec that was wrong. Fixing only the code
leaves the docs lying; fixing only the docs leaves the bug. This skill does both, in that order, for
exactly one reported problem.

- **Backend first, docs second.** If the developer already committed the backend fix, they pass the
  commit and the skill goes straight to the docs.
- **Nothing is applied blind.** Backend changes stay uncommitted for review (gate A); doc changes are
  proposed in a local review file and applied only after approval (gate B).

Use `/architect:sync-architecture` instead when nothing is broken and the requirement simply changed —
that skill treats the requirement as truth and touches docs and task briefs, not code.

|  | fix-arch-bug | sync-architecture |
|---|---|---|
| Starts from | a defect traced to the spec | a changed requirement |
| Breadth | the one defect | the whole requirement diff |
| Writes code | yes (or reuses a given commit) | never |
| Updates | backend + architecture docs | architecture docs + task briefs |
| Input | bug text/file, optional doc path, optional commit | changed spec + architecture |

## Invocation

```
/architect:fix-arch-bug <bug text | bug file> [architecture doc path] [extra context]
```

1. **Bug** (required) — pasted in quotes, or a path to a local file containing it.
2. **Doc path** (optional) — a file or a folder of block files. Otherwise taken from a path in the bug
   text, or asked for.
3. **Context** (optional) — scope hints, or a statement that the backend is already fixed:
   `"backend fixed in 4e1a9c2"`, `"BE done in <hash>"`, `"commit <hash>"`. A recognised hash skips the
   backend stage and scopes the doc work to that commit.

Examples:

```bash
/architect:fix-arch-bug "QA: invoice list ignores dueBefore when sent as ISO date; spec says epoch ms"
/architect:fix-arch-bug ./qa/invoice-due-filter.md docs/architecture/invoicing/
/architect:fix-arch-bug ./qa/invoice-due-filter.md "only the list endpoint, not the export"
/architect:fix-arch-bug ./qa/invoice-due-filter.md "backend fixed in 4e1a9c2"
```

Ask for anything required that is missing.

From the bug text derive a **bug slug** — 2–5 kebab-case words describing the defect
(`invoice-due-date-filter`). It names the branch (`fix/<bug-slug>`), appears in the change-log row,
and is used to detect repeat runs. It never contains ticket or task numbers.

## Environment

Read everything environment-specific from `.claude/toolkit.json` and `.claude/CLAUDE.md`:
docs root (default `docs/architecture/`), shared-contract package and backend app locations, and the
typecheck/lint/test commands. No hardcoded hosts or machine paths; plugin files are under
`${CLAUDE_PLUGIN_ROOT}`, project files under `${CLAUDE_PROJECT_DIR}`.

## Flow

```
Stage 1  Intake ............ rules, clean tree, branch, bug, doc, doc contents    → context-gathering.md
Stage 2  Backend fix ....... repeat-run check, diagnose, fix, verify             → backend-fix.md
         ▶ GATE A — developer reviews the uncommitted diff
         (skipped entirely when a fix commit was supplied)
Stage 3  Doc diff .......... compare fix vs docs, write local review file        → analysis-and-report.md
         ▶ GATE B — developer approves the proposed doc edits
Stage 4  Apply ............. edit approved sections, change log, final report   → apply-and-finalize.md
Any stage: unusual situations                                                   → edge-cases.md
```

Open each file when its stage begins, not before. Announce each stage with a one-line status
("Stage 2 — verifying backend fix (typecheck, lint, tests)…") so the developer can follow along.

**Review artefact:** `<docs-root>/sync/<feature>-arch-fix-<date>.md`. After the fix lands, commit it as
documentation or delete it.

## Rules

1. **One defect.** Code and doc changes stay inside the reported problem; other issues you notice are
   listed, not fixed.
2. **Review file before doc edits**, and both gates are hard stops.
3. **Never edit architecture docs without explicit approval.**
4. **Ask rather than guess** — about the doc to update, an unclear fix, or a fix you cannot locate.
   Never auto-pick a search result.
5. **Minimal edits** — only sections the fix affects; everything else is left as it was.
6. **Always log** in the change log when one exists: trigger, bug slug, commit (or "uncommitted").
7. **Every doc edit names its trigger** (QA finding label, bug label, or commit).
8. **No new doc files.** If one is needed, recommend `/architect:create-architecture`.
9. **Re-read before writing** and warn if a file changed since the analysis.
10. **Check for a previous sync** of the same fix before doing work.
11. **Client code is out of bounds.** Frontend/mobile/service consumers of a changed contract are listed
    as follow-ups only.
