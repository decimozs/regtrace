---
name: regtrace
description: LLM evaluation CLI. Set up golden sets, run evaluations, detect regressions, enforce quality gates in CI/CD. Use when a user asks about LLM output quality, model regressions, golden sets, or automated evaluation.
---

# Regtrace

Regtrace is a CLI tool for evaluating LLM outputs across four dimensions:
**Factuality**, **Format**, **Tone**, and **Regression**. It's the "linter for
LLM outputs" — it tells you which dimension failed, why it failed, how
confident the evaluator is, and how the score compares to the last baseline.

## When to use this skill

- A user wants to evaluate LLM output quality
- A user asks about writing golden sets (test cases)
- A user needs to debug a failing evaluation
- A user wants to add quality gates to a CI/CD pipeline
- A user wants to compare two model versions or prompt changes
- A user sees a `regtrace` command and doesn't know how it works

## Quick start

1. **Install**: Download the binary for your platform from GitHub Releases.
2. **Init**: `regtrace init` — scaffold a project with sample config + golden set.
3. **Write golden sets**: Add test cases to `golden-sets/qa.yaml` (see format below).
4. **Run**: `regtrace run` — evaluates all golden sets, prints a terminal report.
5. **Inspect**: `regtrace list` — see run history; `regtrace history --run-id <id>` — details.

## Golden set format

Golden sets are YAML files. Each test case needs:

```yaml
test_cases:
  - id: qa-001                    # unique ID, stable across versions
    description: "Short description"
    input: "What is the capital of France?"
    expected_output: "The capital of France is Paris."
    actual_output: null            # fill this with the model's response
    metrics: [factuality, format, tone]  # which pillars to run
    tags: [geography]
    weight: 1.0
```

- `actual_output` is evaluated (fill it in). Set to `null` to skip this case.
- Expected output can be the ideal response. The judge compares actual vs expected.
- Metrics default to all four pillars; you can override per-case.

## Interpreting results

Each metric scores 0.0–1.0. A score >= threshold passes.

| Pillar | What it checks | How it scores |
|--------|---------------|---------------|
| Factuality | Claims match expected output | LLM judge or heuristic overlap |
| Format | Structure, JSON, markdown, forbidden patterns | Deterministic checks |
| Tone | Formality, sentiment, persona | LLM judge or heuristic word lists |
| Regression | Quality trend vs last baseline | Delta calculation |

**Quality gates** are AND-composed. All must pass for the suite to pass:

1. Suite score >= `suite_score_minimum` (default 0.7)
2. Failed cases <= `max_failed_test_cases` (default 0)
3. Low-confidence ratio <= `max_low_confidence_ratio` (default 0.1)
4. Regression status != critical (when `regression_gate: true`)

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All quality gates passed |
| 1 | One or more quality gates failed |
| 2 | Config or schema error — evaluation did not run |

Use in CI: `regtrace run --ci` exits 1 on gate failure.

## Common tasks

### Add a new test case

Edit the golden set YAML. Add a new entry under `test_cases:` with a unique
`id`, `input`, `expected_output`, and fill in `actual_output` with the
model's response. Run `regtrace run` to evaluate.

### Debug a failing test case

1. Check the terminal report: which metric failed? What was the score?
2. Run `regtrace history --run-id <id>` for full details including explanations.
3. Common fixes:
   - **Format fails** — check JSON validity, markdown structure, forbidden content.
     Disable irrelevant sub-checks in `regtrace.config.yaml`.
   - **Factuality fails** — the actual output differs from expected. Update
     `actual_output` or the expected answer.
   - **Tone fails** — adjust `tone_profile` in config, or check the output's
     formality, sentiment, and persona consistency.
4. Run `regtrace run --dry-run` to validate changes before a full run.

### Set up CI integration

Add to your pipeline:

```bash
regtrace run --ci --format json --output results.json
```

Exit code 0 passes the gate, exit code 1 blocks the pipeline. Output JSON
to capture structured results.

### Run with a specific judge provider

```bash
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GROQ_API_KEY=gsk_...
```

Edit `regtrace.config.yaml` to set the judge provider and model. LLM-judged
metrics (factuality deep mode, tone) use the configured provider.

### Compare two runs

```bash
regtrace history --diff run_20260101_abc run_20260102_def
```

Shows per-metric and per-test-case delta between the two runs.
