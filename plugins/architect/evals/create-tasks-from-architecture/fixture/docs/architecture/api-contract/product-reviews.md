# Reviews domain

Types: `apps/api/src/reviews/contracts/` · Logic: [business logic](../product-reviews/03-business-logic.md)

## 1. POST /products/:productId/reviews

**Auth:** signed-in customer with a delivered order containing the product ([BR-1](../product-reviews/03-business-logic.md#rules)).

**Request** `CreateReviewReq`

```json
{ "rating": 4, "text": "Fits well, runs slightly small." }
```

**Response** `201 Created` → `ReviewRes`

```json
{ "id": "rv_01H", "productId": "p_42", "rating": 4, "text": "Fits well, runs slightly small.", "status": "pending", "createdAt": "2026-04-02T10:00:00Z" }
```

**Errors:** 400 `RATING_OUT_OF_RANGE`, `TEXT_TOO_LONG` · 403 `NOT_A_VERIFIED_BUYER` · 409 `ALREADY_REVIEWED`

## 2. GET /products/:productId/reviews

**Auth:** public.

**Request** query `page` (default 1), `pageSize` (default 20, max 50).

**Response** `200 OK` → `Paginated<PublicReviewRes>`; only `published` reviews, newest first.

```json
{ "items": [{ "id": "rv_01H", "rating": 4, "text": "Fits well.", "authorName": "Ana P.", "createdAt": "2026-04-02T10:00:00Z" }], "page": 1, "pageSize": 20, "total": 1 }
```

**Errors:** 404 `PRODUCT_NOT_FOUND`

## 3. GET /reviews/pending

**Auth:** role `moderator`.

**Response** `200 OK` → `Paginated<ReviewRes>` of `pending` reviews, oldest first.

**Errors:** 403 `FORBIDDEN`

## 4. PATCH /reviews/:id/moderation

**Auth:** role `moderator`.

**Request** `ModerateReviewReq`

```json
{ "decision": "reject", "reason": "Contains personal data" }
```

**Response** `200 OK` → `ReviewRes` with the new status.

**Errors:** 400 `REASON_REQUIRED` · 404 `REVIEW_NOT_FOUND` · 409 `REVIEW_NOT_PENDING`

## 5. DELETE /reviews/:id

**Auth:** the review's author.

**Response** `204 No Content`.

**Errors:** 403 `NOT_REVIEW_AUTHOR` · 404 `REVIEW_NOT_FOUND`
