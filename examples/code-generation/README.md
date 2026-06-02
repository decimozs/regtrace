# Code Generation Example

This example evaluates LLM-generated code snippets. It demonstrates Regtrace's
format metrics for code block structure and language tagging — no API key
required.

## Scenario

Six test cases covering correct code, missing code blocks, hallucinated APIs,
insecure code, wrong language tags, and correct code without explanation:

| Case | Description | Expected |
|---|---|---|
| cg-001 | Correct code with explanation | Pass |
| cg-002 | Missing code block fences | Fail |
| cg-003 | Hallucinated API/function | Fail |
| cg-004 | Insecure code (SQL injection) | Fail |
| cg-005 | Wrong language tag in code block | Fail |
| cg-006 | Correct code, no explanation | Pass |

## Run

```bash
regtrace run
```

Two pass, four fail.

## Next steps

- Add an LLM judge key (`.env`) and enable `factuality` in `metrics.enabled`
  to evaluate code correctness claims and API usage
- Enable `regex_match` to enforce code patterns (e.g. no try-catch swallows)
- Run `regtrace run --format json` for structured code quality audit
