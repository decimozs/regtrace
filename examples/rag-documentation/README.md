# RAG Documentation Example (LLM Judge)

Evaluates RAG response faithfulness against API documentation using the LLM
judge. Outputs are pre-provided — the judge scores factuality against
retrieved context. Needs ANTHROPIC_API_KEY in `.env`.

## What's tested

Six RAG test cases for a developer documentation chatbot:

| Case | Description | Expected |
|---|---|---|
| rag-doc-001 | Faithful answer from API docs | Pass |
| rag-doc-002 | Hallucinated endpoints not in docs | Fail |
| rag-doc-003 | Partially grounded with unsourced claim | Fail |
| rag-doc-004 | Correct but missing attribution | Fail |
| rag-doc-005 | Correctly refuses when unsure | Pass |
| rag-doc-006 | Incomplete answer missing context details | Fail |

## Run

```bash
regtrace run
```

The `interaction_type: rag` flag enables context-based factuality evaluation.
Each test case includes `context.documents` with `source` and `retrieval_score`.

## Next steps

- Set `claim_extraction_depth: deep` for stricter factuality
- Test with different `retrieval_score` thresholds
- Enable `tone` for formality evaluation in RAG responses
