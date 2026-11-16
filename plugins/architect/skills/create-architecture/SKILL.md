---
name: create-architecture
description: Design a feature's backend architecture from a spec as a folder of small single-purpose block files plus an overview, with endpoint and schema detail kept once in the shared api-contract/ and data-model/ files. Blocks are drafted by parallel agents, then an impact pass links and (with approval) updates overlapping architecture.
---

# create-architecture

Turns a requirement into `{docs-root}/{feature-slug}/` — the input `create-tasks` slices into work.
Backs `/architect:create-architecture`.

## Design principles

1. **Many small files, one entry point.** Each concern is its own block file (target ≤200 lines); the
   feature `README.md` is the only file that describes the whole. Readers load just what they need.
2. **Specs live once.** Endpoint specs go to `{docs-root}/api-contract/`, entity schemas to
   `{docs-root}/data-model/`. Feature blocks hold *indexes* that link there.
3. **Concrete over generic.** Real table names, paths, enum members, JSON. No leftover template slots.
4. **Roles are the API.** Block numbers are labels and may shift; downstream commands find blocks by
   the *Role* column of the Block Index.
5. **Never contradict shipped design silently.** An impact pass links related architecture both ways
   and proposes edits — applied only after approval.
6. **Trace to the source.** The README links the exact requirement(s) from the first draft on.

## Setup

| Setting | Source | Fallback |
|---|---|---|
| Docs root | `.claude/toolkit.json` or project convention | `docs/architecture/` |
| Shared-contract package | path/alias in `.claude/toolkit.json` (e.g. `@acme/contracts`) | contracts belong to the owning module |
| Requirements | path given, or the project's local requirements folder | the pasted text (note that no source file exists) |

**Paths this skill owns** inside the feature folder: numbered block files, `README.md`, `_impact.md`.
**Not owned:** `tasks/` (from `create-tasks`, incl. `_template-sources.md`) and `tasks/_pr/` (from
`implement`) — leave them out of the Block Index and never modify them. Progress tracking lives outside
the folder in `{progress-root}/{feature-slug}/`; its location and formats are defined in
`${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md`.

## Input

`$ARGUMENTS`: a path (contains `/` or ends `.md`/`.txt`) or inline text, plus optional hints
("admin only", "realtime needed", "lean MVP"). If it is a feature name or text rather than a path, first
search the local requirements folder for the matching requirement and keep the resolved path. With no
argument, ask once where the spec is.

---

## 1. Prepare

**Rules.** Read `.claude/CLAUDE.md`, `.claude/toolkit.json`, `.claude/rules/shared/*.md` and every
rule folder for the active stacks (discover by glob — don't hardcode). They fix the conventions for
contracts, persistence, errors, enums, REST, migrations, API docs and validation. If the project has a
validation-error contract (error envelope, code families), the validation block must follow it.

**Requirement.** Extract title, status, acceptance criteria, preconditions, in/out of scope, and every
entity, role, status and reference table mentioned. Record the requirement path(s).

**Codebase.** Using paths from config/CLAUDE.md, locate existing entities/data access, controllers or
routers, services, and shared contracts. Note what already exists so the design extends it instead of
duplicating it. Pull reference/master data tables only if the feature actually uses them.

**Overlap candidates.** List existing feature folders and flat docs under `{docs-root}/` (excluding
`api-contract/` and `data-model/`), then grep them for this feature's key entity names, paths and enums.
Record each hit and the reason (shared entity, endpoint, enum, domain) — the impact pass consumes it.

**Gaps.** Resolve gaps and ambiguities with explicit `[ASSUMPTION-n]` entries in the README. Stop and ask
only if the target app is genuinely unclear, two requirements conflict in a way that changes the design,
or the feature's name/domain is unclear. Otherwise post a one-paragraph summary (name, target, number of
assumptions) and continue.

## 2. Plan the folder

Pick a kebab-case **slug** from the requirement title (e.g. `appointment-booking`) and note the flags:
realtime, feature flag, wizard, list/detail views, CRUD.

Default layout — drop blocks that don't apply, split any that would pass ~200 lines (`02a-…-write.md`,
`02b-…-read.md`), and index every file:

| File | Role | Holds |
|---|---|---|
| `README.md` | — | overview, scope, assumptions, Block Index, Dependency Map, related work, requirements |
| `01-database-schema.md` | `db-schema` | entity → table index linking the Data Model; naming conventions only |
| `02-api-endpoints.md` | `api-endpoints` | `METHOD /path` index linking the API Contract |
| `03-business-logic.md` | `business-logic` | permission matrix, lifecycle (ASCII + transition table), rules `[BR-n]`, side effects |
| `04-validation-and-error-codes.md` | `validation` | **required**: domain code enum, field → code map, cross-field codes, wizard-step hints, code → HTTP table |
| `05-non-functional.md` | `nfr` | latency budgets, auth/roles/ownership scoping, paging & sort defaults, error shape, observability, audit |
| `06-websocket-events.md` | `websocket` | only if realtime: namespace, events, payloads, rooms, auth |
| `07-change-log.md` | `change-log` | change table, seeded with the first row |
| `_impact.md` | — | output of step 5 |

