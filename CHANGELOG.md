# Changelog

## 0.9.3 (2026-06-05)

### Bug Fixes

- **upgrade/uninstall**: Check parent directory write permission instead of binary
  file permission. `accessSync(W_OK)` on the binary can pass even when the parent
  directory is root-owned — `copyFileSync` / `unlinkSync` require directory write
  permission, not file write permission. Now check `accessSync(dirname(path), W_OK)`.
- **upgrade**: Wrap `performSwap` `copyFileSync` in try-catch — unhandled EACCES
  now shows a helpful message with `sudo` hint instead of a raw exception.
- **upgrade**: Clean stale temp files before download — previous failed attempts
  could leave files that block fresh downloads.

## 0.9.2 (2026-06-05)

### Bug Fixes

- **generate**: Pass `system_prompt` from golden set to LLM during `--generate`
  (was sending `null` instead, so system prompts had no effect on generation)
- **format evaluator**: Strip markdown code fences before JSON validity,
  schema, length, and required-fields checks. LLMs often wrap JSON in
  ` ```json ``` ` blocks — now handled correctly.

## 0.9.1 (2026-06-05)

### Features

- `regtrace uninstall` command: remove the binary cross-platform
  - Unix: immediate unlink, Windows: background .cmd script
  - Permission checks, missing-binary handling, `-y` flag for unattended use
  - Project files left in place

## 0.9.0 (2026-06-04)

### Features

- CLI tool for evaluating LLM outputs across 4 pillars: Factuality, Format, Tone, Regression
- Golden set YAML format for defining test cases
- Multi-provider support: Anthropic, OpenAI, Groq, Gemini, Ollama
- `regtrace run --generate` to auto-generate actual_output from LLM
- Automatic regression detection with per-run baseline comparison
- Quality gates with composable pass/fail criteria (score, failure count, confidence, regression)
- Deterministic fallbacks for LLM-judged metrics when API is unavailable
- CI mode with exit code enforcement
- File-watch mode for iterative development
- SQLite database for run history persistence
- JSON and Markdown report formats

### Security

- API keys: fail-fast on missing credentials, switch Gemini to header auth
- Sanitize API error responses (truncate + redact key patterns)
- Add ReDoS guard in format regex_match evaluation

### Changed

- Remove unused cost_controls schema (token tracking was never enforced)
- Decompose run.command.ts into run-pipeline.ts with proper evaluation orchestration
- Fix weighted scoring: suite_score now respects per-test-case weights
- Separate stdout (JSON data) from stderr (human-readable output)
- Replace `require("dotenv")` with ESM import
- Add exponential backoff with jitter to API retry logic
- Remove stale 20-second inter-batch delay from evaluateSuite
- Fix regtraceVersion: use build-time __VERSION__ define
- Fix quality gate status written to file before gate check
