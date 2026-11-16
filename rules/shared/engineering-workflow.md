---
paths:
  - "**/*"
---
# How engineering work proceeds
- Before touching anything, read the repo's instructions, manifests, surrounding code, tests, and git status.
- Treat the architecture and conventions already in place as authoritative; new dependencies, frameworks, abstractions, or directory layouts need a concrete justification.
- Surface any assumption that changes behaviour, data shape, security, compatibility, or migrations instead of guessing silently.
- Aim for the narrowest change that fully solves the task, and leave public contracts intact unless a change to them was requested.
- Ship failure handling, observability, and tests together with the behaviour; report a check as passing only after actually running it.
- Go over the final diff for stray edits, secrets, generated artefacts, dead code, and absent tests.
- Do not loosen validation, authorization, type safety, or tests merely to get a check to go green.
