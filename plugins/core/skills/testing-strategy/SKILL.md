---
name: testing-strategy
description: Choose and implement effective unit, integration, contract, component, and end-to-end tests based on risk and system boundaries.
---
# Testing strategy
- Start from user-visible behavior, business invariants, failure modes, and regression risk—not a target coverage percentage.
- Unit-test pure logic and isolated policies. Integration-test database, queues, framework wiring, and serialization at real boundaries.
- Use contract tests for independently deployed consumers/providers. Use E2E for a small number of critical user journeys.
- Assert outcomes and invariants, not private implementation details or exact call counts unless contractual.
- Cover success, invalid input, authorization, not-found/conflict, timeout, retry, duplicate delivery, partial failure, and concurrency where relevant.
- Keep tests deterministic: control time/randomness, isolate data, clean resources, avoid live third-party APIs.
- Use realistic fixtures and test factories; avoid giant shared mutable fixtures.
- A passing mock test does not prove SQL semantics, transaction isolation, browser accessibility, or provider compatibility.
- Run the narrowest relevant suite during iteration and required project checks before completion.
