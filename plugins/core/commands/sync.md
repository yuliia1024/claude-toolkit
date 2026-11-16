---
description: 'Pull the toolkit rules into the project under .claude/toolkit-rules/.'
allowed-tools: Bash
---

# core:sync

Execute:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs"
```

Pass the script's output back to the user. Should it report a missing config, point them to `/core:setup`.
