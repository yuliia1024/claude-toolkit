---
name: database-engineering
description: Design and review backend persistence across relational and document databases, including schema design, indexes, transactions, query performance, migrations, and consistency.
---
# Database engineering
Inspect the actual database engine, version, schema, access layer, migration history, and workload before recommending a design. Do not assume a particular ORM.

## Data modeling
- Model entities, ownership, lifecycle, and invariants before choosing tables or collections.
- Normalize transactional data to avoid update anomalies; denormalize only for measured read patterns with an explicit consistency strategy.
- Choose keys and constraints to enforce invariants in the database, not only in application code.
- Define deletion, retention, uniqueness, and nullable-field semantics explicitly.

## Queries and indexes
- Inspect representative query plans and cardinalities. Index for real filter, join, sort, and uniqueness patterns.
- Consider write amplification, index size, selectivity, and maintenance cost; more indexes are not automatically better.
- Use explicit projections, bounded result sets, stable pagination, and parameterized queries.
- Avoid N+1 access and unbounded scans. Verify optimizations with realistic data volume.

## Transactions and concurrency
- Define atomicity and isolation requirements before selecting transaction boundaries.
- Keep transactions short; do not perform network calls or user interaction while holding locks.
- Understand lost updates, write skew, phantom reads, deadlocks, and retryable serialization failures for the chosen engine.
- Use constraints and appropriate locking/optimistic concurrency for competing updates; process-local locks do not coordinate replicas.

## Migrations and reliability
- Make schema changes compatible with rolling deploys: expand, backfill, switch reads/writes, then contract.
- Review table rewrites, long locks, index-build behavior, and rollback feasibility before production rollout.
- Make data backfills resumable and observable; avoid one giant transaction for large datasets.
- Test migrations and transaction behavior against the actual database engine/version, not only mocks.
