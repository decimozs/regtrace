# RAG Legal Example (Advanced Config)

Evaluates RAG response precision for legal/regulatory Q&A with strict
factuality mode and per-metric quality gates. Needs ANTHROPIC_API_KEY
in `.env`.

## Config highlights

```yaml
factuality:
  mode: strict
  claim_extraction_depth: deep
quality_gates:
  metric_score_minimums:
    factuality: 0.8
```

Strict claim extraction and a dedicated factuality gate (0.8) ensure
precision-critical legal evaluation.

## What's tested

Six GDPR compliance test cases:

| Case | Description | Expected |
|---|---|---|
| rag-legal-001 | Faithful paraphrase of regulation | Pass |
| rag-legal-002 | Oversimplified — meaning changed | Fail |
| rag-legal-003 | Adds unsourced legal advice | Fail |
| rag-legal-004 | Correct but confusingly structured | Fail |
| rag-legal-005 | Correctly refuses when unsure | Pass |
| rag-legal-006 | Partially incorrect legal detail | Fail |

## Run

```bash
regtrace run
```

## Next steps

- Add `judge.fallback` with a second Claude model for high availability
- Add regression baseline for tracking legal accuracy over time
- Use `regtrace run --format json` for compliance audit trail
