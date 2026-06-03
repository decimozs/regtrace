# Summarization Example (Generate Mode)

Claude generates news article summaries, then Regtrace evaluates format quality.
Needs ANTHROPIC_API_KEY in `.env`.

## What's tested

Seven summarization test cases covering accurate summaries, hallucinated names,
fabricated statistics, missing details, inflammatory tone, verbosity, and
concise writing:

| Case | Description | Expected |
|---|---|---|
| sum-001 | Accurate faithful summary | Pass |
| sum-002 | Hallucinated person name | Fail |
| sum-003 | Fabricated statistic | Fail |
| sum-004 | Missing key detail | Fail |
| sum-005 | Inflammatory tone | Fail |
| sum-006 | Overly verbose | Fail |
| sum-007 | Perfect concise summary | Pass |

## Run

```bash
regtrace run --generate
```

## Next steps

- Enable `factuality` in `metrics.enabled` for hallucination detection
- Enable `tone` for sentiment and formality scoring
- Set `claim_extraction_depth: deep` for stricter summary factuality
