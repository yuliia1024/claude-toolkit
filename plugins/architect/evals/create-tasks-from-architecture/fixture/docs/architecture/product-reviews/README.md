# Product Reviews — Architecture

Status: Draft · Updated: 2026-04-01
Requirement: [docs/requirements/product-reviews.md](../../requirements/product-reviews.md)

## 1. Overview
Verified buyers leave one star review per product; moderators approve or reject it before it is shown publicly; authors can delete their own review.

## 2. Scope
In: create, public list, moderation queue, moderate, delete. Out: review photos, helpfulness votes, email notifications.

## 3. Assumptions
- [ASSUMPTION-1] "Verified buyer" = at least one order in status `delivered` containing the product.
- [ASSUMPTION-2] The `moderator` role already exists in the auth module.

## 4. Block Index
| # | Role | Block | File | Summary |
|---|------|-------|------|---------|
| 01 | `db-schema` | Entities | [01-database-schema.md](./01-database-schema.md) | product_review |
| 02 | `api-endpoints` | Endpoints | [02-api-endpoints.md](./02-api-endpoints.md) | 5 endpoints |
| 03 | `business-logic` | Logic | [03-business-logic.md](./03-business-logic.md) | permissions, lifecycle, rules |
| 04 | `validation` | Validation | [04-validation-and-error-codes.md](./04-validation-and-error-codes.md) | ReviewsValidationCode |
| 05 | `nfr` | NFR | [05-non-functional.md](./05-non-functional.md) | paging, auth, audit |
| 06 | `websocket` | Realtime | omitted — no live updates required | — |
| 07 | `change-log` | Changes | [07-change-log.md](./07-change-log.md) | initial draft |

## 5. Dependency Map
Inside the feature:

    01 entities → 02 endpoints → 03 logic
    01 entities → 04 validation
    03 logic (lifecycle) → moderation endpoints 3–4

Outside the feature:

| Uses | Kind | From | Reason |
|------|------|------|--------|
| `customer` | entity | existing | review author |
| `product` | entity | existing | review subject |
| `order` / `order_item` | entity | existing | verified-buyer check |

Reference data: none.

## 6. Related Architecture
None yet.

## 7. Requirements
| Req | Title | Link | Status |
|-----|-------|------|--------|
| REV-1 | Product reviews | [spec](../../requirements/product-reviews.md) | Ready |
