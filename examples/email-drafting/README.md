# Email Drafting Example

This example evaluates LLM-generated customer outreach and support emails.
It demonstrates Regtrace's tone and format metrics — detecting
unprofessional tone, missing personalization, and pushy language.

## Scenario

Six test cases covering professional follow-ups, aggressive tone, missing
personalization, informal language, churn prevention, and generic templates:

| Case | Description | Expected |
|---|---|---|
| em-001 | Professional follow-up email | Pass |
| em-002 | Aggressive pushy sales tone | Fail |
| em-003 | Missing personalization tokens | Fail |
| em-004 | Too informal for business email | Fail |
| em-005 | Perfect churn prevention email | Pass |
| em-006 | Generic template without customization | Fail |

## Run

```bash
regtrace run
```

## Next steps

- Add an LLM judge key (`.env`) and enable `[tone, format]` in
  `metrics.enabled` for full tone sub-dimension evaluation
- Enable `required_fields` with regex patterns for personalization tokens
- Run `regtrace run --format json` for structured email quality reports
