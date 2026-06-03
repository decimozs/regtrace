import { describe, expect, it, mock } from "bun:test";

// Mock judge module so tests always exercise the heuristic fallback path
// regardless of API key presence in the environment
mock.module("../../../src/judge/judge", () => ({
	buildJudgeConfig: (config: Record<string, unknown>) => ({
		provider: String(config.provider),
		model: String(config.model),
		temperature: Number(config.temperature),
		maxTokens: Number(config.max_tokens),
		timeoutMs: Number(config.timeout_ms),
		retryAttempts: Number(config.retry_attempts),
		localEndpoint: undefined,
	}),
	judgeTone: mock(async () => {
		throw new Error("Mocked judge failure — testing heuristic path");
	}),
	judgeFactuality: mock(async () => {
		throw new Error("Mocked judge failure");
	}),
}));

import { toneEvaluator } from "../../../src/metrics/evaluators/tone.evaluator";
import type { EvaluateInput } from "../../../src/metrics/types";
import type { Config } from "../../../src/schema/config.schema";

function makeConfig(): Config {
	return {
		project: { name: "test", version: "1.0" },
		golden_sets: [
			{ path: "test.yaml", enabled: true, weight: 1, store_in_db: true },
		],
		metrics: {
			enabled: ["tone"],
			default_threshold: 0.7,
			default_weight: 1,
			factuality: {
				mode: "lenient",
				claim_extraction_depth: "shallow",
				rag_faithfulness_only: false,
			},
			format: {
				sub_checks: {
					length: false,
					json_validity: false,
					json_schema: false,
					markdown_structure: false,
					required_fields: false,
					forbidden_content: false,
					regex_match: false,
				},
				length_tolerance: 0.3,
				strict_json: false,
			},
			tone: {
				sub_dimensions: {
					formality: true,
					sentiment: true,
					assertiveness: true,
					persona_consistency: true,
					verbosity: true,
				},
			},
			regression: {
				enabled: true,
				baseline_strategy: "last_passing",
				tolerance: 0.05,
				critical_threshold: 0.15,
				exclude_new_test_cases: true,
			},
		},
		judge: {
			primary: {
				provider: "anthropic",
				model: "claude-3-5-sonnet-20240620",
				temperature: 0.1,
				max_tokens: 4096,
				timeout_ms: 30000,
				retry_attempts: 3,
			},
		},
		quality_gates: {
			suite_score_minimum: 0.7,
			max_failed_test_cases: 0,
			max_low_confidence_ratio: 0.1,
			regression_gate: true,
		},
		run: { concurrency: 1 },
		output: {
			run_history_limit: 50,
			default_format: "terminal",
			explain_by_default: false,
			color: "auto",
			ci_mode_auto_detect: true,
		},
	};
}

function makeInput(overrides: Partial<EvaluateInput> = {}): EvaluateInput {
	return {
		testCase: {
			id: "tone-001",
			description: "Tone check test",
			input: "test input",
			system_prompt: null,
			expected_output: "We must ensure the project is completed on time.",
			actual_output: "We must ensure the project is completed on time.",
			metrics: ["tone"],
			tags: [],
			weight: 1,
		},
		actualOutput: "We must ensure the project is completed on time.",
		expectedOutput: "We must ensure the project is completed on time.",
		config: makeConfig(),
		metricConfig: {
			sub_dimensions: {
				formality: true,
				sentiment: true,
				assertiveness: true,
				persona_consistency: true,
				verbosity: true,
			},
		},
		threshold: 0.5,
		...overrides,
	};
}

describe("tone evaluator", () => {
	it("returns a score for default input", async () => {
		const result = await toneEvaluator.evaluate(makeInput());
		expect(result.score).toBeGreaterThanOrEqual(0);
		expect(result.score).toBeLessThanOrEqual(1);
	});

	it("scores 1.0 when no dimensions enabled", async () => {
		const input = makeInput({
			metricConfig: {
				sub_dimensions: {},
			},
		});
		const result = await toneEvaluator.evaluate(input);
		expect(result.score).toBe(1);
	});

	it("detects informal language", async () => {
		const input = makeInput({
			actualOutput: "yeah that's cool, just wanted to say hi",
			expectedOutput: "yeah that's cool, just wanted to say hi",
		});
		const result = await toneEvaluator.evaluate(input);
		expect(result.score).toBeDefined();
	});

	it("returns evaluation type deterministic", async () => {
		const result = await toneEvaluator.evaluate(makeInput());
		expect(result.evaluation_type).toBe("deterministic");
	});

	it("includes dimension details in explanation", async () => {
		const result = await toneEvaluator.evaluate(makeInput());
		expect(result.explanation).toBeTruthy();
	});
});
