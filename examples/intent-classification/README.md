# Intent Classification Example (Zero-Setup)

Evaluates structured JSON intent classification outputs with deterministic
format metrics. Demonstrates `json_validity` and `json_schema` sub-checks.
No API key required.

## What's tested

Six test cases covering correct classification, wrong intent, missing fields,
malformed JSON, invalid intent values, and correct routing:

| Case | Description | Expected |
|---|---|---|
| ic-001 | Correctly classified billing intent | Pass |
| ic-002 | Wrong intent assigned | Fail |
| ic-003 | Missing confidence field | Fail |
| ic-004 | Malformed JSON output | Fail |
| ic-005 | Invalid intent value not in schema | Fail |
| ic-006 | Correct routing to general support | Pass |

## Run

```bash
regtrace run
```

## Next steps

- Add ANTHROPIC_API_KEY and enable `factuality` to verify extracted values
- Add more intents and complex routing rules
- Use `regtrace run --format json` for structured intent audit
