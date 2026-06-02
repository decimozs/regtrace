# Regtrace — Metric Contract

Every metric in Regtrace regardless of which pillar it belongs to must implement the same interface. This contract is the foundation that allows the runner, the scorer, the report engine, and the regression tracker to work with any metric without knowing its internal implementation.

## The Core Interface

Every metric receives a `TestCase` and returns a `MetricResult`. Nothing more, nothing less.

```typescript
interface MetricResult {
  metricName: string
  score: number               // 0.0 to 1.0
  confidence: number          // 0.0 to 1.0
  passed: boolean             // score >= threshold
  threshold: number           // the threshold applied for this result
  explanation: string         // plain English reasoning — never empty
  evaluationType: 'deterministic' | 'llm_judged'
  tokenCost: number           // 0 for deterministic, estimated tokens for llm_judged
  subResults?: SubResult[]    // optional breakdown for metrics with sub-dimensions
}

interface SubResult {
  name: string
  score: number
  passed: boolean
  explanation: string
}
```

## Rules Every Metric Must Follow

**Score is always between 0.0 and 1.0 inclusive.** Never below 0, never above 1. Never null, never undefined.

**Confidence is always between 0.0 and 1.0 inclusive.** Deterministic metrics always return confidence `1.0` — there is no uncertainty in a deterministic check. LLM-judged metrics return a confidence value derived from the judge's self-reported certainty.

**Explanation is never an empty string.** Every result must explain why the score was given. For passing results the explanation should describe what was verified. For failing results it must describe specifically what failed and why. The explanation is what turns Regtrace from a scoring tool into a debugging tool.

**Passed is always derived from score and threshold.** It is never set independently. `passed = score >= threshold`. A metric must never decide passed/failed by any other logic.

**TokenCost is always 0 for deterministic metrics.** Deterministic metrics make no LLM calls and consume no tokens. LLM-judged metrics must report their actual token consumption so the cost tracker can accumulate totals across a run.

**Metrics are stateless.** A metric receives a test case and returns a result. It does not store state between calls, read from files, write to files, or access the config directly. Any configuration a metric needs is passed into it at instantiation time by the runner.

**Metrics do not catch and hide errors.** If a metric encounters an unrecoverable error it throws. The runner handles errors at the orchestration level. A metric that silently returns a low score instead of throwing on an error is hiding bugs.

## The Four Pillar Metric Names

These are the canonical metric name strings used in run records, reports, and config files:

- `factuality`
- `format`
- `tone`
- `regression`

Never use variations like `factual`, `formatting`, `tone_check`, or `regression_score`. Consistency in metric names is critical for regression tracking — a metric name change between runs breaks historical comparison.

## Sub-Results by Pillar

**Factuality sub-results:**
- `claim_precision` — ratio of correct claims to total claims made
- `claim_recall` — ratio of expected claims covered to total expected claims
- `hallucination_rate` — ratio of contradicted or unverifiable claims

**Format sub-results:**
One sub-result per enabled sub-check: `length`, `json_validity`, `json_schema`, `markdown_structure`, `required_fields`, `forbidden_content`, `regex_match`

**Tone sub-results:**
- `formality`
- `sentiment`
- `assertiveness`
- `persona_consistency`
- `verbosity`

**Regression sub-results:**
- `test_case_level` — per test case delta
- `metric_level` — per metric average delta
- `suite_level` — overall suite delta

## Confidence Thresholds

Results with confidence below `0.6` should be flagged in the report as requiring human review. They still receive a score and a pass/fail determination, but the low confidence is surfaced prominently. This threshold is configurable in the config file via `max_low_confidence_ratio`.

## What a Metric Is Allowed to Do

- Receive a test case object
- Call the judge interface via the injected judge dependency
- Perform deterministic string, structure, or pattern analysis
- Return a MetricResult

## What a Metric Is Not Allowed to Do

- Import from `src/storage/` or touch the file system
- Import from `src/cli/` or any command file
- Import a judge provider SDK directly — always use the injected judge interface
- Access `process.env` directly — configuration is passed in, not read from environment
- Modify the test case object it receives
- Make network calls outside of the judge interface
