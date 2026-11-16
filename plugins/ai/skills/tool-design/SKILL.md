---
name: tool-design
description: Design safe, reliable tools and function-calling interfaces for LLM applications and agents. Use when defining tool schemas, execution, authorization, retries, side effects, or parallel tool calls.
---

# Tool Design and Execution

## Boundary

A tool is an application capability exposed through a constrained contract. The model may request a tool call; only application code decides whether it is valid, authorized, and safe to execute.

## Schema design

- Give each tool one clear responsibility and an action-oriented name.
- Describe when to use it, when not to use it, and important side effects.
- Use narrow JSON schemas with required fields, enums, bounds, and explicit nullability.
- Prefer stable domain identifiers over ambiguous display names.
- Keep schemas small; split unrelated operations.
- Validate arguments again in application code (for example, with Zod), even if the provider supports strict schemas.
- Do not expose internal database queries, arbitrary URLs, shell commands, or unrestricted code execution as general-purpose tools.

## Execution lifecycle

1. Parse the provider response and identify requested calls.
2. Validate tool name and arguments against the server-side registry.
3. Authenticate the caller and authorize the specific resource/action.
4. Apply business invariants and approval requirements.
5. Execute with timeout, cancellation, and bounded resource usage.
6. Normalize success and failure into a documented tool result.
7. Append the result to the model interaction using the provider's required call/result correlation.
8. Record a trace with call ID, tool name, duration, outcome, and safe metadata.

Never trust the model's statement that a tool ran. The backend result is authoritative.

## Errors and retries

Return errors that help the model recover without exposing stack traces, credentials, internal topology, or sensitive records. Distinguish invalid arguments, denied permissions, not found, conflict, rate limit, transient dependency failure, and permanent failure.

Retry only when the failure is transient and the operation is safe to repeat. Use idempotency keys for side effects. Do not automatically retry a payment, email, transfer, or destructive action without a sound idempotency/confirmation design.

## Side effects and approval

Read-only tools should be separate from write tools. Require explicit confirmation for consequential, irreversible, external, or high-impact actions. Bind approval to the exact action and arguments; revalidate authorization and state at execution time.

## Parallel calls

Parallelize only independent operations. Declare and enforce concurrency limits. Do not parallelize operations with ordering or shared-state dependencies. Aggregate partial failures explicitly.

## TypeScript/NestJS example

See [NestJS tool boundary](references/nestjs-tool-boundary.md) for a thin tool adapter, tenant-aware application-service call, and test cases. The example is illustrative, not a substitute for the project's authorization model.

## Checklist

- [ ] Tool has one clear purpose and a narrow schema.
- [ ] Arguments are validated server-side.
- [ ] Authentication, authorization, and business rules run outside the model.
- [ ] Timeouts, cancellation, and resource limits are enforced.
- [ ] Side effects are idempotent and approval-gated where needed.
- [ ] Errors are safe and machine-actionable.
- [ ] Parallel execution is bounded and dependency-aware.
- [ ] Tool calls and results are traceable.
