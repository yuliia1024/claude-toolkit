# Isolated procedure (one sub-agent per probe)

Here the checkers are separate agents launched with the Agent tool. They never see the draft, so a
HOLDS from them carries real weight. Probes run concurrently, so wall-clock time stays reasonable.

Cost: ~8–15× a plain answer, ~4–6× with `--quick`.

## Options

| Option | Effect |
| --- | --- |
| `--quick` | only 1–2 probes, on the weakest claim |
| `--explore` | checkers use the read-only `Explore` agent — best for questions about this repo |
| `--haiku` | checkers run on `model: "haiku"` (pass the tier name, not a dated model id) |
| `--agent=<name>` | checkers use the named agent type |

Options combine freely, e.g. `--quick --explore`.

## 1. Draft

Same as the single-turn variant: a complete, committed answer under a `### Draft` heading.

## 2. Probe — written for a stranger

The checker knows nothing except the probe text. Every probe therefore has to carry its own context:

- name the repository location, file, symbol or library version explicitly;
- state exactly what should be determined;
- never refer back ("the above", "that function", "as claimed").

Write 3–5 probes (1–2 with `--quick`) under `### Probes`.

## 3. Dispatch

Send all checkers in **one message** — one Agent call per probe — so they run in parallel.

Agent settings:

- default: `subagent_type: "general-purpose"`;
- `--explore`: `subagent_type: "Explore"` (capital E);
- `--haiku`: add `model: "haiku"`;
- `--agent=<name>`: `subagent_type: "<name>"`.

Brief for each checker:

```
You are verifying one fact and have no other context.

Probe: <self-contained probe>

Reply with:
- answer: what is actually true, with the reasoning or evidence
- confidence: high | medium | low
- references: file paths with line numbers for anything in code, or the source you relied on
```

Collect the replies:

```
### Checker results
C1 — <probe in a few words>
  reply: <summary of what the checker found>
  confidence: high | medium | low
  outcome: HOLDS | FAILS | OPEN
```

## 4. Correct

Apply the single-turn rules, plus:

- a high-confidence FAILS is decisive — revise;
- low-confidence replies become caveats, not corrections;
- if two checkers disagree, say so in the answer rather than picking one silently;
- keep the agent ids so each correction can be traced.

```
### Check summary
held: N of M (with confidence) · corrected: <list + evidence> · qualified: <list> · disagreements: <list>

### Answer
<corrected answer>
```

## Example

`/core:cove-isolated --explore Where is rate limiting applied to the public API, and what happens
when a client exceeds it?`

Draft from current knowledge, then probes such as:

1. "In the repository at the current working directory, which files configure request rate
   limiting? List paths and the exported functions or decorators involved."
2. "In the repository at the current working directory, what limit values (requests per window,
   window length) are configured for unauthenticated routes, and where are they read from?"
3. "In the repository at the current working directory, what HTTP status and response body are
   returned when a client exceeds the rate limit? Cite the code."

Three `Explore` agents run in parallel; their file paths and values replace whatever the draft
guessed.

## Closing block

```
### Cost of checking
variant: isolated · full | quick
probes: N
sub-agents: N (type: general-purpose | Explore | <custom>)
model: default | haiku
approx. multiplier: ~Nx
```
