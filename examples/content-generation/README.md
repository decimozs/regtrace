# Content Generation Example

This example evaluates LLM-generated marketing and brand content for tone
consistency. It demonstrates Regtrace's tone and format metrics — detecting
off-brand voice, wrong formality, and persona drift.

## Scenario

Six test cases covering on-brand copy, overly formal writing, too casual tone,
competitor mentions (forbidden), inconsistent persona, and perfect social posts:

| Case | Description | Expected |
|---|---|---|
| cg-001 | On-brand product launch copy | Pass |
| cg-002 | Overly formal corporate tone | Fail |
| cg-003 | Too casual for brand voice | Fail |
| cg-004 | Mentions competitor brand name | Fail |
| cg-005 | Inconsistent persona throughout copy | Fail |
| cg-006 | Perfect social media post | Pass |

## Run

```bash
regtrace run
```

## Next steps

- Add an LLM judge key (`.env`) and enable `[tone, format]` in
  `metrics.enabled` for full tone sub-dimension evaluation
- Configure `forbidden_content` patterns for competitor names or disallowed
  phrasing
- Run `regtrace run --format json` for structured brand compliance reports
