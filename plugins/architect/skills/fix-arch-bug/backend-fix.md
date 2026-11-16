<!-- Part of fix-arch-bug. SKILL.md decides when to open this file. -->

# Stage 2 — Backend fix

## 2a. Was a fix commit supplied?

Look in the extra context for a hash (7–40 hex characters) introduced by phrases such as "fixed in",
"backend fixed in", "BE done in" or "commit".

- **Hash found:** list touched files with `git show <hash> --stat`; for each file in the
  shared-contract package or backend app, read `git show <hash> -- <file>`. That diff *is* the scope.
  Run 2b, then jump to 2f (record scope). Gate A does not apply — the code was already reviewed.
- **No hash:** run 2b, then continue with 2c.

## 2b. Already synced?

Search the doc's change log (if any) for the commit hash, the trigger label, or the bug slug. On a match,
stop and ask:

```
This fix seems to be in the docs already:
  2026-05-14 | arch-fix | invoice-due-date-filter — dueBefore accepts ISO 8601 date
Reply "continue" to analyse again (e.g. the last run was partial) or "skip" to stop.
```

## 2c. Diagnose

Establish three things:

1. **Spec today** — what the architecture doc says (the wrong or incomplete part).
2. **Intended behaviour** — what QA or the developer says should happen.
3. **Code today** — infer the domain from the bug area and doc title (e.g. *Invoicing* → `invoice`),
   then read, using real paths from config/CLAUDE.md: contract types and enums in the shared package;
   the domain's DTOs and controller/handler; its repository and entity; its domain service.

Pinpoint where the code misbehaves because it was built to the spec. If the bug text is too vague to
define correct behaviour, ask concretely:

```
I can't pin down the correct behaviour from the report. For example:
  - Should dueBefore be an ISO date, a datetime, or still epoch ms? (now: epoch ms)
  - Inclusive or exclusive bound? (now: exclusive)
```

## 2d. Implement (contracts first)

Follow the backend rules loaded in Stage 1.

1. **Shared contracts** (when needed): request/response types, enums (new codes or statuses), route
   constants if a path moves, barrel export. Changing enum members also needs a DB migration (e.g. a
   Postgres `ALTER TYPE … ADD VALUE`); TypeScript values, DB values and migration defaults must agree —
   see the enum rule's checklist.
2. **Backend**: DTOs (implementing their contract interface), controller/handler, repository queries,
   domain service, mappers when response shape changes, migrations via the project's migration command.
   If a mutating endpoint is touched, confirm its audit-log call still records the right before/after
   values per the review-lessons rule.
3. **Tests**: update affected unit tests and fixtures to the new types; add cases for the new behaviour.

Smallest change that fixes the defect — no refactors, no neighbouring clean-ups.

## 2e. Verify

Run the project's commands with a generous timeout (these often exceed two minutes):
backend app — typecheck, lint, test; shared-contract package — typecheck, lint (skip tests if it has no
test target). Use the linter's fix mode for auto-fixable issues; investigate and repair failing tests,
staying within scope.

## 2f. Record the scope

Whether written now or taken from a commit, list precisely what changed: contract types/enums, DTO
validation, business logic, error codes, queries, tests — and whether the **public API contract**
changed (renamed/removed fields, type changes, new required params, new error codes). That last item
feeds the consumer follow-ups. This list bounds everything in Stages 3–4.

## 2g. Gate A — review the backend diff

Only when this skill wrote the code. Changes are uncommitted so `git diff` shows them.

```
Backend fix ready — invoice-due-date-filter

Changed
  contracts/src/types/invoice/invoice-list-query.type.ts   dueBefore: number → string (ISO 8601 date)
  contracts/src/enums/invoice-validation-code.enum.ts      + DUE_BEFORE_INVALID_DATE
  api/src/invoice/dto/invoice-list-query.dto.ts            @IsISO8601 on dueBefore
  api/src/invoice/invoice.repository.ts                    date comparison, inclusive bound
  api/src/invoice/invoice.service.spec.ts                  3 new cases

No spec file for: api/src/invoice/invoice-export.service.ts  (consider adding tests separately)

Checks  typecheck ✔  lint ✔  tests ✔ (212, 3 new)

Inspect: git diff   ·   Reply: approved | change <what> | revert
```

Wait for an explicit answer; Stage 3 does not start otherwise.

On **revert**, propose — but do not run until confirmed:

```
git checkout -- <contracts-pkg>/ <backend-app>/
git clean -fd <contracts-pkg>/ <backend-app>/    # only if the fix created files
Run these? (yes / I'll do it)
```

Then ask what to change and redo the fix.
