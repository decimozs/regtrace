import { describe, expect, it } from "bun:test";
import { jsonReporter } from "../../../src/reports/json-reporter";
import type { ReportData } from "../../../src/reports/types";

function makeReportData(overrides?: Partial<ReportData>): ReportData {
	const defaults: ReportData = {
		run: {
			run_id: "run_test_001",
			timestamp: "2026-01-01T00:00:00.000Z",
			status: "passed",
			trigger: "cli",
			duration_ms: 1234,
			regtrace_version: "0.1.0",
			judge_provider: "anthropic",
			judge_model: "claude-3-haiku-20240307",
			config_hash: "abc",
			golden_set_name: "test-gs",
			golden_set_version: "1.0",
			golden_set_file_hash: "def",
			suite_score: 0.92,
			metric_summary: {
				factuality: { score: 0.95, pass_rate: 1.0 },
				format: { score: 0.85, pass_rate: 0.75 },
			},
			test_case_results: [
				{
					test_case_id: "tc-1",
					input: "hello",
					actual_output: "world",
					overall_passed: true,
					severity: "pass",
					metric_results: {
						factuality: {
							metric_name: "factuality",
							score: 0.9,
							threshold: 0.7,
							passed: true,
							confidence: 0.95,
							evaluation_type: "deterministic",
							token_cost: 0,
							explanation: "good match",
						},
					},
				},
			],
			regression: {
				baseline_run_id: "run_prev_001",
				baseline_golden_set_version: "1.0",
				current_golden_set_version: "1.0",
				version_change_detected: false,
				suite_delta: 0.02,
				regression_status: "clean",
				test_cases_excluded: [],
				metric_deltas: { factuality: 0.02 },
			},
		},
		qualityGates: {
			passed: true,
			gates: {
				suiteScore: { passed: true, actual: 0.92, minimum: 0.7 },
				maxFailedCases: { passed: true, actual: 0, maximum: 0 },
				maxLowConfidence: { passed: true, actual: 0, maximum: 0.1 },
			},
		},
		config: {
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
				regression_gate: false,
			},
			run: { concurrency: 1 },
			output: {
				run_history_limit: 50,
				default_format: "terminal",
				explain_by_default: false,
				color: "auto",
				ci_mode_auto_detect: true,
			},
		},
	};
	return { ...defaults, ...overrides } as ReportData;
}

describe("jsonReporter", () => {
	it("produces valid JSON", () => {
		const data = makeReportData();
		const output = jsonReporter.generate(data);
		expect(() => JSON.parse(output)).not.toThrow();
	});

	it("includes top-level suite object", () => {
		const data = makeReportData();
		const parsed = JSON.parse(jsonReporter.generate(data));
		expect(parsed.suite).toBeDefined();
		expect(parsed.suite.name).toBe("test-gs");
		expect(parsed.suite.run_id).toBe("run_test_001");
	});

	it("includes summary with counts", () => {
		const data = makeReportData();
		const parsed = JSON.parse(jsonReporter.generate(data));
		expect(parsed.summary.status).toBe("passed");
		expect(parsed.summary.suite_score).toBe(0.92);
		expect(parsed.summary.total_test_cases).toBe(1);
		expect(parsed.summary.passed).toBe(1);
		expect(parsed.summary.failed).toBe(0);
		expect(parsed.summary.severity_counts.pass).toBe(1);
		expect(parsed.summary.severity_counts.fail).toBe(0);
	});

	it("includes quality gates", () => {
		const data = makeReportData();
		const parsed = JSON.parse(jsonReporter.generate(data));
		expect(parsed.quality_gates.passed).toBe(true);
		expect(parsed.quality_gates.gates.suiteScore).toBeDefined();
	});

	it("includes regression info", () => {
		const data = makeReportData();
		const parsed = JSON.parse(jsonReporter.generate(data));
		expect(parsed.regression.status).toBe("clean");
		expect(parsed.regression.suite_delta).toBe(0.02);
		expect(parsed.regression.baseline_run_id).toBe("run_prev_001");
	});

	it("includes test case details", () => {
		const data = makeReportData();
		const parsed = JSON.parse(jsonReporter.generate(data));
		expect(parsed.test_cases).toHaveLength(1);
		const tc = parsed.test_cases[0];
		expect(tc.id).toBe("tc-1");
		expect(tc.metrics.factuality.score).toBe(0.9);
	});

	it("includes judge info", () => {
		const data = makeReportData();
		const parsed = JSON.parse(jsonReporter.generate(data));
		expect(parsed.judge.provider).toBe("anthropic");
		expect(parsed.judge.model).toBe("claude-3-haiku-20240307");
	});
});
