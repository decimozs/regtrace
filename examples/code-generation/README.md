# Code Generation Example (Zero-Setup)

Evaluates LLM-generated code snippets with deterministic format metrics.
Works immediately — no API key required.

## What's tested

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

Two pass, four fail — demonstrating `markdown_structure`, `required_fields`,
and `forbidden_content` sub-checks.

## Next steps

- Enable `regex_match` to enforce code patterns (no try-catch swallows)
- Add ANTHROPIC_API_KEY and enable `factuality` in `metrics.enabled` for
  deeper code correctness evaluation with LLM judge

