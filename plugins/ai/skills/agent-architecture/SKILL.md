---
name: agent-architecture
description: Design and implement production agent systems. Use when a feature needs autonomous or semi-autonomous decisions, multi-step tool use, planning, handoffs, memory, or agent orchestration.
---

# Agent Architecture

## Goal

Design the smallest reliable architecture that satisfies the task. An agent is justified only when the next action depends on information or results discovered at runtime.

## Decision process

1. Write the user goal, success criteria, constraints, and forbidden actions.
2. List the steps that are known in advance. Implement those as deterministic application workflow.
3. Identify the decisions that genuinely require model judgment.
4. Choose the lowest-complexity pattern:
   - single model call for one bounded transformation;
   - model + tools when the model selects among a small set of actions;
   - deterministic workflow when the sequence is known;
   - agent loop when actions and sequence depend on observations;
   - multi-agent only when independent roles, context boundaries, or parallel work justify the coordination cost.
5. Define the execution contract before implementation.

## Agent execution contract

Specify:
- input and output schemas;
- state owned by the application;
- available tools and per-tool authorization;
- maximum steps/iterations, wall-clock duration, and token/cost budget;
- termination conditions and completion criteria;
- retryable vs terminal errors;
- cancellation behavior;
- human approval points;
- audit and trace events.

The model proposes actions. The application validates, authorizes, executes, and records them. Never treat model output as proof that an action succeeded.

## State and control flow

Keep durable business state in application storage, not only in conversation history. Model context is a projection of relevant state, not the source of truth.

Represent execution explicitly, for example: created → running → waiting_for_approval → completed / failed / cancelled. Persist checkpoints when work must survive process restarts. Make resumed steps idempotent.

Use explicit handoffs between deterministic workflow and agent execution. Do not let an agent silently take over unrelated business processes.

## Multi-agent systems

Introduce multiple agents only when there is a measurable benefit such as independent parallel research, distinct permission boundaries, or specialized context. Define each agent's responsibility, input/output schema, tools, budget, and handoff contract. Avoid agents that merely rephrase another agent's output.

## Failure handling

Handle tool failure, malformed output, empty results, conflicting evidence, exhausted budget, timeout, cancellation, and partial completion. The agent must not claim success for unexecuted or failed actions. Return a structured status and actionable next step.

## Reference implementation

For a bounded TypeScript orchestration example, see [TypeScript agent loop](references/typescript-agent-loop.md). It is an illustrative pattern; adapt provider-specific request/response and tool-result correlation to the actual SDK/API version.

## Validation checklist

- [ ] A simpler non-agent design was considered.
- [ ] Success and termination criteria are testable.
- [ ] Iteration, time, and cost limits are enforced by application code.
- [ ] State survives restarts where required.
- [ ] Tools are allowlisted and authorized outside the model.
- [ ] Side effects are idempotent or guarded by approval.
- [ ] Partial failure and cancellation are defined.
- [ ] Traces can explain every model decision and tool result.
- [ ] Evaluation cases cover normal, edge, and adversarial paths.
