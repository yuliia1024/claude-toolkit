---
name: context-engineering
description: Design the information supplied to LLMs across prompts, conversation history, retrieved documents, tool results, and memory. Use when context windows, relevance, token budgets, long-running conversations, or context quality matter.
---

# Context Engineering

## Principle

Context engineering is the discipline of selecting, structuring, ordering, and updating the information available to a model at a particular step. It is broader than prompt wording. Optimize for task-relevant evidence, not maximum context size.

## Context assembly

Build context from explicit sources:
1. Stable system/developer instructions.
2. Current user request and constraints.
3. Application state required for this step.
4. Relevant conversation history or a compact summary.
5. Retrieved evidence, with provenance and access checks.
6. Tool outputs required for the next decision.
7. Output schema and task-specific constraints.

Keep instructions separate from untrusted user content, retrieved documents, and tool output. Label data boundaries clearly.

## Token budgeting

Estimate tokens before assembling large contexts. Reserve capacity for the model response and tool results. Allocate budgets by source priority; truncate or summarize low-priority material first. Do not silently cut off required constraints, schemas, or safety instructions.

Use provider token-counting facilities when available. Treat estimates as estimates and account for model-specific tokenization.

## History and memory

Do not append an unlimited transcript to every request. Select relevant turns, preserve unresolved user constraints, and summarize completed or low-value history.

A useful summary records:
- user goal and current task;
- durable constraints and preferences relevant to the task;
- decisions already made and their rationale;
- facts that must not be re-inferred;
- open questions and next action;
- source/provenance and freshness where applicable.

Distinguish conversation history from durable application memory. Define retention, deletion, tenant isolation, and update rules. Do not store secrets or sensitive data without a justified, explicit policy.

## Context compression

Summaries are lossy. Preserve exact identifiers, numbers, dates, negations, permissions, and unresolved requirements. Keep links or IDs to source records so important details can be reloaded. For high-impact decisions, retrieve source evidence instead of trusting a compressed summary.

## Ordering and relevance

Place the most important instructions and task constraints where the selected model/provider handles them reliably. Avoid redundant context and conflicting instructions. Consider lost-in-the-middle effects; test ordering with representative evals rather than relying on a universal placement rule.

## Observability and evaluation

Record context composition metadata (source types, document IDs, token counts, truncation, summary version) without logging secrets or unnecessary personal data. Evaluate answer quality against context variants, history length, ordering, and compression. Measure both task success and token/latency cost.

## Checklist

- [ ] Every context source has a purpose and provenance.
- [ ] Untrusted data is distinguishable from instructions.
- [ ] Token budget reserves room for output and tool calls.
- [ ] Truncation is deterministic and observable.
- [ ] Summaries preserve constraints, decisions, and references.
- [ ] Memory has retention, deletion, and tenant boundaries.
- [ ] Context quality is evaluated on representative cases.
