---
name: sync-architecture
description: Fold a changed requirement into a feature architecture that is already written. Every difference gets a verdict; only the owning blocks and the matching api-contract/data-model sections are edited; logs every change, and reports which task briefs are now stale, invalid or missing.
---

# sync-architecture

Use after `create-architecture` has run and the requirement moved: a story was amended, an open question
got answered, scope shrank, a field changed type. Backs `/architect:sync-architecture`.

Why not just edit the doc or regenerate it?

- One requirement change usually lands in several places — contract, endpoint index, validation codes,
  change log, sometimes a consuming feature. Editing only the obvious file is how docs rot.
- Task briefs link architecture anchors; this skill finds which briefs a change breaks.
- Regenerating throws away reviewer edits, resolved assumptions and history. Surgical edits keep them.

## Lookups

Same as `create-architecture`: docs root from `.claude/toolkit.json` (fallback
`docs/architecture/`); feature at `{docs-root}/{feature-slug}/`; shared specs in `api-contract/` and
`data-model/`; briefs in `{feature-slug}/tasks/`. Locate each block via its role slug in the README Block Index
(the seven slugs are defined by `create-architecture`). An old README with no Role column: guess roles
from filenames one time and mention it in the report. Requirement sources are only read.

## Input

`$ARGUMENTS`:
1. **What changed** (required) — a local requirement file or an inline description.
2. **Target feature** (optional) — slug or folder.
3. **Hints** (optional) — "scope cut, no new endpoints", "question 3 answered: yes".

No target? Search the feature READMEs under `{docs-root}/` for this requirement's reference (it sits in
the header and §7); if nothing matches, search by core entity names. Ask the user to confirm the hit
before the first edit — a question is cheaper than patching the wrong feature. No arguments at all: ask once what changed.

---

## Stage A — Baseline

1. Read project rules: `.claude/CLAUDE.md`, `.claude/toolkit.json`, `.claude/rules/shared/*.md`,
   the stack rule folders in use, plus the validation-error contract doc when one exists.
2. Read the new requirement; extract acceptance criteria, in/out scope, entities, statuses, roles, and
   its **version/date** (the change log cites it).
3. Read the current architecture: README (Block Index, Dependency Map), every block, this feature's
   sections of `api-contract/` and `data-model/`, and `_impact.md` if present.
4. Mark human contributions you must preserve: `[ASSUMPTION-n]` lines, existing change-log rows,
   reviewer-written prose.
5. Run the validator and keep its output as the baseline:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-architecture.mjs --feature {feature-slug}
   ```

   Pre-existing errors are reported as such, not silently fixed and not blamed on this sync. If the
   folder is unparseable (no README or no readable Block Index), stop and say so.

## Stage B — Diff table (complete before any edit)

One row per concrete difference:

| Kind | Definition | Treatment |
|---|---|---|
| Added | requirement has it, architecture doesn't | write it into the owning block and shared file |
| Modified | documented item behaves differently now | edit in place; change log keeps the previous value |
| Dropped | documented item left scope | mark removed/deprecated; keep its history |
| Resolved | an assumption or open question now has an answer | replace the assumption with the fact and cite the answer |
| Same | unchanged | no edit — still listed so the user sees it was checked |

Map each non-Same row to its owner:

| Difference in… | Edit here (source of truth first) |
|---|---|
| endpoint shape | `api-contract/{slug}.md`, then the `api-endpoints` index |
| column, index, enum, lifecycle | `data-model/{slug}.md`, then the `db-schema` index |
| rule, transition, permission, side effect | `business-logic` |
| code, field map, cross-field rule | `validation` |
| performance, security, paging | `nfr` |
| realtime event, payload, room | `websocket` |

A row with no owner either belongs to another feature (report and stop) or needs a new block (add it
with a Block Index row).

A half-applied diff leaves the doc inconsistent — finish the table first.

## Stage C — Edit

**Order** (keeps links valid at every step):
1. `api-contract/{slug}.md`, `data-model/{slug}.md`
2. shared overview rows and global ERD nodes
3. index blocks (`api-endpoints`, `db-schema`)
4. narrative blocks (`business-logic`, `validation`, `nfr`, `websocket`)
5. feature README — only if scope, assumptions or dependencies moved
6. `change-log`

**Editing discipline**
- Touch only the affected section; everything else stays byte-identical.
- Numbers are permanent: new endpoints are appended as the next `## N.`; a dropped endpoint keeps its
  number with a removed marker.
- Resolve an assumption by replacing it with the fact and logging it — never delete it silently.
- Don't rename headings. If one must change, fix every referrer (the validator lists them).
- New in-scope copy goes in verbatim, with attribution, as `create-architecture` requires.

**Change log:** one row per difference — date, what, kind, requirement source and version, blocks edited.

## Stage D — Ripple check

**Other features.** Repeat the `create-architecture` impact pass scoped to these differences: grep
the remaining features for names this sync touched (entities, paths, enums), give each hit one of the
four relations (reuses, extends, changes, supersedes) and append a dated section to `_impact.md`. Add cross-links now; content edits to
other features wait for "approve impact".

**Task briefs** in `{feature-slug}/tasks/`:

| Verdict | Condition | Action |
|---|---|---|
| untouched | links nothing that changed | none |
| stale | links an edited anchor, scope still valid | update its reference lines and done-when list; note it |
| invalid | its scope was dropped or fundamentally changed | add `SUPERSEDED` to its header and README row; propose a replacement |
| missing | new scope no brief covers | propose a new brief — numbering and waves belong to `create-tasks` |

Briefs already `IMPLEMENTED` (or shipped through a merged PR) are code, not docs: don't rewrite them.
Report a follow-up and point to `/architect:fix-arch-bug` for a code-plus-docs correction. If waves or
task boundaries need to change, report it for `create-tasks` and stop there.

**Re-validate.** Run the validator again; errors introduced by this sync must be zero. Compare against
the Stage A baseline so old failures are labelled as old.

## Stage E — Report and tracking

```
appointment-booking ← self-service-booking.md v4 (2026-05-02)

Differences: 6 → 2 added · 2 modified · 1 dropped · 1 resolved · 0 same
Edited:
  api-contract/appointment-booking.md  §7 new POST /appointments/:id/no-show
  03-business-logic.md                 no-show transition, BR-6
  07-change-log.md                     6 rows
Other features: 1 link added · 1 edit awaiting approval (staff-directory)
Briefs: 3 untouched · 1 stale (fixed) · 0 superseded · 1 new proposed
Shipped work now diverging: 02-booking-intake → needs follow-up
Validator: 0 new errors (1 pre-existing), 2 warnings

Reply: "approve impact" · "regenerate tasks" · or edit blocks and re-run
```

Edit no other feature's content until approved; iterate on feedback.

Tracking (formats in `${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md`), in `{progress-root}/{feature-slug}/`:

- `worklog.md` — one entry: in product terms, what changed ("no-shows are now recorded and block rebooking
  for 48h") and its cost ("1 planned piece needs re-planning"); the requirement ref up top; counts per
  kind, edited blocks and brief impact inside `<details>`; link the change-log block.
- `progress.md` and its index row — if briefs went stale, set state `blocked` with resume
  `/architect:create-tasks` for the affected slices; otherwise just refresh the *Updated* stamp.

If a change is too large to patch sensibly, say so and let the user decide whether to regenerate.
