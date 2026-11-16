---
name: api-design
description: Quick reference for designing REST APIs — naming resources, choosing status codes, paginating, and the error envelope. Consult it while designing or reviewing API endpoints.
---

# Designing APIs

## Which status code

| Case | Code |
|---|---|
| Successful read | 200 |
| Resource created | 201 + the new resource |
| Deleted, or nothing to return | 204 |
| Input failed validation | 400 `{ code: "VALIDATION_ERROR", details: { field: ["REQUIRED"] } }` |
| Caller unauthenticated / forbidden | 401 / 403 |
| Resource missing | 404 |
| Conflict (duplicate or invalid state) | 409 |

## Paging through lists

`GET /orders?page=2&limit=20` → `{ "items": [...], "total": 134 }`
