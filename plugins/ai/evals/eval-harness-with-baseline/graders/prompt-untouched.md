---
type: regex
pattern: 'Set urgency: high if the customer cannot work or is losing money right now, normal otherwise, low for questions and ideas\.'
match: contains
target: { source: file, path: src/classifyTicket.ts }
---
Setting up the eval must not change the prompt under test.
