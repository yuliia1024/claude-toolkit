---
name: multi-epic
description: Coordinate 2–4 independent backend features ("epics", i.e. local feature folders) delivered at the same time — survey each one's readiness, line up the doc fixes it needs, give each its own worktree and branch, print a per-terminal runbook, and publish overlap hotspots plus a landing order. One feature on its own goes through create-architecture → create-tasks → implement instead.
---

# Multi-epic coordination

Backs `/architect:multi-epic`. This session is the **coordinator**: it reads, plans, creates worktrees
and prints instructions. It never writes product code. Each epic is implemented in its own terminal, in
its own worktree, by a person running `/architect:implement` there.

Why separate terminals rather than background agents: implement pauses for approvals (pushes, review
outcomes) and asks domain questions. Funnelling N epics through one session makes the user the single
queue; N terminals give N independent conversations.

## Fit check

| Situation | Use |
|---|---|
| one feature | `/architect:create-architecture` → `/architect:create-tasks` → `/architect:implement` directly |
| 2–4 backend features at once | this skill |
| more than 4 | warn about machine load and split into batches |
| a feature with frontend or infra/ops work | listed as **manual** — no worktree, no runbook; a person handles it |

Background reading before fanning out — the coordinator must know what each terminal will do:
`${CLAUDE_PLUGIN_ROOT}/skills/implement/SKILL.md` (what each terminal runs, including its branch naming),
plus `skills/create-architecture/SKILL.md` and `skills/create-tasks/SKILL.md` (the doc fixes it may
schedule).

## Settings

- `{docs-root}` from `.claude/toolkit.json` / `CLAUDE.md`. An epic is `{docs-root}/{feature-slug}/`
  (architecture blocks) with its plan in `tasks/`. Everything is read from the working tree.
- `{base}` — the default base branch from `.claude/rules/shared/git-workflow.md` (`main`, `develop`, …).
- `{progress-root}` — as defined in `${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md`.
- Branch names follow the git-workflow rule: `<type>/<short-kebab-summary>`, describing the change, with no
  ticket keys or task numbers.

## Arguments

| Argument | Meaning |
|---|---|
| `orders payments …` | 2–4 feature slugs or folders, space- or comma-separated |
| `--waves` | inside each epic run implement's full layout (task branches + stacked wave PRs). Without it each epic is **one branch, one PR**: implement runs with `single-branch` |
| `status` | re-inspect an existing fan-out; changes nothing |

Why one branch per epic is the default: with several epics in flight there are already several PRs to
review; per-wave stacks inside each epic only pay off for a genuinely large epic.

---

## 1. Survey (read-only, all epics at once)

Issue the reads for all epics in one message. Per epic, collect:

- **Intent** — summary, listed pieces of work, items marked descoped / do-not-build, external
  prerequisites (keys, ops setup).
- **What already exists**, best first:
  1. block architecture at `{docs-root}/{feature-slug}/` (README + blocks);
  2. `tasks/README.md` with all three of: a task table with a Scope column, a wave list, a dependency graph
     (a phase table alone does not qualify);
  3. an older single-file architecture doc somewhere under `{docs-root}`;
  4. older per-item specs (e.g. `specs/*/` with priority sections) — usable as source material only;
     implement cannot consume them;
  5. spikes or integration notes, if the project keeps them.
- **Track** — backend only → implement; anything frontend or infra/ops → manual.

Output a readiness table:

| Epic | Track | Architecture | Wave plan | Existing material | Fix needed | Then |
|---|---|---|---|---|---|---|
| orders | backend | yes | no | arch blocks | create-tasks | implement |
| payments | backend | no | no | legacy spec | create-architecture + create-tasks | implement |
| storefront | manual | — | — | Figma links | — | handled by a person |

## 2. Independence analysis

Report, before touching anything:

- **Shared surface** — epics reaching into the same existing app or library area; suggest serialising only
  those.
- **Dependencies between epics** — *hard* (epic B uses A's types, module or endpoint) vs *soft* (B is merely
  informed by A).
- **External prerequisites** that should be chased first.
- **Hotspots** — files several epics will likely edit and that conflict easily: shared enums and constants;
  root workspace config (`package.json`, `tsconfig.base.json`, `nx.json` or equivalent) when libraries are
  added; the shared contracts package; the shared e2e contracts package; migrations (ordering clashes);
  plus anything specific the survey found. Each hotspot gets an **owner** — the epic touching it that lands
  earliest. Only the owner makes structural edits; others append or ask.
- **Shared building blocks** — anything reusable two epics both plan to build (module, util, contract type,
  endpoint). It goes into the first wave of a single owner; the rest wait for it (a hard dependency)
  instead of building their own.
- **Landing order** — narrowest footprint first, widest last.
- **PR budget** — default: one PR per epic (waves only order the work). With `--waves`: aim for 3–5 stacked
  wave PRs per epic; pass `"target 3–5 waves"` to every create-tasks call in the runbooks and tell each
  terminal to check the wave count before implementing (1–2 → slice finer; 6+ → combine).
- **Exclusions** — descoped items, to be passed to the task generators.

