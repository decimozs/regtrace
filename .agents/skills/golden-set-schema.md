# Regtrace — Golden Set Schema

The golden set is Regtrace's data contract. Every metric, every CLI command, and every report derives its meaning from the golden set schema. This file is the canonical reference for what a valid golden set looks like.

## Top-Level Structure

Every golden set is a YAML file with a header block and a flat list of test cases.

```yaml
name: string                    # human-readable identifier for this set
version: string                 # semantic version e.g. "1.2.0"
description: string             # what this set tests and why it exists
interaction_type: single_turn | rag   # determines which fields are valid on test cases
tags: string[]                  # for filtering sets during a run
author: string                  # accountability on teams
created_at: string              # ISO 8601 UTC
updated_at: string              # ISO 8601 UTC
test_cases: TestCase[]          # flat list — no nesting
```

## Versioning Rules

**Patch version** — fix a typo or clarify wording in an expected output without changing its meaning. The evaluation contract is unchanged.

**Minor version** — add new test cases or modify expected outputs meaningfully. The evaluation contract is extended.

**Major version** — restructure the set, remove test cases, or change the interaction type. The evaluation contract is broken and regression comparisons against prior versions are marked as version-adjusted.

When the regression engine detects a golden set version change between runs it flags this prominently. A score change caused by a golden set evolution is fundamentally different from a score change caused by model degradation.

## Single-Turn Test Case

```yaml
id: string                      # unique within the set, stable across versions
description: string             # one line — what this test case asserts
input: string                   # the raw prompt or user message
system_prompt: string | null    # system instruction in effect, null if none
expected_output: string         # human-labeled ideal response
actual_output: string | null    # populated at eval time, null at authoring time
metrics: string[]               # which pillars to run: factuality | format | tone | regression
thresholds:                     # optional per-case overrides
  factuality: number | null
  format: number | null
  tone: number | null
tags: string[]                  # for filtering individual cases within a run
weight: number                  # contribution to suite score, default 1.0
```

## RAG Test Case

RAG test cases extend the single-turn structure with a context block. All single-turn fields apply plus:

```yaml
context:
  documents:
    - source: string            # URL, filename, or document ID
      content: string           # the actual retrieved text
      retrieval_score: number | null   # similarity score from retriever, optional
```

The `context` field is required when `interaction_type` is `rag`. It is null and ignored when `interaction_type` is `single_turn`.

For RAG test cases, factuality evaluates faithfulness to the retrieved context documents specifically, not world knowledge. The judge receives the context documents alongside the actual output and checks that all claims are supported by the provided content.

## Field Rules

**id** must be unique within a golden set and must remain stable across versions. The regression engine uses id to match test cases between runs. If you change an id, regression tracking loses the history for that test case. Treat ids like primary keys in a database.

**actual_output** is always null when the golden set is authored. It is populated by the runner during evaluation. Never commit a golden set with actual_output values — the golden set represents the expected state, not a snapshot of a specific run.

**weight** defaults to 1.0. Higher weight means this test case contributes more to the overall suite score. Use higher weights for test cases that represent critical production paths and lower weights for edge cases or experimental scenarios.

**metrics** must contain at least one valid pillar name. If omitted, all four pillars run by default as configured in the project config file.

**thresholds** at the test case level override the global thresholds from the config file for that specific test case only. Use this sparingly — for known ambiguous scenarios where the global threshold is too strict, not as a way to make failing test cases pass.

## What the Schema Intentionally Excludes

**No model name.** Which model produced the actual output is tracked at the run level, not the test case level. Test cases are model-agnostic quality contracts.

**No prompt templates.** Regtrace evaluates outputs. Prompt construction belongs to the application being evaluated, not to the evaluator.

**No nested test cases.** No groups within groups. Flat list filtered by tags when needed. Simplicity wins over hierarchy.

**No computed fields at authoring time.** Fields like scores, pass/fail, and regression deltas are never stored in the golden set. They live in run records.

## Validation

Golden sets are validated against the Zod schema in `src/schema/golden-set.schema.ts` when added via `regtrace set add`. Validation catches missing required fields, invalid field types, duplicate ids, and invalid metric names before any evaluation runs. A golden set that fails validation is never registered and never evaluated.

## Example — Single-Turn Test Case

```yaml
name: customer-support-qa
version: 1.0.0
description: Tests response quality for common customer support scenarios
interaction_type: single_turn
tags: [customer-support, production]
author: jane@example.com
created_at: "2024-06-01T00:00:00Z"
updated_at: "2024-06-01T00:00:00Z"
test_cases:
  - id: cs-001
    description: Verifies correct refund policy explanation
    input: "What is your refund policy?"
    system_prompt: "You are a helpful customer support agent for Acme Corp."
    expected_output: "Our refund policy allows returns within 30 days of purchase with a full refund to your original payment method."
    actual_output: null
    metrics: [factuality, tone]
    thresholds:
      factuality: 0.9
    tags: [refund, policy]
    weight: 1.5
```

## Example — RAG Test Case

```yaml
name: rag-product-docs
version: 1.0.0
description: Tests faithfulness of responses grounded in product documentation
interaction_type: rag
tags: [rag, documentation]
author: jane@example.com
created_at: "2024-06-01T00:00:00Z"
updated_at: "2024-06-01T00:00:00Z"
test_cases:
  - id: rag-001
    description: Verifies API rate limit claim is faithful to documentation context
    input: "What is the API rate limit?"
    system_prompt: null
    context:
      documents:
        - source: "docs/api-reference.md"
          content: "The API enforces a rate limit of 500 requests per minute per API key."
          retrieval_score: 0.94
    expected_output: "The API rate limit is 500 requests per minute."
    actual_output: null
    metrics: [factuality, format]
    thresholds: null
    tags: [api, rate-limit]
    weight: 1.0
```
