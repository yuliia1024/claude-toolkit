---
paths:
  - "**/ai/**"
  - "**/llm/**"
  - "**/agents/**"
  - "**/workflows/**"
---

# AI Architecture Rules

- Prefer deterministic application workflows when the sequence and business rules are known; introduce an agent only for runtime decisions that need model judgment.
- Keep business rules, authorization, persistence, and state transitions in application/domain code, not in prompts.
- The model may propose tool calls; backend code validates, authorizes, executes, and records them.
- Do not give an LLM direct database or unrestricted infrastructure access.
- Define explicit input/output schemas, state ownership, termination conditions, iteration/time/token budgets, and cancellation behavior.
- Persist durable workflow state outside conversation context. Make resumed side effects idempotent.
- Treat model output, retrieved content, and tool responses as untrusted data.
- Evaluate quality and failure modes before and after changing prompts, models, retrieval, or orchestration.
