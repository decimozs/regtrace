import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

import { runCommand } from "../../../src/cli/run.command";

const tempDirs: string[] = [];

beforeEach(() => {
	process.env.OPENAI_API_KEY = "sk-test-openai";
	process.env.GROQ_API_KEY = "gsk-test-groq";
});

afterEach(() => {
	delete process.env.OPENAI_API_KEY;
	delete process.env.GROQ_API_KEY;
});

afterAll(() => {
	for (const dir of tempDirs) {
		try {
			rmSync(dir, { recursive: true, force: true });
		} catch {
			// ignore
		}
	}
});

function tmpDir(): string {
	const d = resolve(
		import.meta.dirname ?? ".",
		"../../.test-tmp",
		`gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
	);
	mkdirSync(d, { recursive: true });
	tempDirs.push(d);
	return d;
}

function writeFiles(
	dir: string,
	config: string,
	goldenSet: string,
): { configPath: string } {
	const cfgPath = resolve(dir, "regtrace.config.yaml");
	writeFileSync(cfgPath, config, "utf-8");
	const gsDir = resolve(dir, "golden-sets");
	mkdirSync(gsDir, { recursive: true });
	writeFileSync(resolve(gsDir, "test.yaml"), goldenSet, "utf-8");
	return { configPath: cfgPath };
}

function latestRecord(dir: string): Record<string, unknown> | null {
	const runsDir = resolve(dir, ".regtrace", "runs");
	if (!existsSync(runsDir)) return null;
	const files = readdirSync(runsDir)
		.filter((f) => f.endsWith(".json"))
		.sort()
		.reverse();
	if (files.length === 0) return null;
	const latest = files[0];
	if (!latest) return null;
	return JSON.parse(readFileSync(resolve(runsDir, latest), "utf-8"));
}

const GEN_CONFIG = (generateProvided = false) => `project:
  name: gen-test
  version: "1.0"
golden_sets:
  - path: golden-sets/test.yaml
    enabled: true
metrics:
  default_threshold: 0.7
  factuality:
    mode: strict
    claim_extraction_depth: shallow
    rag_faithfulness_only: false
  format:
    sub_checks:
      length: true
      json_validity: false
      json_schema: false
      markdown_structure: false
      required_fields: false
      forbidden_content: false
      regex_match: false
    length_tolerance: 0.5
    strict_json: false
  tone:
    sub_dimensions:
      formality: false
      sentiment: false
      assertiveness: false
      persona_consistency: false
      verbosity: false
  regression:
    enabled: false
    baseline_strategy: last_passing
    tolerance: 0.05
    critical_threshold: 0.15
    exclude_new_test_cases: true
judge:
  primary:
    provider: openai
    model: gpt-4o-mini
    temperature: 0.1
    max_tokens: 4096
    timeout_ms: 5000
    retry_attempts: 0
${
	generateProvided
		? `generator:
    provider: groq
    model: llama-3.3-70b-versatile
    temperature: 0.7
    max_tokens: 4096
    timeout_ms: 30000
    retry_attempts: 0
`
		: ""
}run:
  concurrency: 1
quality_gates:
  suite_score_minimum: 0.0
  max_failed_test_cases: 5
  max_low_confidence_ratio: 1.0
  regression_gate: false
output:
  run_history_limit: 50
  default_format: terminal
  color: never
  ci_mode_auto_detect: false
`;

const NULL_OUTPUT_GS = `name: gen-test-gs
version: "1.0"
description: Generate test
interaction_type: single_turn
tags: [test]
author: test
created_at: "2026-01-01"
updated_at: "2026-01-01"
test_cases:
  - id: gen-001
    description: Capital of France
    input: "What is the capital of France?"
    system_prompt: null
    expected_output: "The capital of France is Paris."
    actual_output: null
    metrics: [format]
    tags: []
    weight: 1
`;

describe("run --generate", () => {
	it("generates output for null test cases when --generate is set", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, GEN_CONFIG(false), NULL_OUTPUT_GS);

		globalThis.fetch = Object.assign(
			async (_request: Request | URL | string, _init?: RequestInit) =>
				new Response(
					JSON.stringify({
						choices: [
							{
								message: {
									content: "The capital of France is Paris.",
								},
							},
						],
						usage: { prompt_tokens: 20, completion_tokens: 10 },
					}),
					{ status: 200 },
				),
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		await runCommand({
			config: configPath,
			generate: true,
			trigger: "cli",
		});

		const record = latestRecord(dir);
		expect(record).not.toBeNull();
		expect(record?.golden_set_name).toBe("gen-test-gs");
		expect(Array.isArray(record?.test_case_results)).toBe(true);
		const result = (record?.test_case_results as Record<string, unknown>[])[0];
		expect(result?.actual_output).toBe("The capital of France is Paris.");
	});

	it("does not generate output when --generate is not set", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, GEN_CONFIG(false), NULL_OUTPUT_GS);

		/// Capture whether fetch was called
		let fetchCalled = false;
		const origFetch = globalThis.fetch;
		globalThis.fetch = Object.assign(
			async () => {
				fetchCalled = true;
				return new Response("{}", { status: 200 });
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		await runCommand({
			config: configPath,
			trigger: "cli",
		});

		/// A null actual_output with no --generate will result in empty string for format check
		expect(fetchCalled).toBe(false);

		const record = latestRecord(dir);
		expect(record).not.toBeNull();
		expect(record?.golden_set_name).toBe("gen-test-gs");

		globalThis.fetch = origFetch;
	});

	it("uses generator config when provided instead of judge.primary", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, GEN_CONFIG(true), NULL_OUTPUT_GS);

		let requestUrl = "";
		globalThis.fetch = Object.assign(
			async (request: Request | URL | string) => {
				requestUrl = typeof request === "string" ? request : request.toString();
				return new Response(
					JSON.stringify({
						choices: [{ message: { content: "Generated by Groq" } }],
						usage: { prompt_tokens: 10, completion_tokens: 5 },
					}),
					{ status: 200 },
				);
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		await runCommand({
			config: configPath,
			generate: true,
			trigger: "cli",
		});

		/// Should call Groq API (from generator block) not OpenAI (from judge.primary)
		expect(requestUrl).toContain("groq");

		const record = latestRecord(dir);
		expect(record).not.toBeNull();
		const result = (record?.test_case_results as Record<string, unknown>[])[0];
		expect(result?.actual_output).toBe("Generated by Groq");
	});
});
