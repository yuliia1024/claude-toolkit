---
name: ai-security
description: Threat-model and secure LLM applications, agents, tools, and RAG systems. Use for prompt injection, data leakage, excessive agency, tool abuse, tenant isolation, and secure output handling.
---

# AI Application Security

## Threat-model the whole system

Identify assets, actors, trust boundaries, entry points, tools, data sources, and possible impacts. Include user prompts, uploaded files, retrieved documents, web pages, tool outputs, model output, memory, logs, and provider integrations.

Treat model output and all external/retrieved content as untrusted data. Prompt instructions are not a security boundary.

## Prompt injection

Consider both direct injection (user content) and indirect injection (retrieved documents, web pages, files, tool output). Delimit and label untrusted content, but do not rely on delimiters or wording alone.

Enforce security in application code:
- tool allowlists and server-side argument validation;
- authorization on every operation and resource;
- least-privilege credentials and scoped capabilities;
- destination/network allowlists where tools fetch external resources;
- confirmation for consequential side effects;
- isolation of secrets and privileged instructions from model-visible context.

## Hidden context exposure

Protect system/developer instructions, internal routing metadata, secrets, credentials, hidden tool schemas, and unrelated conversation or tenant data. Do not place secrets in prompts as if they were protected; keep credentials in server-side secret stores and expose only narrowly scoped capabilities. Test whether user-controlled content can cause hidden context to be repeated or sent to an external tool.

## Data protection and tenant isolation

Apply ACL and tenant filtering before retrieval and before returning tool results. Never rely on the model to enforce access control. Prevent cross-tenant cache, memory, vector-index, and trace leakage. Define retention and deletion for prompts, files, embeddings, memory, and logs.

Minimize sensitive data sent to providers. Verify provider data handling, region, retention, and contractual requirements for the deployment.

## Supply chain and model/data provenance

Treat model providers, model artifacts, embedding models, datasets, MCP servers, plugins, tool packages, and prompt dependencies as supply-chain inputs. Pin and review versions, verify sources and integrity where available, scan dependencies, restrict permissions, and document model/data provenance. Do not install a tool server or plugin solely because it appears in a marketplace.

## Output handling and misinformation

Validate structured output against schemas and business invariants. Escape or sanitize output before rendering HTML/Markdown or passing it to downstream interpreters. Never execute generated SQL, shell, code, templates, or URLs without strict allowlists and independent validation.

For factual or high-impact answers, ground claims in trusted sources, expose uncertainty, and provide abstention or escalation paths. A valid schema does not make a claim true.

## Agent and tool risks

Limit tool capabilities, iterations, runtime, and spend. Separate read and write tools. Require approval for high-impact actions. Bind approval to exact arguments and revalidate state before execution. Use idempotency and audit trails for side effects.

## RAG-specific risks

Treat retrieved content as evidence, not instructions. Apply ACL filters before retrieval and verify permissions again before returning content. Defend against poisoned documents, malicious embedded instructions, stale permissions, vector/embedding manipulation, and citation spoofing. Preserve provenance and support deletion/re-indexing.

## Testing

Add adversarial tests for direct/indirect injection, hidden-context disclosure, cross-tenant access, malicious tool arguments, output injection, secret exfiltration attempts, poisoned retrieval, vector/embedding manipulation, excessive loops, supply-chain compromise assumptions, misinformation, and approval bypass. Test the enforcement layer, not only whether the model refuses.

## Checklist

- [ ] Trust boundaries and threat scenarios are documented.
- [ ] Authorization and tenant ACLs are enforced outside the model.
- [ ] Tools use least privilege and narrow schemas.
- [ ] Side effects have approval/idempotency/audit controls.
- [ ] Retrieved and generated content is treated as untrusted.
- [ ] Model, data, plugin, and tool supply-chain provenance is reviewed.
- [ ] Sensitive data, memory, cache, and logs have lifecycle controls.
- [ ] Adversarial tests cover the enforcement boundary.

## References

Use the [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) as a threat-coverage checklist, not as a substitute for application-specific threat modeling.
