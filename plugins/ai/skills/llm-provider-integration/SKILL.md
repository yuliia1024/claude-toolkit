---
name: llm-provider-integration
description: Integrate LLM providers and model APIs behind maintainable application boundaries. Use for SDK selection, provider adapters, model capabilities, streaming, structured output, fallback, and API migrations.
---

# LLM Provider Integration

## Start with capabilities, not a lowest-common-denominator abstraction

Inspect the current provider SDK, API documentation, model capabilities, project wrappers, and configuration before changing code. Verify current model identifiers, supported parameters, structured-output modes, tool semantics, streaming events, limits, and pricing from official sources.

Do not switch provider, model, or API family unless requested or justified by a documented requirement.

## Adapter boundary

Keep provider-specific request/response mapping in adapters. Expose application-level use cases such as generate, stream, or execute tool turn, rather than leaking raw SDK types through the domain.

Normalize only stable concepts the application actually needs:
- text/content blocks;
- tool calls and correlated results;
- structured output;
- usage metadata;
- finish/stop reason;
- provider errors;
- streaming lifecycle.

Preserve access to provider-specific capabilities when normalization would erase important functionality. Avoid building a speculative universal abstraction for providers not in use.

## Configuration and capabilities

Represent provider, model, endpoint, timeout, output-token limit, and feature flags as validated configuration. Maintain a capability map for features the application relies on. Fail fast when a selected model does not support a required capability.

Keep secrets in the approved secret/configuration system. Never log API keys or raw sensitive prompts by default.

## Streaming

Treat streaming as a lifecycle, not just text chunks. Handle start, deltas, tool-call events, completion, refusal, provider error, cancellation, and incomplete/truncated output according to the provider contract. Do not report success until the terminal event confirms completion.

## Fallback and routing

Fallback only to models/providers with compatible capabilities and acceptable privacy, quality, latency, and cost. Make fallback visible in traces. Avoid retrying non-idempotent tool execution merely because a model request failed.

## Migration and testing

Use official migration guides and changelogs. Add adapter contract tests for request mapping, structured output, tool-call correlation, streaming, usage, and error normalization. Test each supported provider/model combination that production configuration can select.

## Checklist

- [ ] Current SDK and official docs were inspected.
- [ ] Provider-specific behavior stays inside adapter boundaries.
- [ ] Required capabilities are checked explicitly.
- [ ] Streaming terminal/error/cancel states are handled.
- [ ] Fallback preserves capability and policy requirements.
- [ ] Secrets and sensitive data are protected.
- [ ] Contract tests cover supported models and API behavior.
