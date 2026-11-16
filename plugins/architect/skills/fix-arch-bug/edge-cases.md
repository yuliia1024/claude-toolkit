<!-- Part of fix-arch-bug. SKILL.md decides when to open this file. -->

# Edge cases

| Situation | What to do |
|---|---|
| **No QA label — the developer found the gap** | Trigger = "developer-initiated". Still write the backend fix, guided by the description and extra context. |
| **Doc can't be identified** | Stop and ask for the path. Never pick a search hit — one code path can be described in several features' docs. |
| **Developer says the area has no doc ("skip")** | Backend only: no Stage 3, no gate B, no 4a/4b. The final report says no doc was updated and lists backend changes plus consumer follow-ups. |
| **Fix is really a project** (new tables, several new endpoints, major rule redesign, several domains) | Stop and explain the size. Recommend planning it: `/architect:create-tasks`, then `/architect:implement`. |
| **More than one doc affected** | One doc per run. Finish this one, then suggest `/architect:fix-arch-bug <bug> <other doc>`. |
| **Doc has an unusual shape** | Don't assume block names or that blocks exist. Read whatever files are there; a single file is fine. |
| **Same fix already logged** | Stage 2b finds the change-log row (hash, label or bug slug); wait for "continue" or "skip". |
| **Doc changed between review and apply** | Stage 4a detects it; the developer chooses reanalyse, force or skip. |
| **An applied edit is wrong** (broken table, wrong section) | Propose `git checkout -- <file>` (which also undoes the change-log row) and wait for confirmation. Diagnose, then run again. |
| **Unrelated drift noticed** | Don't fix it. List it under "Other drift seen" in the review file and point to `/architect:sync-architecture` or `/architect:audit-architecture`. |
