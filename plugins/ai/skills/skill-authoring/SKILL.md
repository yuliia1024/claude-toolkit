---
name: skill-authoring
description: Design, test, and maintain effective Claude Code Skills and agent instructions. Use when creating or revising SKILL.md files, agent prompts, rules, or reusable AI engineering playbooks.
---

# Skill Authoring

## Core principle

Treat an instruction file as a behavior change, not as documentation that is correct merely because it reads well. Write the smallest guidance that measurably improves outcomes.

## Workflow: evaluation before prose

1. **Define the behavior.** State the task, desired result, constraints, and observable failure modes.
2. **Capture a baseline.** Run representative tasks without the proposed Skill. Record what the agent actually does wrong; do not invent a failure to justify a Skill.
3. **Create pressure scenarios.** Include a normal case, an edge case, and an adversarial or ambiguous case. Make the scenarios specific enough to expose likely shortcuts.
4. **Write the minimum guidance.** Add only instructions that address observed failures. Use explicit steps for fragile operations and allow judgment where multiple solutions are valid.
5. **Run the same scenarios with the Skill.** Compare behavior against the baseline. Check whether the Skill prevents the failure without making unrelated tasks worse.
6. **Refine.** Close loopholes, remove redundant prose, and repeat the scenarios after meaningful edits.
7. **Record limits.** State which models, tools, versions, and project assumptions were actually tested. Never claim a Skill was tested if only its text was reviewed.

## Authoring rules

- Keep the frontmatter description specific: what the Skill does and when to use it.
- Keep the main SKILL.md concise and task-oriented. Put detailed examples, provider-specific notes, and long references in adjacent files.
- Link every reference directly from SKILL.md; avoid chains of nested references.
- Use one responsibility per Skill. Split unrelated workflows instead of creating a broad "do everything" document.
- Prefer checklists, decision tables, concrete examples, and feedback loops over generic advice.
- Use imperative, testable instructions for high-risk steps. Avoid rigid rules where context legitimately changes the right answer.
- Avoid embedding time-sensitive API details unless they are versioned and linked to the authoritative documentation.
- Treat code examples as illustrative unless they are compiled and tested in the target repository.

## Skill structure

A useful default:

- Purpose and trigger conditions
- Decision process or workflow
- Concrete constraints and anti-patterns
- Verification checklist
- Links to detailed references and examples

Keep references one level below the Skill. Include a table of contents in long reference files.

## Review checklist

- [ ] The Skill addresses a real recurring task or observed failure.
- [ ] Its description makes the correct invocation context discoverable.
- [ ] The guidance is specific enough to change behavior.
- [ ] Examples are technically accurate and clearly labeled as illustrative or tested.
- [ ] Normal, edge, and adversarial scenarios were considered.
- [ ] The same scenarios were compared with and without the Skill where practical.
- [ ] No duplicate or conflicting guidance exists in another Skill, agent, or rule.
- [ ] Version-sensitive claims link to current primary documentation.
- [ ] The Skill is concise and references are directly linked.
