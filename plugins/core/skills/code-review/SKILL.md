---
name: code-review
description: Review code changes for correctness, security, reliability, maintainability, performance, and test gaps with actionable evidence-based findings.
---
# Code review
Review the diff against the base branch and project conventions. Prioritize findings by user impact.

## Lenses
- Correctness: logic, edge cases, races, state transitions, data integrity, backward compatibility.
- Security: trust boundaries, authorization, injection, secrets, unsafe deserialization, browser exposure.
- Reliability: timeouts, retries, cancellation, cleanup, partial failure, idempotency.
- Data: query shape, indexes, transaction scope, migrations, pagination.
- Performance: complexity, N+1, unbounded memory/concurrency, unnecessary rendering/network calls.
- Tests: missing assertions for changed behavior and failure modes.

## Finding format
For each finding include severity, file/line, concrete scenario, consequence, and minimal fix. Distinguish confirmed defects from questions/risks. Do not report style preferences as bugs. If no findings, state scope and checks performed; do not imply a full audit if only a partial diff was reviewed.
