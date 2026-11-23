---
type: regex
pattern: '^[*_]*verdict[*_]*\s*:\s*[*_]*PASS\b'
flags: im
match: not_contains
target: last_message
---
The overall verdict must not be PASS. Anchored at line start so the indented per-lens `verdict: PASS`
lines inside `lenses:` (e.g. a design lens that found nothing) do not count.
