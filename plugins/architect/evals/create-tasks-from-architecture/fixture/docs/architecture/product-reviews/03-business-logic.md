# 03. Business logic

## Permissions

Based on: REV-1 AC-1, AC-4, AC-5

| Action | customer | author | moderator | public |
|--------|----------|--------|-----------|--------|
| create | verified buyer only | — | — | — |
| list published | yes | yes | yes | yes |
| moderation queue | — | — | yes | — |
| moderate | — | — | yes | — |
| delete | — | own review | — | — |

## Lifecycle

Based on: REV-1 AC-3, AC-4

    pending ──approve──▶ published
    pending ──reject───▶ rejected

| From | Event | To | Who | Guard |
|------|-------|----|-----|-------|
| pending | approve | published | moderator | — |
| pending | reject | rejected | moderator | reason required |

## Rules

- [BR-1] Only a customer with a `delivered` order containing the product may create a review.
- [BR-2] One review per customer per product (unique constraint; 409 on conflict).
- [BR-3] Moderation only from `pending`; anything else is 409.
- [BR-4] Deletion is a hard delete by the author, in any state.

## Side effects

- Every moderation decision writes an audit entry (`review.moderated`) in the same transaction.

---
Nav: [Overview](./README.md) | [Entities](./01-database-schema.md) | [Endpoints](./02-api-endpoints.md) | [Logic](./03-business-logic.md) | [Validation](./04-validation-and-error-codes.md) | [NFR](./05-non-functional.md) | [Changes](./07-change-log.md)
