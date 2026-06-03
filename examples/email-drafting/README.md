# Email Drafting Example (Generate Mode)

Claude generates sales and support emails, then Regtrace evaluates format
and tone quality. Needs ANTHROPIC_API_KEY in `.env`.

## What's tested

Six email test cases covering professional follow-ups, aggressive tone, missing
personalization, informal language, churn prevention, and generic templates:

| Case | Description | Expected |
|---|---|---|
| em-001 | Professional follow-up email | Pass |
| em-002 | Aggressive pushy sales tone | Fail |
| em-003 | Missing personalization tokens | Fail |
| em-004 | Too informal for business email | Fail |
| em-005 | Perfect churn prevention email | Pass |
| em-006 | Generic template | Fail |

## Run

```bash
regtrace run --generate
```

Tone evaluation (`formality`, `sentiment`, `persona_consistency`) uses the LLM
judge. Format evaluation (`required_fields`, `forbidden_content`) is
deterministic.

## Next steps

- Enable `regex_match` for personalization token pattern validation
- Tune tone `sub_dimension_weights` for your brand voice
- Add `factuality` to verify claims made in generated emails
