---
type: regex
pattern: 'Math\.ceil'
match: not_contains
target: { source: file, path: src/nights.js }
---
`Math.ceil` "fixes" spring-forward but over-charges the 25-hour fall-back day — a symptom patch.
