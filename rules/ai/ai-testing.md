---
paths:
  - "**/ai/**"
  - "**/llm/**"
  - "**/agents/**"
  - "**/evals/**"
---

# AI Testing Rules

- Maintain a versioned eval dataset with typical, edge, adversarial, and regression cases.
- Prefer deterministic assertions for schema validity, classification, authorization, and business invariants.
- Test provider adapters, tool execution, agent state transitions, cancellation, and failure paths independently.
- For RAG, evaluate retrieval and generation separately; include ACL and stale-index cases.
- Calibrate LLM judges against human labels; inspect disagreement and position bias.
- Compare old and new versions on the same dataset and report per-category results, not only an aggregate.
- Track quality with latency, token usage, and cost. Avoid brittle exact-text assertions for unconstrained generation.
- Mock external model/provider calls in unit tests; keep a smaller set of contract/integration tests against supported provider APIs.
