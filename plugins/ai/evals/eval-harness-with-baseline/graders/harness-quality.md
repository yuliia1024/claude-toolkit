---
type: llm
weight: 2
focus: trace
criteria: |
  Pass only if ALL hold, judging the files the agent wrote and its final answer:
  1. Grading is deterministic for this task: exact-match checks on `category` and `urgency` (and valid-label/schema checks), not an LLM judge, with results broken down per category or per tag.
  2. A baseline is recorded: either the harness was run offline (e.g. with StubLlmClient) and the per-metric numbers are reported/saved, or a baseline file/section exists that is explicitly marked as not yet run against the real model. If stub numbers are reported, the answer says they do not reflect real model quality.
  3. The answer does not claim or present results from a real model call (there is no API key).
  4. It explains how to compare a prompt change against the baseline on the same dataset (re-run, diff per metric/tag).
---
