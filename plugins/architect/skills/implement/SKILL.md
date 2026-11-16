---
name: implement
description: 'Turn a feature''s task plan into code: the contracts slice lands first on its own branch, then each wave fans out to backend agents in separate worktrees (one branch per task, named by what it does), and a local verification branch runs the full unit + e2e gate before anything is pushed.'
---

# Implement

Backs `/architect:implement`. Input is the task plan written by `/architect:create-tasks`; output is a set
of local, gated commits on well-named branches plus ready-to-paste PR descriptions. Every task — the
contracts slice and the backend slices — is handed to the stack's backend agent.

## The shape of a run

| Step | What happens | Blocks the next step? |
|---|---|---|
| Readiness | resume state, plan validation, rules, environment probe | yes |
| Naming | every branch name is computed up front and printed | yes (and `dry run` stops here) |
| Contracts | the contracts + validations task is built alone, in the main checkout | yes — nothing else starts until it is committed |
| Waves | tasks of one wave are built concurrently, one agent + worktree + branch each; waves run in order | each wave waits for the previous one |
| Whole-feature check | everything is merged on a throwaway local branch; full typecheck, lint, unit, coverage, e2e | yes |
| Review | the stack's `review-changes` pass over the combined diff | yes |
| Hand-off | PR drafts shown; pushing waits for an explicit yes | — |
| Wrap-up | report, progress files, worktree cleanup | — |

Three things hold throughout:

- **A task is a slice, the architecture is the spec.** A task file may cover several related endpoints;
  it only points at the architecture anchors (api-contract, data-model, business logic, validation),
  and the agent reads those for every endpoint it owns.
- **Local commits are part of the deal; remote actions are not.** Running the command means accepting
  one local commit per task. Pushing and opening PRs happen only after the user says yes.
- **Git names describe the change, never the plan.** Branches, commit subjects and PR titles say what
  the code does. Task numbers, ticket keys and words like "task"/"ticket" stay inside the docs.

## Settings it reads

- `{docs-root}` and the task folder `{docs-root}/{feature-slug}/tasks/` — same resolution as create-tasks.
- Lint / typecheck / test / e2e commands and the task runner — from `.claude/toolkit.json` and
  `CLAUDE.md`. Nothing is assumed about which runner the project uses.
- The shared-contract package (alias + path) when the project has one, e.g. `@org/contracts`.
- Branch and commit conventions — `.claude/rules/shared/git-workflow.md`. A project-specific scheme in
  that rule wins over the defaults below.
- The backend agent for the enabled stack (`backend` for Node, `backend-python` for Python).

---

## Arguments

`$ARGUMENTS` = a selector, then optional modifiers.

**Selector** (one of):

| Form | Meaning |
|---|---|
| `{docs-root}/{feature-slug}/tasks/` | that task folder |
| `order-delivery` | the feature slug; resolves to its task folder |
| `all` | every task, in wave order |
| `next` | first task without the `IMPLEMENTED` marker |
| `01-03`, `01,03,05` | a range or list of internal task ids |

No selector: find the most recently modified task folder and ask the user to confirm it.

**Modifiers:**

| Modifier | Effect |
|---|---|
| `sequential` | no worktrees; tasks are built one after another in the main checkout, still one branch each |
| `single-branch` | one branch and one PR for the whole run: tasks go in wave order on the current branch, each gated and committed; no per-task branches, no fan-out, no wave branches. Multi-epic runbooks pass this by default so an epic arrives as a single reviewable PR |
| `stacked` | review per wave instead of per task (see *Review layouts*) |
| `target {branch}` | the branch PRs point at, instead of the contracts branch |
| `no e2e` | skip the e2e part of the whole-feature check; everything else still gates |
| `dry run` | stop after printing the branch plan; write no code |

---

## Step 1 — Readiness

### 1a. Pick up where the last run stopped

If `{progress-root}/{feature-slug}/progress.md` exists (folder and format: `${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md`),
read it first — before interpreting `next` or scanning mtimes. Its technical section names the branches,
worktrees and wave that were in flight. Cross-check against git (`git branch --list`, `git worktree list`,
the `IMPLEMENTED` markers). The file tells you what was intended; git tells you what is true. Report any
disagreement before continuing.

