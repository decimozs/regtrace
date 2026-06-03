# Contributing

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- Node.js 22+ (for docs)

## Setup

```bash
git clone https://github.com/decimozs/regtrace
cd regtrace
bun install
```

## Project Structure

```
regtrace/
├── packages/cli/          # CLI binary (source + tests)
│   ├── src/               # TypeScript source
│   │   ├── cli/           # Command implementations
│   │   ├── judge/         # LLM judge providers
│   │   ├── metrics/       # Evaluators (factuality, format, tone, regression)
│   │   ├── schema/        # Zod schemas + validators
│   │   ├── storage/       # Config loading, run persistence
│   │   └── reports/       # Output reporters (terminal, JSON, markdown)
│   └── tests/             # Unit + integration tests
├── apps/docs/             # Documentation site (Next.js + Fumadocs)
└── scripts/               # Build scripts
```

## Commands

All commands run from the repo root or `packages/cli/`:

```bash
# Test
bun test                    # Run all 159 tests
bun run --cwd packages/cli test

# Typecheck
bun run --cwd packages/cli typecheck    # tsc --noEmit

# Lint + format
bun run lint                             # biome check

# Build binary
bun run build                            # outputs ./regtrace (minified)
bun run build --outfile ./my-custom-name # custom output path
bun run build --minify                   # explicit minification flag
bun run build --no-minify                # skip minification

# Build docs
bun run --cwd apps/docs build

# Dev (docs)
bun run --cwd apps/docs dev
```

## Adding a New Judge Provider

1. Create `packages/cli/src/judge/providers/<name>.ts` implementing `JudgeProvider`
2. Register in `packages/cli/src/judge/providers.ts`
3. Add provider string to `providerSchema` in `config.schema.ts`
4. Add tests in `packages/cli/tests/unit/judge/`
5. Add `ANTHROPIC_API_KEY`-style env var handling in `providers.ts`

## Adding a New Metric

1. Create `packages/cli/src/metrics/evaluators/<name>.evaluator.ts` matching the `MetricEvaluator` interface
2. Register in the `EVALUATOR_MAP` in `runner.ts`
3. Add config schema block in `config.schema.ts`
4. Add tests in `packages/cli/tests/unit/metrics/`

## Release Process

1. Update version in `packages/cli/package.json`
2. `git tag v<version>` (e.g., `git tag v1.0.1`)
3. `git push origin v<version>` — triggers `.github/workflows/release.yml`
4. Workflow builds binaries for Linux x86-64, macOS ARM64, Windows x86-64 and creates a GitHub release


## Code Style

- **No comments** in source code. Code should be self-documenting.
- **Zod v5** for validation. Use explicit types, never `z.infer`.
- **`noUncheckedIndexedAccess: true`** — handle array access with checks or assertions.
- **`verbatimModuleSyntax: true`** — use `import type` for type-only imports.
- Biome for linting and formatting (config at root and per-package).
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
