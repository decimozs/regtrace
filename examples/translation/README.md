# Translation Example

This example evaluates LLM-generated Spanish translations of English product
descriptions. It demonstrates Regtrace's factuality and format metrics —
detecting mistranslations, missing content, and wrong register.

## Scenario

Six test cases covering accurate translation, mistranslated brand names,
added content, omissions, wrong formality, and correct use of idioms:

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
regtrace run
```

Two pass, four fail.

## Next steps

- Add an LLM judge key (`.env`) and enable `[factuality, format, tone]` in
  `metrics.enabled` for full cross-language factuality evaluation
- Tune `length_tolerance` for source-to-target length ratios
- Run `regtrace run --format json` for structured translation quality reports
