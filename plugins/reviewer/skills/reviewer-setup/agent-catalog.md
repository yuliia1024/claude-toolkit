# Reviewer catalog

Twenty-eight candidates a `.reviewer/` pipeline can be assembled from. Being listed here earns a reviewer
nothing: step 3 of `SKILL.md` scores each one against the risk map, and the user picks.

Each entry gives:

- **origin** — how much of the brief comes from a template versus from this repo (see below);
- **flags** — the kind of defect it comments on;
- **add when** — the risk-map signal that justifies it;
- **hands off** — what it ignores, and who owns that instead.

A reviewer without a "hands off" boundary will drift into taste and get ignored. Two reviewers without a
seam between them will double-report, and the team will start skimming.

---

## Origin labels

| Label | What it means | Can the brief move to another repo? |
|---|---|---|
| **stock** | The concern looks the same everywhere. The brief is the template plus a few facts (test command, file locations) and the cross-references for the chosen set. | Yes, after updating cross-references. |
| **fitted** | Every repo has the concern, but its substance — paths, invariants, limits — comes from this repo's risk map. | No. Re-fit it from the new repo's map. |
| **discovered** | The concern exists because of something the survey found in this code. Named after what it protects. | No. The next repo may not need it at all. |

The usual way this goes wrong is copying a **fitted** brief into a different project. It then names files
that do not exist there, which reads as confident and is simply wrong.

---

## Backbone — always present

These form the graph rather than offering an opinion.

**coordinator** · fitted
Reads the change first and alone, then writes the routing note every reviewer receives: what the change
does, which touched paths matter, what to distrust here. Files no findings. It is the risk map rendered as
prose, so it is the least transferable file; it is written last.

**judge** · stock
The `filter` step. Removes findings the code refutes, checking the factual premise before the argument,
keeps the arithmetic, labels each survivor *new* or *pre-existing*, and does not drop on doubt alone.
Agreement between reviewers is not treated as confirmation.

**report** · stock
The `sink` step: formatting only — per-finding or combined, grouping, overview.

## Baseline — recommended for nearly every repo

**correctness** · fitted
*Flags:* changes that make the system return or store a wrong but plausible value. Proof: input, actual,
expected.
*Hands off:* formatting; a missing test on its own; old defects the change does not newly expose.

**contracts** · fitted
*Flags:* breakage across a seam — an API consumer, rows already persisted, a component deployed separately.
Both sides pass their own tests; the pairing fails.
*Hands off:* stylistic inconsistency between modules; breaking changes the diff migrates in full.

**claims** · stock
*Flags:* the MR description says something the diff does not do, or cites a check that cannot fail (a test
command that matches zero files, a type check on an excluded folder).
*Hands off:* missing tests, unless the untested code is the change's main risk (then `tests` owns it).
It reviews honesty, not domain logic, so it costs the same in a simple repo as in a hard one. It needs two
facts: the real verification commands and where schema changes live.

## Opt-in — data

**migrations** · fitted
*Flags:* schema changes that fail or corrupt on existing rows — a new constraint old data violates, no
backfill, a column renamed while code still reads the old name.
*Add when:* a migrations folder exists and changes regularly; otherwise `contracts` covers it.
*Hands off:* migrations the diff already handles end to end.

**data-integrity** · fitted
*Flags:* lost or duplicated writes — multi-step writes outside a transaction, retries without idempotency,
concurrent requests interleaving, orphan rows.
*Add when:* counted things (balances, stock, seats, bookings) or queued/retried writes.
*Hands off:* races with no reachable request path.

**background-jobs** · fitted
*Flags:* work that vanishes silently — no retry, a retry that duplicates, no dead-letter path, a poison
message that blocks the queue, a job assuming the schema from when it was enqueued.
*Add when:* queues, schedulers, cron, workers.
*Hands off:* missing metrics and logs (→ `observability`).

## Opt-in — security

