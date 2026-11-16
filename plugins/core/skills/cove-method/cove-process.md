# Single-turn procedure

Everything happens in the current turn. The only separation between drafting and checking is the
discipline you apply, so the draft stays visible and can bias you. Use this variant for quick checks;
switch to `cove-isolated.md` when the stakes are higher.

Cost: ~3–5× a plain answer, ~2–3× with `--quick`.

## `--quick`

- write 1–2 probes, aimed only at the claim you trust least;
- skip the probe categories below;
- present results as a short bullet list instead of per-probe sections.

## 1. Draft

Answer the question completely and commit to specifics. Vague drafts cannot be tested.

```
### Draft
<the answer>
```

## 2. Probe

Extract the claims the answer depends on. Rank them by "if this were wrong, would the answer change?"
and write 3–5 probes for the top ones. A good probe names one concrete claim and can be answered
without reading the draft.

Angles worth covering:

| Angle | Shape of the probe |
| --- | --- |
| Truth | "Does X actually do Y?" |
| Exact value | "What is the precise default/limit/version for X?" |
| Inference | "Given A, does B really follow, or is a step missing?" |
| Coverage | "Which inputs or cases does the answer ignore?" |
| Version drift | "Is this behaviour the same in the version this project uses?" |

```
### Probes
P1. <probe>
P2. <probe>
...
```

## 3. Resolve

Set the draft aside. For each probe:

- derive the answer from scratch — evidence first, memory second;
- for anything about this repository, look it up with Read/Grep/Glob;
- for external facts, reason carefully and say where your knowledge is thin;
- finish with an outcome: HOLDS, FAILS or OPEN.

```
### Resolution
P1 — <probe>
  evidence: <what you found and how>
  outcome: HOLDS | FAILS | OPEN
```

## 4. Correct

- all HOLDS → state that the checks passed and give the answer;
- any FAILS → fix the answer and list each correction explicitly;
- any OPEN → keep the claim but qualify it.

```
### Check summary
held: N of M · corrected: <list> · qualified: <list>

### Answer
<corrected answer>
```

## Example

**Question:** "Does `Array.prototype.sort` in modern JavaScript engines sort stably, and what does it
do with `undefined` elements?"

**Draft:** Since ES2019 the spec requires `sort` to be stable. `undefined` entries are moved to the
end without being passed to the comparator. Sorting happens in place and the same array is returned.

**Probes:**

- P1. Did ES2019 make stability of `Array.prototype.sort` mandatory?
- P2. Are `undefined` elements excluded from comparator calls and placed last?
- P3. Does `sort` mutate the receiver and return the same reference?
- P4. Is there a non-mutating alternative, and since when?

**Resolution:** P1 HOLDS (stability became normative in ES2019). P2 HOLDS (undefined values are
collected and appended after the sorted portion; holes go after them). P3 HOLDS. P4 HOLDS —
`toSorted()` arrived in ES2023.

**Correction:** all held; the final answer adds that holes are placed after `undefined` values and
mentions `toSorted()` for callers that must not mutate.

## Known weakness

Because the draft is still in context, this variant leans toward agreeing with itself:

- a FAILS outcome here is strong evidence — it overcame that pull;
- a HOLDS outcome is weaker than the same outcome from an isolated checker;
- if the answer will drive a decision, rerun with `/core:cove-isolated`.

## Closing block

```
### Cost of checking
variant: single-turn · full | quick
probes: N
approx. multiplier: ~Nx
```
