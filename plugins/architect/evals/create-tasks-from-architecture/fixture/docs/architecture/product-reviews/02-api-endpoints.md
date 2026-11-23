# 02. Endpoints

Based on: REV-1 AC-1 – AC-5

| # | Endpoint | Auth |
|---|----------|------|
| 1 | [POST /products/:productId/reviews](../api-contract/product-reviews.md#1-post-productsproductidreviews) | customer (verified buyer) |
| 2 | [GET /products/:productId/reviews](../api-contract/product-reviews.md#2-get-productsproductidreviews) | public |
| 3 | [GET /reviews/pending](../api-contract/product-reviews.md#3-get-reviewspending) | moderator |
| 4 | [PATCH /reviews/:id/moderation](../api-contract/product-reviews.md#4-patch-reviewsidmoderation) | moderator |
| 5 | [DELETE /reviews/:id](../api-contract/product-reviews.md#5-delete-reviewsid) | author |

---
Nav: [Overview](./README.md) | [Entities](./01-database-schema.md) | [Endpoints](./02-api-endpoints.md) | [Logic](./03-business-logic.md) | [Validation](./04-validation-and-error-codes.md) | [NFR](./05-non-functional.md) | [Changes](./07-change-log.md)
