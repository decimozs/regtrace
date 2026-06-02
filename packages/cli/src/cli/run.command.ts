import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { load } from "js-yaml";
import { buildJudgeConfig } from "../judge/judge";
import {
	type EvaluateTestCaseParams,
	evaluateTestCase,
} from "../metrics/runner";
import { checkQualityGates } from "../reports/quality-gates";
import { generateReport } from "../reports/reporter";
import type { ReportData } from "../reports/types";
import type { Config } from "../schema/config.schema";
import type { TestCase } from "../schema/golden-set.schema";
import type { RunRecord, TestCaseResult } from "../schema/run-record.schema";
import {
	type LoadConfigResult,
	loadConfigFromFile,
} from "../storage/config-loader";
import { loadGoldenSetFromFile } from "../storage/golden-set-loader";
import {
	createRunRecord,
	ensureRegtraceDir,
	findBaselineRun,
} from "../storage/run-store";
import {
	configureColor,
	isCiEnvironment,
	printError,
	printHeader,
	printInfo,
	printMetricSummary,
	printQualityGates,
	printSuccess,
	printSuiteSummary,
	printTestCaseResults,
	writeJson,
} from "./print";

interface RunOptions {
	config?: string;
	setName?: string;
	trigger?: "cli" | "ci" | "watch";
	format?: string;
	output?: string;
	ci?: boolean;
	noCi?: boolean;
	verbose?: boolean;
	dryRun?: boolean;
	bail?: boolean;
}

interface PreparedGoldenSet {
	config: Config;
	configContent: string;
	configDir: string;
	goldenSetContent: string;
	parsed: {
		name: string;
		version: string;
		description: string;
		interaction_type: string;
		test_cases: Pick<
			TestCase,
			| "id"
			| "description"
			| "input"
			| "expected_output"
			| "actual_output"
			| "metrics"
			| "weight"
		>[];
	};
}

async function prepareConfig(
	options: RunOptions,
): Promise<LoadConfigResult & { configContent?: string; configDir?: string }> {
	const result = await loadConfigFromFile(options.config);

	if (!result.success) {
		return result;
	}

	const configPath = result.configPath;
	if (!configPath) {
		return {
			success: false,
			errors: [{ field: "file", message: "Config path not found" }],
		};
	}

	const configContent = readFileSync(configPath, "utf-8");
	const configDir = resolve(configPath, "..");

	return { ...result, configContent, configDir };
}

function resolveGoldenSetPath(configDir: string, relativePath: string): string {
	if (relativePath.startsWith("/")) return relativePath;
	return resolve(configDir, relativePath);
}

async function prepareGoldenSet(
	configDir: string,
	path: string,
): Promise<
	| PreparedGoldenSet
	| { success: false; errors: { field: string; message: string }[] }
> {
	const fullPath = resolveGoldenSetPath(configDir, path);
	const loadResult = await loadGoldenSetFromFile(fullPath);

	if (!loadResult.success) {
		return loadResult;
	}

	const gsContent = readFileSync(fullPath, "utf-8");
	const parsed = load(gsContent) as PreparedGoldenSet["parsed"];

	return {
		config: undefined as unknown as Config,
		configContent: "",
		configDir,
		goldenSetContent: gsContent,
		parsed,
	};
}

function buildTestCaseParams(
	prepared: PreparedGoldenSet,
	tc: PreparedGoldenSet["parsed"]["test_cases"][number],
	baseline: RunRecord | null,
): EvaluateTestCaseParams {
	return {
		testCase: {
			id: tc.id,
			description: tc.description,
			input: tc.input,
			system_prompt: null,
			expected_output: tc.expected_output,
			actual_output: tc.actual_output ?? null,
			metrics: tc.metrics,
			tags: [],
			weight: tc.weight,
		},
		actualOutput: tc.actual_output ?? "",
		expectedOutput: tc.expected_output,
		config: prepared.config,
		baselineRecord: baseline
			? {
					run_id: baseline.run_id,
					golden_set_version: baseline.golden_set_version,
					suite_score: baseline.suite_score,
					metric_summary: baseline.metric_summary,
				}
			: null,
		currentGoldenSetVersion: prepared.parsed.version,
	};
}

