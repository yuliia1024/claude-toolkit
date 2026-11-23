# Data model

| Entity (folder) | Table | Status | Owning domain |
|-----------------|-------|--------|---------------|
| Review (`apps/api/src/reviews/entities`) | `product_review` | proposed | [product-reviews](./product-reviews.md) |

```mermaid
erDiagram
  customer ||--o{ product_review : writes
  product ||--o{ product_review : has
```
