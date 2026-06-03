# PR Comment Report

Runs evaluation on every pull request and posts a Markdown report as a PR comment.
Gives reviewers instant visibility into how LLM output quality changes with each PR.

## When to use this

Use when you want evaluation results visible directly in the PR conversation
without requiring reviewers to click through to CI logs. Best for teams that:

- Review prompt changes in PRs and want quality data at a glance
- Want to build a visible quality culture around LLM outputs
- Need to share evaluation results with non-technical stakeholders (product managers, QA)

## Prerequisites

- `secrets.ANTHROPIC_API_KEY` set in your GitHub repository
- The `report.md` file must not be gitignored (the read-file-action reads from disk)
- This workflow needs `permissions: pull-requests: write` — already set in the YAML

## Key flags

| Flag | Purpose |
|------|---------|
| `--ci` | Suppress color, exit 1 on quality gate failure |
| `--format markdown` | Generate a human-readable Markdown report |
| `--output report.md` | Write report to file for the PR comment action |

## Quality gates

Moderate gates — the report is informational, the PR should still pass unless
quality drops significantly:

| Gate | Value | Rationale |
|------|-------|-----------|
| `suite_score_minimum` | 0.75 | High bar for marketing copy |
| `max_failed_test_cases` | 1 | Allow single weak case |
| `tone` | 0.8 (via threshold on copy-001) | Tone is critical for brand copy |

## Run locally first

```bash
cd examples/pr-comment-report
export ANTHROPIC_API_KEY=sk-ant-...
regtrace run --format markdown --output report.md
cat report.md
```

This writes a Markdown report to `report.md` that you can inspect locally.
The same file is posted as a PR comment in CI.

## Permission notes

The `permissions: pull-requests: write` block is required. Without it, the
`github-script` step throws a 403 error when trying to create the comment.
