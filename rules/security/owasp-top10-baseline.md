---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.html"
---
# Baseline application security (OWASP)
- Check authentication and per-resource authorization server-side for each sensitive operation and object.
- Validate and normalise untrusted data where it enters, query the database with bound parameters, and encode output for the context it lands in.
- Guard secrets and sensitive data both on the wire and in storage; credentials, tokens, and complete sensitive payloads never go into logs.
- State-changing requests authenticated by cookies need CSRF defences; CORS is an allowlist, not a substitute for authorization.
- Block SSRF through destination allowlists, DNS/IP checks, redirect handling, and egress limits where they apply.
- Put limits on request, body, and upload size, plus timeouts, rate limiting, and error responses that reveal nothing unsafe.
- Keep runtimes and dependencies patched, and scrutinise where dependencies come from and any lockfile changes.
- Uploaded files get checked for content type/signature, size, storage location, and access policy — a filename extension proves nothing.
- Every vulnerability found gets a security regression test, and remaining risk gets written down.
