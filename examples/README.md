# Regtrace Examples

Collection of ready-to-run Regtrace configurations across different evaluation
patterns. Each category runs differently — choose based on your needs.

## Quick start

```bash
# Zero-setup: works immediately, no API key
cd code-generation
regtrace run

# Generate mode: needs ANTHROPIC_API_KEY in .env
cd customer-support
regtrace run --generate
```

---

## Categories

| Category | API key? | Command | Examples |
|---|---|---|---|
| **A: Zero-Setup** | No | `regtrace run` | code-generation, content-moderation, intent-classification, data-extraction |
| **B: Generate Mode** | Yes (Anthropic) | `regtrace run --generate` | customer-support, email-drafting, translation, summarization |
| **C: LLM Judge Eval** | Yes (Anthropic) | `regtrace run` | content-generation, rag-documentation |
| **D: Advanced Config** | Yes (Anthropic) | `regtrace run --generate` or `regtrace run` | rag-legal, rag-product |

### A: Zero-Setup

Deterministic format evaluation — no LLM calls. Tests structure, JSON validity,
forbidden content, and field presence. Useful for CI pipelines without API keys.

| Example | Format sub_checks | Scenario |
|---|---|---|
| [code-generation](./code-generation/README.md) | markdown_structure, required_fields, forbidden_content | AI-assisted code review |
| [content-moderation](./content-moderation/README.md) | required_fields, forbidden_content, length | Content filtering decisions |
| [intent-classification](./intent-classification/README.md) | json_validity, json_schema | Structured intent routing |
| [data-extraction](./data-extraction/README.md) | json_validity, json_schema | Invoice data extraction |

### B: Generate Mode

Regtrace calls Claude to produce `actual_output` from each test case `input`,
then evaluates against `expected_output`. Demonstrates end-to-end LLM evaluation
with zero manual output creation.

| Example | Metrics | What gets generated |
|---|---|---|
| [customer-support](./customer-support/README.md) | format | Support email responses |
| [email-drafting](./email-drafting/README.md) | format, tone | Sales & support emails |
| [translation](./translation/README.md) | format | Spanish product descriptions |
| [summarization](./summarization/README.md) | format | News article summaries |

### C: LLM Judge Evaluation

Uses the LLM judge for deeper evaluation — tone analysis, factuality verification.
Outputs are pre-provided; the judge scores them against expected quality.

| Example | Enabled metrics | What the judge evaluates |
|---|---|---|
| [content-generation](./content-generation/README.md) | format, tone | Brand voice consistency |
| [rag-documentation](./rag-documentation/README.md) | format, factuality | RAG faithfulness to API docs |

### D: Advanced Config

Showcases Regtrace's deeper configuration options — strict factuality, per-metric
quality gates, RAG + generate mode.

| Example | Pattern | Config highlight |
|---|---|---|
| [rag-legal](./rag-legal/README.md) | Strict factuality + per-metric gates | `factuality.mode: strict`, `metric_score_minimums` |
| [rag-product](./rag-product/README.md) | Generate mode + RAG context | `interaction_type: rag` + `generator` block |

---

## Adding API keys

Create a `.env` file in the example directory:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

All LLM-powered examples use Claude (`claude-haiku-4-5-20251001`) by default.
No other provider keys needed.
