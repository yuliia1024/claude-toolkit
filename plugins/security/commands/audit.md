---
argument-hint: '[area, e.g. deps, secrets, authz, config]'
description: 'Repository-wide security sweep led by scanners and targeted searches — dependencies, secrets, access control, input handling, injection, configuration, data exposure, abuse limits, client-side and CI risks — rated per area with an ordered fix list.'
allowed-tools: Bash, Edit, Glob, Grep, Read, Write
---

# /security:audit

A broad security sweep. `$ARGUMENTS` can name one area to restrict the run.

**Limits:** read-only and non-destructive — no writes to the code under review, no migrations, no
calls to production, no outbound data. Scope comes from the enabled stacks' `paths` in
`.claude/toolkit.json`; tool commands come from `CLAUDE.md`.

## Areas

Rate each applicable area 1–5 and skip those the project has no surface for.

| Key | Area | What to look at |
| --- | --- | --- |
| `deps` | Third-party packages | known CVEs from a lockfile-only scanner (`osv-scanner`, or the package manager's own `audit`, `pip-audit` for Python); floating versions; packages with no recent maintenance |
| `secrets` | Credentials in the repo | keys and tokens in source, config, fixtures and git history; committed `.env` files; `.gitignore` coverage — mask any value you report |
| `authz` | Authentication and authorization | every non-public handler checks identity and permission; record lookups are scoped to owner or tenant |
| `input` | Input handling | body, params, query and headers validated at the boundary with a schema or DTO |
| `injection` | Interpreters | raw or concatenated queries, shell calls, unsafe deserialisation, path traversal, outbound fetches of user-supplied URLs, unescaped HTML output |
| `config` | Transport and runtime config | TLS enforcement, cookie flags, CORS with credentials, security headers, error verbosity in production |
| `data` | Sensitive data | personal data and tokens in logs, encryption at rest where required, over-broad response payloads |
| `abuse` | Abuse limits | throttling on login and expensive endpoints, upload type and size limits |
| `client` | Browser side | secrets in bundles, `target="_blank"` without `rel="noopener"`, missing CSP |
| `ci` | Pipeline and supply chain | pinned actions and images, fork-triggered workflows with secrets, dependency review |

## How to run it

1. Run the safe scanners first; they give fast, objective signal.
2. Search for risky patterns in each area, then read the code around every hit.
3. Trace two or three real requests through authentication and authorization end to end.
4. Discard hits that existing controls already neutralise; keep only evidenced findings.

For a structured walk through the ten OWASP categories, use `/security:owasp`. The two overlap
deliberately: this one is breadth-first and tool-driven, that one is category-driven.

## Report

```
# Security sweep — <project> (<date>)

Posture: <n>/5 · Scope: <paths>

| Area | Rating | Open findings |
| --- | --- | --- |

## Findings
### SEC-007
secrets · high
Where: `config/payments.ts:12`
What: live payment provider key committed in source (value masked: sk_live_****).
Remedy: rotate the key, load it from the secret store, add a pre-commit secret scan.

## Fix order (impact first, then effort)

## Gaps in this pass
<what a static sweep could not establish; suggest dynamic testing, CI secret scanning, etc.>
```

Put exploitable findings at the top. Be explicit about what the sweep did not cover.

## Audit register

If the project keeps an audit register (`docs/audits/` by default, or `audit.dir` in
`.claude/toolkit.json`):

1. Follow the register's `README.md` for IDs, statuses, severities and layout.
2. Replace `<audits dir>/security.md` with this run's report and reconcile the open `SEC-` rows.
3. A finding that `/security:owasp` also reports keeps the ID it was registered with first,
   regardless of prefix; a new shared finding is given a `SEC-` ID. Refer to the other report's ID
   inline ("tracked as OWASP-009", linking to `owasp.md#owasp-009`), never as a heading here.
4. Refresh `debt.md` / `summary.md` if present, per the README.

Without a register, return the report in the conversation.
