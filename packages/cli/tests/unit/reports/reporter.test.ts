import { describe, expect, it } from "bun:test";
import { jsonReporter } from "../../../src/reports/json-reporter";
import { markdownReporter } from "../../../src/reports/markdown-reporter";
import { generateReport, getReporter } from "../../../src/reports/reporter";
import type { ReportData } from "../../../src/reports/types";

function makeReportData(overrides?: Partial<ReportData>): ReportData {
	const defaults: ReportData = {
		run: {
			run_id: "run_md_001",
			timestamp: "2026-06-01T12:00:00.000Z",
			status: "passed",
			trigger: "cli",
			duration_ms: 500,
			regtrace_version: "0.1.0",
			judge_provider: "anthropic",
			judge_model: "claude-3-haiku-20240307",
			config_hash: "abc",
			golden_set_name: "md-test",
			golden_set_version: "2.0",
			golden_set_file_hash: "def",
			suite_score: 0.88,
			metric_summary: {
				factuality: { score: 0.9, pass_rate: 1.0 },
			},
			test_case_results: [
				{
					test_case_id: "tc-pass",
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
							explanation: "",
						},
					},
				},
			],
			regression: {
				baseline_run_id: null,
				baseline_golden_set_version: null,
				current_golden_set_version: "2.0",
				version_change_detected: false,
				suite_delta: 0,
				regression_status: "clean",
				test_cases_excluded: [],
				metric_deltas: {},
			},
		},
		qualityGates: {
			passed: true,
			gates: {
				suiteScore: { passed: true, actual: 0.88, minimum: 0.7 },
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

describe("markdownReporter", () => {
	it("includes report header with name and version", () => {
		const data = makeReportData();
		const output = markdownReporter.generate(data);
		expect(output).toContain("# Regtrace Report: md-test v2.0");
	});

	it("includes run metadata in list", () => {
		const data = makeReportData();
		const output = markdownReporter.generate(data);
		expect(output).toContain("run_md_001");
		expect(output).toContain("500ms");
	});

	it("includes summary table", () => {
		const data = makeReportData();
		const output = markdownReporter.generate(data);
		expect(output).toContain("| Status |");
		expect(output).toContain("| Suite Score |");
		expect(output).toContain("88.0%");
	});

	it("includes metric scores table", () => {
		const data = makeReportData();
		const output = markdownReporter.generate(data);
		expect(output).toContain("factuality");
	});

	it("includes quality gates section", () => {
		const data = makeReportData();
		const output = markdownReporter.generate(data);
		expect(output).toContain("## Quality Gates");
		expect(output).toContain("PASSED");
	});

	it("includes test case results", () => {
		const data = makeReportData();
		const output = markdownReporter.generate(data);
		expect(output).toContain("tc-pass");
		expect(output).toContain("hello");
	});

	it("includes regression when baseline exists", () => {
		const data = makeReportData();
		data.run.regression.baseline_run_id = "run_prev_001";
		data.run.regression.suite_delta = -0.03;
		const output = markdownReporter.generate(data);
		expect(output).toContain("## Regression");
		expect(output).toContain("-3.0%");
	});

	it("reports failed quality gates", () => {
		const data = makeReportData();
		data.qualityGates.passed = false;
		if (data.qualityGates.gates.suiteScore) {
			data.qualityGates.gates.suiteScore.passed = false;
		}
		const output = markdownReporter.generate(data);
		expect(output).toContain("FAILED");
	});
});

describe("getReporter", () => {
	it("returns json reporter for json format", () => {
		const reporter = getReporter("json");
		expect(reporter.generate).toBe(jsonReporter.generate);
	});

	it("returns markdown reporter for markdown format", () => {
		const reporter = getReporter("markdown");
		expect(reporter.generate).toBe(markdownReporter.generate);
	});

	it("defaults to json for unknown format", () => {
		const reporter = getReporter("unknown");
		expect(reporter.generate).toBe(jsonReporter.generate);
	});
});

describe("generateReport", () => {
	it("generates JSON report for json format", () => {
		const data = makeReportData();
		const output = generateReport(data, "json");
		const parsed = JSON.parse(output);
		expect(parsed.suite.run_id).toBe("run_md_001");
	});

	it("generates Markdown for markdown format", () => {
		const data = makeReportData();
		const output = generateReport(data, "markdown");
		expect(output.startsWith("# Regtrace Report:")).toBe(true);
	});
});
