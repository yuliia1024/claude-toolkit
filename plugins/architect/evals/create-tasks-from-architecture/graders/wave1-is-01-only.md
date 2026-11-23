---
type: regex
pattern: '^\|\s*01\s*\|[^\n]*\|\s*1\s*\|[^\n]*\|\s*contracts\s*\|'
flags: m
match: contains
target: { source: file, path: docs/architecture/product-reviews/tasks/README.md }
---
Task 01 sits in wave 1 with Scope `contracts`.
