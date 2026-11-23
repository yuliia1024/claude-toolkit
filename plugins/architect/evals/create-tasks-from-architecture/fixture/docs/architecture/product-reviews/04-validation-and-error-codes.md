# 04. Validation and error codes

Based on: REV-1 AC-1 – AC-5

## Enum

`ReviewsValidationCode`

## Field codes

| Field | Rule | Code |
|-------|------|------|
| rating | required, integer 1–5 | RATING_OUT_OF_RANGE |
| text | optional, ≤ 2000 chars | TEXT_TOO_LONG |
| decision | `approve` \| `reject` | INVALID_DECISION |
| reason | required when decision = reject, ≤ 500 chars | REASON_REQUIRED |

## Domain codes

| Code | HTTP |
|------|------|
| RATING_OUT_OF_RANGE | 400 |
| TEXT_TOO_LONG | 400 |
| INVALID_DECISION | 400 |
| REASON_REQUIRED | 400 |
| NOT_A_VERIFIED_BUYER | 403 |
| NOT_REVIEW_AUTHOR | 403 |
| PRODUCT_NOT_FOUND | 404 |
| REVIEW_NOT_FOUND | 404 |
| ALREADY_REVIEWED | 409 |
| REVIEW_NOT_PENDING | 409 |

---
Nav: [Overview](./README.md) | [Entities](./01-database-schema.md) | [Endpoints](./02-api-endpoints.md) | [Logic](./03-business-logic.md) | [Validation](./04-validation-and-error-codes.md) | [NFR](./05-non-functional.md) | [Changes](./07-change-log.md)
