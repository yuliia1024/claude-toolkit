---
name: audit-architecture
description: Detect drift between architecture docs and code, both ways — specs for endpoints/tables the code no longer has, shipped code with no spec, mismatches, and [PROPOSED] tags left on shipped endpoints — and propose the cheapest reconciliation. Reports first; applies only approved doc edits; never edits code.
---

# audit-architecture

`create-architecture` reads the code once, at creation time. After that the docs stand still while the
code moves, and no other pipeline step looks back. Two kinds of rot follow:

- **Docs ahead of reality** — a documented endpoint was renamed or deleted, an assumption proved wrong,
  or a `[PROPOSED — not in code]` tag outlived the release.
- **Reality ahead of docs** — routes, tables or enums shipped without architecture, so the next design
  run duplicates or contradicts them.

The data-model `[GAP]` row covers only the second case and only for entities. This audit covers both,
for endpoints, entities, enums and tags. Run it before planning a new phase, when onboarding, after a
burst of hotfixes, before a decision that relies on the docs, or periodically.

Backs `/architect:audit-architecture`. Read-only until the user approves specific doc edits; code is
never changed.

## Setup

- Docs root: `.claude/toolkit.json`, fallback `docs/architecture/`.
- Code locations — controllers/routers, entities/models, migrations, the shared-contract package — from
  `.claude/toolkit.json` or `CLAUDE.md`. If unspecified, discover them once by glob and **list the paths
  you used** in the report; auditing the wrong folder is worse than not auditing.
- Blocks are found through each README's Block Index Role column.
- Also read the active-stack rules in `.claude/rules/`: they describe what a route, entity or enum looks
  like in this codebase, which is how you recognise one.

## Arguments

All optional: feature slug(s) (default: whole docs root); `--docs-to-code` or `--code-to-docs`
(default both); free-text context such as "admin app is out of scope" or "billing is mid-migration".

---

## 1. Inventories

**Documented side** — let the validator parse the Markdown:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-architecture.mjs --inventory
```

Per feature it lists endpoints (`method`, `path`, `n`, `proposed`, `anchor`), entities (`table`) and
tasks (`implemented`, `superseded`). Add `--feature {slug}` to narrow it. Also run it once without
`--inventory`: those structural errors are the docs' own baseline and are reported separately from drift.

**Code side** — build from the real tree, recording a file path for every item:

| Kind | Where to look | Normalise before comparing |
|---|---|---|
| Endpoints | route definitions plus their controller-level prefix | strip global prefixes (`/api`, `/v2`); treat path-parameter names as wildcards so `/carts/:cartId` = `/carts/{id}` |
| Tables | entity/model layer, and migrations if any (migrations are the better proof of the real table name) | singular/plural, casing |
| Enums & codes | shared-contract package or owning module | member names |

Raw string comparison produces mostly false positives — normalise first.

## 2. Classify

| Verdict | Docs | Code | Default proposal |
|---|---|---|---|
| in-sync | ✓ | ✓ identical | count only |
| phantom | ✓ | ✗ | tagged `[PROPOSED]` → a plan, not drift; otherwise delete the spec or tag `[REMOVED <date>]` |
| undocumented | ✗ | ✓ | assign an owning feature, or add a `[GAP]` row |
| divergent | ✓ | ✓ but different | doc patch — or a code bug |
| unknown | ✓/✗ | can't tell | say why and what would settle it |

Guardrails:

- A `[PROPOSED]` endpoint that **is** in the code is drift: the tag should have been removed at ship
  time. This is the most frequent and cheapest finding.
- One empty grep is not proof of absence. Dynamic registration, generated routers or flags → `unknown`.
- Don't decide which side is wrong for a divergence. Show both; the bug may be in the code.
- Report only on what you inspected. If you audited one service, say the others were not checked.

## 3. Report

Write `{docs-root}/_audit-{YYYY-MM-DD}.md` at the docs root (it spans features):

```markdown
# Drift audit 2026-06-18

Checked: appointment-booking, staff-directory · both directions
Code read: apps/api/src/**/*.controller.ts, apps/api/src/**/*.entity.ts, apps/api/migrations/
Docs' own baseline: 1 validator error, 3 warnings (pre-existing, not drift)

## Totals
| Feature | Documented | In sync | Phantom | Undocumented | Divergent | Unknown |
|---|---|---|---|---|---|---|
| appointment-booking | 9 | 7 | 0 | 1 | 1 | 0 |

## Shipped but still tagged [PROPOSED]
| Feature | Endpoint | Code location |

## Phantoms
| Feature | Item | Doc anchor | Why we think it's gone |

## Undocumented
| Item | Code location | Likely owner |

## Divergent
| Item | Docs | Code | Which side is wrong? |

## Unknown
| Item | Reason | What would settle it |

## Suggested fixes (cheapest first)
1. Drop 2 stale [PROPOSED] tags.
2. Add 1 [GAP] row for `waitlist_entry`.
3. appointment-booking: run /architect:sync-architecture for the removed reschedule endpoint.
4. Needs a human: `appointment.status` is an enum in docs, free text in code.
```

## 4. Apply what's approved

Present the report and wait. Then apply in order of least judgement:

1. **Mechanical** (on approval): remove `[PROPOSED]` tags on endpoints the code confirms; add `[GAP]`
   rows in `data-model/README.md`; append a dated audit line to each affected feature's `change-log`.
2. **One decision each**: phantoms (delete, or tag `[REMOVED <date>]` to keep history) and divergences
   (patch docs, or file a code bug).
3. **Never here**: code changes, or rewriting specs for shipped scope — route those to
   `/architect:sync-architecture` (docs) or `/architect:fix-arch-bug` (code + docs).

Re-run the validator after applying so no edit leaves a dead anchor.

Features that produced findings each get a single worklog entry in `{progress-root}/{feature-slug}/`
(format per `${CLAUDE_PLUGIN_ROOT}/skills/status/SKILL.md`): audit ran, counts per verdict, report link,
what was applied. Update `progress.md` only if the next step changed.

## Principles

- Never invent a spec for undocumented code; the `[GAP]` marker is the honest answer.
- A one-direction audit must not call itself clean.
- Every finding carries evidence: a code path or a doc anchor.
- Lead with the cheap, uncontroversial fixes; they build trust for the contested ones.
