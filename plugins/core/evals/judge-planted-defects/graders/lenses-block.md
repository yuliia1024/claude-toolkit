---
type: regex
pattern: 'lenses:[\s\S]*lens:\s*security[\s\S]*lens:\s*spec|lenses:[\s\S]*lens:\s*spec[\s\S]*lens:\s*security'
match: contains
target: last_message
---
The machine-readable `review_result.v1` block is present with per-lens results (at least security and spec).
