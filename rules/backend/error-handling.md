---
description: 'How the API reports errors: payload shape and which layer throws.'
paths:
  - '**/*.controller.ts'
  - '**/*.service.ts'
---

# Reporting errors

- Domain errors are raised in services; a controller must not assemble an error response itself.
- All 4xx responses take the form `{ "code": "<ErrorCode>", "details": { ... } }`.
- Stack traces and database errors must never reach the client.
