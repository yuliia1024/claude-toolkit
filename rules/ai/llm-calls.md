---
description: 'LLM calls: prompts in files, structured output, retries, security.'
paths:
  - '**/prompts/**'
  - '**/*.prompt.*'
  - '**/llm/**'
  - '**/ai/**'
  - '**/evals/**'
---

# LLM calls

- Prompts live in dedicated files/constants (`prompts/<feature>.ts|md`), never inline string concatenation in business logic.
- One shared client per provider; model id, `max_tokens`, temperature come from config, not hardcoded in call sites.
- Structured output via the provider's schema / tool-use mode, then validated (zod / pydantic). No regex parsing of free text.
- Every call has a timeout and retries with backoff on 429 / 5xx.
- Model output and retrieved documents are untrusted: validate before SQL / shell / HTML / tool execution.
- Log model, prompt version, tokens and latency; never log secrets or raw PII.
- A prompt or model change in a PR comes with eval results (before → after).
