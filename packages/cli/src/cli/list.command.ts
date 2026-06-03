import { resolve } from "node:path";
import type { RunRecord } from "../schema/run-record.schema";
import { listRunRecords, loadRunRecord } from "../storage/run-store";
import {
	BOLD,
	CHECK,
	CROSS,
	GRAY,
	GREEN,
	printError,
	printHeader,
	printInfo,
	printMetricSummary,
	printRegressionStatus,
	printRunRecordRow,
	printSuiteSummary,
	printTestCaseResults,
	RED,
	RESET,
} from "./print";

/** Resolves the base directory from the config path option or falls back to cwd. */
function getBasePath(options: { config?: string }): string {
	if (options.config) return resolve(options.config, "..");
	return process.cwd();
}

/**
 * Lists all run records in summary (terminal) or JSON format.
 *
 * @param options.config - Path to the config file.
 * @param options.format - Output format: `"json"` for machine-readable, otherwise terminal.
 */
export async function listCommand(options: {
	config?: string;
	format?: string;
}): Promise<void> {
	const basePath = getBasePath(options);
	const records = await listRunRecords(basePath);

	if (records.length === 0) {
		if (options.format !== "json") printInfo("No run records found");
		else console.log(JSON.stringify([]));
		return;
	}

	if (options.format === "json") {
		console.log(JSON.stringify(records, null, 2));
		return;
	}

	printHeader("Run History");
	for (const record of records) {
		printRunRecordRow(record);
	}
	console.log();
	printInfo(`${records.length} run(s) total`);
}

/**
 * Shows run history: the latest run by default, a specific run with `--run-id`,
 * or a diff between two runs with `--diff`.
 *
 * @param options.config - Path to the config file.
 * @param options.runId - Specific run ID to inspect.
 * @param options.diff - Run ID(s) to diff. If only one ID is given, diffs it against
 *   its immediate predecessor in the run history.
 * @throws Exits with code 2 if the requested run is not found.
 * @example
 * // Show latest run
 * await historyCommand({ config: "./regtrace.config.yaml" });
 * // Diff two specific runs
 * await historyCommand({ config: "./regtrace.config.yaml", diff: "run-a", runId: "run-b" });
 */
export async function historyCommand(options: {
	config?: string;
	runId?: string;
	diff?: string;
}): Promise<void> {
	const basePath = getBasePath(options);

	if (options.diff) {
		if (options.runId) {
			await printDiff(basePath, options.runId, options.diff);
		} else {
			await printDiff(basePath, options.diff, undefined);
		}
		return;
	}

	if (options.runId) {
		const record = await loadRunRecord(basePath, options.runId);
		if (!record) {
			printError(
				`Run "${options.runId}" not found. Use \`regtrace list\` to see all runs.`,
			);
			process.exit(2);
		}
		printSuiteSummary(record);
		printTestCaseResults(record.test_case_results);
		printMetricSummary(record);
		printRegressionStatus(record);
		return;
	}

	const records = await listRunRecords(basePath);
	if (records.length === 0) {
		printInfo("No run records found");
		return;
	}

	const latest = records[0];
	if (latest) {
		printHeader("Latest Run");
		printSuiteSummary(latest);
		printTestCaseResults(latest.test_case_results);
		printMetricSummary(latest);
		printRegressionStatus(latest);
		printInfo(
			`Run "${latest.run_id}" shown. Use --run-id <id> to view a specific run.`,
		);
	}
}

/**
 * Prints a colored diff between two run records showing suite score delta,
 * per-metric changes, and per-test-case status transitions.
 *
 * @param basePath - Directory containing `.regtrace/runs/`.
 * @param runIdA - The newer run ID (required).
 * @param runIdB - The older run ID. If omitted, uses the immediate predecessor of `runIdA`.
 */
