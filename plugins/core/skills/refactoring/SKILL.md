---
name: refactoring
description: Safely improve code structure without changing externally observable behavior, using characterization tests and incremental changes.
---
# Safe refactoring
- Define behavior and compatibility that must remain unchanged before editing.
- Inspect callers, public exports, serialization, side effects, timing assumptions, and persisted data.
- Add characterization tests where behavior is poorly specified; do not encode known bugs as desired behavior without confirmation.
- Refactor in small reversible steps. Keep behavior changes separate from structural changes.
- Prefer clear cohesion and dependency direction over abstractions for hypothetical reuse.
- Avoid large-scale renames or formatting churn mixed with logic changes.
- Run focused tests after each step, then relevant suite and type/lint checks.
- Compare public API and generated artifacts; document migration/deprecation when compatibility changes are intentional.
