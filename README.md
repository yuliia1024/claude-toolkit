# claude-toolkit

My own Claude Code toolkit — plugins and coding rules kept side by side in a single folder, with no git dependency.
Its marketplace goes by the name `toolkit`.

## Layout

```
claude-toolkit/
├── .claude-plugin/marketplace.json   ← catalog listing every plugin and its location
├── rules/                            ← coding standards that get synced into projects
│   ├── shared/                       ←   engineering workflow common to all stacks
│   ├── backend/ + backend-node/      ← API, Node runtime, NestJS
│   └── ai/                           ←   paths: **/prompts/**, **/llm/**, **/ai/**, **/evals/**
└── plugins/
    ├── core/        ← base layer: setup, sync, rules-loader hook, cove, judge, cleanup
    ├── backend/     ← plugin for learning: backend agent, /backend:endpoint, api-design skill
    ├── ai/          ← ai-engineer agent, /ai:prompt, /ai:eval, /ai:rag plus skills
    ├── architect/   ← spec → architecture → tasks → implementation in parallel
    ├── node/        ← flows for NestJS backends
    ├── reviewer/    ← produces an MR review pipeline tailored to the project
    └── security/    ← security audit, OWASP Top 10, security-reviewer agent
```

## What a plugin is made of

| Piece | Location | What triggers it |
|---|---|---|
| **Command** (slash command) | `commands/<name>.md` | the user enters `/<plugin>:<name>`; whatever follows the command arrives as `$ARGUMENTS` |
| **Agent** (subagent) | `agents/<name>.md` | Claude hands work over when the `description` fits, or you request it ("use the backend agent") |
| **Skill** (knowledge / instructions) | `skills/<name>/SKILL.md` | Claude pulls it in once the task lines up with its `description` |
| **Hook** (automation) | `hooks/hooks.json` + script | Claude Code fires it on an event (PreToolUse, PostToolUse, SessionStart, …) |

Inside commands and hooks, `${CLAUDE_PLUGIN_ROOT}` resolves to wherever the plugin is installed.

## The rules pipeline

1. `/core:setup` figures out the stack and writes `.claude/toolkit.json` (`toolkitPath` + `areas`).
2. Each stack setup command folds its answers into that same `.claude/toolkit.json` rather than creating another project config.
3. `/core:sync` copies the chosen `rules/<area>/*.md` packs into `.claude/toolkit-rules/`.
4. Before any Edit/Write tool runs, the `PreToolUse` rules-loader injects the path-scoped rules that match, each only once per session.

> Why `toolkit-rules/` rather than `rules/`? Claude Code picks up `.claude/rules/` by itself. Keeping a dedicated folder
> shows exactly what the hook contributes and prevents the same rules from loading twice.

## Checks and upkeep provided by `core`

| Command | Purpose |
|---|---|
| `/core:cove [--quick] <claim>` | Chain-of-Verification: write a draft → pose 3–5 verification questions → answer each afresh → mark every claim CONFIRMED / REFUTED / UNCERTAIN and produce a corrected answer |
| `/core:cove-isolated [--explore] [--haiku] <claim>` | Same procedure, except every question is handled by its own subagent that never sees the draft — removes confirmation bias at a higher cost |
| `/core:judge <diff \| branch \| PR \| feature-dir>` | Four reviewers run independently and in parallel — 🔴 correctness, 🔵 security, 🟢 spec conformance, 🟣 architecture — and their results merge into PASS / CHANGES_REQUESTED / NEEDS_HUMAN. Reviews only |
| `/core:cleanup [--worktrees] [--branches] [--artifacts] [--all] [--dry-run]` | Clears out the leftovers of parallel runs: orphaned git worktrees, local branches already merged, test/build artifacts. Shows sizes up front and removes nothing without approval |

`/core:validate-toolkit` verifies manifests, Skill metadata, links, and marketplace references.

`cove` answers whether claims are **true**; `judge` answers whether code is **ready to merge**;
`cleanup` recovers disk space once `architect:implement` runs finish.
Review flows in `node` and `architect` invoke `/core:cove` to filter out false findings.

## About the `ai` plugin

| Component | Role |
|---|---|
| agents | `ai-engineer`, `ai-architect`, `agent-engineer`, `rag-engineer`, `llm-evaluator`, `ai-security-auditor` |
| `/ai:prompt` | Write or review a prompt, suggest a diff, and measure it with evals |
| `/ai:eval` | Create or execute an eval set (`evals/<feature>/`) and report the baseline |
| `/ai:rag` | Design, build, or debug a RAG pipeline one stage at a time |
| skills | `llm-app-patterns`, `prompt-engineering`, `rag`, `evals`, `agent-architecture`, `context-engineering`, `tool-design`, `mcp-engineering`, `llm-provider-integration`, `llm-resilience`, `ai-observability`, `ai-security`, `skill-authoring` |
| AI rules | `rules/ai/ai-architecture.md`, `ai-security.md`, `ai-testing.md`, `ai-production.md` |
| Hands-on references | TypeScript agent loop, NestJS tool boundary, RAG chunking strategies, TypeScript eval harness, MCP protocol-version notes |

