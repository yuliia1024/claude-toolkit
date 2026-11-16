---
name: create-tasks
description: Turn a feature's architecture folder into a wave-ordered backlog of backend task files. The first task always owns the shared contracts and validation codes and ships alone; every later task is a short brief that links architecture anchors instead of restating them.
---

# create-tasks

Input: the architecture a `create-architecture` run left in `{docs-root}/{feature-slug}/`.
Output: `{docs-root}/{feature-slug}/tasks/` — numbered task briefs plus a README that orders them into
waves, which `/architect:implement` then executes. Backs the `/architect:create-tasks` command.

## Non-negotiables

| # | Rule | Why |
|---|------|-----|
| R1 | `01-contracts-and-validations.md` exists, is the only task in wave 1, and every other task depends on it. | Types, enums, routes and validation codes are what everything else compiles against. |
| R2 | A task is one coherent backend slice — often several endpoints around one entity or concern. | One reviewable PR and one agent context per task; no one-endpoint confetti, no grab-bags. |
| R3 | Tasks in the same wave share no dependency and create no common new file. | `implement` runs a wave as parallel agents with separate branches. |
| R4 | A brief stays near 100 lines and **links** to architecture anchors; it never copies tables, JSON or email bodies. | The architecture remains the single spec; briefs cannot drift from it. |

R4 caps the *document*, not the work. If a brief refuses to fit, the scope is too wide — split it by
concern rather than trimming words.

## Where things live

- **Docs root** — same lookup as `create-architecture`: `.claude/toolkit.json`, else `docs/architecture/`.
- **Tasks folder** — `{docs-root}/{feature-slug}/tasks/`. From a brief, `../` is the feature's blocks and
  `../../` holds the shared `api-contract/` and `data-model/`.
- **Owned here:** the `NN-slug.md` briefs, `tasks/README.md`, `tasks/_template-sources.md`.
- **Not owned here:** `tasks/_pr/` (written later by `implement` — never delete it or count it as a
  task), the architecture blocks and `_impact.md` (read-only for this skill).
- **Shared-contract lib** — if `.claude/toolkit.json` names one, task 01 targets it; otherwise task 01
  places the contracts in the owning backend module.
- Everything produced is local Markdown; nothing is sent to an external tracker.

## Accepted input (`$ARGUMENTS`)

| Shape | How to recognise it | Handling |
|---|---|---|
| Architecture folder (preferred) | path is a `{docs-root}/<slug>/` directory | read README, then the blocks |
| Single-file architecture | path ends in `-architecture.md` | map its sections onto block roles yourself |
| Free text | anything else | rebuild a block inventory in memory |

Optional trailing hints ("lean MVP", "keep it to two waves") shape sizing. With no argument, propose the
most recently modified feature folder under `{docs-root}/` and confirm before continuing.

---

## Step 1 — Read the rules

Load `.claude/CLAUDE.md`, `.claude/toolkit.json`, `.claude/rules/shared/*.md` and the rule folders
for the active backend stacks. The ones that shape briefs: contracts-first API design, error envelope and
validation-code enums, REST conventions, persistence and migration patterns, layering, test patterns,
API-doc annotations, and any review-lessons file. If the project documents its validation-error
contract, read it — task 01 is its implementation.

## Step 2 — Inventory the architecture

1. Open the feature `README.md`: overview, **Block Index**, **Dependency Map**. Waves derive from the map.
2. **Resolve blocks by role.** Take each filename from the Block Index *Role* column (`db-schema`,
   `api-endpoints`, `business-logic`, `validation`, `nfr`, `websocket`, `change-log`) and use those
   paths everywhere. Numbers shift when blocks split. For a legacy README without a Role column, infer
   roles from filenames once and record the mapping in the tasks README Notes.
3. List every concrete change:
   - **Contracts** — new/changed types, enums, route constants, the domain validation-code enum and its
     field / cross-field mapping (from the `validation` block).
   - **Persistence** — entities and migrations; detail lives in `data-model/{feature-slug}.md`, which
     briefs cite.
   - **Endpoints** — method, path, auth, and a complexity guess (CRUD / rules-heavy / multi-step); detail
     lives in `api-contract/{feature-slug}.md`.
   - **Behaviour** — state machines, cross-field rules, side effects (mail, audit, notifications).
   - **Other** — realtime events, feature flags.
4. **Deferred copy (repair path only).** `create-architecture` should already have pasted in-scope
   notification text verbatim. If a legacy or hand-written doc still says "text as in the story", fetch
   the exact subject and body from the requirement source into `tasks/_template-sources.md` with source,
   version and date. Briefs link that file; no brief may leave copy unresolved.

## Step 3 — Cut the slices

### Task 01 — the contract foundation

