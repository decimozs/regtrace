# Source-to-Doc Mapping

## CLI Entry & Commands

| Source | Doc |
|---|---|
| `packages/cli/src/index.ts` | `reference/cli.mdx` |
| `packages/cli/src/cli/init.command.ts` | `reference/cli.mdx`, `tutorials/getting-started.mdx` |
| `packages/cli/src/cli/run.command.ts` | `reference/cli.mdx`, `tutorials/getting-started.mdx`, `tutorials/setup-regression.mdx`, `how-to/ci-integration.mdx` |
| `packages/cli/src/cli/list.command.ts` | `reference/cli.mdx`, `how-to/debug-failures.mdx` |
| `packages/cli/src/cli/watch.command.ts` | `reference/cli.mdx`, `tutorials/watch-mode.mdx` |
| `packages/cli/src/cli/baseline.command.ts` | `reference/cli.mdx`, `how-to/pin-baseline.mdx`, `tutorials/setup-regression.mdx` |
| `packages/cli/src/cli/print.ts` | (internal — no doc) |

## Schema

| Source | Doc |
|---|---|
| `packages/cli/src/schema/config.schema.ts` | `reference/config-file.mdx` |
| `packages/cli/src/schema/golden-set.schema.ts` | `reference/golden-set.mdx`, `tutorials/create-golden-set.mdx` |
| `packages/cli/src/schema/run-record.schema.ts` | `reference/run-record.mdx` |
| `packages/cli/src/schema/validators/config.validator.ts` | `reference/config-file.mdx` |
| `packages/cli/src/schema/validators/golden-set.validator.ts` | `reference/golden-set.mdx` |

## Judge (LLM Providers)

| Source | Doc |
|---|---|
| `packages/cli/src/judge/judge.ts` | `reference/judge-providers.mdx`, `explanation/deterministic-vs-llm.mdx`, `how-to/switch-provider.mdx` |
| `packages/cli/src/judge/providers.ts` | `reference/judge-providers.mdx`, `how-to/switch-provider.mdx` |
| `packages/cli/src/judge/prompts.ts` | `reference/judge-providers.mdx` |
| `packages/cli/src/judge/types.ts` | `reference/judge-providers.mdx` |

## Metrics

| Source | Doc |
|---|---|
| `packages/cli/src/metrics/types.ts` | `reference/metrics.mdx` |
| `packages/cli/src/metrics/runner.ts` | `reference/metrics.mdx`, `explanation/how-regtrace-works.mdx` |
| `packages/cli/src/metrics/evaluators/factuality.evaluator.ts` | `reference/metrics.mdx`, `explanation/deterministic-vs-llm.mdx`, `how-to/configure-metrics.mdx` |
| `packages/cli/src/metrics/evaluators/format.evaluator.ts` | `reference/metrics.mdx`, `how-to/configure-metrics.mdx` |
| `packages/cli/src/metrics/evaluators/tone.evaluator.ts` | `reference/metrics.mdx`, `how-to/configure-metrics.mdx` |
| `packages/cli/src/metrics/evaluators/regression.evaluator.ts` | `reference/metrics.mdx`, `explanation/regression.mdx`, `tutorials/setup-regression.mdx` |

## Reports

| Source | Doc |
|---|---|
| `packages/cli/src/reports/types.ts` | `how-to/generate-reports.mdx`, `reference/config-file.mdx` |
| `packages/cli/src/reports/reporter.ts` | `how-to/generate-reports.mdx` |
| `packages/cli/src/reports/json-reporter.ts` | `how-to/generate-reports.mdx` |
| `packages/cli/src/reports/markdown-reporter.ts` | `how-to/generate-reports.mdx` |
| `packages/cli/src/reports/quality-gates.ts` | `reference/config-file.mdx`, `explanation/quality-gates.mdx`, `how-to/ci-integration.mdx` |

## Storage

| Source | Doc |
|---|---|
| `packages/cli/src/storage/config-loader.ts` | `reference/config-file.mdx` |
| `packages/cli/src/storage/golden-set-loader.ts` | `reference/golden-set.mdx` |
| `packages/cli/src/storage/run-store.ts` | `reference/run-record.mdx` |

## Utils

| Source | Doc |
|---|---|
| `packages/cli/src/utils/env.ts` | `how-to/switch-provider.mdx`, `reference/judge-providers.mdx` |
| `packages/cli/src/utils/hash.ts` | (internal — no doc) |
| `packages/cli/src/utils/logger.ts` | (internal — no doc) |

## Build / CI

| Source | Doc |
|---|---|
| `scripts/build.ts` | `explanation/architecture-decisions.mdx` (weak) |
| `.github/workflows/ci.yml` | `how-to/ci-integration.mdx` (weak) |
| `.github/workflows/release.yml` | (not documented) |

## Conceptual docs (no source anchor)

These cover cross-cutting concepts or serve as landing pages. Not tied to a single source file:

- `index.mdx` — docs landing
- `explanation/why-regtrace.mdx`
- `explanation/four-pillars.mdx`
- `explanation/architecture-decisions.mdx`
- `explanation/glossary.mdx`
- `tutorials/create-golden-set.mdx`
- `how-to/rag-evaluation.mdx`
