---
description: Check this toolkit for consistency — plugin manifests, Skill metadata, internal links, and marketplace references.
allowed-tools: Bash, Read, Glob, Grep
---
# core:validate-toolkit
Perform a static consistency check across the whole repository.
1. Parse each plugin manifest, the marketplace manifest, and every hook JSON file; flag anything that fails to parse and any plugin name listed twice in the marketplace.
2. Each skills/**/SKILL.md must open with frontmatter carrying a non-empty name and description, and the name must agree with its directory.
3. Collect relative Markdown links and local file references from Skills, commands, agents, and rules, then confirm each target; keep paths the project generates apart from files the toolkit ships.
4. Confirm that each marketplace source is present and holds a plugin manifest.
5. Confirm rule frontmatter is valid and that the configured setup areas exist.
6. List errors, warnings, and deliberately external or project-supplied references in separate groups. The audit never fixes anything automatically.
