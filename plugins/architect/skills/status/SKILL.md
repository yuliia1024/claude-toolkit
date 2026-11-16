---
name: status
description: Answers "where was I?" — reads the tracking files of every feature in the progress folder, places each feature in the pipeline, and prints the command that picks it up again. This file is also the single definition of the progress folder and its file formats — every skill that writes them links here instead of restating them.
---

# Status

Backs `/architect:status`. Use it after any interruption — overnight, a crashed run, a week on another
project — or before taking over someone else's feature. It answers three questions without archaeology:
**what is finished, where is it, and what exactly do I type next.**

## Where tracking lives

Architecture docs say *what* is being built; the progress folder says *how far along* it is. They are
kept apart so one folder shows all work in flight.

| Path | Kind | Question it answers |
|---|---|---|
| `README.md` (at the root) | index — a row per feature | which features are moving at all? |
| `{feature-slug}/progress.md` | the present — **overwritten** whenever it is written | current position, next move, how to continue |
| `{feature-slug}/worklog.md` | the past — **only appended to** | what was done and when, and where to inspect it |

(All three live under `{progress-root}`.)

`{progress-root}`: a path configured in `.claude/toolkit.json`, otherwise a `progress/` folder next to the
architecture docs root (`docs/architecture/` → `docs/progress/`). Create the folder, the feature
subfolder and the index on first write.

State and history obey opposite rules — one must be overwritten so there is a single "now", the other must
never be overwritten so it stays trustworthy — which is why they are two files.

### Readers, and the two layers

Product owners, analysts and clients read these files as often as the next working session does. So each
file has:

- **a plain layer on top** — what users can now do, what is under way, what is needed from whom. No
  branch names, file paths, command names or wave counters. Written in the project's working language
  (the language of the requirements).
- **a technical layer below, inside one collapsed `<details>`** — in English, and exhaustive: branch,
  worktree, commit, PR, gate results, resume command. A resuming session must never have to guess a name.

---

## `progress.md` (whole file replaced each time)

```markdown
# {Feature Name} — progress

> {One plain sentence on purpose and progress. e.g. "Couriers will see live delivery
> ETAs; the design is approved and about half of it is built."}

**State:** {🔨 building · 3/4 | ⏸ paused | ⛔ needs you | ✅ done} — **as of** {YYYY-MM-DD}

| | Step | Meaning | |
|---|---|---|---|
| 1 | Blueprint | technical design written and reviewed | ✅ {date} · [open](../../architecture/{feature-slug}/README.md) |
| 2 | Work breakdown | split into {N} buildable pieces | ✅ · [list](../../architecture/{feature-slug}/tasks/README.md) |
| 3 | Building | {done}/{N} pieces built + checked | 🔨 |
| 4 | Handover | merged, docs current | ⬜ |

**Works now:** {plain list}
**Being built:** {plain list}
**Still to come:** {plain list}
**Needed from you:** {approvals, open questions — or "nothing"}

<details><summary>Technical state</summary>

| field | value |
|---|---|
| resume | `/architect:implement docs/architecture/{feature-slug}/tasks/` |
| stage | {architecture \| tasks \| implement} · wave {k}/{W} · layout {per-task \| stacked \| single-branch} |
| review base | `feat/{feature-slug}-contracts` → `{default branch}` |
| live worktrees | {paths, or "none"} — confirm with `git worktree list` |
| before resuming | {branches to inspect, gates to re-run} |
| links | [worklog](./worklog.md) · [PR drafts](../../architecture/{feature-slug}/tasks/_pr/) |

In flight:

| piece | branch | worktree | last finished step | next / failing |
|---|---|---|---|---|
| courier ETA endpoint | `feat/courier-eta-endpoint` | `{path}` | committed | unit tests red: {what} |
</details>
```

Rules:

- **Replace, don't append.** History belongs in the worklog.
- **Write before and after.** Record in-flight work (piece, branch, worktree) *before* starting it and the
  result *after*. That ordering is what makes any interruption recoverable.
- **Plain on top, precise below.** The steps table names outcomes, never commands. The technical block names
  real branches, paths and commands — "continue implementation" is not a resume line.
- **The resume line must run.** Check that every path in it exists before writing it.
- Update the feature's index row whenever State or the date changes.
- One progress file per feature, written by whichever command is driving it right now.

## `worklog.md` (append at the end, oldest first)

