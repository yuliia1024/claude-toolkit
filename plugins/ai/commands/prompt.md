---
description: 'Write or improve a prompt (system / task / tool description).'
argument-hint: '<path to prompt file | task description>'
---

# ai:prompt

Target: `$ARGUMENTS`

Use the `prompt-engineering` skill.

1. If a file path is given — read the prompt and find where it is used in code (model, params, how output is parsed).
   Otherwise — ask for (or infer) the task, the input data and the desired output.
2. Review against the skill: structure, explicitness, reasons for rules, examples, data/instruction separation, output format, "don't know" path.
3. Propose the improved prompt as a diff, with one line of reasoning per change.
4. If an eval set exists (`evals/`), run it before and after and show the scores. If not, offer to create one with `/ai:eval`.
