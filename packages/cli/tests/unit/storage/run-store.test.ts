import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import {
	createRunRecord,
	findBaselineRun,
	generateRunId,
	listRunRecords,
	loadRunRecord,
} from "../../../src/storage/run-store";

const TEST_BASE = resolve(__dirname, "../../fixtures/temp-run-store");

beforeEach(async () => {
	await rm(TEST_BASE, { recursive: true, force: true });
	await mkdir(TEST_BASE, { recursive: true });
});

afterEach(async () => {
	await rm(TEST_BASE, { recursive: true, force: true });
});

function makeParams(overrides: Record<string, unknown> = {}) {
	return {
		status: "passed" as const,
		trigger: "cli" as const,
		durationMs: 1000,
		regtraceVersion: "0.1.0",
		judgeProvider: "anthropic",
		judgeModel: "claude-3-5-sonnet-20240620",
		configContent: "project:\n  name: test",
		goldenSetName: "test-set",
		goldenSetVersion: "1.0.0",
		goldenSetContent: "name: test\nversion: 1.0.0",
		suiteScore: 0.85,
		metricSummary: {
			factuality: { score: 0.9, pass_rate: 1.0 },
			format: { score: 1.0, pass_rate: 1.0 },
		},
		testCaseResults: [
			{
				test_case_id: "tc-001",
				input: "test input",
				actual_output: "test output",
				overall_passed: true,
				severity: "pass" as const,
				metric_results: {
					factuality: {
						metric_name: "factuality",
						score: 0.9,
						confidence: 0.95,
						passed: true,
						threshold: 0.7,
						explanation: "All claims verified.",
						evaluation_type: "llm_judged" as const,
						token_cost: 100,
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
			regression_status: "clean" as const,
			test_cases_excluded: [],
			metric_deltas: {},
		},
		...overrides,
	};
}

describe("run-store", () => {
	it("creates and saves a run record", async () => {
		const record = await createRunRecord(TEST_BASE, makeParams());

		expect(record.run_id).toBeDefined();
		expect(record.run_id.startsWith("run_")).toBe(true);
		expect(record.suite_score).toBe(0.85);
		expect(record.status).toBe("passed");

		const filePath = resolve(
			TEST_BASE,
			".regtrace/runs",
			`${record.run_id}.json`,
		);
		expect(existsSync(filePath)).toBe(true);
	});

	it("loads a run record by id", async () => {
		const created = await createRunRecord(TEST_BASE, makeParams());
		const loaded = await loadRunRecord(TEST_BASE, created.run_id);

		expect(loaded).not.toBeNull();
		expect(loaded?.run_id).toBe(created.run_id);
		expect(loaded?.suite_score).toBe(0.85);
	});

	it("returns null for a non-existent run id", async () => {
		const result = await loadRunRecord(TEST_BASE, "run_nonexistent");
		expect(result).toBeNull();
	});

	it("lists all run records sorted by time descending", async () => {
		await createRunRecord(TEST_BASE, makeParams({ durationMs: 1000 }));

		await new Promise((r) => setTimeout(r, 5));

		await createRunRecord(TEST_BASE, makeParams({ durationMs: 2000 }));

		const records = await listRunRecords(TEST_BASE);
		expect(records.length).toBe(2);
		expect(records[0]?.duration_ms).toBe(2000);
		expect(records[1]?.duration_ms).toBe(1000);
	});

	it("returns empty list when no runs directory exists", async () => {
		const records = await listRunRecords("/nonexistent/path");
		expect(records).toEqual([]);
	});

	it("finds the last passing run as baseline", async () => {
		await createRunRecord(
			TEST_BASE,
			makeParams({ status: "failed" as const, suiteScore: 0.3 }),
		);

		await new Promise((r) => setTimeout(r, 5));

		await createRunRecord(
			TEST_BASE,
			makeParams({
				status: "passed" as const,
				suiteScore: 0.9,
				durationMs: 2000,
			}),
		);

		await new Promise((r) => setTimeout(r, 5));

		await createRunRecord(
			TEST_BASE,
			makeParams({
				status: "passed" as const,
				suiteScore: 0.8,
				durationMs: 3000,
			}),
		);

		const baseline = await findBaselineRun(TEST_BASE, "last_passing");
		expect(baseline).not.toBeNull();
		expect(baseline?.status).toBe("passed");
		expect(baseline?.duration_ms).toBe(3000);
	});

	it("returns null for baseline when no passing runs exist", async () => {
		await createRunRecord(TEST_BASE, makeParams({ status: "failed" as const }));
		const baseline = await findBaselineRun(TEST_BASE, "last_passing");
		expect(baseline).toBeNull();
	});

	it("filters baseline by branch", async () => {
		await createRunRecord(
			TEST_BASE,
			makeParams({ branch: "main", durationMs: 1000 }),
		);

		await new Promise((r) => setTimeout(r, 5));

		await createRunRecord(
			TEST_BASE,
			makeParams({ branch: "feature-x", durationMs: 2000 }),
		);

		const mainBaseline = await findBaselineRun(
			TEST_BASE,
			"last_passing",
			undefined,
			"main",
		);
		expect(mainBaseline).not.toBeNull();
		expect(mainBaseline?.branch).toBe("main");
		expect(mainBaseline?.duration_ms).toBe(1000);

		const featureBaseline = await findBaselineRun(
			TEST_BASE,
			"last_passing",
			undefined,
			"feature-x",
		);
		expect(featureBaseline).not.toBeNull();
		expect(featureBaseline?.branch).toBe("feature-x");
		expect(featureBaseline?.duration_ms).toBe(2000);
	});

	it("falls back to fallbackBranch when no passing runs for branch", async () => {
		await createRunRecord(
			TEST_BASE,
			makeParams({ branch: "main", durationMs: 1000 }),
		);

		await new Promise((r) => setTimeout(r, 5));

		await createRunRecord(
			TEST_BASE,
			makeParams({ branch: "other", durationMs: 2000 }),
		);

		const result = await findBaselineRun(
			TEST_BASE,
			"last_passing",
			undefined,
			"feature-x",
			"main",
		);
		expect(result).not.toBeNull();
		expect(result?.branch).toBe("main");
		expect(result?.duration_ms).toBe(1000);
	});

	it("falls back to branch-agnostic when branch and fallbackBranch both yield no results", async () => {
		await createRunRecord(
			TEST_BASE,
			makeParams({ branch: "other", durationMs: 1000 }),
		);

		const result = await findBaselineRun(
			TEST_BASE,
			"last_passing",
			undefined,
			"feature-x",
			"main",
		);
		expect(result).not.toBeNull();
		expect(result?.duration_ms).toBe(1000);
	});

	it("falls back to branch-agnostic when no fallbackBranch provided (legacy behavior)", async () => {
		await createRunRecord(
			TEST_BASE,
			makeParams({ branch: "other", durationMs: 1000 }),
		);

		const result = await findBaselineRun(
			TEST_BASE,
			"last_passing",
			undefined,
			"feature-x",
		);
		expect(result).not.toBeNull();
		expect(result?.duration_ms).toBe(1000);
	});

	it("generates unique run ids", () => {
		const ids = new Set<string>();
		for (let i = 0; i < 100; i++) {
			ids.add(generateRunId());
		}
		expect(ids.size).toBe(100);
	});
});
