---
name: llm-app-patterns
description: Architecture patterns for LLM-powered features — choosing between single calls, tool use, deterministic workflows, and agents; structured output, streaming, reliability, and cost. Use when designing or reviewing LLM application code.
---

# LLM App Patterns

## Choose the simplest sufficient pattern

| Pattern | When to use | Example |
|---|---|---|
| Single call | One bounded transformation | summarize, classify, extract |
| Model + tools | Model chooses from a small set of capabilities | look up an order |
| Deterministic workflow | Steps and business rules are known | extract → validate → enrich → persist |
| Agent loop | Next step depends on observations and model judgment | research across sources |
| Multi-agent | Independent roles/contexts or parallel work justify coordination | parallel specialist review |

Workflow patterns include chaining, routing, bounded parallelization, and evaluator–optimizer. Do not use an agent merely to make a fixed workflow appear intelligent.

## Agent execution lifecycle

1. Application creates a run and loads authorized state/context.
2. Model receives task, constraints, and available tool schemas.
3. Model returns a final response or proposed tool calls.
4. Application validates tool names and arguments, authorizes access, checks budgets/approval, then executes.
5. Application appends correlated tool results and requests the next model turn.
6. Application terminates on explicit completion, failure, cancellation, or enforced step/deadline/budget limit.
7. Application persists final status and emits trace/audit events.

The model does not execute tools and cannot certify that an external action succeeded. Backend results are authoritative.

## Tool use

Use one clear action per tool, a narrow schema, and descriptions that explain when to use it and important side effects. Validate arguments server-side. Separate read/write capabilities. Use idempotency and explicit approval for consequential operations. Parallelize only independent calls with bounded concurrency.

## Structured output

Use provider-supported schema-constrained output where available, then validate with runtime schemas (for example Zod). Schema validity does not replace domain/business validation. Handle refusal, incomplete output, and validation failure explicitly.

## Production checklist

- [ ] Request deadlines, cancellation, and bounded retry policy
- [ ] Output-token limits and explicit truncation handling
- [ ] Streaming lifecycle handles completion, refusal, error, and interruption
- [ ] Model routing/fallback respects capability, privacy, quality, and cost
- [ ] Token/cost/latency and tool outcomes are observable
- [ ] Agent steps and tool permissions are bounded
- [ ] Prompts and outputs are versioned and evaluated
- [ ] Sensitive data is minimized and model output is treated as untrusted

## Anti-patterns

- Agent where a deterministic workflow is enough.
- Direct model access to databases or privileged services.
- Treating prompt instructions as authorization.
- Unbounded loops, retries, or tool concurrency.
- Regex parsing when structured output is supported.
- Declaring success based on model text rather than backend execution.