```markdown
# {Feature Name} — worklog

## {YYYY-MM-DD} — {plain outcome, e.g. "Couriers can see an ETA for each delivery"} ✅

{1–3 plain sentences: what a user can do now (or what was decided), and what is intentionally not
included yet.}

Read: [spec of this piece](../../architecture/{feature-slug}/tasks/{task file}.md) · [its PR draft](../../architecture/{feature-slug}/tasks/_pr/{id}.md)

<details><summary>Technical record</summary>

| field | value |
|---|---|
| command | `/architect:implement` · wave 2 |
| branch | `feat/courier-eta-endpoint` → `feat/order-delivery-contracts` |
| worktree | `{path}` — {removed \| kept: reason} |
| commit · PR | `{short sha}` · {PR link or —} |
| gates | typecheck ✅ · lint ✅ · unit ✅ · e2e {✅ \| at whole-feature check \| NOT-RUN: reason} |

Files at `{short sha}` (line ranges valid for that commit):

| file | change | look at |
|---|---|---|
| `apps/api/src/delivery/eta.controller.ts` | added — GET route | `eta.controller.ts:10-41` |
| `apps/api/src/delivery/eta.service.ts` | added — ETA calculation | `eta.service.ts:22-58` |
| `libs/contracts/src/delivery.type.ts` | modified — `CourierEtaRes` | `delivery.type.ts:30-37` |
| lockfile, snapshots | regenerated | — |
</details>
```

Write the headline for a stakeholder:

- ✗ "Added GET /deliveries/:id/eta controller + service; specs green."
- ✓ "Customers can see when their courier will arrive. Live map tracking comes later."

Rules:

- **Append only.** Corrections are new entries. Appending also keeps parallel runs from conflicting.
- **One entry per meaningful outcome** — approved blueprint, generated breakdown, finished piece,
  consolidated wave, applied requirement change. Not per file edit; that is what `git log` is for.
- **The technical record is a filled table.** Empty values are `—`, never omitted rows.
- **File tables come from git** (`--name-status` output for the sha, or the wave diff). Each created,
  changed or deleted source file gets a row; generated files share one row. `look at` gives
  `path:start-end` for the two or three places a reviewer should read, valid at the recorded sha.
- **Doc-writing commands list their docs** (create-architecture, create-tasks, sync) as markdown links.
- **Docs are links, code is backticks.** Doc links are relative to `{progress-root}/{feature-slug}/`
  (so architecture is under `../../architecture/…`) and checked by the validator; code paths resolve from
  the repo root and would be reported as broken links.
- Every entry answers "where do I look": spec and PR draft in the plain layer; code, branch and worktree in
  the technical one.

## The index (`{progress-root}/README.md`)

```markdown
# Features in flight

| Feature | State | As of | Files |
|---|---|---|---|
| {Feature Name} | 🔨 building · 3/4 | {date} | [state](./{feature-slug}/progress.md), [history](./{feature-slug}/worklog.md) |
```

Each writer keeps its own feature's row current (adding it if missing). `/architect:status` can rebuild the
table from the progress files on request. One row per feature.

## Which command writes what

All paths are under `{progress-root}/{feature-slug}/`.

| Command | worklog entry | progress.md |
|---|---|---|
| create-architecture | after approval: design approved (plain), blocks and assumptions linked, generation details in the technical record | stage → tasks; resume = the next command |
| create-tasks | breakdown into N pieces | stage = tasks; resume runs implement on the new task folder |
| implement | one per finished or blocked piece (plain outcome + full technical record), one per consolidated wave, one closing summary | replaced **when a wave starts** (in-flight rows before agents launch), after each piece, and at the end (done / paused / blocked + resume + live worktrees) |
| sync-architecture | product-level change in plain words; deltas, patched blocks, affected pieces under `<details>` | stale pieces → state blocked, resume regenerates them via create-tasks |
| audit-architecture | per feature that had findings: a link to the report | untouched unless the next step changes |

---

## What a run does

### Scan

Resolve `{progress-root}`, read the index and every `progress.md`. A feature with visible work but no
progress file (predates this convention) gets its state reconstructed on the spot from evidence —
architecture README, tasks README and waves, `IMPLEMENTED` markers, `_pr/` drafts, local branches named in
its PR drafts or matching its slug, live worktrees — and is labelled `(derived)`.

### Report

```
In flight — docs/progress/

  order-delivery   🔨 building 3/4 · {date}
                   next: courier ETA endpoint — unit tests red on feat/courier-eta-endpoint ({worktree})
                   run:  /architect:implement docs/architecture/order-delivery/tasks/

  billing          ⛔ needs you · design waiting for approval · {date}
                   run:  review docs/progress/billing/progress.md

  invoicing        ✅ done {date}

  refunds          (derived) breakdown exists, nothing built
                   run:  /architect:implement docs/architecture/refunds/tasks/
```

With a feature argument, go deeper: quote the plain layer (headline, steps, needed-from-you) as written,
show the latest three worklog headlines, and check the technical block against reality — resume path
exists, in-flight branches exist, worktrees appear in `git worktree list`. Where reality differs, say so
and adjust the recommendation.

### Propose, don't do

Read-only. With an explicit yes it may create a missing `progress.md` from derived state or rebuild the
index. Nothing else: no code, no architecture edits, no git commands that change state.

---

## Ground rules

- progress.md is replaced; worklog.md is appended. Never the other way round.
- Record intent before starting work, not only results after.
- Resume lines run as written; branch and worktree names are exact.
- Docs as links, code as backticks.
- Derived state is labelled as derived.
- A stakeholder reading from the top meets no jargon before the `<details>` block; inside it, nothing is
  missing.
