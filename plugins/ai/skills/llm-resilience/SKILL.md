---
name: llm-resilience
description: Engineer resilient LLM features under provider failures, rate limits, latency, streaming interruption, and budget constraints. Use for production reliability and dependency failure design.
---

# LLM Resilience

## Failure model

Treat the model provider as an external dependency with variable latency, quotas, transient failures, and partial responses. Identify failure modes per operation: connection failure, timeout, rate limit, overload, invalid request, safety refusal, malformed output, truncation, stream interruption, and provider outage.

## Timeouts and cancellation

Set explicit connection and total-operation deadlines. Propagate cancellation from the incoming request to provider calls and downstream work. For background jobs, define job-level deadlines and checkpoint/resume behavior. Do not leave abandoned streams or tool work running after cancellation.

## Retry policy

Retry only transient failures. Use bounded exponential backoff with jitter and respect provider retry guidance such as Retry-After when available. Set attempt and total-time budgets. Do not retry invalid requests, authorization failures, refusals, or deterministic schema errors without changing the request.

Avoid retry multiplication across HTTP client, SDK, service, and job layers. Assign retry ownership to one layer or define a coordinated budget.

## Rate limits and concurrency

Apply per-provider/model concurrency controls and request/token rate limiting. Queue work when asynchronous processing is acceptable. Add tenant-aware quotas where needed. Prevent one tenant or retry storm from exhausting shared capacity.

## Circuit breaking and fallback

Use circuit breaking or load shedding when a dependency is persistently unhealthy. Define recovery behavior and avoid rapid oscillation. Fallback to another model only if it satisfies capability, privacy, region, quality, and cost constraints. Record when fallback occurs.

## Streaming and partial output

Distinguish completed output from partial output. On interruption, do not silently treat a partial answer or missing tool-call completion as success. Define whether to resume, restart, return partial output with an explicit status, or fail. Avoid duplicate side effects when resuming.

## Cost and deadlines

Enforce request-level token/cost budgets and maximum tool/agent steps. Apply an overall deadline across all retries and model turns. Degrade gracefully where possible (smaller model, reduced context, asynchronous completion), but make quality trade-offs explicit.

## Checklist

- [ ] Deadlines and cancellation propagate end to end.
- [ ] Retry policy is bounded, jittered, and failure-aware.
- [ ] Retry ownership avoids multiplicative retries.
- [ ] Concurrency and tenant quotas are enforced.
- [ ] Circuit breaking/load shedding has a recovery policy.
- [ ] Fallback respects capability and data policies.
- [ ] Partial streams are never misreported as complete.
- [ ] Token, cost, iteration, and wall-clock budgets are enforced.
- [ ] Failure and fallback behavior is observable and tested.
