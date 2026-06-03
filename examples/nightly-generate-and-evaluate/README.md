# Nightly Generate + Evaluate

Runs on a schedule to generate fresh LLM outputs via `--generate`, evaluate them,
and upload the JSON report as a CI artifact. Tracks output quality trends over time.

## When to use this

Use when your golden sets define inputs and expected outputs but the actual outputs
are generated fresh each run. Best for teams that:

- Want to evaluate LLM output quality on a recurring basis without manual golden set maintenance
- Track score trends over time (suite score up or down since last week?)
- Need an audit trail of LLM output quality across releases

## Prerequisites

- `secrets.ANTHROPIC_API_KEY` set in your GitHub or GitLab repository
- All golden set test cases have `actual_output: null`
- A `generator` block in `regtrace.config.yaml` (already included)

## How it works

```mermaid
flowchart LR
  Cron[Nightly Cron] --> DryRun[Dry-Run Pre-Check]
  DryRun --> Generate[regtrace run --generate --ci]
  Generate --> Report[Upload JSON Report]\n  Report --> Artifact[CI Artifacts]
```

## Key flags

| Flag | Purpose |
|------|---------|
| `--generate` | Auto-fill null actual_output via LLM |
| `--ci` | Suppress color, exit 1 on failure |
| `--format json` | Machine-readable output for analysis |
| `--dry-run` | Validate setup before spending tokens |

## Quality gates

Lenient gates tolerate minor variance from non-deterministic generations:

| Gate | Value | Rationale |
|------|-------|-----------|
| `suite_score_minimum` | 0.7 | Lower bar for generated outputs |
| `max_failed_test_cases` | 1 | Allow occasional weak generation |
| `max_low_confidence_ratio` | 0.2 | Higher tolerance for LLM judge uncertainty |

## Run locally first

```bash
cd examples/nightly-generate-and-evaluate
export ANTHROPIC_API_KEY=sk-ant-...

# Count null outputs without spending tokens
regtrace run --dry-run

# Generate and evaluate
regtrace run --generate --format json --output report.json
```

## Cost estimation

`--generate` calls the provider for each `null` `actual_output`. Estimate cost:

```bash
regtrace run --dry-run --generate
```

The dry-run reports how many cases need generation before any API calls are made.
