# Surveying a repo for risk

The survey is read-only. It produces a short in-memory briefing — never a file on its own — that drives
reviewer selection and becomes the raw material for `coordinator.md`.

**Admission rule for every line of the briefing:** it is backed by something you can point at — an
existing path, a search that returned matches, a commit count. A line you cannot back up is deleted, not
softened. A wrong briefing produces confidently wrong reviewers.

Run the six probes below, in this order, and stop. Do not read the repo cover to cover.

| Probe | Question | Feeds |
|---|---|---|
| A · Charter | What does the project say about itself? | mode decision, vocabulary, `rules-conformance` |
| B · Conventions | Which rules does the code demonstrably follow? | coordinator house rules, every brief |
| C · Blast radius | Where does a wrong result leave the system? | `correctness`, discovered reviewers |
| D · Seams | Where do separately deployed or separately owned parts meet? | `contracts`, `migrations`, `background-jobs` |
| E · Hostile input | Where does data from outside enter, and where does it end up? | `security`, `authz` |
| F · History | Which files change most and get repaired most? | "where to look first" bullets |

---

## A · Charter

Cheapest probe, run first, because it gives the others their vocabulary.

Read, where present:

- `.claude/toolkit.json` — stacks, topology, path globs;
- `.claude/CLAUDE.md` — standing instructions;
- `.claude/CONSTITUTION.md` — the conventions this team actually holds; in an established codebase this
  outranks any shared standard;
- `.claude/rules/**` — note which areas exist; they mark what the team already treats as policy;
- top-level `README`, architecture notes, ADR folder;
- build manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, …).

Record: languages, frameworks, the real lint/typecheck/test commands, coverage policy, monorepo layout.

## B · Conventions

These turn a generic brief into one that reads like a colleague wrote it — and they are the easiest thing to
invent by accident. Only record a convention you can show being followed in several places.

Typical candidates:

- how amounts are represented (integer minor units, a decimal type, a money library);
- how ranges are bounded (inclusive end dates? half-open intervals?);
- how time is stored and which field is authoritative;
- the error shape returned to callers;
- whether null, missing and zero mean different things;
- naming or layout rules that tooling depends on.

Write each as one checkable sentence plus a file that demonstrates it. When two parts of the codebase
**disagree**, do not record a rule — record the disagreement under *Conflicts*; it is a lead for
`contracts`.

## C · Blast radius

Ask "where does a wrong answer reach a customer, a regulator, or another system?", not "what is complex?".
Search by vocabulary, then open only the two or three files that own the logic.

```bash
# amounts and charging
git grep -ilE 'cents|minor_?units|subtotal|refund|payout|ledger|exchange_?rate|fee|charge' -- \
  ':!*test*' ':!*spec*' ':!*fixtures*' ':!*.lock'

# who may do what
git grep -ilE 'rbac|policy|guard|owner_?id|tenant_?id|forbidden|can[A-Z][a-z]+\(' -- ':!*test*'

# documents and exports others consume
git grep -ilE 'export|render_?(pdf|csv)|submission|statement|xsd|schema_?version' -- ':!*test*'
```

For each real hit write one sentence: *which module owns the rule, and what goes wrong downstream if it
is wrong.* The coordinator brief reuses exactly this sentence.

## D · Seams

Unit tests never catch a broken seam: both halves behave correctly on their own.

- **Payloads that leave verbatim** — serializers with pass-through fields, JSON columns echoed to clients.
  Whatever lands there is public.
- **The API surface** — route tables, controllers, request/response schemas, OpenAPI/GraphQL files.
- **Schema changes** — the migrations folder and how often it moves:
  `git log --oneline --since=12.months -- <migrations-dir> | wc -l`.
- **Async hand-offs** — queues, scheduled jobs, webhooks, event topics.
- **Shared contract packages** imported by more than one deployable.

For each seam note producer, consumer, and whether they deploy independently. Independent deploys make
`contracts` mandatory.

## E · Hostile input

Trace each entry point to where the data is finally used, not just to the handler.

- uploads and parsers (XML entity expansion, archives, spreadsheets);
- **generated values** — LLM responses, OCR, extraction pipelines — commonly trusted by accident;
- webhooks and callbacks, and whether signatures are checked;
- admin or internal routes that call user-facing services and inherit their assumptions;
- sinks: SQL, path joins, subprocesses, deserializers, templates.

## F · History

The best cheap predictor of the next defect: files that change a lot **and** keep needing repairs.

```bash
# change frequency over the last 12 months (skip lockfiles and build output)
git log --since=12.months --pretty=tformat: --name-only \
  | grep -vE '^$|\.lock$|lock\.json$|^dist/|^build/' \
  | sort | uniq -c | sort -nr | head -25 > /tmp/churn.txt

# files touched by repair commits in the same window
git log --since=12.months -i -E --grep='(fix|bug|revert|hotfix|regress)' --pretty=tformat: --name-only \
  | grep -v '^$' | sort | uniq -c | sort -nr | head -25 > /tmp/repairs.txt

# files present in both lists
awk 'NR==FNR{seen[$2]=$1; next} ($2 in seen){print $2, "changes=" seen[$2], "repairs=" $1}' \
  /tmp/churn.txt /tmp/repairs.txt
```

Discard mass-formatting commits and generated files. Files in the intersection are what the coordinator
names first.

A new repo has no history; report "no history yet" and move on. Never substitute guesses.

---

## Briefing format

Keep it to a page.

```
MODE        established | new build — <the signals that decided it>
STACK       <languages · frameworks · lint/typecheck/test commands>

BLAST RADIUS
  <path> owns <rule>; if wrong → <downstream effect>            [evidence]
SEAMS
  <surface> : <producer> → <consumer>, independent deploy <y/n>  [evidence]
HOSTILE INPUT
  <entry point> ⇒ <sink>                                         [evidence]
HISTORY
  <path>  changes=<n>  repairs=<m>
CONVENTIONS
  <checkable sentence> — e.g. <file>
CONFLICTS (leads, not rules)
  <what disagrees> — <place 1> vs <place 2>
```

The `[evidence]` column is used when scoring the catalog and then dropped: generated briefs cite paths, not
the searches that found them.
