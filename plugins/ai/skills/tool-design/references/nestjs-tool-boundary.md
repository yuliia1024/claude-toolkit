# NestJS Tool Boundary — Reference Pattern

Use this pattern when exposing an application capability to an LLM through function calling or an agent tool registry. It illustrates the backend boundary, not a provider SDK integration.

## Keep the tool adapter thin

The adapter should parse untrusted arguments, establish actor context, call an application service, and map the result to a small model-safe response. It should not contain business rules or query arbitrary data.

```ts
import { Injectable } from "@nestjs/common";
import { z } from "zod";

const GetOrderInput = z.object({
  orderId: z.string().uuid(),
}).strict();

type AuthenticatedActor = {
  userId: string;
  tenantId: string;
};

@Injectable()
export class GetOrderTool {
  constructor(private readonly orders: OrdersApplicationService) {}

  async execute(rawArguments: unknown, actor: AuthenticatedActor) {
    const input = GetOrderInput.parse(rawArguments);

    // The application service performs a tenant-scoped, permission-aware lookup.
    const order = await this.orders.getReadableOrder({
      orderId: input.orderId,
      actor,
    });

    // Return only fields required for the model's next decision.
    return {
      orderId: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
    };
  }
}
```

The example assumes that the authenticated actor is supplied by trusted request/run context. Never accept userId, tenantId, roles, or permission flags from model-generated arguments.

## Side-effecting tools

For a write operation, the application service should:
1. validate business invariants;
2. authorize against current state;
3. require an explicit approval where the impact warrants it;
4. enforce idempotency using a server-generated or validated idempotency key;
5. persist the operation and an audit record;
6. return the authoritative operation status.

Do not make the model invent an idempotency key and then trust it as proof of uniqueness. The application owns idempotency semantics.

## Provider boundary

The provider adapter maps tool definitions and tool-call/result envelopes to the selected API. Keep these concerns outside the NestJS application service:
- provider-specific JSON schema restrictions;
- tool-call IDs and result correlation;
- streaming event parsing;
- refusal, incomplete, and terminal response states.

Validate again with Zod or the project's runtime validation library even when the provider supports strict schema mode. Provider schema enforcement does not replace authorization or domain validation.

## Tests

Test at least:
- malformed arguments and unexpected properties;
- cross-tenant and unauthorized resource IDs;
- resource deleted or permissions changed between proposal and execution;
- duplicate write requests and idempotency;
- provider retry after a tool side effect;
- safe error mapping without stack traces or secrets.
