---
name: typescript-engineering
description: Design maintainable type-safe TypeScript APIs and domain models using narrowing, generics, utility types, and runtime validation.
---
# TypeScript engineering
- Treat TypeScript as compile-time assistance, not runtime validation. Validate untrusted input at boundaries.
- Prefer inference for obvious local values; add explicit types at public API, module, and domain boundaries.
- Model finite states with discriminated unions rather than loosely related booleans or optional fields.
- Narrow unknown values with guards; avoid any and unsafe assertions. Isolate and explain unavoidable assertions.
- Use generics when they preserve a real relationship between input and output; avoid decorative generic abstractions.
- Understand structural typing, keyof/indexed access, conditional and mapped types before building reusable type utilities.
- Use satisfies to validate object shape while retaining useful inference.
- Keep runtime schemas and static types aligned; derive types from schemas when supported.
- Check compiler strictness and runtime/module target before changing tsconfig. Do not relax strict flags to silence errors.
- Types do not validate JSON, database rows, HTTP responses, or environment variables; test runtime validation separately.
