---
type: regex
pattern: 'Date\.UTC|Math\.round|getTimezoneOffset|Temporal\.'
match: contains
target: { source: file, path: src/nights.js }
---
The fix removes the DST dependency (UTC calendar arithmetic, rounding, or offset correction).