### 1b. Refuse a broken plan

Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-architecture.mjs --feature {feature-slug}`. Errors
(dead anchors, unindexed tasks, misplaced dependencies) mean the plan contradicts itself. Stop, list
them, and point the user at `/architect:create-tasks`; a parallel run on a bad plan wastes every agent.

### 1c. Load rules and the plan

- Read every backend rule under `.claude/rules/` (`backend-node/**` or `backend-python/**`, nested
  folders included), all of `.claude/rules/shared/`, the validation-error contract doc if the project
  has one, and `.claude/CLAUDE.md`. They bind this orchestrator and every agent it starts.
- From the tasks `README.md` take the task table, the wave list and the dependency graph, and confirm
  the architecture folder it points to exists. No wave list (older plans)? Derive waves by topological
  level of `Depends on`, with the contracts task alone in the first.

### 1d. Sanity checks on the plan

- The first task must be the contracts + validations slice and everything else must depend on it.
  If not, stop — this ordering is not negotiable; regenerate the plan.
- Two tasks of the same wave must not create the same new file. If they would, move one to a later
  wave for this run and say so.
- A task bundling unrelated endpoints or more than one new entity is too large for one agent. Flag it
  and suggest re-splitting in create-tasks; do not re-slice it here.

### 1e. Tracking

Keep a session todo list (per task: build, gate, commit, PR draft). The durable record lives in
`{progress-root}/{feature-slug}/`, formats per the status skill:

- **Before each wave fans out:** rewrite `progress.md` — stage `implement`, current wave of total,
  and an in-flight row per task with its branch and worktree path, plus the resume command. Writing it
  first means an interrupted wave still leaves an accurate map.
- **After each task finishes or is blocked:** append a `worklog.md` entry (plain-language outcome on
  top; the technical field table and the changed-files table inside `<details>`, the latter generated
  from `git show --name-status {sha}` with `path:start-end` pointers to the few lines worth reading), then
  update that task's row in `progress.md`.
- **At wrap-up:** final `progress.md` rewrite (done / paused / blocked, exact resume command, worktrees
  still present), a closing worklog entry, and the feature's row in `{progress-root}/README.md`.

### 1f. Environment probe

Do this before any branch is created, decide a strategy, and paste that strategy into every agent
prompt so no agent rediscovers it.

1. **Runtime pin.** Compare the active runtime major version with `.nvmrc` / `.node-version` /
   `.python-version` (or equivalent). On mismatch, stop and ask the user to switch (`nvm use`,
   `fnm use`, `pyenv local`, …) and re-run. Native modules in monorepo runners are compiled against the
   pinned ABI; the wrong runtime shows up later as cryptic native-binary or daemon crashes and forces the
   slow path. Install-time engine checks do not catch a shell switched afterwards.
2. **Runner health.** Run something cheap through the task runner (list projects, typecheck the contracts
   package). If it dies with a native/daemon error, do not try to repair the install. Switch every gate
   to the underlying tools: the compiler against the backend config with `--noEmit --incremental`, the
   linter on changed files with `--fix`, the test runner on explicit spec paths. Build the contracts
   package once and let every agent reuse the output.
3. **Worktree health.** Sandboxes often refuse writes to `.claude/**`, `.mcp.json`, `.vscode/**`, which
   leaves those paths looking deleted in a fresh worktree. Agents must then
   `git restore --source=HEAD -- <paths>` and stage only their own files by name. If checkout is badly
   broken, or the test runner cannot resolve modules from inside a worktree, choose sequential mode.
   Under a restrictive sandbox, sequential is the safer default.
4. **e2e infrastructure.** Check the container runtime (`docker info` or similar). Absent → e2e will be
   reported as not run, with the reason. Unit, lint and typecheck still gate.
5. **Plan-mode leakage.** Spawned agents inherit plan mode and come back with plans. Every agent prompt
   opens with an explicit instruction to write code and commit, never to plan or call ExitPlanMode. If a
   plan comes back anyway, leave plan mode and respawn, passing the plan file so research is not repeated.
6. **Keep gates cheap.** Agents write the whole slice, then gate once; re-gate only on real failures.
   While iterating, typecheck incrementally and lint only touched files; run the full compile and full
   suite once at the end. Warm the incremental caches with one throwaway run before each wave. Use the
   project's generators for module/entity/controller skeletons. Hand a re-run agent its earlier notes.
7. **Model.** Every spawned agent — builders, fixers, verifiers — gets an explicit top-tier `model`
   override regardless of the task's `Effort` column, and the orchestrator itself must run on that tier.
   `Effort` is for estimating duration and batching only; cheaper models on "simple" tasks are where
   contract drift sneaks in.
8. **Shared grounding.** If create-tasks produced an implementation-grounding appendix (exemplar files,
   exact signatures), include it in every prompt. If not, do one grounding read yourself and pass the
   result to all agents, rather than letting each one explore the same files.

---

## Step 2 — Naming

`git status --short` first. Unrelated uncommitted changes → ask the user to commit or stash them;
worktrees fork from HEAD and a dirty tree breaks isolation.

### 2a. Branch types

Default scheme from the git-workflow rule: `<type>/<short-kebab-summary>`, 2–5 words, no nested
slashes, no task numbers or ticket keys.

| type | pick it when the task… |
|---|---|
| `feat` | adds behaviour, an endpoint, or contracts that new behaviour needs |
| `fix` | corrects existing behaviour |
| `refactor` | restructures without changing behaviour |
| `perf` | makes something measurably faster or cheaper |
| `test` | only adds or repairs tests (e.g. a dedicated e2e slice) |
| `docs` | only changes documentation |
| `chore` | tooling, dependencies, config, scaffolding, and local-only helper branches |
| `ci` | pipeline or build configuration |

### 2b. How each name is derived

The orchestrator computes all names before any branch exists, so the plan is reproducible:

1. **Type** — from the task's nature using the table above (read the task's goal and work items, not
   just its title). When unsure between `feat` and `chore`, ask: would a user or API client notice? Then `feat`.
2. **Summary** — from the task title: lowercase, drop ids, numbering, articles and filler words
   ("implement", "add", "the", "task", "ticket"), keep the 2–5 most specific words, join with `-`.
   Prefix with the feature's key noun when the title alone would be ambiguous across features.
3. **Uniqueness** — collect existing names (`git branch -a --format='%(refname:short)'`) plus names
   already assigned in this run. On collision append `-2`, `-3`, … in task order. Never reuse a name.

| Role | Pattern | Example (feature `order-delivery`) |
|---|---|---|
| Contracts branch (also the review base) | `feat/{feature-slug}-contracts` | `feat/order-delivery-contracts` |
| Task branch | `{type}/{summary}` | `feat/courier-eta-endpoint`, `fix/delivery-window-overlap`, `test/order-delivery-e2e` |
| Wave branch (`stacked` only) | `{type}/{what the wave delivers}` — dominant type of its tasks, summary from their shared subject | `feat/courier-assignment-and-eta`, `feat/delivery-status-notifications` |
| Verification branch (never pushed) | `chore/verify-{feature-slug}` | `chore/verify-order-delivery` |

For wave branches: if all tasks share a subject word, build the summary around it
(`courier-eta-endpoint` + `courier-assignment` → `courier-assignment-and-eta`); otherwise use the user-visible
capability the wave completes. Same uniqueness rule.

**Commit subjects** follow the same types: `feat: expose courier ETA endpoint`,
`feat: add order-delivery request contracts and validation codes`. One commit per task, with the usual
`Co-Authored-By` trailer. No task ids in subject or body.

### 2c. Print the plan

Print a table — wave, task id (internal), branch, forks from, PR target, agent, isolation mode. On
`dry run`, stop after this.

### 2d. Review layouts

**Per-task PRs (default).**

| Branch | Forks from | PR into | Merge order |
|---|---|---|---|
| `feat/order-delivery-contracts` | default branch | default branch | last — it carries the whole feature home |
| each task branch | the contracts branch, or the branch of a task it depends on in an earlier wave | the contracts branch (or `target`) | any order once green |
| `chore/verify-order-delivery` | the contracts branch | — (local only) | never merged |

Each task PR shows only its own slice against the contracts. Good when there are few tasks or reviewers
want to merge them individually.

**Stacked per-wave PRs (`stacked`).** Tasks are still built on their own branches in their own worktrees;
review happens per wave. When a wave's tasks are green, merge them `--no-ff` in plan order into the wave
branch, and that branch gets the PR.

| Branch | Forks from | PR into |
|---|---|---|
| contracts branch | default branch | default branch (merged last) |
| first wave branch after contracts | contracts branch | contracts branch |
| every later wave branch | the previous wave branch | the previous wave branch |

Consequences: each wave PR's diff contains just that wave; later tasks automatically see everything
earlier (no per-dependency fork points); same-wave merges are conflict-free because same-wave tasks never
share new files. Merge deepest-first: top wave into the one below, … , first wave into contracts, contracts
into the default branch. With `target {branch}` the stack flattens — every wave PR points at that branch and
they reference each other in their descriptions. Choose stacked when a per-task PR count would swamp reviewers.

---

## Step 3 — Contracts (main checkout, alone)

1. Create the contracts branch from the current/default branch.
2. Build the contracts task from its file and the architecture's validation and type/enum blocks:
   enums (state/kind enums and the validation-code enum) → request/response types with dates typed as
   `string` → route constants → index exports of the package. After that the validation layer: DTO
   decorators, required-ness decorator leading as the error-handling rule says, a per-field code map,
   codes for cross-field rules, and step hints for wizard-style flows.
3. Gate with the strategy from 1f (runner or direct tools): lint + typecheck of the contracts package,
   plus the backend config if DTOs live there. Build the package once here for reuse.
4. Commit (`feat: …` subject describing the contracts).
5. Draft the PR description into `{docs-root}/{feature-slug}/tasks/_pr/{id}.md` (format in Step 7).
6. Mark the task `IMPLEMENTED` in its file and in the README table.

Waves do not start until this commit exists.

---

## Step 4 — Waves

### 4a. Cross-epic checkpoint (only when `{progress-root}/_cross-epic/` exists)

This run is one of several epics. At the start of each wave, before spawning anyone, run the sync
protocol from the multi-epic skill: rebase if a sibling landed on the base branch, read the shared-assets
ledger from every sibling branch (`git show <branch>:<path>`), `git grep` sibling branches before
creating anything reusable (found → consume it or leave a TODO pointing at it), and touch hotspots you do
not own only by appending or by filing a `needed-by` ledger row. After the wave, record its new reusable
assets in this epic's ledger section. Copy the relevant ledger rows and hotspot rules into each agent
prompt — agents cannot discover them from inside a worktree.

### 4b. Choosing isolation per wave

| Situation | How the wave runs |
|---|---|
| 2+ independent tasks, worktrees healthy | one backend agent per task, all spawned in one message, each with `isolation: "worktree"` |
| 2+ tasks, worktrees can build but tests fail inside them | parallel worktrees, then the main-checkout verification pass (4e) |
| 1 task | main checkout, one agent, no isolation — keeps the incremental cache warm and the test runner working |
| `sequential`, or worktrees unusable | main checkout, one task at a time (4f) |

A lone worktree buys no concurrency and costs a cold compile cache; in one recorded run a solo task took
about three hours in a worktree versus well under an hour in the main checkout.

A task depending on an earlier-wave task forks from that task's branch; otherwise from the contracts
branch (or, under `stacked`, from the previous wave branch). Tell each agent its exact fork point.
Finish a wave completely before starting the next.

### 4c. Agent brief

Fill this in per task and send it with the backend `subagent_type`, the isolation chosen above and the
top-tier model:

```
Plan mode does not apply to you. Write the code and commit it. Do not produce a plan and do not
call ExitPlanMode; if you notice plan mode is on, stop and say so.

Feature: {feature-slug}. Your slice: {task title}.
Branch to create: {branch}   (fork point: {fork-branch})
Commit subject: {type}: {what the change does}   — no task ids, no ticket keys.

Sources of truth — open each one, for every endpoint in your slice:
  - slice scope and acceptance:   {task file path}
  - endpoint contract (auth, request, response, errors):
                                  {docs-root}/api-contract/{feature-slug}.md#{anchors}
  - schema (columns, indexes, enums, migrations):
                                  {docs-root}/data-model/{feature-slug}.md#{anchors}
  - rules, state machines, side effects: the feature's business-logic block
  - validation codes:             the feature's validation block
  (find block filenames via the Role column of the architecture README's block index; never guess numbers)
Project rules: everything relevant under .claude/rules/ (backend + shared) and the validation-error doc.

Environment (decided by the orchestrator, do not re-probe): {runtime ok | runner vs direct tools |
exact gate commands | e2e available?}. Grounding: {appendix or shared notes}. Prior attempt notes: {path|none}.
Cross-epic rules: {ledger rows + hotspot etiquette | n/a}.

Contracts already exist on your fork point — import them from {contracts alias}; never redefine them.
In a worktree, if .claude/**, .mcp.json or .vscode/** show as deleted, restore them from HEAD and stage
only files you wrote, by name.

Do:
  1. Build the whole slice and nothing outside it. Reuse existing patterns and generators.
     Write everything, then gate — not after every file.
  2. Tests: unit tests for services and controllers covering every endpoint; an e2e spec per endpoint
     flow; update every existing e2e spec your change breaks (routes, payloads, fixtures, seeds).
     Read the changed project's coverage threshold first and meet it; never lower it or exclude paths.
  3. Gate: typecheck + lint must pass. Unit tests must pass; if the runner cannot resolve modules inside
     this worktree, verify the logic, say so, and leave the authoritative run to the orchestrator.
  4. Self-review against the checklist below; any miss blocks the commit.
  5. One commit (squash work in progress), then write the PR draft to {pr-draft path} using the
     template you were given.

Reply with exactly one JSON object (shape below), nothing else.
```

Reply shape (the orchestrator parses this):

```json
{
  "slice": "courier ETA endpoint",
  "outcome": "built | blocked",
  "git": { "branch": "feat/courier-eta-endpoint", "forkedFrom": "feat/order-delivery-contracts", "commit": "a1b2c3d" },
  "touched": [ { "path": "apps/api/src/…/eta.controller.ts", "change": "added | modified | removed" } ],
  "checks": [
    { "name": "typecheck", "result": "green | red | not-run", "note": "" },
    { "name": "lint",      "result": "green | red | not-run", "note": "" },
    { "name": "unit",      "result": "green | red | logic-only", "note": "worktree resolution issue" }
  ],
  "coverage": [ { "project": "api", "required": 80, "measured": 84.2 } ],
  "e2eSpecs": { "added": [], "updated": [], "unaffectedBecause": "" },
  "departures": [ "anything that differs from the spec, and why" ],
  "prDraft": "{docs-root}/{feature-slug}/tasks/_pr/{id}.md"
}
```

Self-review checklist for agents (each item mapped to the project's own rule):

- Errors use the project's error envelope with enum codes; no ad-hoc message/field objects or string codes.
- Multi-rule validation collects all violations before failing; DB uniqueness/constraint errors are
  translated in the repository layer.
- Every request DTO field is validated; required fields start with the presence decorator.
- API docs declare every status the endpoint can return, with a validation-error example for 400.
- Reads are scoped to the owner; ownership is checked before any write.
- Writes record an audit entry in the same transaction, when the project audits.
- Domain values are compared through enum members, never string literals.
- Long functions are split into private helpers; non-trivial entity construction goes through a mapper.
- Path parameters are primary keys as the REST rule prescribes, not human-readable codes.
- Notification or email copy is taken verbatim from the `_template-sources.md` the task references.

### 4d. Collecting a wave

- Parse each reply. Red checks or a crashed agent → one retry with the failure attached. Second failure
  → mark the task `BLOCKED` with the reason and carry on with the rest.
- Do not merge task branches into the contracts branch now; combining happens on the verification branch.
- Mark finished tasks `IMPLEMENTED` (task file + README).
- Under `stacked`: create the wave branch from its fork point and merge the wave's green task branches
  `--no-ff` in plan order (blocked ones left out). Append a worklog entry for the consolidated wave.

### 4e. Main-checkout verification pass

When agents could build but not test inside worktrees (no local `node_modules`, upward resolution),
their `unit` result is only `logic-only`. Fix that one branch at a time in the main checkout:

1. Remove the idle worktree (`git worktree remove <path>`; `--force` only if it is clean apart from
   build output), check the branch out.
2. Run the full backend typecheck (exact config; ignore unrelated repo-wide noise) and the branch's specs.
3. Red → a fixer agent (no isolation) repairs it and folds the fix into the branch's one commit; re-gate.
4. Next branch only when this one is green.

Building stays parallel; verification becomes real. For single-task waves this pass is unnecessary.

### 4f. Sequential mode

For `sequential`, or when worktrees are unusable: for each task, check out its branch from its fork point
in the main checkout, run one agent without isolation to build, gate and commit, then move on. Same
branches, same PRs, no concurrency. Keep the cheap-gate habits from 1f. Remove stale worktrees before
checking their branches out (git refuses a branch checked out twice).

---

## Step 5 — Whole-feature check

### 5a. Verification branch

```bash
git switch -c chore/verify-order-delivery feat/order-delivery-contracts
git merge --no-ff feat/courier-eta-endpoint      # each built task branch, wave order
git merge --no-ff feat/delivery-status-notifications
```

Under `stacked`, skip this: the top wave branch already contains everything — check it out and run the
gates there. Same-wave tasks cannot conflict; anything non-trivial across waves is reported, not guessed.
This branch is local-only and never pushed.

### 5b. Gates of record

In the main checkout, run the full typecheck, lint and unit suite for the contracts package and the backend
(runner or direct tools). This is the first place the complete unit suite is guaranteed to run.

Then coverage as CI would see it: rerun with coverage for every project the diff touches and compare to
the threshold configured for that very project (`coverageThreshold`, `fail_under`; monorepos vary). Below
threshold is a failed pipeline even when tests pass — add tests; never relax the threshold.

### 5c. e2e (unless `no e2e`)

1. **Align the suite first.** List existing e2e specs affected by the feature (routes, payloads, selectors,
   fixtures, seeds) and confirm each was updated; fix the stragglers on this branch. Stale old specs are
   the usual reason a pipeline dies at the last stage.
2. **Run** the project's e2e procedure from `CLAUDE.md` (bring infra up, apply new migrations, run, tear
   down — tear down even on failure). Infra cannot start → e2e is `NOT-RUN` with the reason.
3. **No cosmetic green.** Do not add `.only` or `skip`, raise timeouts, or delete assertions. A spec that
   must be parked gets `// TODO(parked): {reason}` and is listed as a known failure.
4. **Real-world side effects.** Before running anything that could email, charge or notify: confirm a
   test environment, a capturing/sandbox transport, and a per-run cap (`shared/external-service-safety.md`).

### 5d. Result block

```
Whole-feature check · order-delivery · on chore/verify-order-delivery
  typecheck  green          lint  green          unit  green (412 tests)
  coverage   api 84.2% (needs 80%) green · contracts 97.0% (needs 90%) green
  e2e        green (18 specs)  |  NOT-RUN: no container runtime
  e2e specs touched  orders.e2e-spec.ts, delivery.e2e-spec.ts  |  none affected: {why}
  slices included    contracts, courier ETA endpoint, delivery status notifications
```

A red gate → identify the owning branch, fix it there, re-merge, re-run. Never report green over red.

---

## Step 6 — Review (required)

Run the stack's `review-changes` command (`/node:review-changes` or `/backend-python:review-changes`,
matching the enabled stack) on the combined diff: verification branch vs contracts branch, or under
`stacked` each wave branch vs the branch below it. It catches what gates miss — file and function size,
error-envelope conformance, audit-in-transaction, API-doc gaps, N+1 queries, duplication, missing tests.
Apply fixes on the owning branch, re-merge, re-gate. Record findings and their resolution in the PR drafts;
a draft is not ready while findings are open without a stated reason for deferring.

---

## Step 7 — Hand-off (push only with approval)

### 7a. PR drafts

One file per PR in `{docs-root}/{feature-slug}/tasks/_pr/` (named by internal id — the filename never
reaches git). Title = the commit subject. Body, in this order:

```markdown
## What changes
{two or three sentences in product terms: who can now do what}

## How
- `{path}` — {one line}
- …

## Compatibility
{migrations, contract changes, config or env additions — or "none"}

## Checks
| check | result |
|---|---|
| typecheck / lint / unit | green on the branch and on the verification branch |
| coverage | api 84.2% (needs 80%) |
| e2e | green (18 specs) · or NOT-RUN: {reason} |
| review-changes | {n} findings, all resolved · or {deferred + why} |

## Read with
Builds on `feat/order-delivery-contracts`. Design: {links to the architecture anchors}.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

No task numbers, ticket keys or "closes …" lines anywhere in the title or body.

### 7b. Ask

```
Ready to push (nothing has left this machine yet):
  feat/order-delivery-contracts      → main                           contracts + validation codes
  feat/courier-eta-endpoint          → feat/order-delivery-contracts
  feat/delivery-status-notifications → feat/order-delivery-contracts
  chore/verify-order-delivery        local only
Push these and open the PRs? (yes / no — branches stay local either way)
```

### 7c. After a yes

Do not push from the sandbox. Print the commands for the user to run in the session, one per branch,
contracts first, with whatever PR-opening flags the host needs (GitLab push options,
or `gh pr create --base … --title … --body-file …` on GitHub):

```bash
git push -u origin feat/order-delivery-contracts   # then open PR → main
git push -u origin feat/courier-eta-endpoint       # then open PR → feat/order-delivery-contracts
```

---

## Step 8 — Wrap-up

```
order-delivery — implementation run complete
  slices       5 of 6 built · 1 blocked
  branches     contracts + 5 task branches (+ chore/verify-order-delivery, local)
  PR drafts    6, in {docs-root}/order-delivery/tasks/_pr/
  gates        typecheck/lint/unit green · coverage green · e2e NOT-RUN (no container runtime)
  worktrees    5 removed · 1 kept (blocked slice, uncommitted work)

  feat/order-delivery-contracts       built
  feat/courier-eta-endpoint           built
  fix/delivery-window-overlap         blocked — migration conflicts with existing index

  next: read the drafts → approve the push → merge the task PRs, then contracts into main
```

Then finish tracking from 1e (final `progress.md`, closing worklog entry, index row), including what
happened to each worktree.

### Worktree cleanup (the run that created them removes them)

Every worktree is a full checkout and, after install, its own dependency tree. Left behind they eat disk
and block later checkouts of the same branch.

```bash
git worktree list
git -C <path> status --short     # anything uncommitted?
git worktree remove <path>       # plain remove; refuses when dirty
git worktree prune
```

Remove worktrees whose branch is committed. Never force-remove a dirty one without saying what would be
lost and getting a yes. Worktrees holding uncommitted work or a blocked slice stay, with a reason given.
For merged branches, test reports and caches point the user at `/core:cleanup`; the rule of record is
`shared/worktree-hygiene.md`.

---

## Non-negotiables

- Contracts are committed before any wave starts.
- One slice → one agent → one worktree → one branch → one PR (outside `single-branch`). Same-wave agents
  never share a worktree or a new file.
- Agents build from the cited architecture anchors for every endpoint in their slice; they never invent
  scope or re-declare contracts.
- Every slice passes its own gates; e2e runs once, on the combined branch, because infra is shared.
- One retry, then `BLOCKED`, and the run continues.
- Git names, commits and PR text describe the change only — no task ids, ticket keys or task wording.
- Commit locally; push and open PRs only after an explicit yes, and let the user run the push.
- Report what actually happened: `NOT-RUN` is a valid result, a hidden failure is not.
- The environment probe runs first and its verdict travels with every agent.
