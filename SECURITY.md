# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | ✅ |

## Reporting a Vulnerability

Report vulnerabilities by opening a [GitHub Issue](https://github.com/decimozs/regtrace/issues) with the label `security`.

Do not submit via email or public channels. We'll respond within 48 hours with a triage plan and expected fix timeline.

## Security Design

### Data Flow

- **No telemetry.** Regtrace never phones home, collects usage stats, or sends analytics.
- **Deterministic metrics** (format, factuality shallow mode, tone fallback, regression) run locally. No data leaves your machine.
- **LLM-judged metrics** (factuality deep mode, tone with LLM) send response text to the configured provider's API endpoint. You control the provider and model.
- **API keys** are read from `.env` or environment variables — never stored in config files, golden sets, or run records.

### Binary Integrity

- Releases are built by GitHub Actions from tagged commits. The workflow is defined in `.github/workflows/release.yml`.
- Binaries are self-contained (Bun `--compile` output). No runtime dependencies, no npm install on target machines.
- Verify download integrity by comparing against the SHA in the release notes.

### Configuration

- `.env` files are loaded from the working directory. Keep them out of version control (`.gitignore` is created by `regtrace init`).
- Config files (`regtrace.config.yaml`) are validated against Zod schemas at startup. Malformed configs produce clear error messages and refuse to run.

## Best Practices

1. Use dedicated API keys with minimum required permissions for each LLM provider.
2. Run in CI with `--format json` for machine-readable pass/fail output.
3. Pin your judge provider version to avoid unexpected behavior from model updates.
