# RAG Legal Example

This example evaluates LLM responses grounded in regulatory and legal text.
It demonstrates Regtrace's RAG interaction type with precision-critical
factuality — where paraphrase that changes meaning is as dangerous as
outright hallucination.

## Scenario

Six RAG test cases for a compliance chatbot answering from official GDPR
regulation text. Precision is non-negotiable:

| Case | Description | Expected |
|---|---|---|
| rag-legal-001 | Faithful paraphrase of regulation | Pass |
| rag-legal-002 | Oversimplified — meaning changed | Fail |
| rag-legal-003 | Adds unsourced legal advice | Fail |
| rag-legal-004 | Correct but confusingly structured | Fail |
| rag-legal-005 | Confidently refuses when unsure | Pass |
| rag-legal-006 | Partially incorrect legal detail | Fail |

## Run

```bash
regtrace run
```

## Next steps

- Add an LLM judge key (`.env`) and enable `[factuality, format]` for
  strict claim-level factuality evaluation
- Set `factuality.mode: strict` and `claim_extraction_depth: deep` for
  precision-critical legal evaluation
- Run `regtrace run --format json` for compliance audit trail
