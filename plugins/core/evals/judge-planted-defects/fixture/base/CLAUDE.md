# orders-service

Small Express + Postgres service that exposes order data to the support console.

- Requirements for the feature currently in flight: `spec.md` (acceptance criteria are numbered AC-n).
- All SQL goes through `src/db.ts`; always use parameterised queries (`$1`, `$2`, ...).
- Every `/orders` route sits behind `requireApiKey`.
