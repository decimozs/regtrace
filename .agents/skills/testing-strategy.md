# Regtrace — Testing Strategy

Testing in Regtrace is not optional and not an afterthought. A CLI evaluation tool that produces wrong scores or behaves inconsistently across environments is worse than no tool at all — teams will make model decisions based on bad data. Every contribution must include appropriate tests.

## Test Structure

```
tests/
├── unit/
│   ├── metrics/
│   │   ├── factuality.test.ts
│   │   ├── format.test.ts
│   │   ├── tone.test.ts
│   │   └── regression.test.ts
│   ├── schema/
│   │   ├── golden-set.validator.test.ts
│   │   └── config.validator.test.ts
│   └── core/
│       ├── runner.test.ts
│       ├── scorer.test.ts
│       └── gate.test.ts
├── integration/
│   ├── run.test.ts
│   └── compare.test.ts
└── fixtures/
    ├── golden-sets/
    │   ├── valid-single-turn.yaml
    │   ├── valid-rag.yaml
    │   ├── invalid-missing-id.yaml
    │   └── invalid-duplicate-id.yaml
    └── run-records/
        ├── passing-run.json
        ├── failing-run.json
        └── regression-baseline.json
```

## Unit Tests

Unit tests test one function, class, or module in complete isolation. They run fast — the entire unit test suite should complete in under five seconds. They never touch the file system, never make network calls, and never call real LLM providers.

**The storage layer is always mocked in unit tests.** Any test that requires reading or writing files uses a mock storage implementation. Real file I/O introduces path dependencies, OS differences, and cleanup requirements that make tests brittle.

**The judge layer is always mocked in unit tests.** Never make real LLM API calls in tests. Mock the judge interface to return controlled responses so metric tests are deterministic, fast, and free. A test that costs money to run will eventually not be run.

## What Must Always Have Unit Tests

**Every metric** must have tests covering at minimum:
- A perfect score scenario — input and output that should score 1.0
- A complete failure scenario — input and output that should score 0.0
- A partial score scenario — a realistic mixed case that scores between 0.3 and 0.7
- A low confidence scenario for LLM-judged metrics — where the judge returns uncertainty
- Edge cases specific to that metric — empty output, null fields, maximum length, invalid JSON for format checks

**Every schema validator** must have tests covering:
- A fully valid golden set — all required fields present and correct
- Each required field missing individually — one test per required field
- Invalid field types — a number where a string is expected
- Duplicate test case IDs — should fail validation
- Invalid metric names — should fail validation

**Every core module** — runner, scorer, aggregator, gate — must have tests covering their primary logic paths and failure modes.

## Integration Tests

Integration tests test full command execution end to end. They use real file system operations against fixture files in `tests/fixtures/` and mock only the judge layer and external network calls.

Integration tests verify:
- `regtrace run` produces the correct exit code for a passing suite
- `regtrace run` produces exit code 1 for a failing suite
- `regtrace run` produces exit code 2 for a config error
- `regtrace compare` correctly identifies regressions between two fixture run records
- The run record written to disk matches the expected structure after a run

Integration tests are slower than unit tests and that is acceptable. They should complete in under thirty seconds total.

## Fixture Files

Fixtures are static golden set YAML files and run record JSON files used across tests. They are the canonical test data for Regtrace.

**Never generate test data inline in test files.** If a test needs a golden set, load it from `tests/fixtures/golden-sets/`. If a test needs a run record, load it from `tests/fixtures/run-records/`. Inline test data is invisible to other tests and produces duplication that gets out of sync.

**Fixtures are real examples, not minimal stubs.** A fixture golden set should look like something a real user would write. A fixture run record should look like something a real run would produce. Tests against minimal or obviously fake data often pass in tests but fail on real inputs.

**Invalid fixtures are as important as valid ones.** `invalid-missing-id.yaml`, `invalid-duplicate-id.yaml`, and similar fixtures test that validation correctly rejects bad input. These fixtures should be obviously broken in the way their name describes and nothing else.

## Test Naming

Every test description reads as a complete sentence that describes the behavior being verified:

```typescript
// Good
it('returns confidence 1.0 for all deterministic format checks')
it('fails validation when a test case is missing the required id field')
it('exits with code 1 when the suite score falls below the configured minimum')

// Bad
it('confidence')
it('validation test')
it('exit code test')
```

The test description should be specific enough that a failing test tells you exactly what broke without reading the test body.

## Arrange-Act-Assert

Every test follows the Arrange-Act-Assert pattern with clear separation between phases. No interleaving of setup and assertions.

```typescript
it('returns a failed result when JSON output is not valid JSON', () => {
  // Arrange
  const testCase = loadFixture('valid-single-turn.yaml').test_cases[0]
  testCase.actual_output = 'this is not json'
  const metric = new FormatMetric({ subChecks: { jsonValidity: true } })

  // Act
  const result = await metric.evaluate(testCase)

  // Assert
  expect(result.passed).toBe(false)
  expect(result.score).toBe(0)
  expect(result.explanation).not.toBe('')
  expect(result.subResults?.find(s => s.name === 'json_validity')?.passed).toBe(false)
})
```

## Coverage Expectations

**Metrics: 100% of public methods covered.** Metrics are the core value of Regtrace. Every code path in every metric must be exercised by tests.

**Schema validators: 100% of validation rules covered.** Every required field, every type constraint, every cross-field rule has a test.

**Core modules: 90%+ coverage.** The runner, scorer, and gate have complex orchestration logic that must be thoroughly tested.

**CLI commands: exit code behavior covered.** Every command's exit code contract must be verified by integration tests. The internal rendering logic does not need exhaustive tests.

**Judge prompts: output structure verified.** Tests verify that prompt functions return strings with the expected structure and that all required inputs are interpolated. Tests do not verify prompt wording — that is a judgment call, not a correctness issue.

## Running Tests

```bash
bun test                          # run all tests
bun test tests/unit               # run unit tests only
bun test tests/integration        # run integration tests only
bun test --watch                  # rerun on file change during development
bun test tests/unit/metrics       # run metric tests only
```

All tests must pass before any PR is merged. A PR that fixes a bug without adding a regression test for that bug will not be accepted.
