# Data Extraction Example (Zero-Setup)

Evaluates structured JSON data extraction from unstructured text using
deterministic format metrics. Demonstrates `json_validity` and `json_schema`
sub-checks. No API key required.

## What's tested

Six invoice extraction test cases covering complete extraction, missing items,
wrong data types, hallucinated vendors, partially correct extraction, and
empty input:

| Case | Description | Expected |
|---|---|---|
| de-001 | Complete invoice extraction | Pass |
| de-002 | Missing line items | Fail |
| de-003 | Wrong data type for total | Fail |
| de-004 | Hallucinated vendor | Fail |
| de-005 | Partially correct extraction | Pass |
| de-006 | Empty input handled gracefully | Pass |

## Run

```bash
regtrace run
```

## Next steps

- Add ANTHROPIC_API_KEY and enable `factuality` to verify extracted values
- Enable `regex_match` for invoice number pattern validation
- Use `regtrace run --format json` to pipe structured data downstream
