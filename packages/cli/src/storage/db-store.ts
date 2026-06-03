import { Database } from "bun:sqlite";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RunRecord } from "../schema/run-record.schema";

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS runs (
    run_id              TEXT PRIMARY KEY,
    timestamp           TEXT NOT NULL,
    status              TEXT NOT NULL,
    trigger             TEXT NOT NULL,
    duration_ms         INTEGER NOT NULL,
    suite_score         REAL NOT NULL,
    golden_set_name     TEXT NOT NULL,
    golden_set_version  TEXT NOT NULL,
    judge_provider      TEXT NOT NULL,
    judge_model         TEXT NOT NULL,
    metric_summary      TEXT NOT NULL,
    test_case_results   TEXT NOT NULL,
    regression          TEXT NOT NULL,
    config_hash         TEXT,
    golden_set_file_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_runs_golden_set ON runs(golden_set_name);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
`;

const INSERT_SQL = `
INSERT OR REPLACE INTO runs (
    run_id, timestamp, status, trigger, duration_ms,
    suite_score, golden_set_name, golden_set_version,
    judge_provider, judge_model,
    metric_summary, test_case_results, regression,
    config_hash, golden_set_file_hash
) VALUES (
    ?1, ?2, ?3, ?4, ?5,
    ?6, ?7, ?8,
    ?9, ?10,
    ?11, ?12, ?13,
    ?14, ?15
);
`;

const SELECT_ALL_SQL = `
SELECT * FROM runs
WHERE (?1 IS NULL OR golden_set_name = ?1)
ORDER BY timestamp DESC
LIMIT ?2
`;

export function openDb(dbPath: string): Database {
	const db = new Database(dbPath);
	db.exec("PRAGMA journal_mode = WAL");
	db.exec(CREATE_TABLE_SQL);
	return db;
}

let _db: Database | null = null;
let _dbPath: string | null = null;

export function getDb(): Database | null {
	return _db;
}

export function initDb(dbPath: string): Database {
	if (_db && _dbPath === dbPath) return _db;
	if (_db) {
		_db.close();
	}
	_db = openDb(dbPath);
	_dbPath = dbPath;
	return _db;
}

export function closeDb(): void {
	if (_db) {
		_db.close();
		_db = null;
		_dbPath = null;
	}
}

export function saveRunRecord(db: Database, record: RunRecord): void {
	const stmt = db.prepare(INSERT_SQL);
	stmt.run(
		record.run_id,
		record.timestamp,
		record.status,
		record.trigger,
		record.duration_ms,
		record.suite_score,
		record.golden_set_name,
		record.golden_set_version,
		record.judge_provider,
		record.judge_model,
		JSON.stringify(record.metric_summary),
		JSON.stringify(record.test_case_results),
		JSON.stringify(record.regression),
		record.config_hash,
		record.golden_set_file_hash,
	);
}

export function listRunRecords(
	db: Database,
	goldenSetName?: string,
	limit?: number,
): RunRecord[] {
	const stmt = db.prepare(SELECT_ALL_SQL);
	const rows = stmt.all(goldenSetName ?? null, limit ?? 1000) as Record<
		string,
		unknown
	>[];

	return rows.map(mapRowToRecord);
}

function mapRowToRecord(row: Record<string, unknown>): RunRecord {
	return {
		run_id: row.run_id as string,
		timestamp: row.timestamp as string,
		status: row.status as RunRecord["status"],
		trigger: row.trigger as RunRecord["trigger"],
		duration_ms: row.duration_ms as number,
		regtrace_version: "", // not stored in DB for now
		judge_provider: row.judge_provider as string,
		judge_model: row.judge_model as string,
		config_hash: (row.config_hash as string) ?? "",
		golden_set_name: row.golden_set_name as string,
		golden_set_version: row.golden_set_version as string,
		golden_set_file_hash: (row.golden_set_file_hash as string) ?? "",
		suite_score: row.suite_score as number,
		metric_summary: JSON.parse(row.metric_summary as string),
		test_case_results: JSON.parse(row.test_case_results as string),
		regression: JSON.parse(row.regression as string),
	};
}

export function rebuildDb(basePath: string, dbPath: string): number {
	const runsDir = resolve(basePath, ".regtrace", "runs");

	if (!existsSync(runsDir)) return 0;

	const files = readdirSync(runsDir)
		.filter((f) => f.endsWith(".json"))
		.sort();

	const db = openDb(dbPath);
	const insertStmt = db.prepare(INSERT_SQL);

	let count = 0;
	for (const file of files) {
		try {
			const content = readFileSync(resolve(runsDir, file), "utf-8");
			const record = JSON.parse(content) as RunRecord;

			insertStmt.run(
				record.run_id,
				record.timestamp,
				record.status,
				record.trigger,
				record.duration_ms,
				record.suite_score,
				record.golden_set_name,
				record.golden_set_version,
				record.judge_provider,
				record.judge_model,
				JSON.stringify(record.metric_summary),
				JSON.stringify(record.test_case_results),
				JSON.stringify(record.regression),
				record.config_hash,
				record.golden_set_file_hash,
			);
			count++;
		} catch {
			// skip corrupt files
		}
	}

	db.close();
	return count;
}
