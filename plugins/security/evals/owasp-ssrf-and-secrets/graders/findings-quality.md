---
type: llm
weight: 2
criteria: |
  Pass only if ALL of the following hold in the final answer:
  1. It reports the SSRF in `GET /preview` (server fetches the user-supplied `url` and follows redirects) and recommends a scheme/host allowlist plus blocking private, loopback and link-local / cloud-metadata (169.254.169.254) destinations after DNS resolution, with redirect re-validation.
  2. It reports that `/admin/users` routes (list, change plan, delete) have no authentication or admin-role check, and points to the existing `requireAuth` + `requireRole('admin')` as the fix.
  3. It reports the PayFlux API key hard-coded in `src/config.js` and recommends moving it to configuration/secret storage and rotating it.
  4. It does NOT report the `/avatar/:handle` GitHub fetch as an SSRF vulnerability (the host is fixed and the handle is URL-encoded); mentioning it as reviewed and not vulnerable is fine.
  5. The exploitable-now issues are ordered first (fix order puts admin auth / SSRF / secret ahead of hardening items).
---
