# Data Extraction Example

This example evaluates LLM-generated structured data extraction from
unstructured text — pulling invoice fields from customer emails. It
demonstrates Regtrace's deterministic format metrics — no API key required.

## Scenario

Six test cases covering complete extraction, missing fields, wrong types,
hallucinated data, partially correct extraction, and empty input handling.
Three pass, three fail:

| Case | Description | Expected |
|---|---|---|
| de-001 | Complete invoice extraction | Pass |
| de-002 | Missing line items | Fail |
| de-003 | Wrong data type for amount | Fail |
| de-004 | Hallucinated vendor not in text | Fail |
| de-005 | Partially correct extraction | Pass |
| de-006 | Empty input handled gracefully | Pass |

## Run

```bash
regtrace run
```

## Next steps

- Enable `json_schema` in format sub_checks to enforce precise schema
  validation on extracted data structures
- Add an LLM judge key (`.env`) and enable `factuality` to verify that
  extracted values match source text
- Run `regtrace run --format json` to pipe structured data downstream
