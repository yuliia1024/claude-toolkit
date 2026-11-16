---
name: design-patterns
description: Select and apply design patterns when they solve a concrete changeability, coupling, lifecycle, or runtime problem.
---
# Design patterns
- Begin with changing behavior and forces (variants, lifecycle, dependencies, consistency), not a pattern name.
- Consider simple functions/modules first. Strategy supports interchangeable algorithms; Adapter isolates external contracts; Factory controls construction; Decorator composes behavior; Observer/pub-sub notifies; Command models explicit operations/queues.
- Use ports/adapters to isolate volatile infrastructure when tests or multiple implementations benefit.
- Avoid pattern stacking, speculative plugin systems, inheritance-heavy designs, and one-class-per-function ceremony.
- Explain trade-offs, ownership, lifecycle, and extension point. Add tests proving substitution and behavior.
- Preserve local conventions; a pattern is not a reason to rewrite a working module.
