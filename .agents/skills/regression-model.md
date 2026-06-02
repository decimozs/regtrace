# Regtrace — Regression Model

Regression is Regtrace's hero feature. Understanding it precisely is essential before working on any part of the codebase that touches run storage, scoring, or the regression metric itself. Getting the regression model wrong produces false positives that erode trust in the tool, or false negatives that let real quality degradation go undetected.

## The Fundamental Distinction

**Regression measures relative change over time, not absolute quality.**

Factuality, Format, and Tone measure whether a response is good. Regression measures whether the product is getting better or worse. These are completely different questions. A suite that scores 0.72 on factuality is giving you an absolute quality signal. A suite that regressed 0.08 from the previous baseline is giving you a trend signal. Both matter. They mean different things.

Never conflate regression scoring with absolute metric scoring. A response can score perfectly on all three absolute metrics and still trigger a regression warning if a previously higher-scoring baseline is being compared against.

## The Baseline Run

Every regression comparison is made against a **baseline run** — the reference point for detecting change.

**Default baseline strategy: `last_passing`**

The baseline is always the most recent run that passed all quality gates — not the most recent run overall. This distinction is critical.

If the sequence of runs is: pass → pass → fail → fail → current, the baseline for the current run is the second run (the last passing one), not the fourth run (the most recent one). Baselining against a failed run would normalize degraded quality as acceptable, which defeats the entire purpose of regression detection.

**Alternative baseline strategy: `pinned`**

A specific run ID is declared as the permanent baseline in the config file. All runs compare against this pinned run regardless of what passes or fails. Use this when you want to track improvement or degradation against a specific known-good state — a model version release, a major prompt overhaul, or a production deployment.

## The Three Levels of Regression

Regression operates at three distinct levels simultaneously. All three are computed on every run.

### Test Case Level Regression

For each individual test case, has any metric score dropped below the regression tolerance since the baseline? This is the most granular signal. A single test case regressing on factuality is a targeted signal — something specific broke for a specific input.

A test case regression is flagged when:
`baseline_score - current_score > regression_tolerance`

Test case regressions appear in the terminal output as individual flagged test cases and are surfaced in full detail by `regtrace audit regression`.

### Metric Level Regression

Has the average score for a specific metric dropped across the entire suite? This catches systemic drift — a prompt change that slightly degrades factuality across many test cases rather than catastrophically failing one.

A metric level regression is flagged when the average score delta across all test cases for that metric exceeds the tolerance threshold.

### Suite Level Regression

Has the overall suite score dropped below the baseline by more than the configured tolerance? This is the quality gate for CI/CD. Suite level regression triggers the regression gate which can fail the entire pipeline.

The suite level regression status has three values:
- `clean` — no regression detected at any level
- `warning` — test case or metric level regressions detected but below critical threshold
- `critical` — suite level regression exceeds critical threshold — fails the quality gate if `regression_gate: true` in config

## Tolerance Bands

Regression uses a tolerance band, not a hard threshold. LLM judge scores have inherent variance — the same output evaluated twice will not always produce identical scores. A drop of 0.01 or 0.02 is likely noise. A drop of 0.15 is a real signal.

**`regression_tolerance`** — the minimum score drop to flag as a regression warning. Scores that drop less than this are treated as noise. Default: `0.05`.

**`regression_critical_threshold`** — the score drop that triggers a critical regression status and can fail the quality gate. Default: `0.15`.

A score drop between `regression_tolerance` and `regression_critical_threshold` produces a warning. A drop above `regression_critical_threshold` produces a critical status.

## Golden Set Version Awareness

When the regression engine detects that the golden set version changed between the current run and the baseline run, it enters version-adjusted mode.

In version-adjusted mode:
- Test cases that were added since the baseline are excluded from regression scoring — you cannot regress on a test case that did not exist in the baseline
- Test cases that were removed since the baseline are excluded from regression scoring — they have no current score to compare against
- Test cases that exist in both versions are scored normally
- The regression report prominently flags that a version change occurred and lists which test cases were excluded

This is the feature that makes Regtrace trustworthy in a real team environment where golden sets evolve. Without version awareness, adding new test cases to a golden set would produce spurious regression warnings because the baseline has no scores for the new cases.

## What Triggers Version-Adjusted Mode

Version-adjusted mode activates when the golden set version in the current run record differs from the golden set version in the baseline run record. The comparison is made on the full semantic version string — `1.0.0` vs `1.1.0` triggers version-adjusted mode. `1.0.0` vs `1.0.0` does not.

## The Regression Run Record Block

Every run record contains a regression block regardless of whether regressions were detected:

```typescript
interface RegressionBlock {
  baselineRunId: string
  baselineGoldenSetVersion: string
  currentGoldenSetVersion: string
  versionChangeDetected: boolean
  suiteDelta: number                    // negative = regression, positive = improvement
  regressionStatus: 'clean' | 'warning' | 'critical'
  testCasesExcluded: string[]           // IDs excluded due to version change
  metricDeltas: Record<string, number>  // per-metric average delta
}
```

The regression block is always populated, never null. On the very first run of a project when no baseline exists, the regression block records that no baseline was available and sets `regressionStatus` to `clean`. The first run always establishes the baseline for the next run.

## Regression in the Terminal Output

In terminal output, regression status is always shown in the run summary regardless of whether a regression occurred. This makes it visible and builds the habit of checking it.

Format for the regression summary line:

```
Regression    clean     ▲ +0.04 from run_20240601_a1b2     (last passing)
Regression    warning   ▼ -0.07 from run_20240601_a1b2     (last passing)
Regression    critical  ▼ -0.18 from run_20240530_c3d4     (pinned)
```

The delta direction, value, baseline run ID, and baseline strategy are always shown together. A developer should never have to run a second command to understand what the regression status means.

## What the Regression Metric Is Not

**Regression is not a metric that scores a single output.** It cannot be run with `regtrace score` on a single input/output pair because it has no meaning without a historical baseline.

**Regression is not a diff tool.** It does not show you what changed in the output text between runs. It shows you what changed in the quality scores. Text diff is a separate concern.

**Regression is not a substitute for absolute metrics.** A suite with a clean regression status but a low absolute factuality score has a quality problem even if it is not getting worse. Both signals are required.
