# reviewer — open verification work

Version `0.1.0` is designed and internally consistent but has **not yet been run end to end on a real
repository**. The items below are the evidence still missing before anyone should rely on it for real MRs. Each item
carries a pass condition so progress is observable. Tick items as they land and delete sections that no
longer matter.

See also: [`GUIDE.md`](GUIDE.md) · [`concept.html`](concept.html) · [`../README.md`](../README.md)

---

## A. Generation on real code — highest priority

Nothing else matters until this works.

| # | Experiment | Passes when |
|---|---|---|
| A1 | `:init` on an established repo with a year or more of history | Every survey path resolves; probe F yields a believable, non-empty overlap list; every convention has a demonstrating file; at least one discovered reviewer is proposed with evidence, or the run explains why none qualified |
| A2 | `:init` on a freshly scaffolded starter repo | Mode is proposed and confirmed, not assumed; probe F reports "no history yet"; briefs enforce the adopted rules |
| A3 | Walk through all four question rounds during A1 | ≤ 4 options per question; irrelevant groups skipped; evidence visible in descriptions; declines appear under `## Declined` |
| A4 | Plant a nonexistent path in a draft brief | Step 6 stops and names the path |
| A5 | Compare a generated `correctness.md` with `agent-authoring.md` | Trigger names an event; 3–6 verified paths; *Hands off* names owners; 25–45 lines |

## B. Dry runs (`:review`)

| # | Experiment | Passes when |
|---|---|---|
| B1 | Run on a historical commit that introduced a bug later fixed | The bug is reported — or the miss is explained and a brief edit makes it reported |
| B2 | Same diff with and without `raw` | Every removal has a one-line reason; removed items are noise, not real defects |
| B3 | Break one `brief:` path; run a diff outside `trigger` | Broken step named and run refused; out-of-bounds diff stops with the trigger values quoted |
| B4 | `only <ids>` and `trace` | Behave as documented |

## C. Hosted runner integration

`pipeline.yml` uses this plugin's own key set. A hosted MR-review service will need a mapping.

- [ ] Choose a target runner and document the key mapping (`steps`/`flow`/`trigger`/`report` → runner format).
- [ ] Decide whether `max_severity` is enforced by the runner or is advisory only.
- [ ] Confirm how the runner treats a router that emits findings.
- [ ] End to end: commit `.reviewer/` in a test repo wired to the runner, open a throwaway MR from a
      `chore/reviewer-smoke-test` branch, and check comments follow `report.*` and the judge visibly removes some.

## D. Deterministic graph validation

Step 1 of `reviewer-run` validates the graph through the model. The mechanical checks belong in a script.

- [ ] Add a validator script (e.g. `plugins/reviewer/scripts/check-pipeline.mjs`): YAML parses; each `brief:`
      resolves; one each of entry/router/filter/sink; acyclic; all steps reachable; every reviewer links to
      the judge; unique `name`; required header keys present.
      *Passes when* each planted defect type is caught with the step id in the message.
- [ ] Call it at the start of `:review`, leaving the model to check only what a script cannot.
- [ ] Offer it as an optional pre-commit hook for repos that commit `.reviewer/`.

## E. Maintenance commands on an aged pipeline

- [ ] Move a module that a brief cites, then `:sync --dry-run` → the broken reference is listed first, ahead of the re-survey.
- [ ] Hand-edit a brief, run `:sync` → edit preserved; conflicts shown as minimal patches.
- [ ] Decline a reviewer at `:init`, run `:sync` → not re-proposed without new evidence (confirms the
      `## Declined` line format is machine-findable; adjust the format if not).
- [ ] `:add-agent "writes update the database but nobody checks the cache gets invalidated"` → a scoped
      discovered brief with evidence, wired in, coordinator updated.

## F. Numbers we do not have yet

- [ ] Token cost of one `:review` with 6–8 reviewers on a typical diff; add it to GUIDE.
- [ ] Token cost of a full `:init` on the A1 repo.
- [ ] Revisit the Q4 model options in light of those figures.

## G. Content upkeep

- [ ] The catalog is long; if it grows further, move *Finding discovered reviewers* into its own reference.
- [ ] After A1, add a redacted worked example under `docs/` (survey briefing, question transcript,
      generated `.reviewer/`). One real example will teach more than the prose.

## Known design risks — monitor

- **Coordinator decay.** It is the survey in prose form and goes stale first; regular `:sync` is the remedy.
- **Overlap in practice.** Seams exist on paper; the judge's removal log on real MRs will show whether two
  briefs still double-report.
- **Catalog growth.** Scoring 28 candidates already takes effort. Admit a new entry only if probes A–F can
  actually detect its *add when* signal.
- **English-only questions.** Intentional, because committed files are English; revisit only if non-English
  teams adopt the plugin.
