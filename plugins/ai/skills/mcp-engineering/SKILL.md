---
name: mcp-engineering
description: Build or integrate Model Context Protocol clients and servers. Use for MCP tools, resources, prompts, transports, lifecycle, authorization, interoperability, and testing.
---

# MCP Engineering

## Understand the protocol boundary

MCP standardizes how a host/client discovers and invokes capabilities exposed by a server. It does not itself decide the product's agent strategy, grant business authorization, or make a tool safe.

Keep these responsibilities distinct:
- host/application: user experience, policy, model interaction, consent;
- MCP client: connection, capability negotiation, protocol messages, lifecycle;
- MCP server: capability implementation and protocol boundary;
- domain/application services: business rules, authorization, persistence, side effects.

## Capability design

Use the right primitive:
- Tools for actions the model may invoke.
- Resources for application-provided context/data.
- Prompts for reusable prompt templates exposed by a server.

Expose narrow, task-oriented capabilities. Document side effects, required inputs, output shape, and failure modes. Avoid exposing broad administrative operations by default.

## Lifecycle and transport

Follow the current MCP specification and the selected SDK's documentation. Do not assume transports, handshake details, or SDK APIs remain unchanged.

The current standard transports are stdio and Streamable HTTP. Do not present legacy HTTP+SSE as the current default. For stdio, reserve stdout for protocol messages and send diagnostics to stderr. For Streamable HTTP, follow the exact negotiated protocol revision: endpoint, streaming, cancellation, session, and metadata behavior have changed between revisions.

Design connection initialization, capability negotiation, request handling, cancellation, progress, notifications, reconnect, and shutdown explicitly. Choose stdio for appropriate local process integrations and Streamable HTTP for supported remote deployments; verify current transport requirements before implementation.

## Security

- Authenticate remote clients and authorize every sensitive operation.
- Treat tool arguments, resource contents, and server responses as untrusted.
- Do not confuse capability discovery with permission to execute.
- Keep secrets out of prompts, logs, and resource contents.
- Validate inputs and outputs at the server boundary.
- Apply tenant/resource ACLs in the application, not in model instructions.
- Restrict filesystem, network, and process access to the minimum required.
- For Streamable HTTP, validate Origin to prevent DNS rebinding; bind local servers to localhost and authenticate remote connections.
- Require confirmation for consequential side effects where appropriate.

## Interoperability and testing

Test against the protocol version and SDK versions actually supported by the project. Cover initialization, capability discovery, valid and invalid calls, permission denial, malformed payloads, timeout, cancellation, disconnect, reconnect, and shutdown. Add interoperability tests with a real MCP client/host when feasible.

## Implementation workflow

1. Inspect the official MCP specification and current SDK docs.
2. Identify whether the project needs a client, server, or both.
3. Define capabilities and trust boundaries before writing handlers.
4. Implement domain logic outside protocol handlers.
5. Add auth, validation, limits, and observability.
6. Test lifecycle and failure behavior.
7. Document supported protocol/SDK versions and deployment assumptions.

For protocol-version-specific transport details, see [MCP protocol notes](references/protocol-current.md). Re-check the specification before relying on that snapshot.
