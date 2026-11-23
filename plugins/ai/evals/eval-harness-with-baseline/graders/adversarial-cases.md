---
type: regex
pattern: '\\"(adversarial|injection|prompt[-_ ]injection)\\"'
flags: i
match: contains
target: trace
---
The dataset tags adversarial cases (e.g. prompt injection in the ticket body), not only happy paths.
Matched as a quoted tag value in the agent's written payloads (the skill docs never quote these words).
