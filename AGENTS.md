# Regtrace — Agent Guide

## What regtrace is

Regtrace is a CLI tool that evaluates LLM outputs against golden-set expectations and reports whether quality is maintained or regressed. It scores outputs across Factuality, Format, Tone, and Regression using deterministic checks and an LLM judge. It is NOT a test runner, linter, or deployment tool — it evaluates text quality, not code.

## Repo layout

```
packages/cli/          CLI binary (src/index.ts entrypoint)
  src/cli/             Commands: run, init, list, history, watch, baseline
  src/schema/          Zod v5 schemas (config, golden-set, run-record)
  src/metrics/         Evaluators: factuality, format, tone, regression
  src/judge/           LLM providers (anthropic, openai, gemini, groq, ollama)
  src/storage/         Config loading, golden-set loading, JSON/SQLite persistence
  src/reports/         Terminal, JSON, markdown reporters + quality gates
  tests/unit/          Unit tests mirrored to src/ structure
  tests/integration/   cli.test.ts, baseline.test.ts (spawn child processes)
  tests/fixtures/      Config, golden-set, run-record test fixtures
apps/docs/             Next.js + Fumadocs documentation site
examples/              17 example projects in 5 categories (A–E)
scripts/               build.ts, download-stats.ts, update-sandbox.sh
skills/regtrace/       SKILL.md — full CLI reference (consult for command details)
sandbox/               Scratch directory for manual testing (gitignored)
```

## How to run things

```bash
# Development
bun install                                    # install workspace deps
bun run lint                                   # biome check (entire repo)
bun run build                                  # compile CLI → ./regtrace
bun run --cwd packages/cli test                # run all tests (159)
bun test --cwd packages/cli -t "test name"    # single test by name
bun run --cwd apps/docs dev                   # docs dev server

# Evaluation (requires API key in env or .env)
regtrace run --dry-run                         # validate config, no tokens spent
regtrace run                                   # evaluate all enabled golden sets
regtrace run --set golden-sets/qa.yaml         # single golden set
regtrace run --generate                        # auto-fill null actual_output, then evaluate
ANTHROPIC_API_KEY=sk-ant-... regtrace run      # inline env var
regtrace run --ci                              # CI mode: no color, exit 1 on gate failure
```

Required env vars by provider: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`. Ollama needs none (local). Format-only evaluations need no API key.

## Where not to touch

- `.regtrace/` — run history and local DB; never commit or edit
- `golden-sets/*.yaml` `actual_output` fields — use `--generate` to fill, don't hand-edit
- `packages/cli/src/schema/*.ts` Zod schemas — single source of truth; config validation derives from these
- `sandbox/` — gitignored scratch directory; not production code
- `examples/` — pinned reference configs; don't modify without explicit instruction

## Contribution conventions

- **Golden set naming**: `kebab-case.yaml` in `golden-sets/` directory
- **Test case IDs**: domain prefix + 3-digit number (e.g. `faq-001`, `rag-doc-003`)
- **Golden set versioning**: patch = typo fixes; minor = new cases; major = restructuring
- **Config changes**: always `regtrace run --dry-run` before committing — validates schema without spending tokens
- **`actual_output`**: set to `null` for generate-mode cases; never hand-write to bypass `--generate`

## Code style

- **No comments** in source. Self-documenting code only.
- **TypeScript** with `verbatimModuleSyntax`. Use `import type` for type-only imports.
- **Zod v5** for schemas. Never use `z.infer` — write explicit types.
- **`noUncheckedIndexedAccess: true`** — always guard array access.
- **Biome** for lint/format: tabs, double quotes. Config at `biome.json`.
- **CLI output**: use `printInfo`/`printError`/`printHeader` from `src/cli/print.ts`, never raw `console.log`.
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`.

## Tests

159 tests across 19 files. `mock.module` in Bun leaks across test files (shared worker state) — use env-var clearing or dependency injection instead. Unit tests for metrics clear env vars at file scope with `afterAll` restore. Integration tests use `Bun.spawn` with minimal env (`NO_COLOR`, `DOTENV_CONFIG_QUIET`, `PATH`, `HOME`) and temp dirs under `.test-tmp/`.

Two integration tests have pre-existing stream-race flakiness in Bun.spawn. CI uses `--retry 2`. Local reproduction:

```bash
bun test --cwd packages/cli tests/integration/cli.test.ts  # if flaky, re-run
```

## CI behavior

Five parallel jobs: lint → typecheck → test → build → docs-build. Pre-commit hook runs `biome check --staged` → typecheck → `bun test`.

Exit codes: **0** = all quality gates passed; **1** = gate failure; **2** = config/schema error (evaluation didn't run).

Reproduce CI locally:

```bash
bun run lint && bunx tsc --noEmit --project packages/cli/tsconfig.json && bun run docs:typecheck && bun test --cwd packages/cli && bun run build
```

## Common agent mistakes to avoid

- **Editing `actual_output` in golden set YAML** instead of using `--generate` — the generate pipeline is the intended workflow
- **Changing `suite_score_minimum` or `metric_score_minimums`** without running `--dry-run` first — may silently break CI gates
- **Committing `.regtrace/`** run history — it's gitignored for a reason
- **Hardcoding API keys** — always read from env vars or `.env`
- **Using `mock.module` in tests** — leaks across files in Bun; use env-var clearing
- **Spreading `...process.env` in integration tests** — use minimal explicit env
- **Using `z.infer`** — write explicit types instead
- **Accessing array elements without checks** — `noUncheckedIndexedAccess: true` is enabled

## Skill reference

`skills/regtrace/SKILL.md` covers the full CLI workflow: all commands, flags, config schema, golden set format, quality gates, CI patterns, and troubleshooting. Consult it for anything not in this file.
