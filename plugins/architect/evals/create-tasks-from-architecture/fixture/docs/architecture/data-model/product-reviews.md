# Product reviews — data model

## product_review

Entity `ProductReview` (`apps/api/src/reviews/entities/product-review.entity.ts`), extends `BaseEntity`.

**Columns**

| Column | Type | Nullable | Default | Set by | Notes |
|--------|------|----------|---------|--------|-------|
| id | uuid | no | gen | db | PK |
| product_id | uuid | no | — | api | FK product |
| author_id | uuid | no | — | api | FK customer |
| rating | smallint | no | — | api | 1–5 |
| text | varchar(2000) | yes | null | api | |
| status | review_status | no | 'pending' | api | see enum |
| rejection_reason | varchar(500) | yes | null | moderator | required when rejected |
| moderated_by | uuid | yes | null | api | FK staff |
| created_at | timestamptz | no | now() | db | |

**Indexes & constraints:** unique (`product_id`, `author_id`); index (`product_id`, `status`, `created_at`); check `rating between 1 and 5`.

**Enum `review_status`**

| Value | Meaning |
|-------|---------|
| pending | awaiting moderation |
| published | visible publicly |
| rejected | hidden, reason recorded |

**Migration history**

1. `CreateProductReview` — table, enum, indexes.
