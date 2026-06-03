# Content Moderation Example (Zero-Setup)

Evaluates content moderation decisions with deterministic format metrics.
Works immediately — no API key required.

## What's tested

Six test cases covering clean content, hate speech, sarcasm, spam, borderline
profanity, and legitimate criticism:

| Case | Description | Expected |
|---|---|---|
| cm-001 | Clean post — correctly allowed | Pass |
| cm-002 | Hate speech — correctly rejected | Pass |
| cm-003 | Sarcastic criticism — allowed | Pass |
| cm-004 | Spam link — missed by filter | Fail |
| cm-005 | Borderline profanity — rejected | Fail |
| cm-006 | Legitimate criticism — allowed | Pass |

The suite fails because `max_failed_test_cases: 1` is exceeded — demonstrating
the quality gate catching a moderation filter that misses spam.

## Run

```bash
regtrace run
```

## Next steps

- Add ANTHROPIC_API_KEY and enable `tone` for sentiment evaluation
- Tune `forbidden_content` patterns for moderation rules
- Enable `regex_match` for URL/spam pattern detection
