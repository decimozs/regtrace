# `regtrace` CLI

The regtrace CLI binary — evaluates LLM outputs against golden-set expectations across Factuality, Format, Tone, and Regression.

## Development

```bash
bun install                        # install workspace deps
bun run --cwd packages/cli test    # run 159 tests
bun test -t "test name"           # single test by name
```

## Build

```bash
bun run build                      # compile + minify → ./regtrace
bun run build --outfile ./myname   # custom output path
```

Uses `bun build --compile --minify src/index.ts`. Version injected via `--define __VERSION__`.

## Layout

```
src/
├── cli/          Commander commands (run, init, list, history, watch, baseline)
├── judge/        LLM providers (anthropic, openai, gemini, groq, ollama)
├── metrics/      Evaluators (factuality, format, tone, regression)
├── reports/      Terminal, JSON, markdown reporters + quality gates
├── schema/       Zod v5 schemas (config, golden-set, run-record)
├── storage/      Config/GS loading, JSON/SQLite persistence
├── utils/        Concurrency, env, hashing, logging
└── index.ts      Entrypoint
tests/
├── unit/         Unit tests mirrored to src/ structure
├── integration/  cli.test.ts, baseline.test.ts
└── fixtures/     Configs, golden sets, run records
```

## Conventions

- No comments in source. Self-documenting code only.
- Zod v5 for schemas. No `z.infer` — write explicit types.
- `noUncheckedIndexedAccess: true` — always guard array access.
- Biome lint/format: tabs, double quotes.
- CLI output via `src/cli/print.ts` — never raw `console.log`.

## Integration tests

Spawn `Bun.spawn` child processes with minimal env. Temp dirs under `.test-tmp/`. Two tests have pre-existing stream-race flakiness; CI uses `--retry 2`.