**security** · fitted
*Flags:* untrusted input reaching a query, a filesystem path, a shell or a template; credentials in code or
logs; an endpoint that answers without identifying the caller; a check that can be skipped. Proof: request,
field, value.
*Add when:* anything reachable over a network — nearly always.
*Hands off:* known CVEs in existing dependencies; hardening that was never there. It reviews what the change
does.

**authz** · fitted
*Flags:* the right record served to the wrong caller — an id from the URL or body that selects another
tenant's data, an admin route reusing a user-scoped service, permission checks done only in the UI.
*Add when:* multiple tenants or roles beyond signed-in/anonymous. Split from `security` when tenancy is the
dominant risk.
*Hands off:* how login and sessions work (→ `security`).

**secrets-and-config** · stock
*Flags:* a new environment variable missing from the sample env file or docs, configuration read at import
time, a default that is fine locally and dangerous in production, a secret echoed into a log or error.
*Add when:* the repo has deployment configuration. Cheap and hits often.
*Hands off:* undocumented variables the change did not touch.

## Opt-in — the work around the change

**tests** · stock
*Flags:* tests that do not test the claim — asserting whatever the code returns, a fixture that builds a
different case than its name, a bug frozen into an expectation, the riskiest touched function left
uncovered. Needs the test command and coverage policy.
*Hands off:* coverage percentages.

**regression-scope** · fitted
*Flags:* knock-on effects the author missed — a modified signature with untouched callers, a reshaped
object with unaware readers, a behaviour flipped in one of several copies.
*Add when:* heavy internal reuse.
*Hands off:* callers the change updated correctly.

**rules-conformance** · fitted
*Flags:* the change breaks a rule this project wrote down (`.claude/rules/**`, `CONSTITUTION.md`,
`CLAUDE.md`). Quotes the rule.
*Add when:* those files exist. In an established codebase, only the project's own rules count.
*Hands off:* standards the project never adopted; rules the codebase itself does not follow.

**dependencies** · stock
*Flags:* a new package that duplicates an existing one, is abandoned, carries an incompatible licence, or
pulls a large tree for a small helper.
*Add when:* there is a lockfile.
*Hands off:* advisories on packages that were already installed.

**docs-drift** · fitted
*Flags:* committed docs made false by the change — a contradicted ADR, a README command that no longer
works, an API reference missing a new field.
*Add when:* the repo keeps docs it expects to be current.
*Hands off:* absent docs for code that never had any.

**dead-code** · stock
*Flags:* leftovers the change creates — a superseded export still exported, a flag branch that can no
longer run, commented-out blocks.
*Add when:* anywhere; most useful during refactors.
*Hands off:* dead code that predates the change.

## Opt-in — runtime

**performance** · fitted
*Flags:* cost that scales with data — per-row queries, queries in loops, unindexed filters, unbounded
fetches or payloads. Names what grows.
*Add when:* a database or list endpoints exist.
*Hands off:* micro-optimisations without a measured cost.

**observability** · fitted
*Flags:* production failures nobody could diagnose — swallowed exceptions, errors missing the identifier
needed to find the record, new failure modes that emit nothing, and personal data written into logs.
*Add when:* code runs unattended.
*Hands off:* dashboards and alerts that do not exist yet.

## Opt-in — frontend

**accessibility** · stock
*Flags:* controls unreachable by keyboard, focus lost after an action, unnamed controls, meaning carried by
colour alone, form errors never announced.
*Add when:* there is a UI.
*Hands off:* contrast it cannot actually measure.

**ui-state** · fitted
*Flags:* screens with only a happy path — no loading, empty, error or partial view, data left stale after a
mutation; spinners that never resolve on failure; optimistic updates without rollback.
*Add when:* the UI fetches data. Highest hit rate in this group.
*Hands off:* visual taste.

