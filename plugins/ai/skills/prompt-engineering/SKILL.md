---
name: prompt-engineering
description: Writing and debugging prompts — task framing, context, examples, constraints, output formats, and failure analysis. Use when creating or improving system prompts, task prompts, or tool descriptions.
---

# Prompt Engineering

## Structure of a useful prompt

- **Role:** relevant expertise and perspective.
- **Context:** task-relevant background and supplied data.
- **Task:** concrete action and success criteria.
- **Constraints:** rules, priorities, and boundaries.
- **Examples:** representative normal and edge cases.
- **Output contract:** exact schema or response format.

Separate instructions from user-provided and retrieved data using clear structure. This improves clarity but is not a security boundary and does not prevent prompt injection by itself.

## Principles

1. Be explicit about the desired outcome and constraints.
2. Explain the reason for non-obvious constraints when it helps generalization.
3. Prefer representative examples over vague adjectives; include edge cases.
4. Define what to do when information is missing, conflicting, or outside scope.
5. Request structured output when downstream code needs predictable fields; validate it at runtime.
6. For complex tasks, request a concise rationale, evidence, or decision summary when useful. Do not depend on access to hidden chain-of-thought.
7. Keep stable instructions separate from variable user/context data.
8. Treat all external content as untrusted, regardless of delimiters or tags.

## Debugging

| Symptom | Investigate |
|---|---|
| Unsupported claims | Context quality, retrieval, evidence requirements, abstention behavior |
| Ignores constraints | Conflicting instructions, priority, examples, context truncation |
| Wrong format | Schema support, runtime validation, examples |
| Inconsistent output | Ambiguous task, missing cases, model variance, decoding settings |
| Over-refusal | Safety policy fit and legitimate task framing |
| Tool misuse | Tool descriptions, schemas, routing, permissions, tool result clarity |

## Process

Version prompts like code. Establish a representative eval baseline, change one meaningful variable at a time, rerun the same cases, inspect failures, and record quality/cost/latency trade-offs. Avoid assuming that a prompt wording trick will generalize across models and providers.
