---
type: regex
pattern: '\\"id\\":\s*\\"[^\\]+\\"[^\n]{0,2000}?\\"tags\\":\s*\['
match: contains
target: trace
---
Dataset rows written by the agent carry a stable id and a tags array (skill: "stable ID, input, expected, tags, provenance").
Matched against the Write/Bash payloads in the trace (target `files` is only the list of changed paths).
