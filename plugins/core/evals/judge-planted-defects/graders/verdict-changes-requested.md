---
type: regex
pattern: 'verdict\W{0,6}CHANGES_REQUESTED'
flags: i
match: contains
target: last_message
---
The final answer states the overall verdict in the skill's vocabulary: CHANGES_REQUESTED.
