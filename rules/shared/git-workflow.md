---
paths:
  - "**/*"
---
# Working with git
- Look at the active branch, working tree, remotes, and the repo's contribution guidelines before creating a branch or a commit.
- Follow the project's branch and commit naming scheme if it has one; failing that, pick short descriptive branch names and conventional-commit messages.
- Default branch naming (when the project has none): `<type>/<short-kebab-summary>` — the summary says what the change does in 2–5 words, with no nested slashes. Branch names, commit messages and PR contain what the change does. Example: `feat/order-delivery-api`, `fix/null-courier-eta`.

  | type | use for |
  |---|---|
  | `feat` | new user-visible behaviour or a new API/endpoint |
  | `fix` | a bug fix — behaviour was wrong, now it is right |
  | `refactor` | code restructuring with no behaviour change |
  | `perf` | a measurable speed or resource improvement |
  | `test` | tests only — adding or repairing them |
  | `docs` | documentation only |
  | `chore` | tooling, deps, config, scaffolding, throwaway/verification branches |
  | `ci` | pipeline and build configuration |

  The same types prefix commit messages (`feat: add courier ETA endpoint`).
- Each commit should cover one concern and leave out unrelated or generated files.
- Force-pushing, rewriting shared history, pushing, or opening a PR all require the user's explicit go-ahead.
- A PR description should state the scope, compatibility or migration impact, which tests ran, and which checks did not.
