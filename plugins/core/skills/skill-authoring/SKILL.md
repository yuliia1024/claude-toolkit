---
name: skill-authoring
description: Create and improve Claude Code Skills with narrow activation descriptions, progressive disclosure, test scenarios, and measurable behavior checks.
---
# Skill authoring
- Give each Skill one coherent job and a description with concrete activation cues.
- Keep SKILL.md concise and actionable; move long examples/checklists to references and link them explicitly.
- State when not to use the Skill and how it composes with neighboring Skills.
- Include workflow, decision criteria, failure modes, and verification—not generic advice.
- Test with representative tasks, edge cases, and negative tasks that should not activate it. Compare behavior with and without the Skill.
- Avoid duplicated global rules; put stable project-wide requirements in rules, reusable expertise in Skills, and task orchestration in commands/agents.
