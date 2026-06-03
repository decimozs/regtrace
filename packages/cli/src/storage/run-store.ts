import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import {
	type RunRecord,
	type RunTrigger,
	runRecordSchema,
} from "../schema/run-record.schema";
import { hashContent } from "../utils/hash";

const REGTRACE_DIR = ".regtrace";
const RUNS_DIR = `${REGTRACE_DIR}/runs`;

function getRunDir(basePath: string): string {
	return resolve(basePath, RUNS_DIR);
}

function getRegtraceDir(basePath: string): string {
	return resolve(basePath, REGTRACE_DIR);
}

/**
 * Generate a unique run ID with a date prefix and random suffix.
 * @returns A string in the format `run_YYYYMMDD_<nanoid>`, e.g. `run_20260603_a1b2c3`.
 */
export function generateRunId(): string {
	const dateStr = format(new Date(), "yyyyMMdd");
	const suffix = nanoid(6);
	return `run_${dateStr}_${suffix}`;
}

/**
 * Generate an ISO 8601 timestamp for the current moment.
 * @returns An ISO timestamp string, e.g. `2026-06-03T12:00:00.000Z`.
 */
export function generateTimestamp(): string {
	return new Date().toISOString();
}

/** Parameters required to create and persist a new run record. */
export interface CreateRunRecordParams {
	status: RunRecord["status"];
	trigger: RunTrigger;
	durationMs: number;
	regtraceVersion: string;
	judgeProvider: string;
	judgeModel: string;
	configContent: string;
	goldenSetName: string;
	goldenSetVersion: string;
	goldenSetContent: string;
	suiteScore: number;
	metricSummary: RunRecord["metric_summary"];
	testCaseResults: RunRecord["test_case_results"];
	regression: RunRecord["regression"];
}

/**
 * Persist a new run record to the filesystem under `.regtrace/runs/`.
 * @param basePath - Root directory of the project (where `.regtrace/` lives).
 * @param params - The run metadata and evaluation results to record.
 * @returns The fully hydrated `RunRecord`, including its generated ID, timestamp, and content hashes.
 */
export async function createRunRecord(
	basePath: string,
	params: CreateRunRecordParams,
): Promise<RunRecord> {
	const configHash = await hashContent(params.configContent);
	const goldenSetHash = await hashContent(params.goldenSetContent);

	const record: RunRecord = {
		run_id: generateRunId(),
		timestamp: generateTimestamp(),
		status: params.status,
		trigger: params.trigger,
		duration_ms: params.durationMs,
		regtrace_version: params.regtraceVersion,
		judge_provider: params.judgeProvider,
		judge_model: params.judgeModel,
		config_hash: configHash,
		golden_set_name: params.goldenSetName,
		golden_set_version: params.goldenSetVersion,
		golden_set_file_hash: goldenSetHash,
		suite_score: params.suiteScore,
		metric_summary: params.metricSummary,
		test_case_results: params.testCaseResults,
		regression: params.regression,
	};

	const runsDir = getRunDir(basePath);
	await mkdir(runsDir, { recursive: true });

	const filePath = resolve(runsDir, `${record.run_id}.json`);
	await writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");

	return record;
}

/**
 * Load a single run record by ID from the filesystem.
 * @param basePath - Root directory of the project.
 * @param runId - The run ID (e.g. `run_20260603_a1b2c3`) to load.
 * @returns The `RunRecord` if found and valid, or `null` if the file is missing or fails schema validation.
 */
export async function loadRunRecord(
	basePath: string,
	runId: string,
): Promise<RunRecord | null> {
	const runsDir = getRunDir(basePath);
	const filePath = resolve(runsDir, `${runId}.json`);

	if (!existsSync(filePath)) {
		return null;
	}

	try {
		const content = await readFile(filePath, "utf-8");
		const parsed = JSON.parse(content);
		const result = runRecordSchema.safeParse(parsed);

		if (result.success) {
			return result.data;
		}

		console.error(
			`Run record schema validation failed for ${runId}:`,
			result.error instanceof Error
				? result.error.message
				: JSON.stringify(result.error),
		);
		return null;
	} catch {
		return null;
	}
}

/**
 * List all run records from the filesystem, sorted newest-first.
 * @param basePath - Root directory of the project.
 * @returns An array of `RunRecord` objects sorted by timestamp descending. Corrupt or unparseable files are silently skipped.
 */
export async function listRunRecords(basePath: string): Promise<RunRecord[]> {
	const runsDir = getRunDir(basePath);

	if (!existsSync(runsDir)) {
		return [];
	}

	const files = await readdir(runsDir);
	const jsonFiles = files.filter((f) => f.endsWith(".json"));

	const records: RunRecord[] = [];
	for (const file of jsonFiles) {
		try {
			const content = await readFile(resolve(runsDir, file), "utf-8");
			const parsed = JSON.parse(content);
			const result = runRecordSchema.safeParse(parsed);
			if (result.success) {
				records.push(result.data);
			}
		} catch {
			// skip corrupt or unparseable files
		}
	}

	records.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);

	return records;
}

/**
 * Locate a baseline run record for regression comparison.
 * @param basePath - Root directory of the project.
 * @param strategy - `"last_passing"` uses the most recent passing run; `"pinned"` loads a specific run by ID.
 * @param pinnedRunId - Required when `strategy` is `"pinned"`. Ignored otherwise.
 * @returns The baseline `RunRecord`, or `null` if no matching run exists.
 */
export async function findBaselineRun(
	basePath: string,
	strategy: "last_passing" | "pinned",
	pinnedRunId?: string,
): Promise<RunRecord | null> {
	if (strategy === "pinned" && pinnedRunId) {
		return loadRunRecord(basePath, pinnedRunId);
	}

	const records = await listRunRecords(basePath);
	const passingRecords = records.filter((r) => r.status === "passed");

	return passingRecords.length > 0 ? (passingRecords[0] ?? null) : null;
}

/**
 * Ensure the `.regtrace/` directory exists, creating it if necessary.
 * @param basePath - Root directory of the project.
 */
export async function ensureRegtraceDir(basePath: string): Promise<void> {
	const dir = getRegtraceDir(basePath);
	await mkdir(dir, { recursive: true });
}
