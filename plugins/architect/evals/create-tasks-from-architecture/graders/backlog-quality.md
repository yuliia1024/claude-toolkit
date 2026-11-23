---
type: llm
weight: 2
focus: trace
criteria: |
  Judge the task files written under docs/architecture/product-reviews/tasks/ (use the trace and final answer).
  Pass only if ALL hold:
  1. Task 01 owns the shared contracts: request/response types (CreateReviewReq, ReviewRes, ModerateReviewReq...), the review_status enum, route constants and the ReviewsValidationCode enum; it is alone in wave 1 and every other task depends on 01.
  2. Later briefs link architecture anchors (e.g. ../../api-contract/product-reviews.md#1-post-productsproductidreviews, ../../data-model/product-reviews.md#product_review, ../03-business-logic.md#lifecycle) rather than copying tables or JSON payloads.
  3. Slices are coherent (e.g. review intake + public list vs. moderation queue + decision vs. delete), not one task per endpoint for all five endpoints, and every one of the 5 endpoints is owned by some task.
  4. Wave ordering respects dependencies (a task that needs the entity/repository created by another task is in a later wave).
---
