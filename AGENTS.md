# Regtrace — Agent Guide

## Monorepo structure

Bun workspaces. Two packages + one app:

- `packages/cli/` — the regtrace CLI binary (`src/index.ts` entrypoint)
- `apps/docs/` — documentation site (Next.js + Fumadocs)
- `scripts/` — build script, download-stats script

All source is TypeScript with `verbatimModuleSyntax`. Never use `z.infer` — write explicit types. Always handle array access with checks (`noUncheckedIndexedAccess: true`).

## Commands

```bash
bun install                        # install all workspace deps
bun run lint                       # biome check (entire repo)
bun run build                      # compile CLI binary to ./regtrace
bun run --cwd packages/cli test    # run all 159 tests
bun run --cwd apps/docs dev        # docs dev server
bun run --cwd apps/docs build      # docs production build
bun run docs:typecheck             # docs typecheck
bun run stats                      # fetch github release download counts
```

Pre-commit (lefthook) runs: `biome check --staged` then `typecheck` then `bun test`. CI runs: `lint` → `typecheck` → `test` → `build` → `docs-build` in parallel jobs.

## Tests

- 19 test files, **159 tests total** (all passing target)
- Tests under `packages/cli/tests/` — unit tests and integration tests
- **Unit tests** under `tests/unit/` mirror `src/` directory structure
- **Integration tests** under `tests/integration/` — `cli.test.ts` and `baseline.test.ts`

### Unit test pitfalls

- `mock.module` in Bun **leaks across test files** because Bun runs test files as workers sharing module state. Never use `mock.module` for per-file mocking. Use env-var clearing or dependency injection instead.
- Unit tests for metrics (`tone.evaluator.test.ts`, `metrics-runner.test.ts`) clear env vars at file-scope and use `afterAll` to restore. Follow this pattern for new metric tests.

### Integration test pitfalls

- Integration tests spawn child processes via `Bun.spawn(["bun", "run", ...args], {cwd, env})`. The `env` is minimal — only `NO_COLOR`, `DOTENV_CONFIG_QUIET`, `PATH`, `HOME`.
- Each test creates its own temp directory under `.test-tmp/`. Temp directories are cleaned up in `afterAll`.
- Two integration tests have **pre-existing flakiness under CI** (stream race condition in Bun.spawn):
  - "evaluates and persists run record"
  - "outputs JSON report with --format json"
- CI workflow uses `bun test --retry 2` to auto-retry these. The test file itself has a `waitForFile` polling helper and a 50ms flush delay after `proc.exited`.

### Running specific tests

```bash
bun test --cwd packages/cli run-generate.test     # single file
bun test --cwd packages/cli -t "JSON report"      # by test name
```

## Code style

- **No comments** in source code. Code must be self-documenting.
- **Zod v5** schemas in `packages/cli/src/schema/`
- **Biome** for lint + format. Config at root `biome.json`. Tabs for indentation, double quotes.
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Use `import type` for type-only imports (`verbatimModuleSyntax` enabled).
- CLI source in `src/cli/` uses `printInfo`/`printError`/`printHeader` — NOT raw `console.log`/`console.error`.

## Build

```bash
bun run build                       # compile + minify; outputs ./regtrace
bun run build --outfile ./myname    # custom output path
```

Uses `bun build --compile --minify` from `src/index.ts`. The version string is injected via `--define __VERSION__`. No extra runtime deps needed.

## Release

1. Bump version in `packages/cli/package.json`
2. `git tag v<version> && git push origin v<version>`
3. CI builds binaries for linux-x64, darwin-arm64, windows-x64 + SHA256 checksums, uploads to GitHub Releases

## Key files to know

| Path | Purpose |
|---|---|
| `packages/cli/src/index.ts` | CLI entrypoint (Commander) |
| `packages/cli/src/cli/run.command.ts` | Main run pipeline orchestration |
| `packages/cli/src/cli/run-pipeline.ts` | Suite evaluation loop (load → generate → evaluate → persist) |
| `packages/cli/src/schema/config.schema.ts` | Zod schema for config.yaml |
| `packages/cli/src/schema/golden-set.schema.ts` | Zod schema for golden set YAML |
| `packages/cli/src/schema/run-record.schema.ts` | Zod schema for persisted run records |
| `packages/cli/src/metrics/runner.ts` | `evaluateSuite` — runs all metrics for a test case |
| `packages/cli/src/judge/providers/` | LLM providers (anthropic, openai, gemini, groq, ollama) |
| `packages/cli/src/storage/run-store.ts` | JSON file persistence for run records |
| `packages/cli/src/storage/db-store.ts` | SQLite persistence (optional, disabled by default) |
| `packages/cli/src/reports/reporter.ts` | Report generation (terminal, JSON, markdown) |
| `apps/docs/content/docs/` | All documentation mdx files |
| `skills/regtrace/SKILL.md` | Agent skill for regtrace CLI usage |
| `scripts/download-stats.ts` | GitHub release download counter |
| `.github/workflows/release.yml` | Multi-platform build + release workflow |

## Skills

Installed skills for agents working in this repo:
- `github-actions-docs` — use when writing or debugging GitHub Actions workflows
- `bun-test` — use when writing or debugging Bun test runner commands
- `sync-docs` — keep `apps/docs/` in sync with code changes (run after code changes)
