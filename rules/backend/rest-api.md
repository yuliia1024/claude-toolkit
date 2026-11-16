---
description: 'REST conventions: naming resources, picking status codes, paginating lists.'
paths:
  - '**/*.controller.ts'
  - '**/*.dto.ts'
---

# REST conventions

- Name resources with plural nouns, e.g. `/users/:id` rather than `/getUser`.
- Creation returns `201` with a body, deletion returns `204`, and a missing resource yields `404`.
- Collection endpoints paginate via `?page=&limit=` and answer with `{ items, total }`.
- Each request body is described by a validated DTO.
