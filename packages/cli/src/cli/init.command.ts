import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { printError, printHeader, printSuccess } from "./print";

const DEFAULT_CONFIG = `# regtrace configuration
project:
  name: my-project
  version: "1.0"
  description: My LLM evaluation project

golden_sets:
  - path: golden-sets/qa.yaml
    enabled: true

metrics:
  default_threshold: 0.7
  factuality:
    mode: lenient
    claim_extraction_depth: shallow
    rag_faithfulness_only: false
  format:
    sub_checks:
      length: true
      json_validity: true
      json_schema: true
      markdown_structure: true
      required_fields: true
      forbidden_content: true
      regex_match: true
    length_tolerance: 0.2
    strict_json: false
  tone:
    sub_dimensions:
      formality: true
      sentiment: true
      assertiveness: true
      persona_consistency: true
      verbosity: true
  regression:
    enabled: true
    baseline_strategy: last_passing
    tolerance: 0.05
    critical_threshold: 0.15
    exclude_new_test_cases: true

judge:
  primary:
    provider: anthropic
    model: claude-haiku-4-5-20251001
    temperature: 0.1
    max_tokens: 4096
    timeout_ms: 30000
    retry_attempts: 3

run:
  concurrency: 1

quality_gates:
  suite_score_minimum: 0.7
  max_failed_test_cases: 0
  max_low_confidence_ratio: 0.1
  regression_gate: true

output:
  run_history_limit: 50
  default_format: terminal
  color: auto
  ci_mode_auto_detect: true
`;

const DEFAULT_ENV_EXAMPLE = `# API keys for LLM providers (at least one required)
# You can also set these in your shell environment.

# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-proj-...
# GROQ_API_KEY=gsk_...
# GEMINI_API_KEY=...
`;

const DEFAULT_GOLDEN_SET = `name: my-qa-set
version: "1.0.0"
description: My QA test cases
interaction_type: single_turn
tags: [qa, general]
author: anonymous
created_at: "2026-01-01"
updated_at: "2026-01-01"
test_cases:
  - id: qa-001
    description: Basic question about the capital of France
    input: "What is the capital of France?"
    system_prompt: null
    expected_output: "The capital of France is Paris."
    actual_output: null
    metrics: [factuality, format, tone]
    tags: [geography]
    weight: 1

  - id: qa-002
    description: Question about the population of Paris
    input: "What is the population of Paris?"
    system_prompt: null
    expected_output: "Paris has a population of approximately 2.1 million people within the city limits."
    actual_output: null
    metrics: [factuality, format]
    tags: [geography, demographics]
    weight: 1
`;

interface InitOptions {
	dir?: string;
	force?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
	const targetDir = options.dir ? resolve(options.dir) : process.cwd();
	const configPath = resolve(targetDir, "regtrace.config.yaml");
	const goldenSetDir = resolve(targetDir, "golden-sets");
	const goldenSetPath = resolve(goldenSetDir, "qa.yaml");
	const envExamplePath = resolve(targetDir, ".env.example");

	printHeader("regtrace init");

	if (!options.force) {
		const existing = [configPath, goldenSetPath].filter((p) => existsSync(p));
		if (existing.length > 0) {
			printError(
				`Files already exist: ${existing.join(", ")}. Use --force to overwrite.`,
			);
			process.exit(2);
		}
	}

	await mkdir(targetDir, { recursive: true });
	await mkdir(goldenSetDir, { recursive: true });
	await mkdir(resolve(targetDir, ".regtrace", "runs"), { recursive: true });

	await writeFile(configPath, DEFAULT_CONFIG);
	await writeFile(goldenSetPath, DEFAULT_GOLDEN_SET);
	await writeFile(envExamplePath, DEFAULT_ENV_EXAMPLE);
	await writeFile(resolve(targetDir, ".gitignore"), ".regtrace/\n.env*\n");
	await mkdir(resolve(targetDir, ".regtrace", "runs"), { recursive: true });

	printSuccess(`Created ${configPath}`);
	printSuccess(`Created ${goldenSetPath}`);
	printSuccess(`Created ${envExamplePath}`);
	printSuccess(`Created ${resolve(targetDir, ".gitignore")}`);
	printSuccess(`Created ${resolve(targetDir, ".regtrace", "runs")}/`);
	console.log();
	printSuccess("Project initialized!");
	printSuccess("Next steps:");
	printSuccess("  1. Set API keys in .env (copy from .env.example)");
	printSuccess("  2. Edit golden-sets/qa.yaml with your test cases");
	printSuccess("  3. Run `regtrace run` or `regtrace run --generate`");
}
