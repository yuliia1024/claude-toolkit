---
description: 'Initialise the project by creating its canonical .claude/toolkit.json config.'
argument-hint: '[path to claude-toolkit]'
allowed-tools: Bash, Read, Write
---

# core:setup

Create `.claude/toolkit.json`, the one canonical config, or update it if present. Every stack setup command
(`node:setup`) writes its results into this same file, so never create
`.claude/project.config.json`.

1. Scan every relevant package.json, workspace packages included, to detect:
   - NestJS → `backend` and `backend-node`
   - OpenAI / Anthropic SDK / an AI framework → `ai`
   - `shared` and `security` are added in every case.
2. Toolkit path: take `$ARGUMENTS` when supplied, else `~/claude-toolkit`, expanded to an absolute path.
   Make sure `<toolkitPath>/rules/` is present.
3. Keep whatever `stacks`, `rulesPathMap`, `plugins`, and custom user fields already exist. Add the detected areas
   without duplicating any, and leave stack questionnaire answers untouched.
4. Present the detected changes and get the user's confirmation before writing anything.
5. Sample base config (the stack setup commands extend this very file):
```json
{
  "toolkitPath": "/absolute/path/to/claude-toolkit",
  "areas": ["shared", "security", "backend", "backend-node", "ai"],
  "stacks": {},
  "rulesPathMap": [],
  "plugins": []
}
```
6. Finish by telling the user to run `/core:sync`.
