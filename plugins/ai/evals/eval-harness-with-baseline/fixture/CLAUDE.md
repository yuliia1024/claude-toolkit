# helpdesk-triage

Classifies inbound support tickets so they land in the right queue.

- `src/classifyTicket.ts` — the prompt and parsing; `src/llm/client.ts` — the model client.
- No API key is available in dev/CI sandboxes: use `StubLlmClient` (`src/llm/stub.ts`) for offline runs.
- Sandboxes have no network: the npm registry is unreachable and `node_modules/` is not installed, so don't try `npm install`.
