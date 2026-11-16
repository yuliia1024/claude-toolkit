---
name: backend-reliability
description: Design reliable backend workflows with queues, idempotency, retries, outbox, caching, concurrency control, and graceful degradation.
---
# Backend reliability
- Define consistency and delivery guarantees before selecting infrastructure.
- Make externally retried commands idempotent with durable scoped keys; define retention and conflict behavior.
- Use transactional outbox when a committed DB change must reliably publish an event. Consumers should be idempotent because delivery is commonly at-least-once.
- Retry only transient failures with bounded exponential backoff, jitter, deadlines, and a retry budget. Provide a dead-letter path and replay procedure.
- Apply timeouts to every network boundary. Use circuit breaking/bulkheads only for demonstrated failure modes.
- Cache-aside needs explicit TTL, invalidation/consistency policy, stampede protection, and stale-read expectations.
- Protect shared mutable state with DB constraints/transactions or distributed coordination; process-local locks do not coordinate instances.
- Define ordering requirements per key/aggregate; do not assume global queue ordering.
- Observe queue age, retries, DLQ depth, cache hit rate, timeout rate, and idempotency conflicts.
