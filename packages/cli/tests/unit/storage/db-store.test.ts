import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	existsSync,
	mkdirSync,
	rmSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import type { RunRecord } from "../../../src/schema/run-record.schema";
import {
	closeDb,
	getDb,
	initDb,
	listRunRecords,
	rebuildDb,
	saveRunRecord,
} from "../../../src/storage/db-store";

const TEST_DB = resolve(__dirname, "../../fixtures/temp-test.db");

function makeRecord(overrides: Partial<RunRecord> = {}): RunRecord {
	return {
		run_id: "run_test_001",
		timestamp: "2026-01-01T00:00:00.000Z",
		status: "passed",
		trigger: "cli",
		duration_ms: 100,
		regtrace_version: "0.1.0",
		judge_provider: "anthropic",
		judge_model: "claude-3-5-sonnet-20240620",
		config_hash: "abc123",
		golden_set_name: "test-suite",
		golden_set_version: "1.0.0",
		golden_set_file_hash: "def456",
		suite_score: 0.85,
		metric_summary: {
			factuality: { score: 0.9, pass_rate: 1.0 },
		},
		test_case_results: [],
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

describe("db-store", () => {
	beforeEach(() => {
		closeDb();
		try {
			unlinkSync(TEST_DB);
		} catch {
			// may not exist
		}
	});

	afterEach(() => {
		closeDb();
		try {
			unlinkSync(TEST_DB);
		} catch {
			// already cleaned
		}
	});

	it("initDb creates the database file and schema", () => {
		const db = initDb(TEST_DB);
		expect(existsSync(TEST_DB)).toBe(true);
		expect(db).toBeDefined();
		expect(getDb()).toBe(db);
	});

	it("initDb is idempotent", () => {
		const db1 = initDb(TEST_DB);
		const db2 = initDb(TEST_DB);
		expect(db1).toBe(db2);
	});

	it("saveRunRecord inserts a run record with all core fields", () => {
		const db = initDb(TEST_DB);
		saveRunRecord(db, makeRecord());

		const rows = db
			.prepare("SELECT run_id, suite_score, golden_set_name, status FROM runs")
			.all() as unknown as Record<string, unknown>[];
		expect(rows.length).toBe(1);
		expect(rows[0]?.run_id).toBe("run_test_001");
		expect(rows[0]?.suite_score).toBe(0.85);
	});

	it("saveRunRecord stores JSON columns correctly", () => {
		const db = initDb(TEST_DB);
		const record = makeRecord({
			metric_summary: {
				factuality: { score: 0.95, pass_rate: 1.0 },
			},
		});
		saveRunRecord(db, record);

		const results = listRunRecords(db);
		expect(results.length).toBe(1);
		expect(results[0]?.metric_summary?.factuality?.score).toBe(0.95);
	});

	it("listRunRecords returns records sorted by timestamp descending", () => {
		const db = initDb(TEST_DB);
		saveRunRecord(
			db,
			makeRecord({
				run_id: "run_older",
				timestamp: "2026-01-01T00:00:00.000Z",
				suite_score: 0.7,
			}),
		);
		saveRunRecord(
			db,
			makeRecord({
				run_id: "run_newer",
				timestamp: "2026-01-02T00:00:00.000Z",
				suite_score: 0.9,
			}),
		);

		const results = listRunRecords(db);
		expect(results.length).toBe(2);
		expect(results[0]?.run_id).toBe("run_newer");
		expect(results[1]?.run_id).toBe("run_older");
	});

	it("listRunRecords filters by golden set name", () => {
		const db = initDb(TEST_DB);
		saveRunRecord(
			db,
			makeRecord({
				run_id: "run_a",
				golden_set_name: "suite-a",
			}),
		);
		saveRunRecord(
			db,
			makeRecord({
				run_id: "run_b",
				golden_set_name: "suite-b",
			}),
		);

		const results = listRunRecords(db, "suite-a");
		expect(results.length).toBe(1);
		expect(results[0]?.run_id).toBe("run_a");
	});

	it("listRunRecords respects limit parameter", () => {
		const db = initDb(TEST_DB);
		for (let i = 0; i < 5; i++) {
			saveRunRecord(db, makeRecord({ run_id: `run_${i}` }));
		}

		const results = listRunRecords(db, undefined, 2);
		expect(results.length).toBe(2);
	});

	it("saveRunRecord does not throw on duplicate run_id (INSERT OR REPLACE)", () => {
		const db = initDb(TEST_DB);
		saveRunRecord(db, makeRecord({ run_id: "run_dup", suite_score: 0.5 }));
		expect(() =>
			saveRunRecord(db, makeRecord({ run_id: "run_dup", suite_score: 0.9 })),
		).not.toThrow();

		const results = listRunRecords(db);
		expect(results.length).toBe(1);
	});
});

function writeRunFile(
	dir: string,
	runId: string,
	overrides: Partial<RunRecord> = {},
): void {
	const record = {
		run_id: runId,
		timestamp: "2026-01-01T00:00:00.000Z",
		status: "passed",
		trigger: "cli",
		duration_ms: 100,
		regtrace_version: "0.1.0",
		judge_provider: "anthropic",
		judge_model: "claude-3-5-sonnet-20240620",
		config_hash: "abc123",
		golden_set_name: "test-suite",
		golden_set_version: "1.0.0",
		golden_set_file_hash: "def456",
		suite_score: 0.85,
		metric_summary: {},
		test_case_results: [],
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
	writeFileSync(resolve(dir, `${runId}.json`), JSON.stringify(record), "utf-8");
}

describe("rebuildDb", () => {
	const BASE = resolve(__dirname, "../../fixtures/temp-rebuild");
	const RUNS_DIR = resolve(BASE, ".regtrace", "runs");
	const DB_PATH = resolve(BASE, "rebuilt.db");

	beforeEach(() => {
		closeDb();
		rmSync(BASE, { recursive: true, force: true });
		mkdirSync(RUNS_DIR, { recursive: true });
	});

	afterEach(() => {
		closeDb();
		rmSync(BASE, { recursive: true, force: true });
	});

	it("imports runs from .regtrace/runs/ directory", () => {
		writeRunFile(RUNS_DIR, "run_001");
		writeRunFile(RUNS_DIR, "run_002");
		writeRunFile(RUNS_DIR, "run_003");

		const count = rebuildDb(BASE, DB_PATH);
		expect(count).toBe(3);

		const db = initDb(DB_PATH);
		const rows = db
			.prepare("SELECT run_id FROM runs ORDER BY run_id")
			.all() as unknown as Record<string, unknown>[];
		expect(rows).toHaveLength(3);
		expect(rows[0]?.run_id).toBe("run_001");
		expect(rows[1]?.run_id).toBe("run_002");
		expect(rows[2]?.run_id).toBe("run_003");
		db.close();
	});

	it("returns 0 when runs directory is empty", () => {
		const count = rebuildDb(BASE, DB_PATH);
		expect(count).toBe(0);
	});

	it("returns 0 when runs directory does not exist", () => {
		const count = rebuildDb("/tmp/nonexistent-0123456789", DB_PATH);
		expect(count).toBe(0);
	});

	it("skips corrupt JSON files", () => {
		writeRunFile(RUNS_DIR, "run_valid");
		writeFileSync(
			resolve(RUNS_DIR, "run_corrupt.json"),
			"not valid json{",
			"utf-8",
		);

		const count = rebuildDb(BASE, DB_PATH);
		expect(count).toBe(1);

		const db = initDb(DB_PATH);
		const rows = db
			.prepare("SELECT run_id FROM runs")
			.all() as unknown as Record<string, unknown>[];
		expect(rows).toHaveLength(1);
		expect(rows[0]?.run_id).toBe("run_valid");
		db.close();
	});
});
