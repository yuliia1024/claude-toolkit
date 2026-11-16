---
description: 'Produce a system-level architecture document from the codebase and infra: context, ADRs, data, infrastructure, security, integrations, observability.'
allowed-tools: Bash, Glob, Grep, Read
argument-hint: '<description | spec path | analyze> [notes]'
---

# /system-architecture

`$ARGUMENTS`: a description, a local spec path, or `analyze` to derive everything from code and infra.

1. **Map the system** — apps, services, packages, repo layout, infra (`*.tf`, Helm charts, CI pipelines),
   external integrations. Use a code-intelligence MCP such as Serena when available.
2. **Load conventions** — `.claude/rules/` for each area involved, including `infrastructure/`.
3. **Write `docs/architecture/system/`** covering:

   | Part | Content |
   |---|---|
   | Context | purpose, actors, boundaries, a text component diagram |
   | Decisions | one ADR each: context, decision, options considered, consequences |
   | Data | stores, ownership, main flows, migration approach |
   | Infrastructure | environments, delivery/GitOps, scaling |
   | Security | authentication and authorisation model, secrets, data protection |
   | Integrations | third parties, contracts, failure handling |
   | Observability | logs, metrics, traces, alerts |

4. **Report** the path plus the most important decisions and risks.

Cite files for every claim; list gaps and open questions explicitly rather than guessing.
