---
paths:
  - "**/*repository*.ts"
  - "**/*entity*.ts"
  - "**/*migration*.ts"
  - "**/*query*.ts"
---
# Data access on the backend
- Learn the real database, ORM, schema, migration, and transaction conventions before you write a query.
- Go through repositories/adapters only where the project already draws that boundary; do not bolt on a repository layer by reflex.
- Bind parameters and select columns explicitly; steer clear of N+1 lookups and result sets with no upper bound.
- Pagination must be deterministic via a stable tie-breaker, and sortable/filterable fields come from an allowlist.
- Atomic writes belong in a single DB transaction; network calls, emails, and slow work stay outside it, with an outbox when delivery must be guaranteed.
- Deal with unique and foreign-key conflicts on purpose, and never report a constraint violation as a success.
- Migrations have to be safe to roll forward and checked for lock or table-rewrite risk and for compatibility with rolling deploys; an already-applied migration is never edited.
- Invariants that depend on concurrency are tested against a real test database, because mocks cannot demonstrate locking or transactional behaviour.
