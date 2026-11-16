---
description: 'Build or update a Postman collection plus environment files that match the backend''s current endpoints, payloads and auth.'
allowed-tools: Bash, Glob, Grep, Read, Write
---

# /node:generate-postman

Produces a Postman collection that mirrors the API as it is now, with environment files so it runs
against any stage without edits.

Read `.claude/toolkit-rules/backend-node/` and `.claude/toolkit-rules/backend/` first.

## Source of truth

1. If the service exposes or generates an OpenAPI document, build from it.
2. Otherwise collect controllers and their route decorators (a symbol-aware MCP speeds this up), plus
   the DTOs for each body and query.

If a collection already exists (commonly in `postman/`), update it in place: add new endpoints,
adjust changed ones, remove deleted ones, and keep user-added examples where they still fit.

## Collection layout

- One folder per domain module (e.g. `Catalog`, `Orders`, `Shipping`).
- One request per endpoint, named after its purpose; the description comes from the API doc
  annotation (`@ApiOperation` summary or equivalent).
- Example bodies use the DTO field names exactly, with realistic sample values.
- Every host, id, token or secret is a variable: `{{baseUrl}}`, `{{accessToken}}`, `{{orderId}}`.
- Protected requests inherit bearer auth from the collection; public ones set auth to none.

## Token handling

On the sign-in and token-refresh requests, add a test script that reads the tokens from the response
and stores them in the environment, for example:

```js
const body = pm.response.json();
if (body.accessToken) pm.environment.set('accessToken', body.accessToken);
if (body.refreshToken) pm.environment.set('refreshToken', body.refreshToken);
```

Adapt the property names to the real response shape.

## Environments

Write one environment file per stage the project uses (e.g. `local`, `staging`), each defining
`baseUrl` and empty placeholders for credentials and tokens. Never write real secrets into them.

Finish with a summary of endpoints added, changed and removed.
