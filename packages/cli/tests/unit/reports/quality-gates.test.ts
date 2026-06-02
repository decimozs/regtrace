import { describe, expect, it } from "bun:test";
// We use a require-style import because the module is under test
// and bun test resolves it
import { checkQualityGates } from "../../../src/reports/quality-gates";
import type { Config } from "../../../src/schema/config.schema";
import type { RunRecord } from "../../../src/schema/run-record.schema";

function makeConfig(overrides?: Partial<Config>): Config {
	const defaults: Config = {
		project: { name: "test", version: "1.0", description: null },
		golden_sets: [{ path: "gs.yaml", enabled: true, weight: 1 }],
		metrics: {
			enabled: ["factuality", "format"],
			default_threshold: 0.7,
			default_weight: 1,
			factuality: {
				mode: "strict",
				claim_extraction_depth: "shallow",
				rag_faithfulness_only: false,
			},
			format: {
				sub_checks: {
					length: true,
					json_validity: true,
					json_schema: true,
					markdown_structure: true,
					required_fields: true,
					forbidden_content: true,
					regex_match: true,
				},
				length_tolerance: 0.2,
				strict_json: false,
			},
			tone: {
				tone_profile: null,
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
				model: "claude-3-haiku-20240307",
				temperature: 0.1,
				max_tokens: 4096,
				timeout_ms: 30000,
				retry_attempts: 3,
				local_endpoint: null,
			},
			cost_controls: { max_tokens_per_run: 100000, warn_at_tokens: 80000 },
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
	return {
		...defaults,
		...overrides,
		quality_gates: { ...defaults.quality_gates, ...overrides?.quality_gates },
	} as Config;
}

function makeTestCaseResult(
	overrides?: Partial<
		import("../../../src/schema/run-record.schema").TestCaseResult
	>,
): import("../../../src/schema/run-record.schema").TestCaseResult {
	const defaults: import("../../../src/schema/run-record.schema").TestCaseResult =
		{
			test_case_id: "tc-1",
			input: "hello",
			actual_output: "world",
			overall_passed: true,
			severity: "pass",
			metric_results: {},
		};
	return { ...defaults, ...overrides };
}

function makeMetricResult(
	overrides: Partial<{
		score: number;
		threshold: number;
		passed: boolean;
		confidence: number;
		evaluation_type: "deterministic" | "llm_judged";
		token_cost: number;
		explanation: string;
	}> = {},
): import("../../../src/schema/run-record.schema").MetricResult {
	return {
		metric_name: "factuality",
		score: 0.8,
		threshold: 0.7,
		passed: true,
		confidence: 0.9,
		evaluation_type: "deterministic",
		token_cost: 0,
		explanation: "",
		...overrides,
	};
}

function makeRunRecord(overrides?: Partial<RunRecord>): RunRecord {
	const defaults: RunRecord = {
		run_id: "run_test_001",
		timestamp: "2026-01-01T00:00:00.000Z",
		status: "passed",
		trigger: "cli",
		duration_ms: 100,
		regtrace_version: "0.1.0",
		judge_provider: "anthropic",
		judge_model: "claude-3-haiku-20240307",
		config_hash: "abc123",
		golden_set_name: "test-gs",
		golden_set_version: "1.0",
		golden_set_file_hash: "def456",
		suite_score: 0.85,
		metric_summary: {},
		test_case_results: [],
		regression: {
			baseline_run_id: null,
			baseline_golden_set_version: null,
			current_golden_set_version: "1.0",
			version_change_detected: false,
			suite_delta: 0,
			regression_status: "clean",
			test_cases_excluded: [],
			metric_deltas: {},
		},
	};
	return {
		...defaults,
		...overrides,
		metric_summary: {
			...defaults.metric_summary,
			...overrides?.metric_summary,
		},
	} as RunRecord;
}

describe("checkQualityGates", () => {
	it("passes all gates by default", () => {
		const config = makeConfig();
		const record = makeRunRecord({ suite_score: 0.85 });
		const result = checkQualityGates(record, config);
		expect(result.passed).toBe(true);
	});

	it("fails suite score gate when below minimum", () => {
		const config = makeConfig({
			quality_gates: {
				suite_score_minimum: 0.8,
				max_failed_test_cases: 0,
				max_low_confidence_ratio: 0.1,
				regression_gate: true,
			},
		});
		const record = makeRunRecord({ suite_score: 0.7 });
		const result = checkQualityGates(record, config);
		expect(result.passed).toBe(false);
		expect(result.gates.suiteScore?.passed).toBe(false);
		expect(result.gates.suiteScore?.actual).toBe(0.7);
		expect(result.gates.suiteScore?.minimum).toBe(0.8);
	});

	it("fails maxFailedCases gate when exceeded", () => {
		const config = makeConfig({
			quality_gates: {
				suite_score_minimum: 0.7,
				max_failed_test_cases: 1,
				max_low_confidence_ratio: 0.1,
				regression_gate: true,
			},
		});
		const record = makeRunRecord({
			suite_score: 0.85,
			test_case_results: [
				makeTestCaseResult({ severity: "fail", overall_passed: false }),
				makeTestCaseResult({ severity: "pass", overall_passed: true }),
				makeTestCaseResult({ severity: "fail", overall_passed: false }),
			],
		});
		const result = checkQualityGates(record, config);
		expect(result.passed).toBe(false);
		expect(result.gates.maxFailedCases?.passed).toBe(false);
		expect(result.gates.maxFailedCases?.actual).toBe(2);
	});

	it("passes maxFailedCases when within limit", () => {
		const config = makeConfig({
			quality_gates: {
				suite_score_minimum: 0.7,
				max_failed_test_cases: 2,
				max_low_confidence_ratio: 0.1,
				regression_gate: true,
			},
		});
		const record = makeRunRecord({
			suite_score: 0.85,
			test_case_results: [
				makeTestCaseResult({ severity: "fail", overall_passed: false }),
				makeTestCaseResult({ severity: "pass", overall_passed: true }),
			],
		});
		const result = checkQualityGates(record, config);
		expect(result.gates.maxFailedCases?.passed).toBe(true);
		expect(result.gates.maxFailedCases?.actual).toBe(1);
	});

	it("fails low confidence ratio when exceeded", () => {
		const config = makeConfig({
			quality_gates: {
				suite_score_minimum: 0.7,
				max_failed_test_cases: 5,
				max_low_confidence_ratio: 0.1,
				regression_gate: true,
			},
		});
		const record = makeRunRecord({
			suite_score: 0.85,
			test_case_results: [
				makeTestCaseResult({
					metric_results: { factuality: makeMetricResult({ confidence: 0.3 }) },
				}),
				makeTestCaseResult({
					metric_results: { factuality: makeMetricResult({ confidence: 0.9 }) },
				}),
			],
		});
		const result = checkQualityGates(record, config);
		expect(result.passed).toBe(false);
		expect(result.gates.maxLowConfidence?.passed).toBe(false);
	});

	it("fails regression gate when status is not clean", () => {
		const config = makeConfig({
			quality_gates: {
				suite_score_minimum: 0.7,
				max_failed_test_cases: 5,
				max_low_confidence_ratio: 0.1,
				regression_gate: true,
			},
		});
		const record = makeRunRecord({
			suite_score: 0.85,
			regression: {
				baseline_run_id: "prev",
				baseline_golden_set_version: "1.0",
				current_golden_set_version: "1.0",
				version_change_detected: false,
				suite_delta: -0.1,
				regression_status: "warning",
				test_cases_excluded: [],
				metric_deltas: {},
			},
		});
		const result = checkQualityGates(record, config);
		expect(result.passed).toBe(false);
		expect(result.gates.regression?.passed).toBe(false);
		expect(result.gates.regression?.status).toBe("warning");
	});

	it("fails per-metric minimums when below threshold", () => {
		const config = makeConfig({
			quality_gates: {
				suite_score_minimum: 0.7,
				metric_score_minimums: { format: 0.8, tone: 0.7 },
				max_failed_test_cases: 5,
				max_low_confidence_ratio: 0.1,
				regression_gate: true,
			},
		});
		const record = makeRunRecord({
			suite_score: 0.85,
			metric_summary: {
				format: { score: 0.6, pass_rate: 0.5 },
				tone: { score: 0.85, pass_rate: 1.0 },
			},
		});
		const result = checkQualityGates(record, config);
		expect(result.passed).toBe(false);
		expect(result.gates.metricScores?.passed).toBe(false);
		expect(result.gates.metricScores?.failures).toHaveLength(1);
		expect(result.gates.metricScores?.failures[0]?.metric).toBe("format");
	});
});
