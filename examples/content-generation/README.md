# Content Generation Example (LLM Judge)

Evaluates brand marketing content tone consistency using the LLM judge.
Outputs are pre-provided — the judge scores tone alongside format.
Needs ANTHROPIC_API_KEY in `.env`.

## What's tested

Six brand content test cases covering on-brand copy, overly formal, too casual,
competitor mentions, inconsistent persona, and perfect social posts:

| Case | Description | Expected |
|---|---|---|
| bn-001 | On-brand product launch copy | Pass |
| bn-002 | Overly formal corporate tone | Fail |
| bn-003 | Too casual for brand voice | Fail |
| bn-004 | Mentions competitor name | Fail |
| bn-005 | Inconsistent persona | Fail |
| bn-006 | Perfect social media post | Pass |

## Run

```bash
regtrace run
```

Tone evaluation measures `formality`, `sentiment`, `assertiveness`,
`persona_consistency`, and `verbosity` sub-dimensions.

## Next steps

- Configure `tone.tone_profile` for custom brand voice definition
- Add more test cases targeting specific tone sub-dimensions
- Tune `sub_dimension_weights` to match brand priorities
