import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildJudgeConfig } from "../judge/judge";
import { type EvaluateTestCaseParams, evaluateSuite } from "../metrics/runner";
import { checkQualityGates } from "../reports/quality-gates";
import type { Config } from "../schema/config.schema";
import type { MetricName } from "../schema/golden-set.schema";
import type { RunRecord } from "../schema/run-record.schema";
import { initDb, saveRunRecord } from "../storage/db-store";
import { loadGoldenSetFromFile } from "../storage/golden-set-loader";
import {
	createRunRecord,
	ensureRegtraceDir,
	findBaselineRun,
} from "../storage/run-store";
import { generateOutput } from "./generate";
import { printError, printInfo } from "./print";

declare const __VERSION__: string | undefined;

/** Pipeline options passed to `runPipeline`. */
interface PipelineOptions {
	generate?: boolean;
	trigger?: "cli" | "ci" | "watch";
	quiet?: boolean;
}

/** A single test case extracted from a golden set, prepared for evaluation. */
interface PreparedTestCase {
	id: string;
	description: string;
	input: string;
	system_prompt: string | null;
	expected_output: string;
	actual_output: string | null;
	metrics: MetricName[];
	weight: number;
}

/** Result of loading and parsing a golden set file. */
interface PrepareGoldenSetResult {
	name: string;
	version: string;
	description: string;
	testCases: PreparedTestCase[];
	goldenSetContent: string;
}

/**
 * Resolves a golden set path relative to the config directory.
 * Absolute paths are returned as-is.
 */
function resolveGoldenSetPath(configDir: string, relativePath: string): string {
	if (relativePath.startsWith("/")) return relativePath;
	return resolve(configDir, relativePath);
}

/**
 * Loads a golden set file, validates it, and extracts test cases
 * into prepared form for the evaluation pipeline.
 */
async function prepareGoldenSet(
	configDir: string,
	path: string,
): Promise<
	| PrepareGoldenSetResult
	| { success: false; errors: { field: string; message: string }[] }
> {
	const fullPath = resolveGoldenSetPath(configDir, path);
	const loadResult = await loadGoldenSetFromFile(fullPath);
	if (!loadResult.success) return loadResult;

	const gsContent = readFileSync(fullPath, "utf-8");
	const parsed = loadResult.data;

	return {
		name: parsed.name,
		version: parsed.version,
		description: parsed.description ?? "",
		testCases: parsed.test_cases.map((tc) => ({
			id: tc.id,
			description: tc.description,
			input: tc.input,
			system_prompt: tc.system_prompt,
			expected_output: tc.expected_output,
			actual_output: tc.actual_output,
			metrics: tc.metrics,
			weight: tc.weight,
		})),
		goldenSetContent: gsContent,
	};
}

/**
 * Builds evaluation parameters from a prepared test case and baseline data.
 */
function buildTestCaseParams(
	config: Config,
	tc: PreparedTestCase,
	baselineRun: RunRecord | null,
	goldenSetVersion: string,
): EvaluateTestCaseParams {
	return {
		testCase: {
			id: tc.id,
			description: tc.description,
			input: tc.input,
			system_prompt: null,
			expected_output: tc.expected_output,
			actual_output: tc.actual_output,
			metrics: tc.metrics,
			thresholds: undefined,
			tags: [],
			weight: tc.weight,
			context: null,
		},
		actualOutput: tc.actual_output ?? "",
		expectedOutput: tc.expected_output,
		config,
		baselineRecord: baselineRun
			? {
					run_id: baselineRun.run_id,
					golden_set_version: baselineRun.golden_set_version,
					suite_score: baselineRun.suite_score,
					metric_summary: baselineRun.metric_summary,
				}
			: null,
		currentGoldenSetVersion: goldenSetVersion,
	};
}

/** Result of evaluating a single golden set suite. */
export interface PipelineResult {
	run: RunRecord;
	qualityGates: ReturnType<typeof checkQualityGates>;
}

/**
 * Main evaluation loop.
 * For each enabled golden set: loads it, generates missing outputs if requested,
 * evaluates all metrics, creates a run record, checks quality gates, and persists
 * results to disk and optionally SQLite.
 */
export async function runPipeline(
	config: Config,
	configDir: string,
	configContent: string,
	startTime: number,
	options: PipelineOptions,
): Promise<PipelineResult[]> {
	const trigger = options.trigger ?? "cli";
	const judgeCfg = buildJudgeConfig(config.judge.primary);
	const regtraceVersion =
		typeof __VERSION__ === "string" ? __VERSION__ : "0.0.0-dev";
	const results: PipelineResult[] = [];

	await ensureRegtraceDir(configDir);

	const enabledSets = config.golden_sets.filter((gs) => gs.enabled);

	for (const gsEntry of enabledSets) {
		const prep = await prepareGoldenSet(configDir, gsEntry.path);
		if (!("name" in prep)) {
			printError(
				`Failed to load golden set "${gsEntry.path}": ${prep.errors.map((e) => e.message).join("; ")}`,
			);
			continue;
		}

		if (!options.quiet) {
			printInfo(
				`Evaluating "${prep.name}" (${prep.testCases.length} test cases)`,
			);
			if (prep.description) printInfo(prep.description);
		}

		const baseline = await findBaselineRun(
			configDir,
			config.metrics.regression.baseline_strategy,
			config.metrics.regression.pinned_run_id ?? undefined,
		);

		// --generate: fill null actual_output (in-place on parsed data, never mutates YAML)
		for (const tc of prep.testCases) {
			if (options.generate && tc.actual_output == null) {
				const genCfg = config.generator ?? config.judge.primary;
				if (!options.quiet) {
					printInfo(
						`  Generating output for "${tc.id}" via ${genCfg.provider}/${genCfg.model}`,
					);
				}
				tc.actual_output = await generateOutput(
					tc.input,
					tc.system_prompt,
					genCfg,
				);
			}
		}

		// Build params and evaluate using evaluateSuite (handles weighted scoring)
		const evalParams = prep.testCases.map((tc) =>
			buildTestCaseParams(config, tc, baseline, prep.version),
		);

		const evalResult = await evaluateSuite({
			config,
			testCases: evalParams,
		});

		const record = await createRunRecord(configDir, {
			status: "passed",
			trigger,
			durationMs: Date.now() - startTime,
			regtraceVersion,
			judgeProvider: judgeCfg.provider,
			judgeModel: judgeCfg.model,
			configContent,
			goldenSetName: prep.name,
			goldenSetVersion: prep.version,
			goldenSetContent: prep.goldenSetContent,
			suiteScore: evalResult.suiteScore,
			metricSummary: evalResult.metricSummary,
			testCaseResults: evalResult.testCaseResults,
			regression: evalResult.regression,
		});

		const qualityGates = checkQualityGates(record, config);
		const finalStatus = qualityGates.passed ? "passed" : "failed";

		if (finalStatus !== record.status) {
			record.status = finalStatus;
			// Rewrite the file with correct status
			writeFileSync(
				resolve(configDir, ".regtrace", "runs", `${record.run_id}.json`),
				JSON.stringify(record, null, 2),
				"utf-8",
			);
		}

		// Write to DB if enabled
		const dbEnabled =
			config.storage?.db.enabled && gsEntry.store_in_db !== false;
		if (dbEnabled) {
			try {
				const db = initDb(
					resolve(
						configDir,
						config.storage?.db.path ?? ".regtrace/regtrace.db",
					),
				);
				saveRunRecord(db, record);
			} catch (err) {
				printInfo(
					`DB insert failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}

		results.push({ run: record, qualityGates });
	}

	return results;
}
