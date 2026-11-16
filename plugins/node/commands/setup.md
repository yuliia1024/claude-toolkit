---
argument-hint: '[--yes]'
description: 'Record the NestJS backend stack (data layer, API docs, code paths, contracts package) under stacks.backend-node in .claude/toolkit.json. Run after /core:setup; safe to rerun.'
allowed-tools: AskUserQuestion, Bash, Edit, Glob, Read, Write
---

# /node:setup

Adds or updates the `backend-node` stack entry in `.claude/toolkit.json`. Requires that
`/core:setup` has already created the file. Running it again only updates this stack's entry.

## Detect

- Read `.claude/toolkit.json`; abort with a pointer to `/core:setup` if it is missing.
- Look through every `package.json` (including workspace packages) for `@nestjs/core`, the data layer
  (`typeorm`, `@prisma/client`, `@mikro-orm/core`, `sequelize`, or a bare driver such as `pg`), and
  `@nestjs/swagger`.
- Look for a package that both client and server import for API types (a "contracts" or "api-types"
  workspace package).

## Ask

Pre-fill each answer from detection; with `--yes`, accept the detected values without asking.

| Key | Question | Options |
| --- | --- | --- |
| `orm` | Data access layer | typeorm · prisma · mikro-orm · sequelize · raw · none |
| `contractsPackage` | Shared API types package | package name, or none |
| `apiDocs` | API documentation | swagger · none |
| `paths` | Globs covering backend source | e.g. `services/orders/**`, `apps/server/**` |

## Merge

Change only these parts; keep every other key and every other stack untouched.

- `stacks.backend-node` = `{ enabled: true, framework: "nestjs", orm, contractsPackage, apiDocs, paths }`
- `areas` gains `backend-node` (and `backend`) once
- `rulesPathMap` gains one `{ match, area: "backend-node" }` per path prefix, listed before any
  generic suffix-based entries
- `plugins` gains `node` once

Resulting fragment, for a service in `services/orders`:

```json
{
  "areas": ["shared", "security", "backend", "backend-node"],
  "stacks": {
    "backend-node": {
      "enabled": true,
      "framework": "nestjs",
      "orm": "typeorm",
      "contractsPackage": "@acme/order-contracts",
      "apiDocs": "swagger",
      "paths": ["services/orders/**"]
    }
  },
  "rulesPathMap": [{ "match": "services/orders/", "area": "backend-node" }],
  "plugins": ["node"]
}
```

Show the diff, write `.claude/toolkit.json` (no other config file is created), then tell the user to
run `/core:sync` so the backend rules are copied in.
