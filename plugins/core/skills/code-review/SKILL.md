---
name: code-review
description: Review a diff, pull/merge request or pasted code change for correctness, security, reliability, maintainability, performance and test gaps, with evidence-based findings ranked by impact. Use whenever the user asks to review, check or look over a change before merging, or pastes a diff for feedback.
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
