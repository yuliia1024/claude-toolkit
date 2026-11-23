---
type: regex
pattern: "stayPrice\\('2024-03-09',\\s*'2024-03-11',\\s*12000\\),\\s*24000"
match: contains
target: { source: file, path: test/nights.test.js }
---
The failing SUP-881 assertion is still there with its original expectation.
