# Translation Example (Generate Mode)

Claude generates Spanish translations of English product descriptions, then
Regtrace evaluates format quality. Needs ANTHROPIC_API_KEY in `.env`.

## What's tested

Six translation test cases covering accurate translation, mistranslated brand
names, added content, omissions, wrong formality, and correct local idioms:

| Case | Description | Expected |
|---|---|---|
| tr-001 | Accurate product translation | Pass |
| tr-002 | Mistranslated brand name | Fail |
| tr-003 | Added unsourced information | Fail |
| tr-004 | Missing sentence | Fail |
| tr-005 | Wrong formality register | Fail |
| tr-006 | Correct with local idioms | Pass |

## Run

```bash
regtrace run --generate
```

## Next steps

- Enable `tone` in `metrics.enabled` for formality register evaluation
- Enable `factuality` for cross-language information preservation
- Tune `length_tolerance` for source-to-target length ratios
