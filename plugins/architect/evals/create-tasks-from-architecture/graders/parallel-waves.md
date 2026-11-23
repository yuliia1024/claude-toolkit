---
type: regex
pattern: '^## Parallel Waves'
flags: m
match: contains
target: { source: file, path: docs/architecture/product-reviews/tasks/README.md }
---
README keeps the validator-parsed `## Parallel Waves` heading.
