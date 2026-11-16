---
name: ai-observability
description: Instrument LLM applications, RAG pipelines, tools, and agents. Use for tracing, token/cost/latency metrics, safe logging, debugging, and production monitoring.
---

# AI Observability

## Trace the complete operation

Create a trace for the user/application request and spans for meaningful steps: context assembly, retrieval, reranking, model call, tool execution, validation, retries, handoffs, and persistence. Propagate trace context across queues and service boundaries.

For agent runs, record each model turn, selected tool, validated arguments (redacted/minimized), tool result status, state transition, and termination reason. Make it possible to reconstruct why a run completed, failed, or stopped.

## Metrics

Track, where relevant:
- request volume and success/error rates;
- latency percentiles by provider, model, and operation;
- time to first token and stream completion;
- input/output tokens and estimated/actual cost;
- rate-limit, timeout, retry, fallback, and cancellation rates;
- tool selection and execution outcomes;
- agent steps, loop-limit exits, and completion rate;
- RAG retrieval/reranking latency and quality metrics;
- structured-output validation and refusal rates.

Segment metrics by safe operational dimensions (model, feature, environment, tenant tier). Avoid high-cardinality or sensitive labels.

## Logging and privacy

Log metadata by default, not unrestricted prompts, completions, retrieved documents, or tool payloads. Apply data minimization, redaction, access control, retention, and deletion policies before capturing content. Never log credentials, tokens, or secrets. Make any content capture explicit and policy-governed.

## Evaluation and production monitoring

Use offline evals before releases and online signals after deployment. Monitor quality regressions, drift in user/task distributions, and changes caused by provider/model upgrades. Route samples for human review when automated signals are insufficient.

Alerts should map to actionable conditions (provider outage, rising latency, cost spike, quality regression, tool failure), with thresholds based on service objectives rather than arbitrary values.

## OpenTelemetry and vendor tools

Prefer standard trace/metric/log interfaces where practical. Inspect current OpenTelemetry semantic conventions and provider instrumentation before adding custom attributes. Vendor-specific tracing platforms may be adapters, not architectural dependencies.

## Checklist

- [ ] End-to-end trace spans model, retrieval, tools, and persistence.
- [ ] Token, cost, latency, retry, and failure metrics exist.
- [ ] Agent runs expose step count and termination reason.
- [ ] Logs minimize and protect user/model content.
- [ ] Trace IDs propagate across async boundaries.
- [ ] Alerts are tied to actionable service objectives.
- [ ] Offline evals and online monitoring complement each other.
