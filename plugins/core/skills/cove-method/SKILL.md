---
name: cove-method
description: 'Self-checking reference for answers that have to be right. Draft, interrogate the draft with targeted probes, settle each probe without leaning on the draft, then publish a corrected answer. Backs /core:cove (single turn) and /core:cove-isolated (one sub-agent per probe).'
allowed-tools: Agent, Bash, Glob, Grep, Read, TaskCreate, TaskGet, TaskOutput
---

# Chain-of-Verification

A first answer is a hypothesis. This skill treats it that way: pull the load-bearing claims out of
it, turn each claim into a probe, resolve the probes separately, and only then commit to an answer.

## Decide whether it is worth it

Use it when a wrong answer is expensive and nothing cheaper can settle the matter:

- the user wants exact values — versions, limits, defaults, dates, counts;
- the answer rests on a chain of three or more inferences;
- it describes how a specific library, framework release or protocol behaves;
- it touches security, money, data loss or anything irreversible;
- your own draft contains hedges ("likely", "should", "I believe").

Do something else when:

| Situation | Better move |
| --- | --- |
| A test, script or REPL can answer it | Run it — an observed result beats any self-review |
| The fact is in a file you can open | Open the file |
| It is a single lookup (a port, a flag name) | Read the config; one probe is not a process |
| It is a question of preference | Give a reasoned opinion; there is nothing to verify |
| You just ran the tests or read the source | You already have evidence; report it |

Rule of thumb: if one tool call answers it in seconds, skip this skill.

## Variants

| Invocation | Probes | Who answers the probes | Rough cost vs. a plain answer |
| --- | --- | --- | --- |
| `/core:cove --quick` | 1–2 | you, same turn | ~2–3× |
| `/core:cove` | 3–5 | you, same turn | ~3–5× |
| `/core:cove-isolated --quick` | 1–2 | fresh sub-agents | ~4–6× |
| `/core:cove-isolated` | 3–5 | fresh sub-agents | ~8–15× |

Pick the single-turn variant for cheap sanity checks. Pick the isolated variant when the answer will
be acted on, or when the probes need to search the repository (`--explore`). `--haiku` lowers the
cost of the isolated variant.

Detailed procedures:

- `cove-process.md` — single-turn procedure
- `cove-isolated.md` — sub-agent procedure

## The loop

1. **Draft** — answer fully, without hedging, so there is something concrete to test.
2. **Probe** — list the claims the answer depends on; write one probe per risky claim.
3. **Resolve** — answer each probe from evidence or first principles, not from the draft.
4. **Correct** — keep what held, fix what failed, flag what stayed open.

Each probe resolves to one of three outcomes: **HOLDS**, **FAILS**, or **OPEN**.

## Checking a list of findings

When the input is a list (audit hits, review comments, drift reports) rather than one answer, run
the loop per item:

- one probe per item: "Does `<item>` reflect a real problem in the current source, or a side effect
  of how it was detected (generated files, vendored code, stale cache)?";
- resolve it the cheapest reliable way — rerun the detecting command with a tighter scope, or open
  the cited `file:line`; never argue a measurement away when you can re-measure;
- in isolated mode, give high-impact items (security, anything that changes a score, suspiciously
  round numbers) their own sub-agent, all launched together;
- outcomes: HOLDS → keep (correct the figure if the re-count differs); FAILS → delete the item
  entirely, no softened remnant; OPEN → keep it with a visible caveat;
- record the tally: `in: N · kept: K · dropped: D · open: O`.

Audit gates and the `review-changes` commands use this list form.

## Closing block

Every run ends with:

```
### Cost of checking
variant: single-turn | isolated · full | quick
probes: N
sub-agents: N (isolated only)
approx. multiplier: ~Nx
```

## Trigger phrases

Start this skill when the user says things like "fact-check that", "verify before answering",
"run CoVe", "check your answer", "self-verify". Phrases such as "verify with separate agents" or
"independent verification" point to the isolated variant.
