# Baseline Pinning

Locks regression comparison to a specific known-good run instead of relying on
the `last_passing` default. Includes two workflows: one that evaluates on push,
and one that pins a baseline via manual trigger.

## When to use this

Use when you need stable regression targets across releases. Best for teams that:

- Prepare releases and want a fixed reference point for quality comparison
- Have golden sets that evolve but need a stable benchmark during a release cycle
- Want to ensure a specific known-good version is the comparison standard

## Prerequisites

- `secrets.ANTHROPIC_API_KEY` set in your GitHub repository
- A previous passing run ID (get it from a green `evaluate` workflow run)
- Two golden sets in this example to demonstrate multi-set scoring

## How it works

### Evaluate workflow (evaluate.yml)

Runs on push to main and on pull requests. Caches `.regtrace/` so regression
history accumulates across runs.

### Pin baseline workflow (pin-baseline.yml)

```bash
# Manual trigger via GitHub UI:
# Actions > Pin Baseline > "Run workflow"
# Input: run_id from a passing evaluate run
```

The workflow:
1. Pins the specified run as baseline in `regtrace.config.yaml`
2. Opens a PR with the config change for review

## Quality gates

| Gate | Value | Rationale |
|------|-------|-----------|
| `suite_score_minimum` | 0.75 | Moderate bar for release branches |
| `max_failed_test_cases` | 0 | Every case must pass |
| `regression_gate` | true | Critical: regression of 12%+ blocks with pinned baseline |

## Run locally first

```bash
cd examples/baseline-pinning
export ANTHROPIC_API_KEY=sk-ant-...
regtrace run

# See runs
regtrace list

# Pin a specific run
regtrace baseline pin run_20260101_a3f9
regtrace baseline show

# Unpin
regtrace baseline unpin
```

## Release workflow

1. Run `evaluate.yml` on main — verify all gates pass
2. Get the passing run ID from the workflow logs or `regtrace list`
3. Trigger `pin-baseline.yml` with that run ID
4. Review and merge the generated PR
5. All subsequent runs compare against the pinned baseline
