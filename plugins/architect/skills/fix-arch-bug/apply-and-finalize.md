<!-- Part of fix-arch-bug. SKILL.md decides when to open this file. -->

# Stage 4 — Apply approved doc edits

Docs are local files in the working tree. Only edits approved at gate B are made.

## 4a. Edit each file

For each file with approved edits:

1. Re-read it now.
2. Compare the review file's *Current* text with what is on disk. If it no longer matches:
   ```
   <file> changed after the review file was written — the "Current" text is gone.
   Reply: reanalyse (redo Stage 3 on today's content) | force (apply anyway) | skip <file>
   ```
3. Apply exactly the approved edits.
4. Save.

Keep the edit surgical: no whole-file rewrites, headings/tables/code fences stay as they are, table rows
keep the table's format, and new business rules take the next free `BR-n` number.

## 4b. Change log

If the doc has a change log, append the approved row, including the commit:

| Date | By | Entry |
|------|----|-------|
| 2026-05-14 | arch-fix | <trigger>: <summary>. Bug `<bug-slug>`. Commit `<hash>`. |

If the backend fix is still uncommitted, write `uncommitted on <branch>` instead of a hash and suggest
committing so the row can later be updated. No change log → say so in the report.

## 4c. Final report

```
Spec fix complete — invoice-due-date-filter

Docs
  ✔ 02-api-endpoints.md — 1 section
  ✔ 04-validation-and-error-codes.md — 1 section
  ✔ change log — 1 row

Consumers to follow up
  web-app invoice filter — dueBefore now an ISO date string
  (or: none — contract is backward compatible)

Only changes tied to this defect were made; client code was not touched.
Review file: <docs-root>/sync/invoicing-arch-fix-2026-05-14.md
```

If another architecture doc is also affected, add:

```
This run updated one doc. For the other, run:
  /architect:fix-arch-bug <bug text | bug file> <other doc path>
```
