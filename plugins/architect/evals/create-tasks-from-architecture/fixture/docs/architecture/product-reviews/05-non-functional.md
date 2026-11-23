# 05. Non-functional

Based on: REV-1

- Paging: `page` default 1, `pageSize` default 20, max 50; public list newest first, queue oldest first.
- Auth: JWT guard; `moderator` role guard on endpoints 3–4; author check on 5.
- Errors: project envelope `{ code, message, details? }` with `ReviewsValidationCode`.
- Latency: public list p95 < 150 ms (index on product_id, status, created_at).
- Audit: moderation decisions only.

---
Nav: [Overview](./README.md) | [Entities](./01-database-schema.md) | [Endpoints](./02-api-endpoints.md) | [Logic](./03-business-logic.md) | [Validation](./04-validation-and-error-codes.md) | [NFR](./05-non-functional.md) | [Changes](./07-change-log.md)
