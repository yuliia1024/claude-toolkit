---
argument-hint: '[category, e.g. A01, A07, injection, ssrf]'
description: 'Category-by-category OWASP Top 10 (2021) review of the configured code paths, with file:line evidence, a 1–5 rating per category and an ordered fix list.'
allowed-tools: Bash, Edit, Glob, Grep, Read, Write
---

# /security:owasp

Review the project against the OWASP Top 10 (2021). `$ARGUMENTS` may restrict the run to one
category (`A03`, `injection`, `auth`, ...); without it all ten are covered.

Load `${CLAUDE_PLUGIN_ROOT}/skills/owasp-top10/SKILL.md` and follow its steps and report layout.

Operating limits:

- read-only toward the code — report, do not patch;
- scope = `paths` of enabled stacks in `.claude/toolkit.json`; commands from `CLAUDE.md`;
- every finding is backed by `file:line` and survives a read of its surrounding code;
- start the report with what is exploitable now.

For dependency scanning, secret search and transport/config checks across the whole repo, pair this
with `/security:audit`.

## Audit register

Some projects keep a register of audit findings — `docs/audits/` by default, or the folder named by
`audit.dir` in `.claude/toolkit.json`. If it exists:

1. Read its `README.md` first; its conventions for IDs, statuses, severities and layout win.
2. Rewrite `<audits dir>/owasp.md` in full for this run.
3. Walk the open `OWASP-` rows and update each: still present, fixed (with evidence), or moved.
4. Close a row only when you can cite the fix. "The search pattern no longer matches" is not
   evidence — the code may simply have moved. If you cannot confirm, mark it `unconfirmed` and leave
   it open.
5. Findings shared with `/security:audit` keep the ID they already have, whatever its prefix. New
   shared findings get a `SEC-` ID. Mention a foreign ID inline
   ("tracked as SEC-004", linking to `security.md#sec-004`), not as a heading.
6. Update `debt.md` and `summary.md` if the register has them, as its README instructs.

No register → print the report in the conversation.
