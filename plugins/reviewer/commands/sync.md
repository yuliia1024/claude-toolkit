---
description: "Re-survey the repo and propose patches that bring an existing `.reviewer/` pipeline back in line — stale paths, new risk with no reviewer, reviewers whose risk has gone. Each change needs approval; hand-edited briefs are patched, not regenerated."
allowed-tools: AskUserQuestion, Agent, Glob, Grep, Read, Bash, Edit, Write
argument-hint: "[--dry-run]  (report only)"
---

# /reviewer:sync

Code moves; briefs that cite it go stale. A reviewer pointing at a deleted file is the quickest way to make
a team distrust the whole report — this command finds that first.

Load the setup skill — `SKILL.md` inside `${CLAUDE_PLUGIN_ROOT}/skills/reviewer-setup` — and follow its
*Variants → `:sync`* section:

1. **Path check.** Glob every path cited in `.reviewer/agents/*.md`. Report missing ones up front.
2. **Re-survey** with `risk-map.md`; recompute history (changes × repairs) from git.
3. **Classify the difference**, with evidence:
   - *stale* — a cited path or convention is no longer true;
   - *uncovered* — new risk with no reviewer (first queue, new payments module, newly public payload);
   - *unearned* — a reviewer whose risk has disappeared (propose removal, never remove silently).
4. **Propose, then wait.** Smallest patch per brief; show conflicts with hand edits side by side.
5. **Respect `## Declined`** in `.reviewer/README.md`: re-offer only with new evidence, stating what changed.
6. **Gate** — the full step-6 checklist again.

`--dry-run` prints the report from 1–3 and stops; suitable for a recurring check.

Writes only to `.reviewer/`, only after approval. No commit or push.
