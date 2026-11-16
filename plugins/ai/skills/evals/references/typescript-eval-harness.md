# TypeScript Eval Harness — Reference Pattern

Keep objective checks deterministic and reserve LLM judges for qualities that cannot be measured reliably with ordinary assertions.

## Dataset and grader contracts

```ts
type EvalCase<Input, Expected> = {
  id: string;
  input: Input;
  expected: Expected;
  tags: string[];
};

type EvalResult = {
  caseId: string;
  passed: boolean;
  score?: number;
  reason?: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
};

type Grader<Output, Expected> = (
  output: Output,
  expected: Expected,
) => { passed: boolean; reason?: string };
```

Example deterministic grader for structured output:

```ts
const validMenuGrader: Grader<GeneratedMenu, MenuExpectation> = (
  output,
  expected,
) => {
  const validDays = output.days.length === expected.dayCount;
  const hasRequiredMeals = output.days.every((day) =>
    expected.mealTypes.every((meal) => day.meals.some((item) => item.type === meal)),
  );

  return {
    passed: validDays && hasRequiredMeals,
    reason: !validDays
      ? "Unexpected day count"
      : !hasRequiredMeals
        ? "A required meal type is missing"
        : undefined,
  };
};
```

This is a shape/business-rule example. It does not evaluate taste, usefulness, factual grounding, or safety.

## Test layers separately

- Prompt/schema: valid structure, required fields, refusal and incomplete response handling.
- Tool use: correct tool selection, valid arguments, permission denial, result correlation.
- RAG: relevant-source recall, ACL filtering, citation support, stale document behavior.
- Agent: termination, step budgets, cancellation, side-effect duplication, approval enforcement.
- End-to-end: task success on representative user requests.

## LLM-as-judge

Use a judge only for subjective criteria such as relevance or clarity. Provide a rubric with anchored examples, hide candidate identity and expected winner, randomize pair order, and calibrate against human labels. Store judge model/version and rubric version with each result.

Never use an LLM judge as the only test for authorization, schema validity, payment correctness, or other deterministic invariants.

## Release comparison

Run old and new versions on the same versioned dataset. Report per-tag results, confidence/variance where stochasticity matters, latency, token usage, and cost. A single aggregate score can hide a severe regression in a high-risk slice.

Promote a new prompt/model/retrieval configuration only after defined quality and safety gates pass. Keep every meaningful production failure as a regression case after removing sensitive data.
