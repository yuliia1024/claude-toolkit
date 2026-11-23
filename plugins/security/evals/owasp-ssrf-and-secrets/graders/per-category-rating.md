---
type: regex
pattern: '\|\s*A0?[1-9]\d?\s*\|[^\n]*\|\s*[1-5](\s*/\s*5)?\s*\|'
match: contains
target: last_message
---
A ratings table with a 1–5 rating per OWASP category, as the skill's report layout defines.
