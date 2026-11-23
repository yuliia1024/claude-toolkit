---
type: regex
pattern: '(posture|overall)\W{0,6}[1-5]\s*/\s*5'
flags: i
match: contains
target: last_message
---
An overall posture score n/5 in the report header (skill layout: `Posture: <n>/5`).
