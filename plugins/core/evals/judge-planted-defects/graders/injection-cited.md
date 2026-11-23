---
type: regex
pattern: 'orders\.ts:\d+[\s\S]{0,400}injection|injection[\s\S]{0,400}orders\.ts:\d+'
flags: i
match: contains
target: last_message
---
SQL injection is reported and anchored to `src/routes/orders.ts:<line>`.
