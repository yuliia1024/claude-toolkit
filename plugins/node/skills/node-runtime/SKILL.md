---
name: node-runtime
description: Diagnose and implement Node.js runtime behavior involving event loop, async context, streams, buffers, workers, child processes, cancellation, and graceful shutdown.
---
# Node.js runtime engineering
Inspect supported Node version and deployment constraints before choosing APIs.

## Event loop and async work
- Keep CPU-heavy work off the event loop; measure event-loop delay/utilization before optimizing.
- Async I/O does not make CPU-bound JavaScript parallel.
- Handle EventEmitter error events; an unhandled error event can terminate the process.
- Use AsyncLocalStorage for request-scoped context carefully; avoid leaking stores across detached work.

## Streams and buffers
- Prefer stream.pipeline/promises pipeline for error propagation and cleanup across pipelines; understand pipe backpressure and ensure producers respect it.
- Handle stream errors, aborts, and premature close. Do not buffer unbounded uploads/downloads in memory.
- Use Buffer.alloc for initialized memory. Buffer.allocUnsafe is safe only when every byte is overwritten before exposure.

## Cancellation and lifecycle
- Propagate AbortSignal through supported APIs; distinguish timeout from caller cancellation.
- Handle unhandled rejections at process boundary for telemetry/controlled shutdown, not as a substitute for catching operation failures.
- Graceful shutdown: stop accepting work, drain in-flight requests/jobs, close consumers and pools, then exit within a deadline.

## Workers and processes
- Use Worker Threads for CPU-bound JavaScript needing shared process memory; use child processes for stronger isolation or external executables.
- Understand structured clone costs, transfer lists, SharedArrayBuffer/Atomics synchronization, worker error/exit/message lifecycle, and backpressure.
- Choose spawn for streaming stdio, exec for shell command output with bounded buffers, execFile for direct executable invocation, and fork for Node child processes with IPC. Avoid shell interpolation with untrusted input.
- Bound worker/process pools and propagate cancellation; test crash, timeout, and shutdown behavior.
