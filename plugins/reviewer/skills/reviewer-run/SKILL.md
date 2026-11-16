---
name: reviewer-run
description: Executes the committed `.reviewer/` pipeline against a local diff — coordinator, then reviewers concurrently, then the judge — and prints the findings without posting anything. Use it to trial a freshly generated or hand-edited pipeline, or to get the project's own review before pushing. Requires `.reviewer/`; run :init if it is missing.
---

# reviewer-run

Replays `.reviewer/pipeline.yml` on your machine. Two typical reasons:

1. **Trial** — a pipeline was just generated or edited and you want to see how it behaves before trusting
   it on real merge requests.
2. **Pre-push check** — you want this project's reviewers, not a generic pass, on your branch.

It reproduces the graph only — not a hosted runner's posting, gating or thresholds beyond `trigger`.
Output goes to the session. No `.reviewer/`? Run `/reviewer:init`. Want a generic review instead? Use a
stack's `review-changes` or `/core:judge`.

## Arguments

| Argument | Effect |
|---|---|
| *(range)* | `HEAD~1`, `main...HEAD`, a branch name. Default: working tree against the merge base with the default branch. |
| `only <ids>` | Run only the listed reviewer step ids (coordinator and judge still run). |
| `raw` | Skip the judge; print everything reviewers produced, labelled **UNFILTERED**. |
| `trace` | Also print, per step, which brief ran and which paths the coordinator pointed it at. |

## Run order

### 1. Validate the pipeline — stop on any defect

Load `pipeline.yml` and every brief it names. Refuse to run, naming the offending step, if:

- a `brief:` path does not resolve;
- there is a cycle, an unreachable step, an unlinked step, or a reviewer with no link to the judge;
- a brief has no `name`, two briefs share one, or the router/filter/sink/entry count is not exactly one each.

Do not run a partial graph. A half-run produces a report that looks complete and is not.

### 2. Prepare the change

- Resolve the range and count changed lines. If outside `trigger.diff_lines_min/max`, say so and stop; the
  pipeline's own bounds decided it, and silently overriding them would hide a bad threshold.
- Run the project's gate — the lint, typecheck and test commands from `CLAUDE.md` or the manifest. If it
  fails, report the failure and stop: on a red build every finding is confounded with breakage, and the
  pipeline exists for what passes a green one.
- Build one shared input bundle: diff, list of touched files, and the MR/commit message
  (`claims` reviews the description).

### 3. Coordinator

Run the router brief alone with the diff. Its output is the routing note. If it emits findings anyway,
discard them and flag the coordinator brief as defective in the summary.

### 4. Reviewers

Spawn every reviewer step as its own Agent **within one message** — they then run at the same time and none
sees another's work. Each receives its brief, the diff, the file list, the description and the routing note. Independence
is what makes two reviewers agreeing meaningful; sequential runs leak conclusions.

Each finding comes back with: file, line, severity (capped at the brief's `max_severity`), the claim, and the
proof the brief demands.

### 5. Judge

Send all findings, grouped by reviewer, to one judge agent with the `filter_prompt`. It removes what the code
refutes and keeps what it cannot refute. Lean toward removal: a pipeline that cries wolf loses its readers,
which costs more than an occasional miss. In addition to `filter_prompt`, these always justify removal:

- the referenced code, once read, contradicts the finding;
- the project's gate would already reject it;
- it rests on no written rule or `CLAUDE.md` invariant — it is preference;
- the same pattern is already standard across the tree — that is a codebase-wide decision, not a defect in
  this diff.

Log one line per removal: reviewer, finding, reason. On a trial run that log is the most useful output — it
shows whether the judge removes noise or real defects, and which brief needs work (do that via `:sync`).

Skipped under `raw`.

### 6. Print

Honour the sink's `report.*` settings. Order by severity, then:

```
[<severity>] <reviewer> — <file>:<line>
    <claim>
    proof: <input/actual/expected | consumer + safe deploy order | request + field + value | growth>
    origin: new in this change | pre-existing
```

Then a run summary:

```
ran:       coordinator, correctness, contracts, claims, authz
kept:      3        removed by judge: 5 (see log)
no output: contracts
failed:    authz — brief not found at agents/authz.md
```

A step that **failed** is reported as failed, never folded into "no output" — one means nothing was found,
the other means nothing was checked.

## Guardrails

- Read-only: no edits to code or to `.reviewer/` (maintenance belongs to `:sync` and `:add-agent`).
- Never posts comments anywhere.
- Never fabricates proof. If a reviewer cannot supply what its brief requires, mark the finding unproven or
  drop it.
- Only the judge removes or alters findings.
- If the user wants results in a file, that happens outside this skill and never inside `.reviewer/`.

## Related

- `reviewer-setup` — creates and maintains the pipeline this skill runs.
- `/core:cove` — fact-check one doubtful finding.