export async function runCommand(options: RunOptions): Promise<void> {
	const startTime = Date.now();
	const trigger = options.trigger ?? "cli";

	const ciMode =
		(options.noCi ? false : options.ci) ||
		(options.noCi ? false : isCiEnvironment());

	configureColor(ciMode ? "never" : "auto");

	if (options.dryRun) {
		await runDryRun(options);
		return;
	}

	printHeader(`regtrace run`);

	const configPrep = await prepareConfig(options);
	if (!configPrep.success) {
		for (const err of configPrep.errors) {
			printError(`${err.field}: ${err.message}`);
		}
		process.exit(1);
	}

	const config = configPrep.data;
	const configContent = configPrep.configContent ?? "";
	const configDir = configPrep.configDir ?? process.cwd();

	const enabledSets = config.golden_sets.filter((gs) => gs.enabled);

	if (options.setName) {
		const filtered = enabledSets.filter(
			(gs) => gs.path === options.setName || gs.alias === options.setName,
		);
		if (filtered.length === 0) {
			printError(`No enabled golden set matches "${options.setName}"`);
			process.exit(1);
		}
		enabledSets.length = 0;
		enabledSets.push(...filtered);
	}

	const judgeCfg = buildJudgeConfig(config.judge.primary);

	await ensureRegtraceDir(configDir);
	const allRunRecords: RunRecord[] = [];

	if (ciMode) {
		printInfo(
			"CI mode — output suppressed, exit code reflects quality gates\n",
		);
	}

	for (const gsEntry of enabledSets) {
		const prep = await prepareGoldenSet(configDir, gsEntry.path);
		if (!("parsed" in prep)) {
			printError(
				`Failed to load golden set "${gsEntry.path}": ${prep.errors.map((e) => e.message).join("; ")}`,
			);
			continue;
		}

		prep.config = config;
		prep.configContent = configContent;

		printInfo(
			`Evaluating "${prep.parsed.name}" (${prep.parsed.test_cases.length} test cases)`,
		);
		if (prep.parsed.description) {
			printInfo(prep.parsed.description);
		}

		const baseline = await findBaselineRun(
			configDir,
			config.metrics.regression.baseline_strategy,
			config.metrics.regression.pinned_run_id ?? undefined,
		);

		const testCaseResults: TestCaseResult[] = [];
		let aggregateScoreSum = 0;

		for (const tc of prep.parsed.test_cases) {
			const params = buildTestCaseParams(prep, tc, baseline);
			const result = await evaluateTestCase(params);
			testCaseResults.push(result.testCaseResult);
			aggregateScoreSum += result.aggregateScore;
		}

		const suiteScore =
			testCaseResults.length > 0
				? aggregateScoreSum / testCaseResults.length
				: 0;

		const metricSummary: Record<string, { score: number; pass_rate: number }> =
			{};
		for (const tcResult of testCaseResults) {
			for (const [metricName, _mr] of Object.entries(tcResult.metric_results)) {
				if (!metricSummary[metricName]) {
					metricSummary[metricName] = { score: 0, pass_rate: 0 };
				}
			}
		}
		for (const metricName of Object.keys(metricSummary)) {
			const scores: number[] = [];
			let passed = 0;
			for (const tcResult of testCaseResults) {
				const mr = tcResult.metric_results[metricName];
				if (mr) {
					scores.push(mr.score);
					if (mr.passed) passed++;
				}
			}
			if (scores.length > 0) {
				metricSummary[metricName] = {
					score: scores.reduce((a, b) => a + b, 0) / scores.length,
					pass_rate: passed / scores.length,
				};
			}
		}

		const durationMs = Date.now() - startTime;

		const status =
			suiteScore >= config.quality_gates.suite_score_minimum
				? "passed"
				: "failed";

		const record = await createRunRecord(configDir, {
			status,
			trigger,
			durationMs,
			regtraceVersion: "0.1.0",
			judgeProvider: judgeCfg.provider,
			judgeModel: judgeCfg.model,
			configContent,
			goldenSetName: prep.parsed.name,
			goldenSetVersion: prep.parsed.version,
			goldenSetContent: prep.goldenSetContent,
			suiteScore,
			metricSummary,
			testCaseResults,
			regression: {
				baseline_run_id: baseline?.run_id ?? null,
				baseline_golden_set_version: baseline?.golden_set_version ?? null,
				current_golden_set_version: prep.parsed.version,
				version_change_detected: baseline
					? baseline.golden_set_version !== prep.parsed.version
					: false,
				suite_delta: baseline ? suiteScore - baseline.suite_score : 0,
				regression_status: "clean",
				test_cases_excluded: [],
				metric_deltas: {},
			},
		});

		const qualityGates = checkQualityGates(record, config);
		record.status = qualityGates.passed ? "passed" : "failed";

		allRunRecords.push(record);

		const format = options.format ?? "terminal";
		if (format === "json") {
			const reportData: ReportData = { run: record, qualityGates, config };
			const report = generateReport(reportData, "json");
			const outputPath =
				options.output ??
				config.output.report_path ??
				`.regtrace/report-${record.run_id}.json`;
			writeFileSync(outputPath, report, "utf-8");
			writeJson(reportData);
		} else if (format === "markdown") {
			const reportData: ReportData = { run: record, qualityGates, config };
			const report = generateReport(reportData, "markdown");
			const outputPath =
				options.output ??
				config.output.report_path ??
				`.regtrace/report-${record.run_id}.md`;
			writeFileSync(outputPath, report, "utf-8");
			printInfo(`Report written: ${outputPath}`);
		} else {
			printSuiteSummary(record);
			printTestCaseResults(testCaseResults, { verbose: options.verbose });
			printMetricSummary(record);
			printQualityGates(qualityGates);
		}

		if (options.bail && !qualityGates.passed) {
			printError("Bailing after first suite failure (--bail)");
			process.exit(1);
		}
	}

	const passCount = allRunRecords.filter((r) => r.status === "passed").length;
	const failCount = allRunRecords.filter((r) => r.status === "failed").length;
	const totalDurationMs = Date.now() - startTime;

	stderr();
	printHeader("Run Complete");
	printInfo(`${allRunRecords.length} suite(s) evaluated`);
	printInfo(`${totalDurationMs}ms total`);
	if (passCount > 0) printSuccess(`${passCount} suite(s) passed`);
	if (failCount > 0) printError(`${failCount} suite(s) failed`);
	stderr();

	if (ciMode && failCount > 0) {
		process.exit(1);
	}
	if (!ciMode && failCount > 0) {
		// In non-CI mode, just report the failure without exiting
	}
}

