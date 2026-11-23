# API contract

| # | Endpoint | Method | Path | Auth | Domain |
|---|----------|--------|------|------|--------|
| 1 | [Create review](./product-reviews.md#1-post-productsproductidreviews) | POST | /products/:productId/reviews | customer | [product-reviews](./product-reviews.md) |
| 2 | [List product reviews](./product-reviews.md#2-get-productsproductidreviews) | GET | /products/:productId/reviews | public | [product-reviews](./product-reviews.md) |
| 3 | [Moderation queue](./product-reviews.md#3-get-reviewspending) | GET | /reviews/pending | moderator | [product-reviews](./product-reviews.md) |
| 4 | [Moderate review](./product-reviews.md#4-patch-reviewsidmoderation) | PATCH | /reviews/:id/moderation | moderator | [product-reviews](./product-reviews.md) |
| 5 | [Delete review](./product-reviews.md#5-delete-reviewsid) | DELETE | /reviews/:id | author | [product-reviews](./product-reviews.md) |