Contains: every request/response type the feature needs, status/type enums, the validation-code enum,
route constants, the DTO validation plan (which field gets which decorators, presence check first per the
error-handling rule; field and cross-field codes; per-step hints for multi-step flows), and barrel
exports when a shared lib exists. It cites the `validation` block and the type/enum tables of the other
blocks rather than re-explaining them.

**Scope column values:** a base token — `contracts` (task 01 only) or `BE` — optionally followed by a
parenthesised service name: `BE (api)`, `BE (billing-worker)`. `implement` routes on the base token;
invent no others.

### Everything after 01

Group by what changes together: one entity, one module, one concern. Examples of good slices in a
returns-processing feature: *return request intake (create + list + get)*, *inspection photos (presign +
attach + remove)*, *refund decision (approve / reject transitions)*. A lone CSV export is a fine task on
its own.

**Split a candidate when** it introduces more than one new entity; mixes a state machine or dense
cross-field validation with unrelated CRUD; bundles independently buildable steps of a wizard; exceeds
roughly five or six endpoints or has read and write halves that could ship apart; or its brief cannot
stay short because the scope sprawls.

**Keep together when** endpoints only make sense as a set (full CRUD, a GET paired with its POST); a piece
is too small to stand alone; or separating would make two same-wave tasks create the same file.

Prefer a handful of medium slices over many micro-tasks — fragmentation adds coordination without adding
real concurrency.

### Dependencies and waves

- Every task lists `01`. Add further `depends-on` only for genuine ordering (a transition task needs the
  entity and repository that the intake task creates).
- Wave = topological level: wave 1 is `01` alone; wave 2 is everything depending only on 01; wave 3+ follows.
- Two tasks that would create the same new file never share a wave — merge them or push one later.

**Wave sizing.** Aim for 2–5 tasks per wave (about one reviewer-sitting of diff). Eight or more is a queue,
not a wave; split it. A single-task wave is normal for wave 1 and acceptable occasionally after, but three
single-task waves in a row means slices all funnel into one file (one controller, one module registry).
Fix the cause: redraw boundaries along real files, or collapse the chain into fewer sequential tasks and
say in Notes why the work is inherently serial. Never publish many waves whose true parallelism is 1.
State the actual per-wave counts in the README.

**Effort and estimate.** Each brief carries an S/M/L `Effort` (used for wave balance) and an
`Estimate` in hours.

### Running alongside other epics

If `{progress-root}/_cross-epic/hotspots.md` exists, this feature is one of several epics in flight:

- A task touching a listed hotspot (shared enums, workspace config, shared config files) gets
  `⚠ HOTSPOT: <file> — owner <epic>` in its Tasks row and moves to the earliest wave its dependencies
  allow. If another epic owns the hotspot, plan only append-only edits; structural changes become a
  `needed-by` request to the owner.
- An asset a sibling epic will likely also need goes under **Notes → Shared-asset candidates**. If the
  shared-assets ledger shows a sibling already building it, depend on that epic's merge and consume it.

### File names

`{docs-root}/{feature-slug}/tasks/NN-short-slug.md`, two-digit ordering; task 01 is always
`01-contracts-and-validations.md`.

## Step 4 — Write the files

### 4a. Plan once, then fan out

1. **Pin the plan in the main thread**: for each task, its owned endpoints/entities, `depends-on`, wave,
   effort, and the exact anchors it must cite (one `api-contract` anchor per endpoint, plus `data-model`,
   `business-logic` and `validation` anchors). Pinned anchors mean writers need no coordination.
2. **Fan out in a single message**: one `general-purpose` agent per brief (01 included), each writing
   exactly its own file from the template below and returning
   `{ file, wave, dependsOn, archRefs, effort }`.
3. **Assemble the README yourself** from the returned manifests. Agents never touch `tasks/README.md`.

With two or fewer tasks, skip the fan-out and write them directly.

### 4b. `tasks/README.md`

The headings `## Tasks`, `## Parallel Waves` and `## Dependency Graph` and the Tasks columns
`# | Task | Wave | Depends on | Scope` are parsed by the validator and by `implement` — keep them.

````markdown
# Returns Processing — Task Plan

Created 2026-03-02 from [the architecture](../README.md). 4 tasks in 3 waves.

## Tasks

| # | Task | Wave | Depends on | Scope | Cites | Effort |
|---|------|------|------------|-------|-------|--------|
| 01 | contracts + validations | 1 | — | contracts | validation, business-logic | M |
| 02 | Return intake (create, list, get) | 2 | 01 | BE (api) | data-model#return_request, api 1–3 | M |
| 03 | Inspection photos (presign, attach, remove) | 2 | 01 | BE (api) | api 4–6, business-logic#photo-limits | S |
| 04 | Refund decision transitions | 3 | 01, 02 | BE (api) | business-logic#return-lifecycle | M |

