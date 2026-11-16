---
name: systematic-debugging
description: Find root causes of bugs and production failures using evidence-driven reproduction, hypothesis testing, and regression prevention.
---
# Systematic debugging
1. Establish impact, scope, start time, affected versions, and whether the issue is ongoing.
2. Reproduce with the smallest reliable case. Capture exact inputs, environment, logs, traces, and relevant changes without exposing secrets.
3. Form competing hypotheses. For each, state evidence that would confirm or falsify it.
4. Change one variable at a time; inspect component boundaries before assuming the suspected module is at fault.
5. Identify root cause, not only symptom. Check concurrency, retries, stale caches, time zones, encoding, partial failure, and version skew where relevant.
6. Add a regression test at the narrowest layer that would have caught the defect; add integration coverage if the failure crosses boundaries.
7. Verify the fix and adjacent failure paths. Report root cause, impact, fix, test evidence, and remaining uncertainty.
Do not make speculative edits, disable checks, or rewrite unrelated code while debugging.