Keep the default numbers unless a split or omission forces a change — predictable names help humans,
while tools rely on the Role column.

Content rules for every block:

- One concern per block; link instead of repeating.
- Each section cites its origin: `Based on: <requirement / AC>`.
- The validation block lists codes only (no prose messages) and names the enum per the project's enum
  convention. Task 01 of `create-tasks` implements it one-to-one.
- In-scope copy (email subject + body, notification text, multi-paragraph dialog text) is pasted
  **verbatim** into the block that owns the side effect, tagged `(verbatim from <source> v<version>,
  fetched <date>)`. "See the story" is not allowed. Short UI labels and toasts are out of scope.

## 3. The overview README

Section names below are checked by the validator; keep them.

````markdown
# Appointment Booking — Architecture

Status: Draft · Updated: 2026-04-11
Requirement: [docs/requirements/booking/self-service-booking.md](../../requirements/booking/self-service-booking.md)

## 1. Overview
Patients pick a slot from a clinician's calendar, receive a confirmation, and may reschedule up to 24h ahead.

## 2. Scope
In: patient booking, reschedule, cancel; clinician calendar read. Out: payments (separate billing epic).

## 3. Assumptions
- [ASSUMPTION-1] One clinic time zone per tenant.

## 4. Block Index
| # | Role | Block | File | Summary |
|---|------|-------|------|---------|
| 01 | `db-schema` | Entities | [01-database-schema.md](./01-database-schema.md) | slot, appointment |
| 02 | `api-endpoints` | Endpoints | [02-api-endpoints.md](./02-api-endpoints.md) | 6 endpoints |
| 06 | `websocket` | Realtime | omitted — no live updates required | — |

## 5. Dependency Map
Inside the feature:
    01 entities → 02 endpoints → 03 logic
    01 entities → 04 validation
Outside the feature:
| Uses | Kind | From | Reason |
|------|------|------|--------|
| `clinician` | entity | staff-directory/ | calendar owner |
| `tenant` | entity | existing | ownership scope |
Reference data: none.

## 6. Related Architecture
| Feature | Relation | Link |
|---------|----------|------|
| Staff directory | consumes `clinician` | [../staff-directory/README.md](../staff-directory/README.md) |

## 7. Requirements
| Req | Title | Link | Status |
|-----|-------|------|--------|
| BK-1 | Self-service booking | [spec](../../requirements/booking/self-service-booking.md) | Ready |
````

The Dependency Map is mandatory even for tiny features — `create-tasks` derives waves from it. Write
"none" where a sub-part genuinely has nothing.

**Block footer.** Every numbered block ends with a navigation line listing the overview and the sibling
blocks that actually exist (real filenames), plus any related features the block mentions. Refresh it
whenever blocks are added, split or removed:

```markdown
---
Nav: [Overview](./README.md) | [Entities](./01-database-schema.md) | [Endpoints](./02-api-endpoints.md) | [Logic](./03-business-logic.md) | [Validation](./04-validation-and-error-codes.md) | [NFR](./05-non-functional.md) | [Changes](./07-change-log.md)
See also: [Staff directory](../staff-directory/README.md)
```

## 4. Shared contract and data model

### `api-contract/` — single home for endpoint specs

- `api-contract/README.md`: one overview table of all endpoints across features
  (`# | Endpoint | Method | Path | Auth | Domain`), each name linking to its anchor.
- `api-contract/{feature-slug}.md`: a `# <Domain> domain` header (types location, logic links), then one
  `## N. METHOD /path` section per endpoint, numbered from 1 within the file. Each section states
  who may call it (**Auth**), the **Request** type with a JSON sample, each **Response** status with JSON, and the **Errors** it raises; it links
  `../{feature-slug}/03-business-logic.md`. Endpoints not yet in code carry `[PROPOSED — not in code]`.
- Anchor = auto-slug of the heading: lowercase, spaces → `-`, `/` and `.` dropped.
  `## 3. PATCH /appointments/:id/reschedule` → `#3-patch-appointmentsidreschedule`.
- Per-file numbering means a new endpoint never renumbers another domain.
- A feature with no HTTP surface gets no contract file; say "no endpoints" in its README and index block.

### `data-model/` — single home for schema

- `data-model/README.md`: entity overview (`Entity (folder) | Table | Status | Owning domain`) and **one
  global mermaid `erDiagram`** with every entity.
