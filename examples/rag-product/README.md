# RAG Product Search Example (Advanced Config)

Combines generate mode with RAG context. Claude generates product responses
grounded in catalog data, then Regtrace evaluates format and factuality.
Needs ANTHROPIC_API_KEY in `.env`.

## Config highlights

```yaml
generator:
  provider: anthropic
  model: claude-haiku-4-5-20251001
metrics:
  enabled: [format, factuality]
```

The `generator` block produces outputs from test case inputs. Each test case
includes `context.documents` from a product catalog. The LLM judge evaluates
factuality against the provided context.

## What's tested

Five e-commerce product search test cases:

| Case | Description | Expected |
|---|---|---|
| rag-prd-001 | Accurate product description from specs | Pass |
| rag-prd-002 | Wrong price quoted | Fail |
| rag-prd-003 | Hallucinated feature not in specs | Fail |
| rag-prd-004 | Correct but missing key specification | Fail |
| rag-prd-005 | Direct product match from catalog | Pass |

## Run

```bash
regtrace run --generate
```

## Next steps

- Tune `generator.temperature` for more or less creative responses
- Add regression tracking to catch spec accuracy drift over time
- Use `regtrace run --format json` for structured product search audit
