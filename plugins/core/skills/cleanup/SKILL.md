---
name: cleanup
description: Find and remove what parallel implementation runs leave on disk — stale git worktrees, local branches already merged, regenerable build and test output. Shows a sized inventory first; deletes only items the user approves.
allowed-tools: AskUserQuestion, Bash, Glob, Read
---

# Cleanup

Parallel flows (`:implement`, `:multi-epic`) give each task a separate git worktree with its own
dependency install. When a run is interrupted those directories stay behind, each one a full copy of
the project. They are easy to forget and expensive to keep.

This skill inventories that debris, sizes it, and removes the parts the user signs off on. Removing
a dirty worktree is irreversible, so the inventory is never skipped.

Typical triggers: a parallel run just finished; disk usage jumped; git says a branch "is already
checked out at" another path; the user asks to tidy worktrees, branches or build output.

## Phase A — make sure nothing is running

```bash
git worktree list
git status --short
```

If a worktree has very recent modifications, or the user mentions a run in progress, stop and say
so. Deleting a live worktree destroys work in flight.

## Phase B — inventory

### Worktrees

For every entry from `git worktree list --porcelain`:

```bash
git -C "$wt" status --porcelain | wc -l     # dirty file count
git -C "$wt" rev-list --count @{u}..HEAD    # commits not on the remote (fails if no upstream — note it)
git branch --merged "$DEFAULT" | grep -q "$branch" && echo merged
du -sh "$wt"
```

Record:

| Path | Branch | Size | Dirty files | Local-only commits | Merged | Proposal |
| --- | --- | --- | --- | --- | --- | --- |

Proposal values:

- **remove** — clean, nothing local-only, branch merged or abandoned;
- **ask** — dirty or has local-only commits; list exactly what would be lost;
- **keep** — main checkout, current directory, or named as active by the user.

### Branches

```bash
git branch --merged "$DEFAULT" --format='%(refname:short)' | grep -vxE "$DEFAULT|main|master|develop"
git branch --no-merged "$DEFAULT"   # shown for information only
```

The current branch is never a candidate.

### Generated output

Candidates are directories such as `coverage`, `test-results`, `playwright-report`, `dist`,
`.nx/cache`, `.turbo`. A path qualifies only if both hold:

```bash
git check-ignore -q "$p"     # ignored by git
du -sh "$p"                  # and record its size
```

and it can be rebuilt by a project command.

### Summary

Start with the total reclaimable size, then one table per category. If nothing qualifies, say so in
one sentence and stop.

## Phase C — approval

Use AskUserQuestion, one question per category. Never bundle "remove" items with "ask" items.

For every **ask** worktree, a separate question naming the files or commits at risk, with the
choices: commit, push, stash, discard, keep. Default to keep.

With `--dry-run`, stop after Phase B.

## Phase D — remove

```bash
git worktree remove "$wt"            # refuses if dirty — good
git worktree remove --force "$wt"    # only for a dirty worktree the user named explicitly
git worktree prune

git branch -d "$branch"              # lowercase -d: refuses unmerged branches

rm -rf -- "$approved_path"           # one explicit path at a time
```

Not allowed: `git branch -D`, `rm -rf` with globs, paths that are tracked, `.env*` files, anything
outside the repository and its worktree directories.

## Phase E — confirm

```bash
git worktree list
git branch
du -sh .git
```

Report what was removed, space recovered (before vs. after), and what was kept and why. If the run
was triggered by an "already checked out" error, retry that checkout and show it succeeds.

## Habits

- Make it the last step of every parallel run.
- Run it before starting a new batch, so stale worktrees do not hold branches you need.
- A weekly pass keeps the repository lean.

## Never

- remove a worktree before showing its dirty files and local-only commits;
- delete an unmerged branch;
- delete something that is tracked or cannot be regenerated;
- run during an active parallel flow;
- claim success without before/after numbers.
