---
paths:
  - "**/ai/**"
  - "**/llm/**"
  - "**/agents/**"
---

# AI Production Rules

- Set request deadlines, cancellation propagation, token/output limits, and bounded concurrency.
- Retry only transient failures with bounded backoff and jitter; avoid retry multiplication across layers.
- Distinguish completed output from refusal, truncation, timeout, cancellation, and partial streaming output.
- Apply provider/model rate limits and tenant-aware quotas where needed.
- Use fallback models only when capability, privacy, quality, region, and cost constraints remain acceptable.
- Trace model turns, retrieval, tool calls, retries, state transitions, and termination reasons.
- Record token usage, estimated cost, latency, errors, and fallback metadata.
- Minimize prompt/completion logging; redact sensitive values and define retention/access controls.