**i18n** · fitted
*Flags:* inline user-facing text (including `aria-label`s and error messages), keys added to one locale
only, dates and numbers assembled by string concatenation. Needs the locale paths.
*Add when:* the app ships in more than one language.
*Hands off:* developer-only strings.

**design-fidelity** · fitted
*Flags:* raw values where a design token exists, one-off copies of registry components, breakpoints that
ignore the system. Needs the token location.
*Add when:* a design system or token set exists.
*Hands off:* pixel differences from a mock-up.

**bundle-size** · fitted
*Flags:* heavy imports on a critical path — whole libraries for one helper, barrel imports that defeat
tree-shaking, all locales loaded, routes that should split and do not.
*Add when:* a shipped browser bundle **with a size budget**. Needs the budget figures.
*Hands off:* growth with no budget to compare against.

## Discovered — catalogued examples

Generated only on strong evidence; whether they apply at all is something the survey decides.

**money** · discovered
*Flags:* floating-point arithmetic on amounts, rounding at the wrong step, a rate fixed once for a span
where it should vary, an off-by-one at a threshold, a missing amount treated as zero.
*Add when:* prices, invoices, payouts, tax, payroll.

**pii-compliance** · discovered
*Flags:* personal data crossing a line it should not — into logs, analytics, error bodies, third parties —
or a change that bypasses retention or erasure.
*Add when:* real user data under a privacy regime.

**api-contract** · discovered
*Flags:* a published contract breaking — a removed or retyped field, a changed status code, a diverging
error shape, a version bump that is due and missing.
*Add when:* external clients or partners consume the API, or an OpenAPI/GraphQL spec is maintained. Carve it
out of `contracts` once the API itself is what customers buy.

---

## Finding discovered reviewers

The survey will turn up risks no catalog can predict. Propose them beside the catalog set, marked
**discovered**, each with its evidence.

**Admission test:** name a defect it would catch that none of the selected reviewers would. If you cannot,
add a bullet to an existing brief instead.

Illustrations of signal → reviewer:

| Survey finding | Reviewer | Comments on |
|---|---|---|
| Cache entries keyed by record id, invalidated by hand in several services | `cache-coherence` | a write path that updates the store but not the cache key |
| Payment or booking endpoints that accept a client-supplied idempotency key | `idempotency-keys` | a new mutating route that ignores the key, or keys scoped too broadly |
| Repeated incidents around scheduling across time zones | `clock-and-timezone` | local-time boundaries, mixed naive/aware timestamps, DST double-counting |
| Role definitions duplicated in server policy and client route guards | `rbac-mirror` | one copy changed without the other |
| An audit or ledger table described as write-once | `ledger-immutability` | updates or deletes against rows that must never change |
| LLM or OCR output stored as structured fields | `model-output-guard` | generated values reaching storage or arithmetic without validation |
| A generated file format a regulator or partner parses strictly | `report-format` | output that validates but means the wrong thing — ordering, code tables, field placement |

Name for the **protected property**, not the library: `cache-coherence` survives a switch from one cache
client to another; `redis-checks` would not.

---

## Assembling a set

**Shape.** Coordinator alone → reviewers in parallel → judge → report. No reviewer reads another's output.

**Size.** Backbone + Baseline + the two or three opt-ins with the strongest evidence, plus any discovered
reviewer with hard evidence: six to eight in all. Reviewers run concurrently, so latency barely moves, but
tokens and — more importantly — reader attention scale with every brief. Before adding one, ask whether the
project's lint/typecheck/CI would already reject the defect it targets; if yes, it is redundant.

**Splitting.** Keep a broad reviewer until it visibly misses something, then split: `security` → `authz`
when tenancy dominates, `contracts` → `migrations` when schema changes ship weekly, `correctness` → `money`
once pricing logic dominates. Split too soon and you trade one sharp brief for two blurry ones.

**Seams.** Wherever two briefs could claim the same defect, name the owner in *both* "hands off" sections.