- `data-model/{feature-slug}.md`: one section per *owned* entity, headed by the **exact table name**
  (`## appointment`) so the anchor equals the table name. Body: entity name/path and base class;
  **Columns** (`Column | Type | Nullable | Default | Set by | Notes`); **Indexes & constraints**;
  enums (`Value | Meaning` + source path); a mermaid state diagram when there is a lifecycle; numbered
  **Migration history**. Non-entity sections (shared enums, audit extensions) use their own heading slug.
- `data-model/foundation.md` covers entities every domain shares (accounts, tenants, sessions).
- Entities found in code but documented nowhere become `[GAP]` rows in the overview (owner "none").
- Entities a feature only *uses* are linked to their owner's section, never redefined.

## 5. Parallel drafting

Above three or so block files (or whenever separate contract/model files are needed), draft in parallel;
below that, write directly.

1. **Freeze the plan (main thread).** Entities with table names → `#table` anchors; endpoints →
   `#n-method…` anchors; rules, codes, dependency map, the active block list. With every anchor fixed up
   front, agents can link to files that are still being written.
2. **Launch in one message** a `general-purpose` agent per file: each block (`06` only if realtime),
   `api-contract/{slug}.md`, `data-model/{slug}.md`. Each prompt carries the requirement refs, that
   agent's slice of the frozen plan, the block rules from step 2, the footer format, the anchor rules from
   step 4 and pointers to the project rules. Each returns
   `{ file, headings, documented, crossRefsNeeded }`.
3. **Assemble aggregates (main thread only):** the feature `README.md`; overview rows in
   `api-contract/README.md` and `data-model/README.md`; ERD nodes and relations; the feature's row in
   the catalog `{docs-root}/README.md`. No agent writes a shared file.

## 6. Verify

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-architecture.mjs --feature {feature-slug}
```

The validator finds the docs root itself and reports Block Index ↔ disk mismatches, broken links and
anchors, oversized files, missing shared files or overview rows, and contract sections lacking
Auth/Request/Response. Fix every error; for warnings you keep, say why in the handover. `--json` gives
machine-readable output.

Judgement checks the script cannot do:

- [ ] All seven README sections present; the Dependency Map is *correct*, not merely non-empty.
- [ ] Header and §7 link the real requirement file(s) — no leftover slots.
- [ ] Every Block Index row has a Role; every numbered `*.md` in the folder is indexed; `README.md`,
      `_impact.md` and `tasks/` are not.
- [ ] Footers present and accurate.
- [ ] Validation block: codes only, enum named per convention.
- [ ] `01` and `02` are pure indexes — no columns, migrations or JSON in the feature folder; every entry
      has a matching section and overview row in the shared files; path params follow REST rules.
- [ ] No deferred copy remains.
- [ ] Every planned file exists (no silently failed agent).

## 7. Impact pass

For each overlap candidate, open the affected blocks (never judge by filename) and classify:

| Relation | Meaning | What to do |
|---|---|---|
| Reuses | reads an existing entity/endpoint/enum unchanged | add links both ways |
| Extends | adds columns, endpoints or enum members to it | links + note the addition in that doc |
| Changes | alters its documented behaviour, validation, state or flow | links + concrete edit proposal for the exact block |
| Supersedes | replaces it | links + mark the old section deprecated, pointing here |

Write `{docs-root}/{feature-slug}/_impact.md`:

```markdown
# Appointment Booking — impact (2026-04-11)

## Links
- appointment-booking/README ↔ staff-directory/README — both use `clinician`

## Proposed edits elsewhere
| # | Target | Relation | Edit |
|---|--------|----------|------|
| 1 | staff-directory/03-business-logic.md | Changes | deactivating a clinician must now cancel future appointments — add rule + back-link |
```

Adding links is non-destructive — do it immediately. Content edits to another feature's docs wait for
explicit approval; when approved, edit the exact block, append to that feature's change log, and keep
links two-way.

## 8. Handover

```
appointment-booking: README + 7 blocks written under {docs-root}/appointment-booking/
Assumptions: 2 · Links added: 3 · Edits proposed elsewhere: 1 (_impact.md)
Validator: 0 errors, 1 warning kept (05-non-functional.md at 204 lines — single table, not worth a split)
Reply: edits to any block · "approved" · "approve impact"
```

Revise until approved; never touch other features' content without "approve impact".

After approval, record progress using the formats in `${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md`:

- `worklog.md` — create folder, H1 and the `{progress-root}/README.md` index row if missing; add one entry
  a non-engineer can read (what the feature is; its blueprint is written and reviewed), with counts and
  links to the README and `_impact.md` via `../../architecture/{feature-slug}/…`, details inside
  `<details>`.
- `progress.md` — Blueprint `done`, stage `tasks`, resume `/architect:create-tasks {docs-root}/{feature-slug}/`.

Skipping this leaves `/architect:status` unable to tell the next session where things stand.
