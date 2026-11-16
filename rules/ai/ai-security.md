---
paths:
  - "**/ai/**"
  - "**/llm/**"
  - "**/agents/**"
  - "**/mcp/**"
---

# AI Security Rules

- Prompts and delimiters are not security boundaries. Enforce controls in application code.
- Validate model-generated structured output and enforce business invariants before use.
- Authorize every tool call and resource access server-side; never rely on the model to enforce ACLs.
- Use least-privilege tools and credentials. Separate read and write capabilities.
- Require explicit approval for consequential side effects and bind approval to exact arguments.
- Defend against direct and indirect prompt injection in user content, retrieved documents, files, web pages, and tool outputs.
- Protect hidden context: never expose system/developer instructions, secrets, internal tool metadata, or unrelated tenant data in model-visible output.
- Review model, dataset, embedding, MCP server, plugin, and tool dependencies as supply-chain inputs; pin and verify trusted sources.
- Defend ingestion and retrieval against poisoned documents, embedding/vector manipulation, stale ACL metadata, and unsafe index updates.
- Enforce token, request, tool, and agent-step budgets to prevent unbounded consumption.
- Prevent cross-tenant leakage in retrieval, memory, caches, and observability data.
- Never execute generated SQL, shell, code, templates, or URLs without strict independent validation and allowlists.
- Minimize sensitive data sent to providers and stored in prompts, traces, and logs.