### Reference material in the Skills

The AI Skills ship with targeted reference files covering implementation samples and protocol specifics. Samples are labelled as illustrative unless they have been verified inside a real target project. The `skill-authoring` Skill lays out a loop of baseline → pressure scenarios → revision → re-test, so that new guidance earns its place through evaluation rather than by merely sounding reasonable.

### Projects consulted for design

The following projects were studied for structure and engineering approach; none of their content was copied in bulk:

- [Anthropic Claude Code plugin structure](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) — how plugins are laid out and how components are discovered.
- [Anthropic Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — progressive disclosure and how reference files are organised.
- [obra/superpowers](https://github.com/obra/superpowers) — test-first flows, systematic debugging, and testing Skills under pressure scenarios.
- [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) — wider harness practice: hooks, context management, verification, and security.
- [wshobson/agents](https://github.com/wshobson/agents) — organising plugins, agents, and Skills as small composable units.
- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) — threat coverage for AI applications.
- [MCP transport specification (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports) — snapshot of transport behaviour that the MCP Skill cites.

## Plugins per stack

The only dependency of `architect`, `node`, `reviewer` and `security` is `core`
(`/core:setup`, `/core:sync`, `/core:cove`, `/core:judge`, `/core:cleanup`).
The stack setup command (`/node:setup`) writes into the one canonical `.claude/toolkit.json`.

## Installing

Inside Claude Code, from any project:

```
/plugin marketplace add ~/claude-toolkit
/plugin install core@toolkit
/plugin install backend@toolkit       # alternatively node@toolkit
/plugin install ai@toolkit
/plugin install architect@toolkit
/plugin install reviewer@toolkit
/plugin install security@toolkit
```

> Should the upstream versions of these plugins already be installed through a different marketplace, turn
> them off to avoid duplicate skills and agents.

Next, restart Claude Code and run this inside the project:

```
/core:setup
/core:sync
```

**Whenever the toolkit itself changes** (a new plugin or command): run `/plugin marketplace update toolkit`, then restart.
**Whenever rules change:** a `/core:sync` in the project is enough.

## Testing outside Claude Code

```bash
claude plugin validate ~/claude-toolkit        # check the marketplace and every plugin

# invoke the hook by hand, feeding it the JSON Claude Code would pass
echo '{"session_id":"t","tool_input":{"file_path":"src/users/users.controller.ts"}}' \
  | CLAUDE_PROJECT_DIR=/path/to/project node plugins/core/hooks/rules-loader.mjs
```

## Tests and evals

Three levels, cheapest first — all driven by `scripts/run-evals.sh`:

| Level | Command | What it proves | Cost |
|---|---|---|---|
| Static | `npm test` / `scripts/run-evals.sh static` | scripts (`validate-architecture`, `rules-loader`, `sync`, `validate-toolkit`) behave; repo is consistent | free |
| Triggers | `scripts/run-evals.sh triggers [plugin]` | every skill activates on a typical request (`plugins/*/evals/trigger-*`) | ≈ $0.1 per case |
| Quality | `scripts/run-evals.sh quality [plugin]` | key skills beat plain Claude on fixtures with planted problems, with vs without the plugin | ≈ $0.4–1.6 per case |

Quality cases: `core/judge-planted-defects`, `core/debug-root-cause`, `security/owasp-ssrf-and-secrets`,
`architect/create-tasks-from-architecture`, `ai/eval-harness-with-baseline`.

Levels 2–3 use `claude plugin eval` and run real sessions on your account; `MAX_COST` (USD per plugin run)
caps spend. Reports stay local in `plugins/*/evals/results/` (gitignored).

Notes for writing cases:
- the Skill tool input is `{"skill":"<plugin>:<name>"}`; a slash command that wraps a skill counts too;
- `regex` graders take `pattern` + `flags` in frontmatter (no inline `(?i)`); `tool_used` with `max` needs `min: 0`;
- `file_exists` / `target: files` see changed paths only, not contents; globs support `*`, `**`, `?`;
- `scaffold_script` is a path; it runs in the empty workspace and `$0` locates the case dir;
- Bash/Edit/Write must be granted with `--allow-tools`; the sandbox has no network and git may not work.

## Broader engineering coverage

- `node`: NestJS lifecycle and DI, the Node.js runtime with streams/workers, TypeScript, backend reliability.
- `core`: systematic debugging, safe refactoring, testing strategy, code review, choosing design patterns, toolkit validation.
- `rules`: shared engineering, Node/NestJS/data access, and application security.

## Possible next steps

- sync in both directions (rule edits made in a project flow back to the toolkit) using a 3-way merge;
- a `format` hook (PostToolUse → run prettier/eslint on the edited file);
- an `enforce` hook (PreToolUse → refuse specific actions; exiting with code 2 blocks the call);
- `/core:doctor` — verify that the config and rules are present;
