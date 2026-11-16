# TypeScript Agent Loop — Reference Pattern

This is an illustrative, provider-neutral pattern for a bounded tool-calling loop in a Node.js/NestJS application. It is not a drop-in framework. Adapt provider response parsing and tool-result correlation to the SDK/API version in use.

## Execution contract

Keep the model adapter, tool registry, authorization, and business services separate.

```ts
import { z } from "zod";

type Actor = { userId: string; tenantId: string };

type ToolContext = {
  actor: Actor;
  signal: AbortSignal;
  runId: string;
};

type ToolDefinition = {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  effect: "read" | "write";
  execute: (input: unknown, context: ToolContext) => Promise<unknown>;
};

type ModelTurn =
  | { kind: "final"; output: string }
  | {
      kind: "tool_calls";
      calls: Array<{ callId: string; name: string; arguments: unknown }>;
    };

interface ModelAdapter {
  next(input: {
    messages: unknown[];
    tools: Array<{ name: string; description: string; schema: unknown }>;
    signal: AbortSignal;
  }): Promise<ModelTurn>;
}
```

## Bounded orchestration

The application owns the loop and its limits. The model only proposes the next action.

```ts
async function runAgent(input: {
  messages: unknown[];
  actor: Actor;
  runId: string;
  signal: AbortSignal;
  maxSteps: number;
  model: ModelAdapter;
  tools: Map<string, ToolDefinition>;
}): Promise<string> {
  const { model, tools, signal } = input;
  const messages = [...input.messages];

  for (let step = 0; step < input.maxSteps; step += 1) {
    signal.throwIfAborted();

    const turn = await model.next({
      messages,
      tools: [...tools.values()].map(({ name, description, schema }) => ({
        name,
        description,
        schema,
      })),
      signal,
    });

    if (turn.kind === "final") return turn.output;

    for (const call of turn.calls) {
      signal.throwIfAborted();

      const tool = tools.get(call.name);
      if (!tool) {
        messages.push({
          type: "tool_result",
          callId: call.callId,
          error: "UNKNOWN_TOOL",
        });
        continue;
      }

      try {
        const args = tool.schema.parse(call.arguments);
        // Authorization belongs inside the tool/application boundary.
        // Re-check it against the current actor and current resource state.
        const result = await tool.execute(args, {
          actor: input.actor,
          signal,
          runId: input.runId,
        });

        messages.push({
          type: "tool_result",
          callId: call.callId,
          result,
        });
      } catch (error) {
        messages.push({
          type: "tool_result",
          callId: call.callId,
          error: normalizeToolError(error),
        });
      }
    }
  }

  throw new Error("AGENT_STEP_LIMIT_REACHED");
}

function normalizeToolError(error: unknown): string {
  if (error instanceof z.ZodError) return "INVALID_TOOL_ARGUMENTS";
  // Map known application errors to stable codes here. Never expose raw messages.
  return "TOOL_EXECUTION_FAILED";
}
```

The example intentionally omits provider-specific message shapes, persistence, tracing, retry policy, and approval UX. Add these through explicit application interfaces rather than hiding them inside the loop.

## Production requirements

- Enforce a wall-clock deadline and token/cost budget in addition to max steps.
- Propagate request cancellation to the provider and every tool.
- Bind each tool result to the provider's exact call identifier.
- Re-authorize every operation; never trust authorization decisions stored in model context.
- Separate read and write tools. For consequential writes, require approval bound to canonical arguments and revalidate state before execution.
- Use idempotency keys for side effects and persist checkpoints if runs must survive process restarts.
- Bound parallel tool execution and only parallelize independent calls.
- Record a terminal status: completed, failed, cancelled, waiting_for_approval, or budget_exhausted.

## Review questions

1. Can a model-proposed action escape the registry?
2. Can an unauthorized actor access another tenant's resource by changing an ID?
3. Can a retry or resumed run repeat a side effect?
4. Can the loop continue after cancellation or deadline expiry?
5. Can the system distinguish a model's claimed success from a confirmed backend result?

