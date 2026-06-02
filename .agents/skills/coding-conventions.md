# Regtrace — Coding Conventions

These conventions apply across the entire monorepo. Every file, every PR, and every AI-assisted contribution must follow them. Consistency is not optional — a CLI tool that feels inconsistent in its codebase produces inconsistent behavior for users.

## TypeScript

**Strict mode is non-negotiable.** `tsconfig.base.json` has `strict: true`. Never disable strict mode or use `@ts-ignore` to work around type errors. Fix the type, not the error message.

**No `any`.** If you do not know the type, use `unknown` and narrow it. `any` disables the type system entirely and hides bugs that TypeScript would otherwise catch.

**No implicit returns.** Every function that returns a value must explicitly return it on all code paths. TypeScript strict mode enforces this but be deliberate about it.

**Prefer types over interfaces for data shapes.** Use `type` for object shapes, union types, and intersections. Use `interface` only when you need declaration merging, which is rare in this codebase.

**No default exports except the CLI entry point.** Every module uses named exports. Default exports make refactoring harder and IDE support weaker. The only default export in the entire codebase is the Commander.js program in `src/cli/index.ts`.

## Naming

**Files:** kebab-case always. `golden-set-loader.ts`, `claim-extractor.ts`, `run-store.ts`. Never camelCase or PascalCase for file names.

**Types and interfaces:** PascalCase. `MetricResult`, `GoldenSet`, `TestCase`, `RunRecord`.

**Zod schemas:** PascalCase with `Schema` suffix. `GoldenSetSchema`, `ConfigSchema`, `RunRecordSchema`. The inferred type from a schema drops the `Schema` suffix: `type GoldenSet = z.infer<typeof GoldenSetSchema>`.

**Functions:** camelCase. `loadGoldenSet`, `computeRegressionDelta`, `renderTerminalOutput`.

**Constants:** SCREAMING_SNAKE_CASE for true constants. `DEFAULT_THRESHOLD`, `MAX_RETRY_ATTEMPTS`. camelCase for computed or configurable values.

**Metric names as string literals:** always lowercase with underscores matching the pillar names exactly — `factuality`, `format`, `tone`, `regression`. These strings appear in config files, run records, and CLI output. Inconsistency breaks regression tracking.

## Error Handling

**Prefer typed result objects over thrown exceptions for expected failure cases.** A golden set that fails validation is an expected failure. Use a result type pattern:

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }
```

**Throw for truly unexpected errors.** Infrastructure failures — file system errors, network timeouts after retries exhausted, corrupt run records — should throw. The runner catches these at the orchestration level and maps them to exit code 2 or 3.

**Never swallow errors silently.** No empty catch blocks. If you catch an error and cannot handle it, rethrow it or convert it to a typed result. Silent failures are the hardest bugs to diagnose in a CLI tool.

## Environment Variables

**Never access `process.env` directly outside of `src/utils/env.ts`.** All environment variable access goes through the env utility which validates presence, provides typed accessors, and gives clear error messages when required variables are missing. A metric file, a command file, or a storage file that reads `process.env.OPENAI_API_KEY` directly is a violation of this convention.

The env utility checks all required variables at startup and exits with a clear error message before any evaluation begins. Users should never see a missing API key error halfway through a run after spending time and tokens on earlier test cases.

## Imports

**Biome handles import ordering.** Do not manually reorder imports — let Biome format them. Run `bun run format` before committing.

**Use path aliases not relative paths for cross-module imports.** `@/metrics/factuality` not `../../metrics/factuality`. Configure path aliases in `tsconfig.base.json`. Deep relative paths are fragile and hard to read.

**Never import from a higher layer.** The dependency direction is `cli → core → metrics → judge`. A metric file must never import from `cli/` or `core/`. A judge file must never import from `metrics/`. Circular dependencies are architecture violations.

## Async Code

**Always use async/await.** Never use raw promise chains with `.then()` and `.catch()`. Async/await produces code that reads linearly and is dramatically easier to debug in a CLI context where stack traces matter.

**Parallelize where it is safe and meaningful.** The runner evaluates multiple test cases concurrently using `Promise.all` or `Promise.allSettled`. Within a single test case, independent metrics can run in parallel. Do not serialize work that can be parallelized — latency compounds across many test cases.

**Use `Promise.allSettled` not `Promise.all` when partial failure is acceptable.** If one test case's evaluation fails it should not abort the entire run. Use `allSettled` so all test cases are attempted and failures are collected, not thrown.

## Comments

**Comments explain why, not what.** Code explains what. Comments explain decisions that are not obvious from the code — why a particular approach was chosen, why a workaround exists, why a threshold was set to a specific value. Do not comment `// loop over test cases` above a loop over test cases.

**Every public function exported from a module has a JSDoc comment.** One line is enough for simple functions. Complex functions with non-obvious parameters or return shapes get fuller documentation.

**TODO comments must include a context.** `// TODO: add retry logic` is not acceptable. `// TODO: add retry logic when judge provider returns 429 — tracked in issue #42` is.

## Testing Conventions

See `testing-strategy.md` for the full testing approach. In terms of conventions:

- Test files live in `tests/unit/` or `tests/integration/` mirroring the `src/` structure
- Test file names match the file they test with `.test.ts` suffix — `claim-extractor.test.ts`
- Every test has a description that reads as a complete sentence — `it('returns confidence 1.0 for all deterministic metrics')`
- Arrange-Act-Assert structure in every test — setup, execute, verify. No interleaving.

## Package and Dependency Management

**Bun is the only package manager.** Never use npm or yarn commands in this repo. `bun install`, `bun add`, `bun remove`.

**Question every new dependency.** Regtrace is a CLI tool distributed as a binary. Every dependency adds to binary size and introduces a potential vulnerability or breaking change. If something can be implemented cleanly in under 50 lines, implement it rather than adding a dependency.

**Dependencies go in the right place.** Dev dependencies — testing tools, type definitions, build tools — in `devDependencies`. Runtime dependencies in `dependencies`. Never put a runtime dependency in devDependencies.
