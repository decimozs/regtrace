# Content Moderation Example

This example evaluates LLM-generated content moderation decisions — flagging
toxic, abusive, or spam content before publishing. It demonstrates Regtrace's
deterministic format metrics — no API key required.

## Scenario

Six test cases covering clean content, hate speech, sarcasm, spam, borderline
profanity, and legitimate criticism. Four cases flag correctly, two fail
(misclassifications):

| Case | Description | Expected |
|---|---|---|
| cm-001 | Clean post — correctly allowed | Pass |
| cm-002 | Hate speech — correctly rejected | Pass |
| cm-003 | Sarcastic criticism — borderline, allowed | Pass |
| cm-004 | Spam link — missed by filter | Fail |
| cm-005 | Borderline profanity — allowed when it should be rejected | Fail |
| cm-006 | Legitimate criticism — correctly allowed | Pass |

## Run

```bash
regtrace run
```

Four cases pass, two fail. The suite fails because `max_failed_test_cases: 1`
is exceeded — demonstrating that a moderation filter missing spam is caught
by the evaluation gate.

## Next steps

- Add an LLM judge key (`.env`) and enable `tone` in `metrics.enabled` to
  evaluate sentiment analysis alongside format checks
- Tune `forbidden_content` patterns to tighten or relax moderation rules
- Run `regtrace run --format json` for machine-readable moderation audit trail
