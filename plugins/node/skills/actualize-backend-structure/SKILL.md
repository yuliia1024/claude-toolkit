---
name: actualize-backend-structure
description: 'Bring backend files back in line with the project naming and layout rules: file suffixes, where constants live, which comments are allowed, one concern per file. Only moves, renames and import updates — behaviour is untouched. Full entry point: /node:actualize-structure.'
argument-hint: '[path | module] [--all] [--report-only]'
user-invocable: true
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Skill, Write
---

# Backend structure alignment

Goal: every backend file sits where the project's rules say it should, with the name they prescribe,
and contains only the comments they allow — achieved purely through moves, renames and import
updates. If a fix would change what the code does, it is reported, not applied.

`SRC` below means the backend paths from `.claude/toolkit.json` → `stacks.backend-node.paths`.

## 1. Load only the rules you will cite

Reading every backend rule up front is the most expensive mistake in this audit. Start with the few
that define structure, from `.claude/toolkit-rules/backend-node/` and `.claude/rules/` (whichever the
project has):

| Concern | Rule to look for |
| --- | --- |
| File naming | the suffix table (e.g. `.service.ts`, `.dto.ts`, `.constant.ts`), singular forms, one export concern per file |
| Constants | where named constants live and the listed exceptions |
| Comments | which comment kinds are permitted |
| Layering | what controllers, services and repositories may contain (report-only here) |

Open further rules only when a finding lands in their territory. Each finding carries a citation of
its governing rule file; a preference with no rule behind it is not a finding. If the project has no
naming rule at all, stop and say so — there is nothing to align to.

## 2. Decide the scope

| Input | Scope |
| --- | --- |
| none (default) | files changed in the working tree and on the branch: `git status --short -- SRC` and `git diff --name-only <default>...HEAD -- SRC` |
| path or module | that subtree |
| `--all` | all of `SRC`, split by top-level module across sub-agents that return findings only; one place applies changes |

Always excluded: migrations (timestamped, framework-named), framework entry files (`main.ts`, root
module, bootstrap/tracing files), the shared contracts package, and test bodies.

Keep every git and search command restricted to `SRC`. Other sessions may be editing elsewhere in the
tree; an unrestricted `git status` mostly shows their work. On large branches ask for counts first.

**Previous runs.** Reports are committed under the reports folder (`reports.dir` in
`.claude/toolkit.json`, default `docs/reviews/`). If `structure-backend-*.md` exists there, read only
its `## Intentional exceptions` section so you do not re-litigate settled cases. Ignore the rest; it
describes an older tree.

## 3. Find candidates

Most matches are fine. Filter each detector's output through the rule's exceptions before reporting.

### 3a. Comments

`//` alone is not enough — codebases often comment in `/* */` and JSDoc. Use all three probes:

```bash
EXCL='(\.spec\.ts|\.mock\.ts|/migrations/)'

# line comments, minus tool directives and TODOs
grep -rnE '^[[:space:]]*//' SRC --include='*.ts' | grep -vE "$EXCL" \
  | grep -vE '(eslint|@ts-|prettier|TODO)'

# one-line block comments
grep -rnE '^[[:space:]]*/\*[^*]' SRC --include='*.ts' | grep -vE "$EXCL" \
  | grep -vE '(eslint|@ts-|prettier)'

# multi-paragraph doc blocks (a blank " *" line inside /** ... */)
find SRC -name '*.ts' | grep -vE "$EXCL" | while read -r f; do
  awk -v F="$f" '
    /\/\*\*/ { open=1; at=NR; gap=0 }
    open && /^[[:space:]]*\*[[:space:]]*$/ { gap=1 }
    open && /\*\// { if (gap) print F ":" at; open=0 }' "$f"
done
```

Keep: the reason after a lint/compiler directive, references to a spec section or design decision,
TODOs in the project format, `@deprecated`. Remove: comments that repeat the code, section banners,
"changed X to Y" history. API documentation strings inside decorators are not comments.

If one comment style is used consistently across the tree and some of those comments are the only
record of a real constraint, report the rule-versus-tree conflict instead of deleting in bulk.
History-style comments are the exception — they never carry a reason, so remove them.

### 3b. Constants outside constant files

```bash
grep -rnE '^(export +)?const +[A-Z][A-Z_0-9]+[[:space:]]*=' SRC --include='*.ts' \
  | grep -vE '\.(constant|enum|spec|mock)\.ts:'
```

In a healthy tree this mostly catches regressions. A constant that references something declared in
the same file usually stays (moving it creates an import cycle). Default destination: a sibling
`<name>.constant.ts`; use an existing `constants/` folder only if one is already there.