**Stop here.** Show the table and the analysis; continue only after the user confirms.

## 3. Fan-out (after confirmation)

### 3a. Seed the coordination folder

Commit (docs only) on `{base}` a folder `{progress-root}/_cross-epic/` so every worktree starts with it:

- `hotspots.md` — table `path or area | owner epic | rule for others (append-only / ask owner)`, then the
  landing order and the **epic → branch** list (the branch list is how terminals find their siblings).
- `shared-assets.md` — append-only, one `## {feature-slug}` section per epic, rows
  `| path | kind | purpose | state |` where state is `planned`, `in-branch`, `merged` or
  `needed-by {feature-slug}`. Per-epic sections and append-only rows keep merges of this file trivial.

### 3b. One worktree and branch per epic

Branch name = `<type>/<feature-slug>` — `feat` for new capability (the usual case), `fix` when the epic is
corrective, `refactor`/`perf` when that is the whole point. Check `git branch -a`; if the name is taken,
append `-2`, `-3`, …

```bash
git worktree add ../wt-orders   -b feat/orders   {base}
git worktree add ../wt-payments -b feat/payments {base}
```

Every epic needs its own feature folder under `{docs-root}` before its worktree exists — two epics sharing a
folder is a readiness gap to raise in step 2, not something to work around.

### 3c. Runbook per terminal

Print, per epic:

1. `cd ../wt-{feature-slug} && {install command from CLAUDE.md} && claude`
2. The doc fixes from the readiness table, in order, always passing existing material and exclusions, e.g.
   `/architect:create-architecture {spec path} "reuse {paths} — convert, don't reinvent"` then
   `/architect:create-tasks {docs-root}/{feature-slug}/ "target 3–5 waves"`. Because `_cross-epic/` exists,
   create-tasks automatically pulls hotspot work into the earliest wave and marks shared building blocks.
3. Implementation:
   - default: `/architect:implement {docs-root}/{feature-slug}/tasks/ single-branch` — everything lands on
     the epic branch as one PR;
   - `--waves`: `/architect:implement {docs-root}/{feature-slug}/tasks/` — implement's own per-task and
     per-wave branches, starting from the epic branch.
4. A dev-server port override when two epics would bind the same port.
5. The sync protocol below, verbatim.

Then print the coordination rules: landing order, rebase after every landing, hotspot etiquette (append to
enums/objects instead of rewriting shared lines), and the post-landing check (run the project's affected
check on `{base}` after each merge).

Do not run create-architecture, create-tasks or implement in this session unless the user explicitly asks
(running one epic's create-tasks inline while others implement is fine).

### Sync protocol (goes into every runbook)

Worktrees share one object store, so sibling branches are readable locally without pushing. When
`_cross-epic/` exists, implement performs these at the start of each wave; a person can do them by hand:

1. **Stay current.** Fetch `{base}`; if a sibling has landed since you branched, rebase immediately.
2. **Read every ledger.** Your `shared-assets.md` plus each sibling's copy:
   `git show {sibling-branch}:{progress-root}/_cross-epic/shared-assets.md` (sibling branches are listed in
   `hotspots.md`). Rows saying `needed-by {your slug}` are work waiting for you.
3. **Search before building anything reusable** (util, shared module, contract type, endpoint, migration):
   `git grep -il "{name or concept}" {sibling branches from hotspots.md} -- {shared paths}`.
   Hit → wait for it to land and use it (record the dependency in `progress.md`), or copy it
   with `TODO({feature-slug}): swap for {ledger row} once merged`. Never quietly build a duplicate.
4. **Hotspots you don't own** — append only; first check pending sibling edits with
   `git diff {base}...{sibling-branch} -- {file}`. A structural change you need is a request: add a
   `needed-by` row and tell the owner's terminal.
5. **After each wave** (committed on the epic branch by default; merged into the stack with `--waves`),
   list the reusable pieces it introduced under your section of `shared-assets.md` (state `in-branch`;
   flip to `merged` once the epic lands). A ledger only helps if entries appear in the wave that creates them.

## 4. `status`

Read-only. Report:

- `git worktree list`, and each epic branch ahead/behind `origin/{base}`;
- which epics now have `tasks/`, which have implement branches (under `--waves`), and who must rebase
  because a sibling landed;
- the landing order, recomputed.

With `_cross-epic/` present, also: the combined ledger across all epic branches, unanswered `needed-by`
rows, and hotspot collisions — per hotspot, which branches have pending edits
(three-dot diff of each branch against `{base}` for that file). Lead with any hotspot edited by two non-owners.

---

## Done when

- every epic has a readiness row and a track; manual epics have no worktree or runbook;
- legacy per-item or phase-style material was never handed directly to implement;
- descoped items reached task generation as exclusions;
- dependencies, owned hotspots, shared building blocks and landing order were shown before any worktree
  existed;
- `_cross-epic/` was committed on `{base}` before fan-out;
- each runbook contains install → doc fixes → implement (`single-branch` unless `--waves`) → port override
  → sync protocol;
- worktrees were created only after confirmation, on `<type>/<feature-slug>` branches cut from `{base}`;
- no product code was written in this session.
