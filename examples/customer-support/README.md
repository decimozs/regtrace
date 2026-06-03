# Customer Support Example (Generate Mode)

Claude generates support email responses, then Regtrace evaluates them
for format quality. Needs ANTHROPIC_API_KEY in `.env`.

## What's tested

Five customer support test cases covering refund policy, shipping, and order
cancellation:

| Case | Description | Expected |
|---|---|---|
| cs-001 | Refund policy — correct response | Pass |
| cs-002 | Refund policy — wrong timeframe | Fail |
| cs-003 | Shipping — correct structured response | Pass |
| cs-004 | Shipping — vague, missing details | Fail |
| cs-005 | Cancellation — forbidden phrases | Fail |

## Run

```bash
regtrace run --generate
```

## Next steps

- Enable `tone` in `metrics.enabled` for sentiment/formality evaluation
- Enable `factuality` for claim verification against policy documents
- Run `regtrace run` a second time for regression detection against baseline
