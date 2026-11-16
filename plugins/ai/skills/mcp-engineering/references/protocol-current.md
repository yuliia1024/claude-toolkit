# MCP Protocol Notes — Verify the Version Before Implementing

This reference captures protocol-specific checks for the MCP specification revision available when this toolkit audit was performed (2026-11-11). Always verify the current specification and SDK changelog before implementation.

## Transports

The standard transports are:
- **stdio** for a client-launched local server process;
- **Streamable HTTP** for remote/server deployments.

Do not teach or implement the legacy HTTP+SSE transport as the current default. It belongs to older protocol revisions and may be supported only for backward compatibility.

## Streamable HTTP version compatibility

The MCP specification revision dated 2026-07-28 changed Streamable HTTP behavior:
- the server exposes a single MCP endpoint using HTTP POST;
- each JSON-RPC request is sent as its own POST;
- a response may be a single JSON response or an SSE stream scoped to that request;
- the revision removes the previous GET stream endpoint and protocol-level sessions.

Older revisions of the specification used different session and streaming behavior. A client supporting multiple protocol revisions must negotiate and implement compatibility deliberately; do not assume one revision's lifecycle applies to another.

## Security requirements to check

For Streamable HTTP:
- validate the Origin header and reject invalid origins;
- bind local servers to localhost rather than all network interfaces;
- authenticate remote connections;
- validate protocol metadata/version requirements for the negotiated revision;
- propagate cancellation when the response stream is closed.

For stdio:
- keep stdout exclusively for protocol messages;
- send diagnostics/logs to stderr;
- validate tool arguments and authorize every operation in application code.

## Implementation checklist

- [ ] Confirm protocol revision and SDK version supported by the host and server.
- [ ] Decide whether the application is an MCP client, server, or both.
- [ ] Keep host policy/model orchestration separate from client transport and server capability implementation.
- [ ] Treat capability discovery as discovery, not authorization.
- [ ] Test initialization, capability discovery, valid/invalid calls, auth denial, cancellation, disconnect, and shutdown.
- [ ] Test the exact transport revision with a real client/host where possible.

Primary specification:
https://modelcontextprotocol.io/specification/2026-07-28/basic/transports
