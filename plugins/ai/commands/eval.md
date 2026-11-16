---
description: 'Create or run an eval for an LLM feature.'
argument-hint: '<feature name or file that calls the model>'
---

# ai:eval

Feature: `$ARGUMENTS`

Use the `evals` skill.

1. Find the code that calls the model for this feature and understand its input and output.
2. If `evals/<feature>/` exists — run it and report a summary table (per metric, per tag, cost, latency).
3. If not — scaffold it in the project's language:
   - `cases.jsonl` with 10–20 cases (typical, edge, adversarial); ask the user for real examples first;
   - `run` script that calls the real pipeline;
   - `grade` script: code checks where possible, LLM-judge rubric only for open-ended quality.
4. Run it once and show the baseline. Do not change the prompt/pipeline in this command.
