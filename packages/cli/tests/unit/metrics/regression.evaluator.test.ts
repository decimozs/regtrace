import { describe, expect, it } from "bun:test";
import type { BaselineRecord } from "../../../src/metrics/evaluators/regression.evaluator";
import {
	buildRegressionBlock,
	regressionEvaluator,
} from "../../../src/metrics/evaluators/regression.evaluator";
import type { EvaluateInput } from "../../../src/metrics/types";
import type { MetricResult } from "../../../src/schema/run-record.schema";

function makeBaselineRecord(
	overrides: Partial<BaselineRecord> = {},
): BaselineRecord {
	return {
		run_id: "run_baseline_001",
		golden_set_version: "1.0.0",
		suite_score: 0.85,
		metric_summary: {
			factuality: { score: 0.9, pass_rate: 1.0 },
			format: { score: 0.8, pass_rate: 0.9 },
		},
		...overrides,
	};
}

function makeMetricResult(score: number): MetricResult {
	return {
		metric_name: "test_metric",
		score,
		confidence: 1,
		passed: score >= 0.7,
		threshold: 0.7,
		explanation: "test",
		evaluation_type: "deterministic",
		token_cost: 0,
	};
}

describe("buildRegressionBlock", () => {
	const defaultConfig = {
		tolerance: 0.05,
		criticalThreshold: 0.15,
		excludeNewTestCases: true,
	};

	it("returns clean block with null values when no baseline", () => {
		const result = buildRegressionBlock(
			null,
			"1.0.0",
			0.85,
			{ factuality: makeMetricResult(0.9) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.baseline_run_id).toBeNull();
		expect(result.baseline_golden_set_version).toBeNull();
		expect(result.suite_delta).toBe(0);
		expect(result.regression_status).toBe("clean");
		expect(result.test_cases_excluded).toEqual([]);
		expect(result.metric_deltas).toEqual({});
		expect(result.version_change_detected).toBe(false);
	});

	it("computes positive suite delta for improvement", () => {
		const baseline = makeBaselineRecord({ suite_score: 0.8 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.9,
			{ factuality: makeMetricResult(0.95) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.suite_delta).toBeCloseTo(0.125);
		expect(result.baseline_run_id).toBe("run_baseline_001");
	});

	it("computes negative suite delta for regression", () => {
		const baseline = makeBaselineRecord({ suite_score: 0.9 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.72,
			{ factuality: makeMetricResult(0.8) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.suite_delta).toBeCloseTo(-0.2);
	});

	it("returns zero delta for identical scores", () => {
		const baseline = makeBaselineRecord({ suite_score: 0.85 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.85,
			{ factuality: makeMetricResult(0.9) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.suite_delta).toBe(0);
	});

	it("handles baseline suite_score of zero", () => {
		const baseline = makeBaselineRecord({ suite_score: 0 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.5,
			{ factuality: makeMetricResult(0.9) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.suite_delta).toBe(1);
	});

	it("handles both baseline and current score of zero", () => {
		const baseline = makeBaselineRecord({ suite_score: 0 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0,
			{ factuality: makeMetricResult(0.9) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.suite_delta).toBe(0);
	});

	it("detects golden set version change", () => {
		const baseline = makeBaselineRecord({ golden_set_version: "1.0.0" });
		const result = buildRegressionBlock(
			baseline,
			"2.0.0",
			0.85,
			{ factuality: makeMetricResult(0.9) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.version_change_detected).toBe(true);
	});

	it("does not detect version change when versions match", () => {
		const baseline = makeBaselineRecord({ golden_set_version: "1.0.0" });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.85,
			{ factuality: makeMetricResult(0.9) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.version_change_detected).toBe(false);
	});

	it("excludes new test cases when excludeNewTestCases is true", () => {
		const baseline = makeBaselineRecord({
			metric_summary: {
				factuality: { score: 0.9, pass_rate: 1.0 },
			},
		});
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.85,
			{ factuality: makeMetricResult(0.9), format: makeMetricResult(0.8) },
			["new-tc-001", "new-tc-002"],
			defaultConfig,
		);

		expect(result.test_cases_excluded).toContain("new-tc-001");
		expect(result.test_cases_excluded).toContain("new-tc-002");
	});

	it("does not exclude test cases when excludeNewTestCases is false", () => {
		const baseline = makeBaselineRecord({
			metric_summary: {
				factuality: { score: 0.9, pass_rate: 1.0 },
			},
		});
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.85,
			{ factuality: makeMetricResult(0.9) },
			["new-tc-001"],
			{ ...defaultConfig, excludeNewTestCases: false },
		);

		expect(result.test_cases_excluded).toEqual([]);
	});

	it("computes per-metric deltas for metrics present in both", () => {
		const baseline = makeBaselineRecord({
			metric_summary: {
				factuality: { score: 0.9, pass_rate: 1.0 },
				format: { score: 0.8, pass_rate: 0.9 },
			},
		});
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.85,
			{
				factuality: makeMetricResult(0.95),
				format: makeMetricResult(0.7),
			},
			["tc-001"],
			defaultConfig,
		);

		expect(result.metric_deltas.factuality).toBeCloseTo(0.0556, 3);
		expect(result.metric_deltas.format).toBeCloseTo(-0.125, 3);
	});

	it("returns delta 0 for metrics not in baseline", () => {
		const baseline = makeBaselineRecord({
			metric_summary: {},
		});
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.85,
			{ tone: makeMetricResult(0.8) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.metric_deltas.tone).toBe(0);
	});

	it("returns clean for delta within tolerance", () => {
		const baseline = makeBaselineRecord({ suite_score: 0.85 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.83,
			{ factuality: makeMetricResult(0.9) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.regression_status).toBe("clean");
	});

	it("returns warning for delta between tolerance and critical", () => {
		const baseline = makeBaselineRecord({ suite_score: 0.85 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.79,
			{ factuality: makeMetricResult(0.85) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.regression_status).toBe("warning");
	});

	it("returns critical for delta exceeding critical threshold", () => {
		const baseline = makeBaselineRecord({ suite_score: 0.85 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.6,
			{ factuality: makeMetricResult(0.7) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.regression_status).toBe("critical");
	});

	it("returns clean for improvement (positive delta)", () => {
		const baseline = makeBaselineRecord({ suite_score: 0.8 });
		const result = buildRegressionBlock(
			baseline,
			"1.0.0",
			0.95,
			{ factuality: makeMetricResult(0.95) },
			["tc-001"],
			defaultConfig,
		);

		expect(result.regression_status).toBe("clean");
	});
});

describe("regressionEvaluator.evaluate", () => {
	function makeEvaluateInput(
		overrides: Partial<EvaluateInput> = {},
	): EvaluateInput {
		return {
			testCase: {
				id: "reg-001",
				description: "Regression check test",
				input: "test input",
				system_prompt: null,
				expected_output: "expected output",
				actual_output: "actual output",
				metrics: ["regression"],
				tags: [],
				weight: 1,
			},
			actualOutput: "actual output",
			expectedOutput: "expected output",
			config: {
				project: { name: "test", version: "1.0" },
				golden_sets: [
					{ path: "test.yaml", enabled: true, weight: 1, store_in_db: true },
				],
				metrics: {
					enabled: ["regression"],
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
					max_failed_test_cases: 1,
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
			},
			metricConfig: {
				tolerance: 0.05,
				critical_threshold: 0.15,
			},
			threshold: 0.7,
			...overrides,
		};
	}

	it("returns passed with score 1 when no baseline available", async () => {
		const result = await regressionEvaluator.evaluate(makeEvaluateInput());

		expect(result.score).toBe(1);
		expect(result.passed).toBe(true);
		expect(result.explanation).toContain("No baseline");
	});

	it("returns passed for clean regression (delta within tolerance)", async () => {
		const input = makeEvaluateInput({
			metricConfig: {
				tolerance: 0.05,
				critical_threshold: 0.15,
				_currentScore: 0.87,
			},
			regressionContext: {
				baseline: makeBaselineRecord({ suite_score: 0.85 }),
				currentGoldenSetVersion: "1.0.0",
			},
		});
		const result = await regressionEvaluator.evaluate(input);

		expect(result.passed).toBe(true);
		expect(result.score).toBe(1);
	});

	it("returns score 0.5 for warning regression", async () => {
		const input = makeEvaluateInput({
			metricConfig: {
				tolerance: 0.05,
				critical_threshold: 0.15,
				_currentScore: 0.79,
			},
			regressionContext: {
				baseline: makeBaselineRecord({ suite_score: 0.85 }),
				currentGoldenSetVersion: "1.0.0",
			},
		});
		const result = await regressionEvaluator.evaluate(input);

		expect(result.passed).toBe(false);
		expect(result.score).toBe(0.5);
	});

	it("returns score 0 for critical regression", async () => {
		const input = makeEvaluateInput({
			metricConfig: {
				tolerance: 0.05,
				critical_threshold: 0.15,
				_currentScore: 0.6,
			},
			regressionContext: {
				baseline: makeBaselineRecord({ suite_score: 0.85 }),
				currentGoldenSetVersion: "1.0.0",
			},
		});
		const result = await regressionEvaluator.evaluate(input);

		expect(result.passed).toBe(false);
		expect(result.score).toBe(0);
	});

	it("uses configured tolerance and critical_threshold from metricConfig", async () => {
		const input = makeEvaluateInput({
			metricConfig: {
				tolerance: 0.1,
				critical_threshold: 0.3,
				_currentScore: 0.78,
			},
			regressionContext: {
				baseline: makeBaselineRecord({ suite_score: 0.85 }),
				currentGoldenSetVersion: "1.0.0",
			},
		});
		const result = await regressionEvaluator.evaluate(input);

		expect(result.passed).toBe(true);
	});

	it("returns deterministic evaluation_type and zero token_cost", async () => {
		const result = await regressionEvaluator.evaluate(makeEvaluateInput());

		expect(result.evaluation_type).toBe("deterministic");
		expect(result.token_cost).toBe(0);
	});
});
