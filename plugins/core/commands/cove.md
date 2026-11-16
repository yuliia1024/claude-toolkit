---
argument-hint: '[--quick] question or claim to check'
description: 'Fact-check an answer in the current turn: draft, probe the risky claims, resolve them, publish a corrected answer'
allowed-tools: Glob(*), Grep(*), Read(*)
---

# /core:cove

Target: `$ARGUMENTS` — a question or claim. Empty means "check my previous reply".
`--quick` limits the run to 1–2 probes on the weakest claim.

Load `${CLAUDE_PLUGIN_ROOT}/skills/cove-method/cove-process.md` (part of the `cove-method` skill) and
follow it step by step.

Non-negotiables:

1. If a test run, a file read or a config lookup can answer the question directly, do that instead
   and say in one line why you skipped the full check.
2. Resolve probes without consulting the draft; use Read/Grep/Glob for anything about this repo.
3. Outcomes are HOLDS, FAILS or OPEN. Treat a FAILS seriously — it beat this variant's bias toward
   agreeing with itself.
4. Expect ~3–5× the tokens of a plain answer (~2–3× quick). For independent checkers, use
   `/core:cove-isolated`.

Begin with: $ARGUMENTS
