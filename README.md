<img width="1920" height="1080" alt="Regtrace Banner" src="https://github.com/user-attachments/assets/51011e21-8328-4d58-8512-bedab56a55a0" />

LLM quality degrades silently. A prompt change, a model update, a new feature — any of it can quietly break outputs that used to work. Regtrace gives you golden sets, multi-dimensional scoring, and baseline comparison so you catch drift before your users do.

## Core Features

- **Factuality** — LLM-as-judge scores response accuracy against expected output. Shallow mode (heuristic overlap) for speed, deep mode (LLM judges) for precision.
- **Format** — deterministic checks: JSON validity, schema match, required fields, regex, forbidden content, length tolerance, markdown structure.
- **Tone** — multi-dimension profile (formality, sentiment, assertiveness, persona consistency, verbosity). Deterministic fallback when no LLM configured.
- **Regression detection** — compare against baseline runs, flag drops beyond configurable tolerance and critical thresholds.
- **4 quality gates** — suite score, max failures, low-confidence ratio, regression status. AND-composed: all must pass for the run to pass.
- **Parallel evaluation** — `run.concurrency` (default 1, max 20) batches test cases for concurrent LLM-judge calls.
- **Multiple judge providers** — Anthropic, OpenAI, Groq, Gemini, Ollama.
- **Fallback judge** — configure a secondary provider; Regtrace retries with exponential backoff + jitter, then falls back automatically.
- **CI-native** — JSON on stdout, human-readable on stderr. Machine-readable pass/fail with exit codes for pipeline integration.
- **Watch mode** — `regtrace watch` re-runs on golden set changes.

## Quick Start

```bash
# Install (Linux x86-64)
curl -L -o regtrace https://github.com/decimozs/regtrace/releases/latest/download/regtrace-linux-x64
chmod +x ./regtrace
sudo mv ./regtrace /usr/local/bin/regtrace

# Create a project
mkdir my-eval && cd my-eval
regtrace init                    # creates config, golden set, .env.example, .gitignore

# Set up an LLM judge (optional — deterministic metrics work without one)
cp .env.example .env             # or: echo "ANTHROPIC_API_KEY=sk-..." > .env

# Populate golden set with model outputs and run
# (edit golden-sets/qa.yaml, fill actual_output)
regtrace run
```

See the [getting started tutorial](https://regtrace-docs.vercel.app/docs/tutorials/getting-started) for detailed walkthroughs.

## Integrations

| Category | Options |
|---|---|
| Judge providers | Anthropic, OpenAI, Groq, Gemini, Ollama, Azure OpenAI, AWS Bedrock |
| Output formats | Terminal, JSON, Markdown |
| CI platforms | GitHub Actions (`.github/workflows/ci.yml` included), any CLI-capable pipeline |

## Deployment (CI)

Add to your CI pipeline:

```bash
regtrace run --format json --output results.json
# Exit code 0 = all quality gates pass
# Exit code 1 = one or more gates fail
```

Full `.github/workflows/ci.yml` template is included in the repo.

## Security & Privacy

- **No telemetry.** Regtrace never phones home.
- **Data stays local** by default. LLM-judged metrics (factuality deep mode, tone) send response text to the configured provider. All other metrics are deterministic and run locally.
- **API keys** read from `.env` or environment variables — never stored in config or golden set files.
- **Binary is self-contained.** No runtime dependencies, no npm install on target machines.

## Known limitations

LLM-as-judge evaluation has known biases — verbosity bias, self-preference,
position bias. Regtrace mitigates these with deterministic fallbacks,
confidence scoring, and honest documentation. See
[Limitations & Caveats](https://regtrace-docs.vercel.app/docs/explanation/limitations) for
details.

## Agent Skill

`skills/regtrace/` is an agent skill that teaches AI coding agents how
to use the regtrace CLI — golden sets, evaluation, regression detection,
and CI integration. Agents load this skill when a user asks about LLM
output quality or regtrace commands.

## Support

- [GitHub Issues](https://github.com/decimozs/regtrace/issues) — bug reports, feature requests
- [Documentation](https://regtrace-docs.vercel.app/docs/) — tutorials, how-to guides, reference

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for repo setup, build steps, test commands, and release process.

## License

MIT. See [LICENSE](LICENSE).
