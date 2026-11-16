# reviewer

Generates a merge-request review pipeline **for one specific repository** and stores it in that repository
under `.reviewer/`.

Off-the-shelf review bots talk in generalities, so people learn to scroll past them. A pipeline from this
plugin talks about your code: the one module allowed to round amounts, the response field that is sent to
clients unchanged, the convention that money is stored as integer cents. That specificity is the product.

The plugin **builds reviewers; it does not review**. For a one-off look at your diff use a stack's
`review-changes` (e.g. `/node:review-changes`) or `/core:judge`.

- New here? Read [`docs/GUIDE.md`](docs/GUIDE.md) — lifecycle, what `:init` does, reading a dry run, a
  half-hour walkthrough.
- Presenting it? Open [`docs/concept.html`](docs/concept.html) in a browser — a slide deck, arrow keys to
  navigate.

## Commands

| Command | Purpose |
|---|---|
| `/reviewer:init` | Surveys the code, scores 28 candidate reviewers, asks you, then generates `.reviewer/` |
| `/reviewer:review` | Dry-runs the committed pipeline locally and prints the would-be MR comments |
| `/reviewer:add-agent` | Add one reviewer — from the catalog or from a concern you describe |
| `/reviewer:sync` | Re-survey and propose fixes: stale paths, new uncovered risk, reviewers no longer needed |

Typical order: `:init` → `:review` a few times while hand-editing briefs → commit → `:sync` every few weeks.

## Generated layout

```
.reviewer/
├── pipeline.yml        trigger + graph: coordinator → reviewers (parallel) → judge → report
├── agents/
│   ├── coordinator.md  writes the routing note; never files findings
│   ├── correctness.md  one brief per chosen concern
│   └── …
└── README.md           provenance, declined reviewers, how to adjust
```

The folder is committed next to the code and read from the MR's source branch, so a change to the review
travels in the same MR as the code change that motivated it. Anyone annoyed by a reviewer can fix its
brief in the open. A central pipeline shared by many repos could not do this — it cannot name their files.

**Running it in CI.** This plugin supplies the generator and a local runner (`:review`). It does **not**
supply a hosted service that executes `.reviewer/` on merge requests. `pipeline.yml` uses this plugin's own
small key set (see `skills/reviewer-setup/pipeline-schema.md`); connecting a hosted runner means mapping
those keys to its format. Until then, `:review` is how the pipeline runs.

## How the set is chosen

1. **Classify** — new build or established codebase. In an established codebase, reviewers enforce the
   team's own conventions; a gap against an outside standard is migration work and is never reported.
2. **Survey (read-only)** — six probes, each line backed by evidence: what the project says about itself,
   conventions the code follows, where wrong output escapes, seams between deployables, where hostile input
   enters, and which files churn and get repaired most (from git history).
3. **Propose and ask** — a scored proposal, then your decisions. Declined reviewers are logged so they are
   not proposed again without new evidence.
4. **Write and gate** — every path, symbol and convention a brief cites is checked to exist before the file
   is written. The gate blocks.

## Catalog

Full definitions, including *add when* signals and *hands off* boundaries:
[the catalog reference](skills/reviewer-setup/agent-catalog.md).

| Group | Reviewers |
|---|---|
| Backbone (always) | `coordinator`, `judge`, `report` |
| Baseline | `correctness`, `contracts`, `claims` |
| Data | `migrations`, `data-integrity`, `background-jobs` |
| Security | `security`, `authz`, `secrets-and-config` |
| Around the change | `dead-code`, `dependencies`, `docs-drift`, `regression-scope`, `rules-conformance`, `tests` |
| Runtime | `performance`, `observability` |
| Frontend | `bundle-size`, `design-fidelity`, `i18n`, `accessibility`, `ui-state` |
| Discovered (examples) | `money`, `pii-compliance`, `api-contract` |

Each entry has an origin label: **stock** (template, portable), **fitted** (built from this repo's survey)
or **discovered** (exists because of something found in this code).

Aim for six to eight briefs. They run concurrently, so wall-clock time hardly grows, but tokens and reader
attention do — and overlapping reviewers are the fastest way to get the whole report skimmed.

## Contents

| Path | Role |
|---|---|
| `skills/reviewer-setup/` | Drives `:init`, `:add-agent` and `:sync`; references: survey (`risk-map.md`), catalog, brief format, schema |
| `skills/reviewer-run/` | Procedure for `:review` |
| `agents/reviewer-architect.md` | Surveys the repo and writes briefs |

## Guarantees

- Nothing is written before you approve a reviewer set; the survey only reads.
- Only `.reviewer/` is written. No commits, pushes or merge requests.
- Hand-edited briefs are patched, never replaced wholesale.
- No invented project facts and no undocumented `pipeline.yml` keys.
- Generated files are committed — no secrets, tokens, internal hostnames or client names.

## See also

- `/core:judge` — immediate four-lens verdict, no pipeline.
- `/node:review-changes` and other stacks' `review-changes` — generic pre-merge pass.

**Version** `0.1.0`. Not yet exercised against a live repository or a hosted runner; open verification
work is listed in [`docs/CHECKLIST.md`](docs/CHECKLIST.md).
