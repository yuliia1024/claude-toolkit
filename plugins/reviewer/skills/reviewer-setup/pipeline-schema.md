# `pipeline.yml` reference

`pipeline.yml` is the wiring diagram of a generated review: which briefs run, in what order, and how their
output is filtered and printed. It lives at `.reviewer/pipeline.yml`.

## Status of this format

The keys below are **this plugin's own notation**. They are what `/reviewer:review` reads, and they are
deliberately small. A hosted MR-review service will have a format of its own; when you connect one, write
a translation (or a second file) and record in `.reviewer/README.md` which keys were mapped and which could
not be confirmed. Never add a key to the generated file on a hunch and present it as supported.

## Minimal example

```yaml
# Purpose: review every MR on the billing service.
# Trigger: no lower bound — the costly bugs here were one-line sign and rounding slips.
title: billing-service MR review

trigger:
  diff_lines_min: 0        # 0 → nothing is too small to review
  diff_lines_max: none     # none → no upper bound

steps:
  - id: begin
    role: entry

  - id: coordinator
    role: router
    brief: agents/coordinator.md

  # Baseline reviewers: earn their slot on any change.
  - id: correctness
    role: reviewer
    brief: agents/correctness.md
  - id: claims
    role: reviewer
    brief: agents/claims.md

  # authz is here because every route resolves an account id from the URL.
  - id: authz
    role: reviewer
    brief: agents/authz.md

  - id: judge
    role: filter
    filter_prompt: |
      <drop policy — see agent-authoring.md, "The judge">

  - id: report
    role: sink
    report:
      one_comment_per_finding: true
      cluster_by_file: false
      add_overview: true

flow:
  - begin -> coordinator
  - coordinator -> correctness
  - coordinator -> claims
  - coordinator -> authz
  - correctness -> judge
  - claims -> judge
  - authz -> judge
  - judge -> report
```

## Key reference

**Top level**

| Key | Type | Notes |
|---|---|---|
| `title` | string | Human label shown in the run header. |
| `trigger.diff_lines_min` | int | MRs with fewer changed lines are not reviewed. `0` disables the floor. |
| `trigger.diff_lines_max` | int or `none` | MRs above this are not reviewed. `none` disables the ceiling. |
| `steps` | list | Every node in the graph. Order in the file is cosmetic; `flow` decides execution. |
| `flow` | list of `"a -> b"` strings | Directed links between step ids. |

**Per step**

| Key | Applies to | Notes |
|---|---|---|
| `id` | all | Unique within the file. Referenced by `flow`. For reviewers, matches the brief's file name. |
| `role` | all | One of `entry`, `router`, `reviewer`, `filter`, `sink`. Exactly one `entry`, one `router`, one `filter`, one `sink`. |
| `brief` | `router`, `reviewer` | Brief file location, resolved against the `.reviewer/` folder. |
| `filter_prompt` | `filter` | The judge's drop policy, as a literal block (`|`). |
| `report.one_comment_per_finding` | `sink` | `true` → one comment each; `false` → a single combined comment. |
| `report.cluster_by_file` | `sink` | Group findings under their file. |
| `report.add_overview` | `sink` | Prepend a short summary of the run. |

## Topology rules

The graph always has the same silhouette: **entry → router → reviewers (fan-out) → filter (fan-in) → sink.**

1. The router is alone in its stage. Its brief is input to every reviewer, so it cannot run beside them.
2. Reviewers have no links between each other. If one seems to need another's output, that logic is the
   judge's job.
3. Every reviewer has a link into the filter. A reviewer wired straight to the sink bypasses the only
   noise control the pipeline has.
4. No cycles; every step reachable from `entry`. A step that is declared but never linked does not run and
   does not complain — check for it explicitly.

## Picking the trigger bounds

Default to `diff_lines_min: 0` wherever wrong output leaves the building — invoices, filings, permissions,
data other systems consume. Small diffs are where inverted conditions and off-by-one boundaries hide. Raise
the floor only for a repo where a mistake is cheap, and **write the reason in a comment beside the number**;
an unexplained threshold tends to creep upward until little gets reviewed.

Use `diff_lines_max` only to keep vendored or generated bulk out. Prefer excluding those paths outright,
because a ceiling also lets a genuinely large refactor through unreviewed.

## Comments are part of the format

Write a comment above each group of reviewers saying why that group exists in *this* repo. Two readers
depend on them: the next maintainer, who needs to tell deliberate choices from leftovers, and `:sync`, which
reads them (together with `.reviewer/README.md`) before proposing changes.
