import { describe, expect, it } from "bun:test";
import { formatEvaluator } from "../../../src/metrics/evaluators/format.evaluator";
import type { EvaluateInput } from "../../../src/metrics/types";
import type { Config } from "../../../src/schema/config.schema";
import type { TestCase } from "../../../src/schema/golden-set.schema";

function makeConfig(): Config {
	return {
		project: { name: "test", version: "1.0" },
		golden_sets: [
			{ path: "test.yaml", enabled: true, weight: 1, store_in_db: true },
		],
		metrics: {
			enabled: ["format"],
			default_threshold: 0.7,
			default_weight: 1,
			factuality: {
				mode: "lenient",
				claim_extraction_depth: "shallow",
				rag_faithfulness_only: false,
			},
			format: {
				sub_checks: {
					length: true,
					json_validity: true,
					json_schema: true,
					markdown_structure: false,
					required_fields: false,
					forbidden_content: true,
					regex_match: false,
				},
				length_tolerance: 0.3,
				strict_json: false,
			},
			tone: {
				sub_dimensions: {
					formality: false,
					sentiment: false,
					assertiveness: false,
					persona_consistency: false,
					verbosity: false,
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
			id: "fmt-001",
			description: "Format check test",
			input: "test input",
			system_prompt: null,
			expected_output: '{"key": "value"}',
			actual_output: '{"key": "value"}',
			metrics: ["format"],
			tags: [],
			weight: 1,
		} as TestCase,
		actualOutput: '{"key": "value"}',
		expectedOutput: '{"key": "value"}',
		config: makeConfig(),
		metricConfig: {
			sub_checks: {
				length: true,
				json_validity: true,
				json_schema: true,
				markdown_structure: false,
				required_fields: false,
				forbidden_content: true,
				regex_match: false,
			},
			length_tolerance: 0.3,
			strict_json: false,
		},
		threshold: 0.7,
		...overrides,
	};
}

describe("format evaluator", () => {
	it("passes valid JSON with matching structure", async () => {
		const result = await formatEvaluator.evaluate(makeInput());
		expect(result.passed).toBe(true);
		expect(result.score).toBeGreaterThanOrEqual(0.7);
	});

	it("fails invalid JSON when json_validity enabled", async () => {
		const input = makeInput({
			actualOutput: "not valid json",
			expectedOutput: "not valid json",
		});
		const result = await formatEvaluator.evaluate(input);
		expect(result.score).toBeLessThan(0.7);
	});

	it("detects forbidden content patterns", async () => {
		const input = makeInput({
			actualOutput: "I'm sorry, I cannot help with that request",
			expectedOutput: "I'm sorry, I cannot help with that request",
		});
		const result = await formatEvaluator.evaluate(input);
		expect(result.explanation).toContain("forbidden_content");
	});

	it("returns 1.0 when no sub-checks enabled", async () => {
		const input = makeInput({
			metricConfig: {
				sub_checks: {},
			},
		});
		const result = await formatEvaluator.evaluate(input);
		expect(result.score).toBe(1);
		expect(result.passed).toBe(true);
	});

	it("handles JSON structure comparison mismatch", async () => {
		const input = makeInput({
			actualOutput: '{"name": "test"}',
			expectedOutput: '{"key": "value"}',
		});
		const result = await formatEvaluator.evaluate(input);
		expect(result.explanation).toContain("json_schema");
	});
});
