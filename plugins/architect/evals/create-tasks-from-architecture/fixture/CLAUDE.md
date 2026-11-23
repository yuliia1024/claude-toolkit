# shopfront

NestJS + TypeORM API in `apps/api/src`. Architecture docs live in `docs/architecture/`
(one folder per feature, shared `api-contract/` and `data-model/`). Requirements in `docs/requirements/`.
Errors use the envelope `{ code, message, details? }`; validation codes are per-domain enums.
