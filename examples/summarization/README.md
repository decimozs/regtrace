# Summarization Example

This example evaluates LLM-generated news article summaries. It demonstrates
Regtrace's factuality and format metrics — detecting hallucination,
missing key points, and structural issues in AI-generated summaries.

## Scenario

Seven test cases covering accurate summaries, hallucination, fabricated
details, inflammatory tone, verbosity, and conciseness:

| Case | Description | Expected |
|---|---|---|
| sum-001 | Accurate faithful summary | Pass |
| sum-002 | Hallucinated person name | Fail |
| sum-003 | Fabricated statistic | Fail |
| sum-004 | Missing key detail | Fail |
| sum-005 | Correct but inflammatory tone | Fail |
| sum-006 | Overly verbose summary | Fail |
| sum-007 | Perfect concise summary | Pass |

## Run

```bash
regtrace run
```

Three cases pass, four fail — demonstrating hallucination detection in action.

## Next steps

- Add an LLM judge key (`.env`) and enable `[factuality, format, tone]` in
  `metrics.enabled` for full hallucination and tone evaluation
- Adjust `claim_extraction_depth` to deep for stricter factuality scoring
- Run `regtrace run --format json` for structured summarization audit
