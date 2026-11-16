<!-- Part of fix-arch-bug. SKILL.md decides when to open this file. -->

# Stage 3 — Doc diff and review file

Only differences **caused by this fix** count. Other stale content is out of scope — this is a targeted
repair, not an audit.

## 3a. Match each fix item against the doc

For every item recorded in Stage 2f:

| Result | Doc vs fix | Proposal |
|---|---|---|
| outdated | doc states the old behaviour | rewrite that text |
| absent | doc never covered the new behaviour | add it |
| aligned | doc already matches | nothing |

## 3b. Cross-check the developer's account

If the developer described the fix (Stage 1c): every change they named should appear in the diff, and
every spec-relevant change in the diff should be explained. Something named but absent from the diff →
ask. Something in the diff but unmentioned → keep it, with a note.

## 3c. Locate precisely

Each outdated/absent item gets file, section and exact text:

```
#1 dueBefore is now an ISO 8601 date (was epoch ms)
   source: contracts/src/types/invoice/invoice-list-query.type.ts:9
   docs:   02-api-endpoints.md → "List invoices" query table → dueBefore row
           04-validation-and-error-codes.md → code table → add DUE_BEFORE_INVALID_DATE
```

## 3d. Nothing spec-relevant?

If the fix only touched tests or internals (no contracts, rules or error codes):

```
The fix changes nothing the architecture describes.
Touched: <files> · spec-relevant: none
No doc update needed — name a section if you disagree.
```

Skip the review file and the 4a/4b edits; go directly to the final report (Stage 4c) stating that no
doc changes were needed.

## 3e. Write the review file

**Feature name:** the doc title up to its "— Architecture" suffix, kebab-cased
(*Invoicing — Architecture* → `invoicing`); with no title, use the main code domain of the fix.

`mkdir -p <docs-root>/sync/`, take the date from `date +%F`, and write the review file at
`<docs-root>/sync/<feature>-arch-fix-<date>.md`:

````markdown
# Invoicing — spec fix 2026-05-14

| | |
|---|---|
| Bug | `invoice-due-date-filter` — list ignores ISO dates in dueBefore |
| Trigger | QA spec-gap finding (or: developer-initiated) |
| Doc | [Invoicing](../invoicing/README.md) |
| Backend | `4e1a9c2` · or · not yet committed, on `fix/invoice-due-date-filter` |
| Boundary | only what this fix changed; other drift deliberately excluded |

## Behaviour before → after
Plain description, spec-relevant changes only.

## Edits
| # | File | Section | Result | Now says | Should say |
|---|------|---------|--------|----------|------------|
| 1 | 02-api-endpoints.md | List invoices → dueBefore | outdated | epoch ms | ISO 8601 date, inclusive |
| 2 | 04-validation-and-error-codes.md | code table | absent | — | DUE_BEFORE_INVALID_DATE → 400 |

### Full text

**02-api-endpoints.md — List invoices → query table**

Current:
```markdown
| dueBefore | number | epoch ms, exclusive |
```
Proposed:
```markdown
| dueBefore | string | ISO 8601 date, inclusive |
```

(one current/proposed pair per edit)

### Change-log row
| Date | By | Entry |
|------|----|-------|
| 2026-05-14 | arch-fix | QA spec-gap: dueBefore accepts ISO date. Bug `invoice-due-date-filter`. |

## Consumers to follow up
Clients or services relying on the changed contract — or "none, backward compatible".
This skill does not change client code.

## Other drift seen (not fixed)
Unrelated stale sections. For a full pass use /architect:sync-architecture or /architect:audit-architecture.
````

## 3f. Gate B

```
Review file saved (see path above)
  2 sections in 2 files · consumers: web-app invoice filter (dueBefore type)
  Bounded to backend fix 4e1a9c2
Reply: approved | <changes> | skip
```

Stop until approved. (Gate A covered the code; this gate covers the docs.)
