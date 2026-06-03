# Multi-Provider Fallback

Uses Anthropic as the primary LLM judge with OpenAI as fallback. If the primary
provider is down, rate-limited, or slow, the fallback is tried after retries are
exhausted. Both providers need API keys set in the CI environment.

## When to use this

Use when you need high availability for LLM judging and can't tolerate a provider
outage halting your evaluation pipeline. Best for teams that:

- Run evaluation in CI on every PR and need reliable gate results
- Use LLM-judged metrics (deep factuality, tone) where a provider outage stops the whole pipeline
- Want to compare judge results between providers for bias analysis

## Prerequisites

- `secrets.ANTHROPIC_API_KEY` set in your CI provider
- `secrets.OPENAI_API_KEY` set in your CI provider
- Both keys must have access to the configured models

## How fallback works

```mermaid
flowchart LR
  Judge[Judge Request] --> Primary[Primary: Anthropic]
  Primary --> Retry{Retries ' exhausted?}\n  Retry -->|No| RetryAgain[Retry with backoff]\n  RetryAgain --> Primary
  Retry -->|Yes| Fallback[Fallback: OpenAI]
  Fallback --> FRetry{Fallback ' retries exhausted?}\n  FRetry -->|No| FRetryAgain[Retry]\n  FRetryAgain --> Fallback
  FRetry -->|Yes| Heuristic[Heuristic Scoring]
```

Retry formula: `min(1000 × 2^attempt + random(500), 30000)`. No double-fallback.
If both providers fail, metric falls back to heuristic scoring (n-gram overlap
for factuality, keyword matching for tone) with low confidence.

## Key config differences from single-provider setups

| Setting | This example | Single provider |
|---------|--------------|----------------|
| `judge.fallback` | Configured (OpenAI) | Not present |
| `retry_attempts` | 3 primary + 2 fallback | 3 total |
| `temperature` | 0.0 (deterministic) | 0.1 |
| `factuality` threshold | 0.9 | 0.7–0.8 |
| `max_low_confidence_ratio` | 0.05 | 0.1 |

## Quality gates

Strict — accuracy-critical use case (medical + legal):

| Gate | Value | Rationale |
|------|-------|-----------|
| `factuality` | 0.9 | Wrong medical/legal info is dangerous |
| `tone` | 0.75 | Sensitive topics need appropriate tone |
| `suite_score_minimum` | 0.8 | High bar for medical accuracy |
| `max_low_confidence_ratio` | 0.05 | Near-zero tolerance for uncertain judgments |

## Run locally first

```bash
cd examples/multi-provider-fallback
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-proj-...
regtrace run --format json --output report.json
cat report.json | jq '.summary'
```

## API key management

The pipeline sets both secrets as environment variables. If `ANTHROPIC_API_KEY`
is missing but `OPENAI_API_KEY` is set, evaluation proceeds using the fallback
provider only (primary can't be reached at all).
