---
name: backend-engineering
description: Build backend features that do not depend on a specific framework — well-drawn boundaries, secure APIs, dependable persistence, and failure handling you can observe.
---
# Engineering the backend
- Survey the runtime/framework, API style, auth model, database, queue/cache, validation, logging, and test setup.
- Settle the API contract, authorization policy, error model, pagination, idempotency, and compatibility before writing code.
- Separate transport mapping from business invariants once the complexity warrants it, and do not add layers without an evident purpose.
- Validate untrusted input where it crosses a boundary and check authorization per resource and action.
- Put limits on DB queries and network calls; wrap atomic DB work in transactions, but never keep one open while waiting on a remote call.
- Give retries, queues, and caches explicitly stated delivery and consistency guarantees.
- Produce structured logs, metrics, and traces that carry no secrets or sensitive payloads.
- Where mocks fall short, test invariants against the real infrastructure boundary.
