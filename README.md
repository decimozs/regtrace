<img width="1920" height="1080" alt="Regtrace Banner" src="https://github.com/user-attachments/assets/51011e21-8328-4d58-8512-bedab56a55a0" />

<p align="center">
  <a href="https://github.com/decimozs/regtrace/actions/workflows/ci.yml"><img src="https://github.com/decimozs/regtrace/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/decimozs/regtrace/releases"><img src="https://img.shields.io/github/v/release/decimozs/regtrace" alt="Latest Release"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

LLM quality degrades silently. A prompt change, a model update, a new feature — any of it can quietly break outputs that used to work.

Regtrace gives you golden sets, multi-dimensional scoring, and baseline comparison so you catch drift **before your users do**.

## Quick Start

```bash
# Install
curl -L https://github.com/decimozs/regtrace/releases/latest/download/regtrace-linux-x64 -o regtrace
chmod +x regtrace
sudo mv regtrace /usr/local/bin/

# Create project, fill outputs, run
regtrace init
regtrace run --generate
```

Deterministic metrics (format checks, word overlap) work without an API key.
LLM-judged metrics (factuality deep, tone) need one — set via `.env` or env vars.

| Platform | Install |
|----------|---------|
| Linux x64 | `curl -LO .../regtrace-linux-x64 && chmod +x regtrace && sudo mv regtrace /usr/local/bin/` |
| macOS ARM64 | `curl -LO .../regtrace-darwin-arm64 && chmod +x regtrace && sudo mv regtrace /usr/local/bin/` |
| Windows | `curl -LO .../regtrace-windows-x64.exe` — move to `%PATH%` |

> Already installed? `regtrace upgrade`

## Why Regtrace?

| Tool | Interface | Deployment | Regression | Config |
|------|-----------|------------|------------|--------|
| **Promptfoo** | CLI + Web UI | Node.js + cloud | Manual diff | JS/TS, YAML |
| **Braintrust** | Web UI + SDK | Cloud/SaaS | Experiment tracking | Python SDK |
| **LangSmith** | Monitoring, traces, eval | Cloud/SaaS | Platform-level | Python/JS SDK |
| **DeepEval** | Library | Python lib | Pytest plugin | Python decorators |
| **RAGAS** | RAG-specific eval | Python lib | No built-in | Python API |
| **Regtrace** | CLI-first | Standalone binary | Automatic, always-on, gates CI | Declarative YAML |

**CLI-first.** Evaluation should be a version-controlled pipeline step, not a dashboard you log into.

**Zero deps.** Standalone binary — no Python, Node, or Docker.

**Always-on regression.** Every run compared to baseline. CI gates fail on drift.

**No vendor lock-in.** Pluggable judge providers: Anthropic, OpenAI, Groq, Gemini, Ollama.

## CI Integration

Add to `.github/workflows/regtrace.yml`:

```yaml
name: LLM Quality Gate
on: [pull_request]
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download regtrace
        run: |
          curl -L https://github.com/decimozs/regtrace/releases/latest/download/regtrace-linux-x64 -o /usr/local/bin/regtrace
          chmod +x /usr/local/bin/regtrace
      - name: Evaluate
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          regtrace run --format json --output results.json
          # 0 = pass, 1 = gate failure, 2 = config error
```

## Key Features

- **4 quality gates** — suite score, max failures, regression status, NFR (latency / cost / coverage). AND-composed: all must pass.
- **Factuality** — LLM-as-judge (shallow heuristic or deep LLM). Auto-detects JSON output and runs structural comparison.
- **Format** — deterministic checks: JSON schema, required fields, regex, length, markdown, forbidden content.
- **Tone** — profile across formality, sentiment, assertiveness, persona, verbosity. Deterministic fallback.
- **Regression detection** — compare against baselines with per-metric tolerance. Stale baseline warnings.
- **Branch-aware baselines** — per-branch baselines with fallback chain.
- **NFR enforcement** — gate on `max_latency_ms`, `max_cost_usd`, `min_coverage`.
- **Generate mode** — `--generate` auto-fills outputs from LLM, skipping manual golden set authoring.
- **Parallel evaluation** — configurable concurrency (default 4).
- **Fallback judge** — secondary provider with exponential backoff + jitter.
- **Watch mode** — `regtrace watch` re-runs on file changes.

## Commands

| Command | Description |
|---|---|
| `regtrace init` | Scaffold a new project |
| `regtrace run` | Evaluate all golden sets |
| `regtrace run --generate` | Auto-fill null outputs from LLM, then evaluate |
| `regtrace run --dry-run` | Validate config without spending tokens |
| `regtrace list` | List recent run history |
| `regtrace history --run-id <id>` | Show detailed run results |
| `regtrace history --diff <a> [b]` | Compare two runs |
| `regtrace baseline pin <run-id>` | Pin regression baseline |
| `regtrace scaffold` | Create golden sets from existing run records or output files |
| `regtrace watch` | Re-run on golden set changes |
| `regtrace upgrade` | Update to the latest release |

All commands support `--config` for custom config paths.

## Security & Privacy

- **No telemetry.** Regtrace never phones home.
- **Data stays local.** LLM-judged metrics send response text to your configured provider. All other metrics run locally.
- **API keys** from `.env` or env vars — never stored in config or golden set files.
- **Self-contained binary.** No runtime dependencies, no npm install.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features: cost tracking, offline evaluation, SARIF output, Homebrew/npm/apt distribution.

## Agent Skill

`skills/regtrace/` teaches AI coding agents how to use regtrace — golden sets, evaluation, regression, CI integration.

## Launch links

- [Product Hunt](https://www.producthunt.com/p/regtrace)
- [Dev.to: "I broke a chatbot with a prompt change — then I built the tool that would've caught it"](https://dev.to/decimozs/i-broke-a-chatbot-with-a-prompt-change-then-i-built-the-tool-that-wouldve-caught-it-m1g)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, build, test, and release process.

## License

MIT.
