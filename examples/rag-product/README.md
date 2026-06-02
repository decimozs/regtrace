# RAG Product Search Example

This example evaluates LLM responses grounded in product catalog data for an
e-commerce product search chatbot. It demonstrates Regtrace's RAG interaction
type with structured data — verifying spec accuracy, pricing, and feature
faithfulness.

## Scenario

Five RAG test cases for a product search bot answering from structured
catalog data. Accuracy on specifications and pricing is critical:

| Case | Description | Expected |
|---|---|---|
| rag-prd-001 | Accurate product description from specs | Pass |
| rag-prd-002 | Wrong price quoted | Fail |
| rag-prd-003 | Hallucinated feature not in specs | Fail |
| rag-prd-004 | Correct but missing key specification | Fail |
| rag-prd-005 | Direct product match from catalog | Pass |

## Run

```bash
regtrace run
```

## Next steps

- Add an LLM judge key (`.env`) and enable `[factuality, format]` for
  full factuality evaluation on numerical and spec accuracy
- Add more test cases with complex product comparisons
- Run `regtrace run --format json` for structured product search audit
