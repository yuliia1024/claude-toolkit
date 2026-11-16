---
description: "Grow a working review pipeline by one or more reviewers, picked from the catalog or derived from a worry you describe; each is fitted to this repo and wired in, while the other briefs change only in their cross-references."
allowed-tools: AskUserQuestion, Agent, Glob, Grep, Read, Bash, Edit, Write
argument-hint: "[catalog name | \"concern in plain words\"]  (empty = choose from catalog)"
---

# /reviewer:add-agent

Extends a working pipeline by one reviewer at a time. Load the setup skill — `SKILL.md` inside `${CLAUDE_PLUGIN_ROOT}/skills/reviewer-setup` — and follow its
*Variants → `:add-agent`* section; the candidates are in `agent-catalog.md`, the brief format in
`agent-authoring.md`.

`$ARGUMENTS` is a catalog name (`authz`, `i18n`, `performance`) or a described worry — e.g.
*"writes update the database but nobody checks the cache gets invalidated"* — which becomes a discovered
reviewer.

Checklist:

- [ ] Read `.reviewer/README.md` (including `## Declined`) and the comments in `pipeline.yml`. If the
      request revives a declined reviewer, say so.
- [ ] Justify it: name a defect the current set would miss. If an existing brief owns the concern, offer to
      sharpen that one instead.
- [ ] Survey just this concern, enough to cite real paths.
- [ ] Write the brief with a *Hands off* section naming neighbouring owners; add the reciprocal line in
      those briefs where the seam is new.
- [ ] Add the step, a `coordinator -> <id>` link and a `<id> -> judge` link; refresh the coordinator's
      territory summary.
- [ ] Gate: paths exist, graph acyclic with no unlinked steps, `name` unique.

Only `.reviewer/` is touched. Other briefs are not regenerated. No commit or push.
