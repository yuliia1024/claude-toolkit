---
name: owasp-top10
description: How to review a codebase against the OWASP Top 10 (2021) — scoping, per-category questions and search patterns, stack-specific traps, a 1–5 rating per category, and a register-friendly report layout. Used by /security:owasp and the security-reviewer agent.
---

# OWASP Top 10 review method

Use this when someone asks "are we exposed to <category>?", wants a pre-release security pass, or runs
`/security:owasp`. The output is a per-category rating with concrete evidence, not a lecture on
security in general.

Edition: OWASP Top 10 **2021**. If you are working from a later edition, map the categories and name
the edition in the report header.

## Ground rules

- **Read-only.** No command that writes, migrates, deploys, calls production, or sends data to third
  parties. Lockfile-only dependency scanners are fine.
- **Scope from config.** Read `.claude/toolkit.json` and limit the review to the `paths` of enabled
  stacks (e.g. `stacks.backend-node.paths`). Tooling commands come from the project's `CLAUDE.md`.
- **A grep hit is a lead.** Read the surrounding code and look for existing mitigations (guards,
  middleware, ORM escaping, framework defaults) before calling it a finding.
- **Never echo secrets.** Point to `file:line` and describe the kind of secret; mask the value.

## Step 1 — map entry points

List where untrusted data enters: REST/GraphQL handlers, WebSocket gateways, queue and event
consumers, scheduled jobs that read external data, file uploads, webhooks, and any code that fetches
a URL. Then pick three or four representative flows and follow the data from the edge to storage or
to the external call it triggers.

## Step 2 — walk the categories

For each category: answer the questions, run the searches, read what they find.

### A01 Broken Access Control

Questions:
- Is there a server-side authorization check on every non-public handler, not only authentication?
- When a record is loaded by id, does the query constrain it to the caller's user or tenant?
- Do admin and write operations require an explicit role/permission, with deny as the default?
- Is any restriction enforced only in the UI?
- Can a credentialed cross-origin request reach endpoints it should not?

Search: guard and decorator names (`UseGuards`, `Roles`, `Public`, `permission`, `policy`), then the
handlers that take `:id` params — compare their queries against the caller identity.

### A02 Cryptographic Failures

Questions:
- Is all traffic carrying credentials or personal data encrypted in transit?
- Are passwords hashed with argon2, bcrypt, scrypt or PBKDF2 with sane parameters?
- Are random tokens produced by a CSPRNG?
- Are keys and IVs loaded from configuration rather than source code?
- Has certificate verification been disabled anywhere?

Search: `md5`, `sha1`, `createCipher(`, `ECB`, `Math.random(`, `rejectUnauthorized: false`,
`NODE_TLS_REJECT_UNAUTHORIZED`, `verify=False`.

### A03 Injection

Questions:
- Do any queries get built by string concatenation or template literals with request data?
- Can request data reach a NoSQL operator (`$where`, `$regex`, `$ne`) unfiltered?
- Is a shell ever invoked with interpolated values?
- Is user-controlled content rendered without escaping (raw HTML props, template "safe" filters)?
- Is `eval`, `new Function` or a server-side template compiled from input?

Search patterns (kept in a code block so the regex characters survive formatting):

