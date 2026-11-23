---
type: regex
pattern: '^\|\s*#\s*\|\s*Task\s*\|\s*Wave\s*\|\s*Depends on\s*\|\s*Scope\s*\|'
flags: m
match: contains
target: { source: file, path: docs/architecture/product-reviews/tasks/README.md }
---
README Tasks table uses the parsed columns `# | Task | Wave | Depends on | Scope`.
