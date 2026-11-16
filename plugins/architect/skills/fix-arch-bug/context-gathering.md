<!-- Part of fix-arch-bug. SKILL.md decides when to open this file. -->

# Stage 1 — Intake

## 1a. Backend rules

Before anything else, glob and read **every** file in the backend rule folder for the stack
(`.claude/rules/backend-node/**/*.md` or `.claude/rules/backend-python/**/*.md`) plus
`.claude/rules/shared/*.md`. Skip none: contract, enum, error-handling and mapper rules plus review
lessons drive both the code fix and the doc comparison.

## 1b. Preconditions

**Working tree must be clean** — `git status --porcelain` must print nothing. Otherwise stop:

```
Your working tree has uncommitted changes. This skill edits backend files, and mixing its edits with
yours would make them impossible to review or revert separately.
Stash (git stash) or commit your work, then run /architect:fix-arch-bug again.
```

**Branch** — `git branch --show-current`. On the default branch (as defined by the git-workflow rule),
offer one named after the defect:

```
You're on main. Create a fix branch first?
  git checkout -b fix/<bug-slug>        e.g. fix/invoice-due-date-filter
Reply: yes / I'll branch myself / stay on main
```

Branch names follow `<type>/<short-kebab-summary>` and contain no ticket IDs or task numbers. Staying
on the default branch is allowed but say why that is risky.

## 1c. The bug

If the first argument is an existing file, read it; otherwise it is the bug text. Empty → ask for it.
Derive the bug slug now and reuse it unchanged later.

Capture:

- **Area** — which feature the title or first line points to
- **Label** — any QA finding or bug label in the text (kept only for the change log)
- **Expected vs actual** behaviour
- **Developer notes** describing the intended fix
- **Doc paths** mentioned in the text
- **Severity**, if given

Classify the trigger:

| Kind | Looks like | Meaning |
|---|---|---|
| Spec-gap finding | QA explicitly flags a spec/architecture gap | strongest signal; gap is stated |
| Bug report | severity/priority + symptom | check the developer notes for a spec-rooted cause |
| Developer account | "fixed X by …", "what changed: …" | treat as the scope boundary of the fix |
| Unlabelled | none of the above | developer-initiated sync; rely on the extra context |

Record the trigger (label, or "developer-initiated"), the gap in one sentence, and the developer's
description of the fix if there is one.

## 1d. Which architecture doc

Stop at the first rule that yields a path:

1. A doc path passed as an argument — always wins, even if the bug text mentions another.
2. A doc path or link under `<docs-root>` inside the bug text.
3. Ask. Endpoints and docs relate many-to-many across features, so only the developer can say which doc
   is meant:

```
Which architecture doc should this fix update? Give a local file or block folder,
or reply "skip" if this area has none.
```

Never search `<docs-root>` and choose a result yourself. Without a doc (and no "skip"), do not proceed.

## 1e. Read the doc

Read the given file; if it is a folder, or the main file links neighbouring block files, read each one.
Don't assume a fixed layout. A typical folder has blocks for schema, endpoints, business rules,
validation codes, non-functional concerns, realtime events and a change log — but real docs may have
fewer, renamed or extra sections. Compare against what is actually written. A single-file doc is used
as-is.

For each file keep path, title and full text. If a file is missing or unreadable, warn, continue with
the rest, and note the coverage gap in the review file.
