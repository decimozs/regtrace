import { afterAll, describe, expect, it } from "bun:test";
import {
	type EvaluateSuiteParams,
	type EvaluateTestCaseParams,
	evaluateSuite,
	evaluateTestCase,
} from "../../../src/metrics/runner";
import type { Config } from "../../../src/schema/config.schema";

// Clear API keys so judge calls throw → evaluators use heuristic fallback
process.env.ANTHROPIC_API_KEY = "";
process.env.OPENAI_API_KEY = "";
process.env.GROQ_API_KEY = "";
process.env.GEMINI_API_KEY = "";

afterAll(() => {
	delete process.env.ANTHROPIC_API_KEY;
	delete process.env.OPENAI_API_KEY;
	delete process.env.GROQ_API_KEY;
	delete process.env.GEMINI_API_KEY;
});

const MINIMAL_CONFIG: Config = {
	project: { name: "test", version: "1.0" },
	golden_sets: [
		{ path: "test.yaml", enabled: true, weight: 1, store_in_db: true },
	],
	metrics: {
		enabled: ["factuality", "format", "tone"],
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
	run: { concurrency: 1 },
	quality_gates: {
		suite_score_minimum: 0.7,
		max_failed_test_cases: 0,
		max_low_confidence_ratio: 0.1,
		regression_gate: true,
	},
	output: {
		run_history_limit: 50,
		default_format: "terminal",
		explain_by_default: false,
		color: "auto",
		ci_mode_auto_detect: true,
	},
};

function makeTestCaseParams(
	overrides: Partial<EvaluateTestCaseParams> = {},
): EvaluateTestCaseParams {
	return {
		testCase: {
			id: "tc-001",
			description: "Test case",
			input: "test input",
			system_prompt: null,
			expected_output: "The expected answer is forty two.",
			actual_output: null,
			metrics: ["factuality", "format", "tone"],
			tags: [],
			weight: 1,
		},
		actualOutput: "The expected answer is forty two.",
		expectedOutput: "The expected answer is forty two.",
		config: MINIMAL_CONFIG,
		baselineRecord: null,
		currentGoldenSetVersion: "1.0.0",
		...overrides,
	};
}

describe("metrics runner", () => {
	it("evaluates a single test case with all metrics", async () => {
		const result = await evaluateTestCase(makeTestCaseParams());
		expect(result.testCaseResult.test_case_id).toBe("tc-001");
		expect(
			Object.keys(result.testCaseResult.metric_results).length,
		).toBeGreaterThan(0);
	});

	it("marks passed when all metrics meet threshold", async () => {
		const result = await evaluateTestCase(makeTestCaseParams());
		expect(result.testCaseResult.overall_passed).toBe(true);
		expect(result.testCaseResult.severity).toBe("pass");
	});

	it("marks failed when metrics fall below threshold", async () => {
		const params = makeTestCaseParams({
			actualOutput: "completely unrelated content here",
		});
		const result = await evaluateTestCase(params);
		expect(result.testCaseResult.overall_passed).toBe(false);
	});

	it("calculates aggregate score from all metrics", async () => {
		const result = await evaluateTestCase(makeTestCaseParams());
		expect(result.aggregateScore).toBeGreaterThanOrEqual(0);
		expect(result.aggregateScore).toBeLessThanOrEqual(1);
	});

	it("includes regression metric when configured", async () => {
		const params = makeTestCaseParams({
			testCase: {
				id: "tc-002",
				description: "Regression test",
				input: "test",
				system_prompt: null,
				expected_output: "answer",
				actual_output: null,
				metrics: ["factuality", "regression"],
				tags: [],
				weight: 1,
			},
			baselineRecord: {
				run_id: "baseline-001",
				golden_set_version: "1.0.0",
				suite_score: 0.9,
				metric_summary: {
					factuality: { score: 0.9, pass_rate: 1.0 },
				},
			},
		});
		const result = await evaluateTestCase(params);
		expect(result.testCaseResult.metric_results.regression).toBeDefined();
	});
});

describe("evaluateSuite", () => {
	it("evaluates a single test case and produces suite score", async () => {
		const params: EvaluateSuiteParams = {
			config: MINIMAL_CONFIG,
			testCases: [
				makeTestCaseParams({
					testCase: { ...makeTestCaseParams().testCase, id: "tc-001" },
				}),
			],
		};
		const result = await evaluateSuite(params);
		expect(result.suiteScore).toBeGreaterThanOrEqual(0);
		expect(result.suiteScore).toBeLessThanOrEqual(1);
		expect(result.testCaseResults).toHaveLength(1);
	});

	it("produces metric summary across test cases", async () => {
		const params: EvaluateSuiteParams = {
			config: MINIMAL_CONFIG,
			testCases: [
				makeTestCaseParams({
					testCase: { ...makeTestCaseParams().testCase, id: "tc-001" },
				}),
			],
		};
		const result = await evaluateSuite(params);
		const fact = result.metricSummary.factuality;
		expect(fact).toBeDefined();
		expect(fact?.score).toBeGreaterThanOrEqual(0);
	});

	it("runs multiple test cases concurrently in a single batch", async () => {
		const config = { ...MINIMAL_CONFIG, run: { concurrency: 3 } };
		const params: EvaluateSuiteParams = {
			config,
			testCases: [
				makeTestCaseParams({
					testCase: { ...makeTestCaseParams().testCase, id: "tc-a" },
				}),
				makeTestCaseParams({
					testCase: { ...makeTestCaseParams().testCase, id: "tc-b" },
				}),
				makeTestCaseParams({
					testCase: { ...makeTestCaseParams().testCase, id: "tc-c" },
				}),
			],
		};
		const result = await evaluateSuite(params);
		expect(result.testCaseResults).toHaveLength(3);
	});
});
