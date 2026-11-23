---
type: regex
pattern: '\.skip\b|\.todo\b|\{\s*skip\s*:|\{\s*todo\s*:|process\.env\.TZ\s*=\s*.(UTC|Etc)'
match: not_contains
target: { source: file, path: test/nights.test.js }
---
No skipped/todo tests and no switching the test's time zone to UTC to hide the bug.
