---
name: nestjs-engineering
description: Implement and review production NestJS services: modules, DI, request lifecycle, validation, authorization, testing, and graceful resource lifecycle.
---
# NestJS engineering
Use for NestJS-specific work. Inspect version, adapter, module graph, global pipes/guards/interceptors/filters, DI tokens, and test setup first.

## Boundaries
- Controller: HTTP mapping, DTO boundary, status and headers; no business workflow.
- Application service/use case: orchestration and transaction boundary.
- Domain: business invariants independent of Nest decorators and transport.
- Infrastructure provider: database, queue, cache, HTTP client, filesystem.
Preserve a simpler existing architecture when appropriate; do not impose layers mechanically.

## Dependency injection
- Prefer constructor injection. TypeScript interfaces disappear at runtime; use explicit symbols/strings/classes as provider tokens.
- Keep providers in the module that owns them and export only dependencies consumed elsewhere.
- Use factory providers for async construction/configuration. Avoid broad service locators in domain logic.
- Diagnose circular dependencies as a boundary smell before reaching for forwardRef.

## Request lifecycle
- Pipes validate/transform untrusted input; guards check request access; interceptors wrap execution; filters map exceptions to transport responses.
- Authentication identifies a principal. Authorization checks action, resource ownership, and tenant scope.
- Critical invariants must also hold when application services are called by jobs, events, or tests rather than HTTP.

## Reliability and tests
- Bound outbound calls with timeouts and cancellation. Configure retries only for transient idempotent operations.
- Close DB pools, consumers, and timers during shutdown; make startup failure and partial initialization safe.
- Unit-test providers with mocked ports; integration-test persistence and HTTP behavior using the project's actual test stack.
- Test guards, pipes, interceptors, and filters at the boundary where their behavior is observable.
