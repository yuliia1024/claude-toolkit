---
argument-hint: '[--explore] [--haiku] [--quick] question or claim to check'
description: 'Fact-check an answer with independent checkers: each probe goes to its own sub-agent that never sees the draft'
allowed-tools: Agent, Glob(*), Grep(*), Read(*)
---

# /core:cove-isolated

Target: `$ARGUMENTS` — a question or claim plus optional switches:

- `--quick` — 1–2 probes only
- `--explore` — checkers are read-only `Explore` agents
- `--haiku` — checkers run on the haiku tier
- `--agent=<name>` — checkers use a custom agent type

Load `${CLAUDE_PLUGIN_ROOT}/skills/cove-method/cove-isolated.md` (part of the `cove-method` skill) and
follow it step by step.

Non-negotiables:

1. Prefer a direct check (run it, open it) when one exists; say so in one line if you skip the loop.
2. Every probe must make sense to someone who has never seen the draft — no back-references.
3. Agent settings: `subagent_type: "general-purpose"` by default, `"Explore"` with `--explore`,
   `model: "haiku"` with `--haiku` (tier name, not a dated id).
4. Dispatch all checkers in a single message, one per probe. A high-confidence FAILS forces a
   revision; disagreements between checkers are reported, not hidden.
5. Expect ~8–15× the tokens of a plain answer (~4–6× quick). `/core:cove` is the cheaper variant.

Begin with: $ARGUMENTS