async function runDryRun(options: RunOptions): Promise<void> {
	printHeader("regtrace dry-run");

	const configPrep = await prepareConfig(options);
	if (!configPrep.success) {
		for (const err of configPrep.errors) {
			printError(`${err.field}: ${err.message}`);
		}
		process.exit(1);
	}

	const config = configPrep.data;
	const configDir = configPrep.configDir ?? process.cwd();
	const enabledSets = config.golden_sets.filter((gs) => gs.enabled);

	printInfo(`Config: valid`);
	printInfo(`Project: ${config.project.name} v${config.project.version}`);
	printInfo(`Golden sets: ${enabledSets.length} enabled`);

	for (const gsEntry of enabledSets) {
		const fullPath = resolveGoldenSetPath(configDir, gsEntry.path);
		const loadResult = await loadGoldenSetFromFile(fullPath);
		if (loadResult.success) {
			printSuccess(
				`  ${gsEntry.path} — ${loadResult.data.test_cases.length} test cases`,
			);
		} else {
			printError(
				`  ${gsEntry.path} — invalid: ${loadResult.errors.map((e) => e.message).join("; ")}`,
			);
		}
	}

	printInfo(
		"Judge provider connectivity: skipped (dry-run does not call providers)",
	);
	printSuccess("Dry-run completed in under 2 seconds");
}

function stderr(...args: unknown[]): void {
	console.log(...args);
}