## Parallel Waves

Waves run in order; tasks inside a wave run as separate agents, each with its own PR.

- Wave 1 — 01 (blocks everything)
- Wave 2 — 02, 03 (2 in parallel)
- Wave 3 — 04

## Dependency Graph

```
01
├─ 02 ─ 04
└─ 03
```

## Notes

- Assumptions spanning several tasks; origin of `_template-sources.md` entries.
- Inferred role → file mapping (only when the Block Index had no Role column).
- Cross-epic only: shared-asset candidates and ledger items this feature consumes.
````

### 4c. A task brief

Links are relative to `tasks/`. Every endpoint in the slice gets its own contract link.

```markdown
# 02. Return intake

**Wave** 2 · **Depends on** 01 · **Scope** BE (api) · **Effort** M · **Estimate** 10h
Architecture: [overview](../README.md)

## Outcome

Customers can open a return for a delivered order and see their open returns; staff can fetch any one.

## Architecture references

- Entity: [return_request](../../data-model/returns-processing.md#return_request)
- Endpoints:
  - [1. POST /returns](../../api-contract/returns-processing.md#1-post-returns)
  - [2. GET /returns](../../api-contract/returns-processing.md#2-get-returns)
  - [3. GET /returns/:id](../../api-contract/returns-processing.md#3-get-returnsid)
- Rules: [eligibility window](../03-business-logic.md#eligibility-window)
- Codes: [intake codes](../04-validation.md#intake)

## Work items

- [ ] Entity + migration for `return_request` (data-model anchor above)
- [ ] Repository with owner-scoped queries
- [ ] Service: eligibility check, create, paginated list, get
- [ ] Controller + route wiring using the task-01 route constants
- [ ] Unit tests (service, controller) and one e2e flow

## Uses from 01

`CreateReturnReq`, `ReturnRes`, `ReturnStatus`, `ReturnsValidationCode.WINDOW_EXPIRED`, `RETURNS_ROUTES.create`

## Done when

- [ ] Status codes and payloads match the contract links
- [ ] Failures use the project error envelope with enum codes
- [ ] Non-owners cannot read or create on another customer's order
- [ ] API-doc annotations list every status the handler can produce
- [ ] Mutations write their audit entry in the same transaction (if the project audits)
- [ ] Unit + e2e tests pass
```

**Never inline** full column lists, request/response JSON, error-code tables or notification bodies —
link them. Inline content is limited to the work-item checklist, the consumed-contracts line and the
done-when list. Task 01 may be denser (it enumerates what to create) but still links the `validation`
block. Notification tasks link the `_template-sources.md` entry and the block owning the side effect.

Writing rules: verify each anchor exists in its target file; list only the contracts a task consumes;
no dependency cycles; scale work items with complexity (a state machine gets one item per transition).

## Step 5 — Gate

Run the validator first and clear every error:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-architecture.mjs --feature {feature-slug}
```

It checks task 01 placement, README ↔ file agreement, Scope tokens, backward-only dependencies, anchor
resolution, brief length and wave sizing. Then confirm by hand:

- [ ] R1–R4 hold.
- [ ] No brief is a trivial endpoint that belongs with a sibling, and none mixes concerns or adds two entities.
- [ ] Each brief links a contract anchor for every endpoint it owns, plus the model/logic/validation anchors it needs.
- [ ] Task count in the README equals the `NN-*.md` files; `README.md`, `_template-sources.md` and `_pr/` are not counted.
- [ ] Every planned brief was actually written; the README was assembled in the main thread.
- [ ] Blocks were resolved by role; no unresolved deferred copy remains.

The usual repair is splitting a sprawling task — without overcorrecting into micro-tasks.

## Step 6 — Review loop and tracking

Present a short summary:

```
returns-processing: 4 tasks, 3 waves
  wave 1  01-contracts-and-validations
  wave 2  02-return-intake · 03-inspection-photos
  wave 3  04-refund-decision
All briefs ≤100 lines, linking ../ blocks and ../../api-contract, ../../data-model.
Reply with edits ("split 04", "merge 02 03", "move 03 to wave 3") or "approved".
```

Iterate until approved. Then, using the formats defined in `${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md`:

- Append one entry to `{progress-root}/{feature-slug}/worklog.md`: a plain-language line ("work split
  into N buildable pieces") linking `../../architecture/{feature-slug}/tasks/README.md`, with wave and
  scope detail tucked into `<details>`.
- Rewrite `{progress-root}/{feature-slug}/progress.md` and its index row: work-breakdown `done — N pieces`,
  stage `implement`, resume command `/architect:implement {docs-root}/{feature-slug}/tasks/`.

Ask questions only for real ambiguity (which service owns a slice, conflicting scope); derive the rest
from the Dependency Map.
