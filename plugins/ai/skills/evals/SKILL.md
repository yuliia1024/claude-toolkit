---
name: evals
description: Evaluate LLM features with datasets, deterministic checks, model judges, pairwise comparisons, calibration, and regression runs. Use before and after changing prompts, models, retrieval, or orchestration.
---

# Evals

## Dataset

Start with a small, versioned dataset and expand it from production failures (anonymized), edge cases, and adversarial examples.

Each case should have a stable ID, input/context, expected properties or reference answer where appropriate, tags, and provenance. Avoid storing secrets or unnecessary personal data.

## Choose the cheapest reliable grader

| Method | Use for |
|---|---|
| Exact/code assertions | Classification, extraction, schema validity, permission checks |
| Heuristics | Length bounds, required citations, prohibited content |
| LLM-as-judge | Subjective quality with an explicit rubric |
| Human review | High-impact decisions, calibration, ambiguous cases |

Prefer deterministic grading for objective properties. Do not use an LLM judge to decide whether authorization or business invariants were enforced.

## Judge quality

- Define criteria, scoring anchors, and examples before running the judge.
- Calibrate against blinded human labels and inspect disagreement.
- Use pairwise comparison for subjective version comparisons when appropriate.
- Randomize candidate order and test for position/verbosity bias.
- Keep expected winner labels hidden from the judge.
- Measure judge consistency on repeated samples; use a second judge or human adjudication for high-impact disagreements.

## Compare versions

Run candidates on the same dataset and report per-metric and per-tag deltas. For stochastic outputs, repeat runs or estimate uncertainty before interpreting small differences. Include latency, token use, and cost.

## Evaluate layers separately

For RAG, separate parsing/indexing, retrieval, reranking, context assembly, and generation. For agents, separately measure tool selection, argument validity, tool execution, policy compliance, and end-to-end task success. A good final answer must not hide unsafe or failed intermediate actions.

## Release gates

Set thresholds based on product risk. Keep regression cases for every meaningful production failure. Use CI for stable, business-critical evals; avoid brittle exact-text gates for open-ended generation.

## TypeScript example

See [TypeScript eval harness](references/typescript-eval-harness.md) for dataset/grader contracts, deterministic checks, and release comparison. The example is illustrative and should be adapted to your application's output schema.

## Report

Include dataset version/coverage, grader type, calibration status, per-category results, regressions, uncertainty, and quality/cost/latency trade-offs.
