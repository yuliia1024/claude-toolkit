# Order search (SUP-212)

Support agents need to look up a customer's orders by e-mail from the support console.

## Endpoint

`GET /orders/search?customer=<email>&limit=<n>&offset=<n>` — behind the existing API-key middleware.

## Acceptance criteria

- **AC-1** Returns the orders of the customer with that e-mail, newest first (`created_at DESC`), as
  `{ items: Order[], total: number }`.
- **AC-2** Results are paginated: `limit` defaults to 20 and is capped at 100; `offset` defaults to 0.
  `total` is the count of all matching orders, not just the current page.
- **AC-3** A missing or malformed `customer` parameter returns `400 { "error": "invalid_customer" }`.
