---
paths:
  - "**/*"
---
# Validating after a change
- Work out the real scripts and package manager from the manifests and lockfiles rather than presuming npm, yarn, pnpm, or bun.
- Start with targeted tests for the behaviour you changed, then run whatever typecheck, lint, build, and integration suites exist.
- Review the diff and git status to rule out unrelated edits, secrets, leftover debug output, or generated files committed by mistake.
- When a check cannot be executed, explain the reason and label it NOT RUN; missing evidence never counts as a pass.
- Migrations, concurrency, authorization, and third-party integrations need verification at the real boundary wherever mocks fall short.
