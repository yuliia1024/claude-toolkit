---
type: regex
pattern: 'A01[\s\S]{0,600}admin\.js|admin\.js[\s\S]{0,600}A01'
match: contains
target: last_message
---
The unauthenticated admin routes are reported under A01 and located in `src/routes/admin.js`.
