import { describe, expect, it } from "bun:test";
import { checkNfrGates, nfrAllPassed } from "../../../src/metrics/nfr";
import type { RunRecord } from "../../../src/schema/run-record.schema";

function makeRecord(overrides: Partial<RunRecord> = {}): RunRecord {
	return {
		run_id: "nfr-test-001",
		timestamp: "2026-06-06T00:00:00.000Z",
		status: "passed",
		trigger: "cli",
		duration_ms: 5000,
		regtrace_version: "0.10.0",
		judge_provider: "anthropic",
		judge_model: "claude-haiku-4-5-20251001",
		config_hash: "abc123",
		golden_set_name: "test-gs",
		golden_set_version: "1.0.0",
		golden_set_file_hash: "def456",
		suite_score: 0.9,
		metric_summary: {
			format: { score: 1, pass_rate: 1 },
		},
		test_case_results: [
			{
				test_case_id: "tc-001",
				input: "test input",
				actual_output: "test output",
				overall_passed: true,
				severity: "pass",
				metric_results: {
					format: {
						metric_name: "format",
						score: 0.9,
						confidence: 1,
						passed: true,
						threshold: 0.7,
						explanation: "ok",
						evaluation_type: "deterministic",
						token_cost: 0,
					},
					factuality: {
						metric_name: "factuality",
						score: 0.95,
						confidence: 0.95,
						passed: true,
						threshold: 0.7,
						explanation: "ok",
						evaluation_type: "llm_judged",
						token_cost: 15,
					},
				},
			},
			{
				test_case_id: "tc-002",
				input: "test input 2",
				actual_output: "test output 2",
				overall_passed: false,
				severity: "fail",
				metric_results: {
					format: {
						metric_name: "format",
						score: 0.6,
						confidence: 1,
						passed: false,
						threshold: 0.7,
						explanation: "bad",
						evaluation_type: "deterministic",
						token_cost: 0,
					},
				},
			},
		],
		regression: {
			baseline_run_id: null,
			baseline_golden_set_version: null,
			current_golden_set_version: "1.0.0",
			version_change_detected: false,
			suite_delta: 0,
			regression_status: "clean",
			test_cases_excluded: [],
			metric_deltas: {},
		},
		...overrides,
	};
}

describe("checkNfrGates", () => {
	it("returns empty result when no NFR gates configured", () => {
		const result = checkNfrGates(makeRecord(), undefined);
		expect(result).toEqual({});
		expect(nfrAllPassed(result)).toBe(true);
	});

	it("passes latency gate when under max", () => {
		const record = makeRecord({ duration_ms: 1000 });
		const result = checkNfrGates(record, { max_latency_ms: 5000 });
		expect(result.latency?.passed).toBe(true);
		expect(result.latency?.actual_ms).toBe(1000);
		expect(result.latency?.max_ms).toBe(5000);
	});

	it("fails latency gate when over max", () => {
		const record = makeRecord({ duration_ms: 10000 });
		const result = checkNfrGates(record, { max_latency_ms: 5000 });
		expect(result.latency?.passed).toBe(false);
	});

	it("passes cost gate when under max", () => {
		const record = makeRecord();
		// Total cost: tc-001 has 2 metrics (0 + 15) = 15 cents = $0.15
		// tc-002 has 1 metric (0) = 0 cents
		// Total: $0.15
		const result = checkNfrGates(record, { max_cost_usd: 1.0 });
		expect(result.cost?.passed).toBe(true);
		expect(result.cost?.actual_usd).toBeCloseTo(0.15);
	});

	it("fails cost gate when over max", () => {
		const record = makeRecord();
		const result = checkNfrGates(record, { max_cost_usd: 0.1 });
		expect(result.cost?.passed).toBe(false);
	});

	it("passes coverage gate when above min", () => {
		const record = makeRecord();
		// 2 test cases, 1 passed (overall_passed = true only on first)
		const result = checkNfrGates(record, { min_coverage: 0.5 });
		expect(result.coverage?.passed).toBe(true);
		expect(result.coverage?.actual).toBe(0.5);
	});

	it("fails coverage gate when below min", () => {
		const record = makeRecord();
		const result = checkNfrGates(record, { min_coverage: 0.6 });
		expect(result.coverage?.passed).toBe(false);
	});

	it("handles empty test cases for coverage", () => {
		const record = makeRecord({ test_case_results: [] });
		const result = checkNfrGates(record, { min_coverage: 0.5 });
		expect(result.coverage?.passed).toBe(false);
		expect(result.coverage?.actual).toBe(0);
	});

	it("passes all gates when all within thresholds", () => {
		const record = makeRecord({ duration_ms: 2000 });
		const result = checkNfrGates(record, {
			max_latency_ms: 5000,
			max_cost_usd: 1.0,
			min_coverage: 0.4,
		});
		expect(nfrAllPassed(result)).toBe(true);
	});

	it("fails overall when any gate fails", () => {
		const record = makeRecord({ duration_ms: 10000 });
		const result = checkNfrGates(record, {
			max_latency_ms: 5000,
			max_cost_usd: 1.0,
			min_coverage: 0.4,
		});
		expect(nfrAllPassed(result)).toBe(false);
	});
});
