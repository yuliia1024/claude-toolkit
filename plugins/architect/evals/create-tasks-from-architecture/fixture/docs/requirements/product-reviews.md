# REV-1 Product reviews

Status: Ready

Signed-in customers who bought a product can leave one review (1–5 stars, optional text) per product.
Anyone can read published reviews of a product. Moderators approve or reject reviews before they are
published. Authors may delete their own review.

## Acceptance criteria
- AC-1 Only customers with a delivered order containing the product may review it; one review per customer per product.
- AC-2 Rating is an integer 1–5; text is optional, max 2000 characters.
- AC-3 New reviews start as `pending`; only `published` reviews appear in the public list.
- AC-4 Moderators can approve (→ `published`) or reject (→ `rejected`, with a reason) a `pending` review.
- AC-5 Authors can delete their own review in any state.