```text
\$queryRawUnsafe|\.query\(\s*`|\.raw\(|SELECT .*\$\{|WHERE .*\+\s*req\.
exec\(|execSync\(|spawn\(.*shell:\s*true|child_process
innerHTML|dangerouslySetInnerHTML|v-html|bypassSecurityTrust|new Function\(|eval\(
```

### A04 Insecure Design

Questions:
- Were sign-up, login, password reset, payments and role changes designed with abuse in mind?
- Are expensive or sensitive operations rate limited?
- Can business rules be bypassed — negative amounts, client-supplied prices, double submission,
  concurrent balance updates?
- Is tenant isolation a design property or something each query has to remember?

Record missing controls even when no exploit is demonstrated yet.

### A05 Security Misconfiguration

Questions:
- Do production builds hide stack traces and verbose errors?
- Are debug, metrics, docs or admin routes exposed without protection?
- Are security headers set (CSP, `X-Content-Type-Options`, frame protection, `Referrer-Policy`)?
- Are cookies `HttpOnly`, `Secure` and `SameSite`?
- Does CORS combine a wildcard or reflected origin with credentials?
- Are storage buckets, containers and proxies configured restrictively?

Search: `enableCors`, `cors(`, `origin: '*'`, `credentials: true`, `helmet`, `swagger`, `DEBUG`,
`trust proxy`, plus Dockerfiles, reverse-proxy and ingress config.

### A06 Vulnerable and Outdated Components

Scan the lockfile with whatever the stack offers — `osv-scanner` works everywhere; the package
manager's `audit` subcommand and `pip-audit` for Python are alternatives. Note missing or uncommitted lockfiles, unmaintained packages, end-of-life runtimes,
and loose version ranges on security-relevant packages. Prioritise known CVEs in code paths that are
actually reachable.

### A07 Identification and Authentication Failures

Questions:
- Is login protected against credential stuffing (throttling, lockout, MFA where expected)?
- Are JWTs verified with a pinned algorithm, checked for `exp`, and signed with a strong secret?
- Are sessions regenerated on login and invalidated on logout and password change?
- Are reset tokens single-use and short-lived?
- Do login and reset responses leak whether an account exists (wording or timing)?
- Do credentials ever travel in query strings?

Search: `jwt.verify`, `jwt.decode`, `algorithms`, `expiresIn`, `passport`, `session(`, `bcrypt`,
`login`, `reset`.

### A08 Software and Data Integrity Failures

Questions:
- Is untrusted data deserialised with a format that can instantiate objects (`pickle`, unsafe YAML
  loaders, `node-serialize`, native Java serialisation)?
- Are CI actions and base images pinned (ideally by digest)?
- Do workflows triggered by forks get access to secrets (`pull_request_target`)?
- Are third-party scripts loaded with integrity checks?
- Does anything pipe a downloaded script straight into a shell?

Search: `pickle.loads`, `yaml.load(`, `unserialize`, `pull_request_target`, `| sh`, `| bash`.

### A09 Security Logging and Monitoring Failures

Questions:
- Are failed logins, permission denials and high-value changes logged with who/what/when?
- Do logs exclude passwords, tokens, authorization headers and full payment data?
- Are logs shipped somewhere users cannot alter, with alerting attached?
- Which sensitive operations leave no trace at all?

Search: logger calls that include `req.body`, `headers`, `password`, `token`, `authorization`.

### A10 Server-Side Request Forgery

Questions:
- Where does the server fetch a URL or host that a user can influence (webhooks, previews, imports,
  image or PDF rendering)?
- Is the destination checked against an allowlist of schemes and hosts?
- Are private and special-purpose destinations rejected after DNS resolution — loopback, RFC 1918
  ranges, link-local including the cloud metadata address, and non-HTTP schemes?
- Are redirects re-validated rather than followed blindly?

Search: `fetch(`, `axios`, `got(`, `HttpService`, `http.request`, `requests.get` near request-derived
values, then trace the URL back to its source.

## Step 3 — rate and rank

| Rating | Meaning |
| --- | --- |
| 5 | No weakness found; controls are consistent |
| 4 | Minor gaps, hard to exploit |
| 3 | Real gaps with limited reach or impact |
| 2 | Exploitable under realistic conditions |
| 1 | Exploitable now with significant impact |

Categories the stack does not touch are marked `n/a` with a one-line reason.

Finding severities: **critical**, **high**, **medium**, **low**. Order remediation by
impact × reachability, then by lowest effort.

## Report layout

Saved to `<audits dir>/owasp.md` when the project keeps an audit register (see the command for the
reconcile rules); otherwise returned in chat.

```
# OWASP Top 10 (2021) — <project>

Run: <date> · Scope: <paths> · Posture: <n>/5

## Ratings
| Cat | Title | Previous | Current | Main issue |
| --- | --- | --- | --- | --- |
| A01 | Broken Access Control | 3 | 4 | ... |

## Open
### OWASP-012
A01 · Tenant filter missing on invoice download — critical
Where: `src/billing/invoice.controller.ts:58`
Risk: any signed-in user can fetch another tenant's invoice by id.
Remedy: scope the lookup by `tenantId` from the token; add a test for cross-tenant access.

## Resolved since previous run
| ID | Title | Resolved by | Evidence |

## Fix order
1. ...

## Not covered by this pass
```

Notes on the layout:

- The `Previous` column is omitted on a first run.
- A heading contains only the finding ID. The category goes on the next line because one finding may
  touch more than one category, and the register links to `#owasp-012`; keeping the heading to the ID
  keeps that link stable when the title is edited.
- With a register, every open finding has an ID and every ID has a register row. A finding also
  reported by `/security:audit` keeps whichever ID it was first registered under; brand-new overlaps
  take a `SEC-` ID. Refer to an ID owned by the other report inline, e.g.
  "tracked as SEC-004" with a link to `security.md#sec-004`, never as a heading of its own.
- Lead with what is exploitable today, and finish by naming what a static read cannot establish
  (dynamic testing, CI dependency scanning, penetration testing of high-risk flows).
