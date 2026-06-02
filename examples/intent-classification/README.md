# Intent Classification Example

This example evaluates LLM-generated intent classification for a customer
service routing system. It demonstrates Regtrace's deterministic format
metrics — no API key required.

## Scenario

Six test cases covering correct classification, wrong intent, missing fields,
malformed JSON, non-standard formats, and multi-intent edge cases. Four pass,
two fail:

| Case | Description | Expected |
|---|---|---|
| ic-001 | Correct intent with confidence | Pass |
| ic-002 | Wrong intent assigned | Fail |
| ic-003 | Missing required confidence field | Fail |
| ic-004 | Malformed JSON output | Fail |
| ic-005 | Non-standard but valid format | Pass |
| ic-006 | Multi-intent handled correctly | Pass |

## Run

```bash
regtrace run
```

## Next steps

- Add an LLM judge key (`.env`) and enable `factuality` in `metrics.enabled`
  to verify the classifier's reasoning matches the input
- Enable `json_schema` to enforce precise output schema validation
- Run `regtrace run --format json` to pipe classification results downstream
