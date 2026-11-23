---
type: regex
pattern: 'A10[\s\S]{0,600}preview\.js|preview\.js[\s\S]{0,600}A10'
match: contains
target: last_message
---
The SSRF in `/preview` is reported under A10 and located in `src/routes/preview.js`.
