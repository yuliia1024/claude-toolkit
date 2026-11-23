---
type: regex
pattern: "'\\d{4}-(10|11)-\\d{2}'"
match: contains
target: { source: file, path: test/nights.test.js }
---
A regression test covers the adjacent failure path: a stay across the autumn (fall-back) DST change.
