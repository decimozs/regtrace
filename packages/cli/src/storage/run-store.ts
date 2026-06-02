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

export function generateRunId(): string {
	const dateStr = format(new Date(), "yyyyMMdd");
	const suffix = nanoid(6);
	return `run_${dateStr}_${suffix}`;
}

export function generateTimestamp(): string {
	return new Date().toISOString();
}

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

		return null;
	} catch {
		return null;
	}
}

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

export async function ensureRegtraceDir(basePath: string): Promise<void> {
	const dir = getRegtraceDir(basePath);
	await mkdir(dir, { recursive: true });
}
