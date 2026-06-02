# RAG Documentation Example

This example evaluates LLM responses grounded in API documentation using
Retrieval-Augmented Generation. It demonstrates Regtrace's RAG interaction
type and factuality metrics — verifying faithfulness to retrieved context.

## Scenario

Six RAG test cases for a developer documentation chatbot. Answers must be
faithful to provided context documents — hallucination beyond the docs is
the primary failure mode:

| Case | Description | Expected |
|---|---|---|
| rag-doc-001 | Faithful answer from API docs | Pass |
| rag-doc-002 | Hallucinated endpoints not in docs | Fail |
| rag-doc-003 | Partially grounded with unsourced claim | Fail |
| rag-doc-004 | Correct but missing attribution | Fail |
| rag-doc-005 | Correctly refuses when context is insufficient | Pass |
| rag-doc-006 | Incomplete answer missing context details | Fail |

## Run

```bash
regtrace run
```

Two pass, four fail.

## Next steps

- Add an LLM judge key (`.env`) and enable `[factuality, format]` in
  `metrics.enabled` for full faithfulness evaluation against context
- Test with different `retrieval_score` thresholds to filter low-relevance
  context
- Run `regtrace run --format json` for structured RAG evaluation reports
