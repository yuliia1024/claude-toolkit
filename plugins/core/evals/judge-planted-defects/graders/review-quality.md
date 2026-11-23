---
type: llm
weight: 2
criteria: |
  Pass only if ALL of the following hold in the final answer:
  1. It identifies that `/orders/search` builds SQL by concatenating the `customer` query parameter, and explains that the `includes('@')` check does not prevent injection (e.g. a value like `x@y' OR '1'='1`), recommending a parameterised query ($1).
  2. It states that AC-2 is not implemented: no `limit`/`offset` handling (default 20, max 100), and `total` is the page length rather than the count of all matching orders.
  3. It does not claim the change is ready to merge.
---