Before moving any constant, look for structure-guard tests that read source files as text — they do
not fail when the constant disappears from the file they read, they just stop checking:

```bash
grep -rlE "<CONST_NAME>|<old-file-stem>" SRC --include='*.spec.ts' | xargs grep -lE 'readFileSync|readFile\('
```

Every hit is updated in the same commit to read the new file. Never relax the assertion.

### 3c. Suffixes

```bash
# plural suffixes are always wrong
find SRC -type f -name '*.ts' | grep -E '\.(utils|types|enums|constants|interfaces)\.ts$'

# suffix frequency table, migrations removed up front
find SRC -name '*.ts' -not -path '*/migrations/*' \
  | sed -nE 's/.*\.([a-z0-9-]+)\.ts$/\1/p' | sort | uniq -c | sort -n

# files without any suffix
find SRC -name '*.ts' -not -path '*/migrations/*' | grep -vE '\.[a-z0-9-]+\.ts$'
```

Read the frequency table from the rare end. A suffix that appears once or twice and is not in the
table is either a rename, or a legitimate kind the table is missing — in which case the table row is
added in the same change. Pick one explicitly. Unsuffixed files (other than exempt entry files) are
always findings.

### 3d. One concern per file

```bash
find SRC -name '*.util.ts' | while read -r f; do
  c=$(grep -cE '^export ' "$f"); [ "$c" -gt 1 ] && echo "$c $f"
done
```

Two exports may share a file only if one is meaningless without the other (a function and its result type).
Split real grab-bags into files named after what they export. The same check applies to
`.type.ts` and `.interface.ts` files collecting unrelated shapes.

### 3e. Placement

- A helper used by one module lives in that module; by several modules, in the shared utilities
  folder; by several apps, in a shared library — the last case is reported, not moved, because it
  crosses an app boundary.
- If two rules disagree about where something goes and the tree follows both, leave it and report
  the conflict.
- Test files are never moved or renamed: runners often select tiers by file name pattern, so a rename
  changes which suite runs the test.

### 3f. Layering — report only

Business logic in a controller, or a repository making policy decisions, cannot be fixed by moving
files. List these under "Decisions needed" and stop there.

## 4. Challenge each candidate

Before touching anything, try to disprove each candidate by reading code (`/core:cove` in list form
gives this a format):

- Is the target file already present, i.e. has the split already happened?
- Does the constant depend on a same-file declaration?
- Does any guard spec read this file or symbol as text?
- Are the two exports genuinely inseparable?
- Is the comment one of the allowed kinds?
- Does the move cross a module, an app, or the contracts package?

Drop disproved candidates. Uncertain ones are reported with the doubt stated, not moved.

## 5. Apply in rising order of risk

One commit per pass, so each can be reverted independently:

1. comment removals — no import changes
2. constant moves — with their guard spec updates
3. suffix renames
4. file splits
5. placement moves

After each pass run typecheck, lint and unit tests for the backend (commands from `CLAUDE.md`), plus
the e2e suite before the final pass if the project gates pushes on it. When a pass turns the
build red, repair or revert it immediately; the following pass waits for green.

Find importers with a symbol-aware MCP (`find_referencing_symbols`) when one is available. The
compiler catches most broken imports, but string-based DI tokens do not show up there; search for
them as plain strings.

Specs: only their import paths change, plus guard retargeting from 3b. No test names, no assertions.
If a move would require rewriting a test, report it instead.

`--report-only` stops after step 4.

## 6. Report

Write `<reports dir>/structure-backend-<scope>.md` with these sections:

```
# Backend structure — <scope> — <date>

## Changes
| Pass | From | To | Rule | Importers updated | Guard specs retargeted |

## Intentional exceptions
<grouped by kind with counts: same-file constant deps, paired exports, migrations,
 rule conflicts, test files — the next run reads this section>

## Decisions needed
<rule conflicts, layering issues, boundary-crossing moves — each with a proposal>

## Verification
<command → result; anything not run is marked NOT-RUN with the reason>

## Outside this run
<what the scope excluded>
```

Commits follow `rules/shared/git-workflow.md`: one concern per commit, on a branch such as
`refactor/align-backend-file-names`, never on the default branch, and the user decides when to push.

## Never

- change behaviour, routes, guards, transactions or contracts inside a move;
- touch migrations, the contracts package, or anything outside `SRC`;
- rewrite a test body or loosen a guard spec to make it pass;
- invent a suffix, resolve a rule conflict on your own, or rename a test file;
- extract logic from a controller — that is refactoring work for `/node:review-changes` follow-ups.
