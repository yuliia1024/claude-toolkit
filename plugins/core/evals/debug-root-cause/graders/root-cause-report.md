---
type: llm
criteria: |
  Pass only if the final answer:
  1. Names the root cause precisely: dates are built at local midnight, and the night of the US spring-forward DST change (10 March 2024 in America/New_York) is only 23 hours long, so `Math.floor(diff / 86_400_000)` drops a night. Saying merely "timezone issue" or "off-by-one" without the 23-hour-day mechanism does not pass.
  2. Explains why the fix also holds for the autumn fall-back day (25 hours), not only the reported March stay.
  3. Reports test evidence after the fix (e.g. all tests passing) and mentions the regression test(s) added.
---
