# Customer Support QA Example

This example evaluates LLM-generated customer support responses for an
e-commerce platform. It demonstrates Regtrace's deterministic format metrics
— no API key required.

## Scenario

Five customer support test cases covering refund policy, shipping, and order
cancellation. Three cases should pass, two should fail:

| Case | Description | Expected |
|---|---|---|
| cs-001 | Refund policy — correct response | Pass |
| cs-002 | Refund policy — wrong timeframe and missing conditions | Fail |
| cs-003 | Shipping — correct structured response | Pass |
| cs-004 | Shipping — vague, missing key details | Fail |
| cs-005 | Cancellation — response with forbidden phrases | Fail |

## Run

```bash
regtrace run
```

Summary shows pass/fail per case with format sub-check breakdowns. Two failing
cases exceeded `max_failed_test_cases: 1` so the suite fails — demonstrating
the quality gate in action.

## Next steps

- Add an LLM judge key (`.env`) and switch `metrics.enabled` to include
  `factuality` and `tone` for deeper evaluation
- Run `regtrace run` twice to see regression detection against baseline
- Run `regtrace run --format json` for machine-readable output
