# Authoring a reviewer brief

Each file in `.reviewer/agents/` is a **brief**: standing orders for one reviewer who will see many diffs.
The pipeline is never better than its weakest brief, so write them like notes to an experienced teammate
who is new to this repo — direct, specific, short.

## Header

```yaml
---
name: correctness          # unique across the pipeline; shown next to each finding
focus: correctness         # correctness | security | general
model: opus                # model the reviewer runs on
max_severity: blocker      # blocker | major | minor — the highest level this brief may assign
role: router               # ONLY in coordinator.md; omit everywhere else
---
```

`max_severity: major` suits reviewers whose findings should inform but never stop a merge on their own —
`claims`, `docs-drift`, `dead-code`, `dependencies`. Keep `blocker` for briefs whose findings would justify
holding a release. If a hosted runner wants different header keys or values, map them there and note the
mapping in `.reviewer/README.md`.

## Body layout

Use these sections, in this order. Target 25–45 lines in total; past that, the brief is doing two jobs.

### Trigger

One or two sentences naming the **event** that deserves a comment — not the reviewer's job title.

> Comment when the change makes the system produce a wrong value: a total, a status, a stored record
> that is plausible and incorrect. Crashes and type errors are someone else's.

Avoid openings like "You are an expert reviewer who checks for bugs." They describe a person, not a finding.

### Where to look first

Three to six bullets, each an **existing** path and the reason it matters in this repo:

> - `src/orders/totals.ts` — computes every order total; `roundToMinor()` here is the only sanctioned
>   rounding point. Rounding anywhere else drifts invoices by a cent.
> - `src/api/serializers/order.ts` — `OrderSummary.meta` is passed to clients untouched, so anything
>   stored in it is public.

Every path goes through the gate (`SKILL.md`, step 6) before the file is written. When the survey found no
hotspot for this concern, say so in one line ("no repo-specific hotspot identified") and keep the brief
general. A guessed path is worse than none.

### Proof required

Spell out what a finding must carry so a reader can act without re-deriving it:

| Brief | A finding must include |
|---|---|
| correctness, money | the input, the value the code yields, the value it should yield |
| contracts, api-contract | who breaks, and in which deploy order it is safe |
| security, authz | the request, the field, and the value that gets through |
| performance | what grows, and the multiplier (per row, per tenant, per page) |
| claims, tests | the command run and its exit status — not a pasted tail of output |

End the section with a hard line: a finding without this proof is not filed.

### Hands off

The section with the biggest effect on trust. List what this reviewer ignores, and for each neighbouring
concern **name the brief that owns it**. Always include, phrased for the reviewer:

- formatting, naming and taste;
- defects already present before this change, unless the change newly exposes them;
- anything the diff itself already fixes or migrates;
- concerns owned by another brief (name it);
- anything you cannot tie to a specific line.

For an **established codebase**, add: *a gap against an external standard this project never adopted is
not a finding; the project's conventions (`CONSTITUTION.md`, `.claude/rules/**`) win.*

### Follow-up changes

A large share of MRs are fix-ups after earlier review. Include a short instruction like:

> If this change answers earlier review comments, confirm that in one line and move on. Spend the effort on
> what the fix introduced: a guard added in one call site but not its siblings, a behaviour inverted, a test
> that encodes the new bug.

## Style

- Second person, present tense, imperative.
- Rule first, reason second; the reason is what lets a reviewer handle a case you did not foresee.
- Concrete over categorical: "a discount applied after tax instead of before" beats "verify business logic".
- No padding, no restating the diff, no generic security checklist pasted into a non-security brief.

## The coordinator brief

Written **after** every reviewer brief, because it summarises their territory.

- State in the file that it **files no findings**.
- Tell it to produce a short routing note: what the change does, which touched paths fall inside which
  reviewer's territory, and what is suspicious *for this repo*.
- Carry the house-rule list from the survey here; every reviewer receives the note.
- It must be allowed to answer "nothing risky touched". Put this line in verbatim: *"If you flag everything,
  reviewers will treat nothing as flagged."*
- No file-by-file recap of the diff.

## The judge

The judge has no file; its policy is the `filter_prompt` of the `filter` step in `pipeline.yml`. It decides
what is removed, so the policy must say:

- Remove a finding when reading the code refutes it (the "missing" check exists; the "nullable" value
  cannot be null).
- **Check the finding's factual premise first** — the file and line it describes. Good reasoning on top of a
  misread line is the most common false positive.
- Two reviewers agreeing is not evidence; they may share the misread.
- Keep the numbers and request details intact; never compress a finding into something unactionable.
- Mark each surviving finding **new in this change** or **pre-existing**.
- Doubt alone is not a reason to remove a finding.

## Pre-write checklist

- [ ] Trigger names an event, not a role.
- [ ] Proof required is explicit.
- [ ] 3–6 paths, each confirmed on disk, each with its reason — or an explicit "none found".
- [ ] Hands off names the owning brief for each excluded concern.
- [ ] Follow-up instruction present.
- [ ] Established-codebase line present where it applies.
- [ ] 25–45 lines.
- [ ] Nothing secret, internal or client-identifying — the file is committed.