async function printDiff(
	basePath: string,
	runIdA?: string,
	runIdB?: string,
): Promise<void> {
	const records = await listRunRecords(basePath);

	if (!runIdA) {
		printError("Need at least one run ID. Usage: --diff <run-a> [run-b]");
		process.exit(2);
	}

	const recordA = await loadRunRecord(basePath, runIdA);
	if (!recordA) {
		printError(`Run "${runIdA}" not found`);
		process.exit(2);
	}

	let recordB: RunRecord | null;
	if (runIdB) {
		recordB = await loadRunRecord(basePath, runIdB);
		if (!recordB) {
			printError(`Run "${runIdB}" not found`);
			process.exit(2);
		}
	} else {
		// diff against immediate predecessor (next in sorted list)
		const idx = records.findIndex((r) => r.run_id === runIdA);
		if (idx < 0 || idx >= records.length - 1) {
			printError("No previous run to diff against. Specify two run IDs.");
			process.exit(2);
		}
		recordB = records[idx + 1] ?? null;
		if (!recordB) {
			printError("Previous run not found");
			process.exit(2);
		}
	}

	printHeader(`Diff: ${recordA.golden_set_name}`);

	const a = recordA;
	const b = recordB;
	const color = a.suite_score >= b.suite_score ? GREEN : RED;
	const sign = a.suite_score >= b.suite_score ? "+" : "";
	console.log(
		`  ${BOLD}Suite Score:${RESET} ${(b.suite_score * 100).toFixed(1)}% → ${(a.suite_score * 100).toFixed(1)}%  ${color}${sign}${((a.suite_score - b.suite_score) * 100).toFixed(1)}%${RESET}`,
	);
	console.log(
		`  ${BOLD}Run IDs:${RESET}    ${GRAY}${b.run_id}${RESET} → ${GRAY}${a.run_id}${RESET}`,
	);
	console.log(
		`  ${BOLD}Date:${RESET}       ${b.timestamp.slice(0, 10)} → ${a.timestamp.slice(0, 10)}`,
	);
	console.log();

	// Per-metric diff
	printHeader("Per-Metric Delta");
	for (const metricName of Object.keys(a.metric_summary)) {
		const mA = a.metric_summary[metricName];
		const mB = b.metric_summary[metricName];
		if (mA && mB) {
			const delta = mA.score - mB.score;
			const dc = delta >= 0 ? GREEN : RED;
			const ds = delta >= 0 ? "+" : "";
			const improved = mA.pass_rate > mB.pass_rate;
			const passIcon = improved ? GREEN : RED;
			console.log(
				`  ${metricName}: ${(mB.score * 100).toFixed(1)}% → ${(mA.score * 100).toFixed(1)}%  ${dc}${ds}${(delta * 100).toFixed(1)}%${RESET}  pass_rate: ${(mB.pass_rate * 100).toFixed(0)}% → ${passIcon}${(mA.pass_rate * 100).toFixed(0)}%${RESET}`,
			);
		}
	}
	console.log();

	// Per-test-case diff
	printHeader("Test Case Changes");
	const aMap = new Map(a.test_case_results.map((tc) => [tc.test_case_id, tc]));
	const bMap = new Map(b.test_case_results.map((tc) => [tc.test_case_id, tc]));

	for (const [id, tcA] of aMap) {
		const tcB = bMap.get(id);
		if (!tcB) {
			console.log(`  ${GREEN}+${RESET} ${id} (new)`);
			continue;
		}
		if (tcA.overall_passed !== tcB.overall_passed) {
			const icon = tcA.overall_passed ? GREEN : RED;
			const label = tcA.overall_passed ? "pass" : "fail";
			console.log(
				`  ${icon}${label === "pass" ? CHECK : CROSS}${RESET} ${id}: ${tcB.overall_passed ? "pass" : "fail"} → ${label}`,
			);
		}
	}
	for (const [id, _tcB] of bMap) {
		if (!aMap.has(id)) {
			console.log(`  ${RED}-${RESET} ${id} (removed)`);
		}
	}
	console.log();
}
