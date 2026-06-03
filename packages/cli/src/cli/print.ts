import type { QualityGateResult } from "../reports/types";
import type {
	MetricResult,
	RunRecord,
	TestCaseResult,
} from "../schema/run-record.schema";

/** ANSI reset sequence. */
export const RESET = "\x1b[0m";
/** ANSI bold sequence. */
export const BOLD = "\x1b[1m";
/** ANSI green sequence. */
export const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
/** ANSI red sequence. */
export const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
/** ANSI gray sequence. */
export const GRAY = "\x1b[90m";

/** Check mark symbol for passing results. */
export const CHECK = "\u2713";
/** Cross mark symbol for failing results. */
export const CROSS = "\u2717";
/** Warning symbol for marginal results. */
export const WARN = "\u26A0";

/** Whether color output is currently enabled. Toggled by {@link configureColor}. */
let useColor = true;

/**
 * Detects whether the process is running inside a known CI environment.
 * @returns `true` if `CI`, `GITHUB ACTIONS`, `GITLAB_CI`, or `CIRCLECI` is set.
 */
export function isCiEnvironment(): boolean {
	return !!(
		process.env.CI ||
		process.env.GITHUB_ACTIONS ||
		process.env.GITLAB_CI ||
		process.env.CIRCLECI
	);
}

/**
 * Checks whether `NO_COLOR` is set (per https://no-color.org).
 * @returns `true` when `NO_COLOR` is present and non-empty.
 */
export function isNoColor(): boolean {
	return process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== "";
}

/**
 * Configures color output for all print helpers.
 * - `"never"`: Disables color unconditionally.
 * - `"always"`: Forces color on even without a TTY.
 * - `"auto"`: Enables color only when stdout is a TTY and no `NO_COLOR`/CI override is active.
 *
 * @param colorSetting - One of `"auto"`, `"always"`, or `"never"`.
 */
export function configureColor(
	colorSetting: "auto" | "always" | "never",
): void {
	if (colorSetting === "never") {
		useColor = false;
	} else if (colorSetting === "auto") {
		useColor = !isNoColor() && !isCiEnvironment() && process.stdout.isTTY;
	} else {
		useColor = true;
	}
}

/** Wraps `text` in an ANSI color if color output is enabled. */
function maybeColor(color: string, text: string): string {
	return useColor ? `${color}${text}${RESET}` : text;
}

/** Returns an ANSI opener sequence if color is enabled, otherwise empty string. */
function c(open: string): string {
	return useColor ? open : "";
}

/** Returns an ANSI closer sequence if color is enabled, otherwise empty string. */
function _c(close: string): string {
	return useColor ? close : "";
}

/** Returns the symbol unchanged; placeholder for future no-symbol mode. */
function icon(symbol: string): string {
	return symbol;
}

/** Writes to stderr (all CLI output goes to stderr; stdout is reserved for JSON). */
function stderr(...args: unknown[]): void {
	console.error(...args);
}

/**
 * Writes a JSON blob to stdout (for machine-readable output mode).
 * @param data - Any serializable value.
 */
export function writeJson(data: unknown): void {
	console.log(JSON.stringify(data, null, 2));
}

/** Formats a numeric score as a color-coded percentage (green >= 70%, yellow >= 40%, red below). */
function formatScore(score: number): string {
	const color = score >= 0.7 ? GREEN : score >= 0.4 ? YELLOW : RED;
	return maybeColor(color, `${(score * 100).toFixed(1)}%`);
}

/** Formats a numeric delta as a signed, color-coded percentage. */
function formatDelta(delta: number): string {
	const color = delta >= 0 ? GREEN : RED;
	const sign = delta >= 0 ? "+" : "";
	return maybeColor(color, `${sign}${(delta * 100).toFixed(1)}%`);
}

/** Maps a severity level to an ANSI color sequence. */
function severityColor(severity: string): string {
	if (!useColor) return "";
	switch (severity) {
		case "pass":
			return GREEN;
		case "warn":
			return YELLOW;
		case "fail":
			return RED;
		default:
			return "";
	}
}

/**
 * Prints a section header with cyan bold formatting.
 * @param text - Header label.
 */
export function printHeader(text: string): void {
	stderr(`\n${c(BOLD)}${c(CYAN)}=== ${text} ===${_c(RESET)}\n`);
}

/**
 * Prints the top-level suite summary: name, version, status, score, run ID,
 * timestamp, duration, and trigger.
 * @param record - The run record to summarize.
 */
export function printSuiteSummary(record: RunRecord): void {
	const statusIcon =
		record.status === "passed"
			? icon(CHECK)
			: record.status === "failed"
				? icon(CROSS)
				: icon(WARN);
	stderr(
		`${c(BOLD)}Suite:${_c(RESET)} ${record.golden_set_name} v${record.golden_set_version}`,
	);
	stderr(
		`${c(BOLD)}Status:${_c(RESET)} ${maybeColor(record.status === "passed" ? GREEN : RED, statusIcon)} ${record.status}`,
	);
	stderr(`${c(BOLD)}Score:${_c(RESET)} ${formatScore(record.suite_score)}`);
	stderr(`${c(BOLD)}Run ID:${_c(RESET)} ${record.run_id}`);
	stderr(`${c(BOLD)}Timestamp:${_c(RESET)} ${record.timestamp}`);
	stderr(`${c(BOLD)}Duration:${_c(RESET)} ${record.duration_ms}ms`);
	stderr(`${c(BOLD)}Trigger:${_c(RESET)} ${record.trigger}`);
	stderr();
}

/**
 * Prints per-metric score and pass-rate lines for a run record.
 * @param record - The run record whose `metric_summary` to display.
 */
export function printMetricSummary(record: RunRecord): void {
	stderr(`${c(BOLD)}Metric Summary:${_c(RESET)}`);
	for (const [name, summary] of Object.entries(record.metric_summary)) {
		const color =
			summary.score >= 0.7 ? GREEN : summary.score >= 0.4 ? YELLOW : RED;
		stderr(
			`  ${name}: ${maybeColor(color, `${(summary.score * 100).toFixed(0)}%`)} (pass rate: ${(summary.pass_rate * 100).toFixed(0)}%)`,
		);
	}
	stderr();
}

/**
 * Prints test case results. By default shows only failing cases;
 * pass `{ verbose: true }` to show all.
 *
 * @param results - Array of test case results to display.
 * @param options.verbose - When `true`, includes passing test cases.
 */
export function printTestCaseResults(
	results: TestCaseResult[],
	options?: { verbose?: boolean },
): void {
	const filtered = options?.verbose
		? results
		: results.filter((tc) => !tc.overall_passed);
	if (filtered.length === 0) return;

	stderr(`${c(BOLD)}Test Cases:${_c(RESET)}`);
	for (const tc of filtered) {
		const color = severityColor(tc.severity);
		const sym = icon(tc.overall_passed ? CHECK : CROSS);
		stderr(`  ${maybeColor(color, sym)} ${maybeColor(color, tc.test_case_id)}`);

		for (const [metricName, mr] of Object.entries(tc.metric_results)) {
			const mColor = mr.passed ? GREEN : RED;
			stderr(
				`    ${metricName}: ${maybeColor(mColor, `${(mr.score * 100).toFixed(0)}%`)} (threshold: ${(mr.threshold * 100).toFixed(0)}%)`,
			);
		}
	}
	stderr();
}

/**
 * Prints the regression status section: suite delta, baseline reference,
 * and any excluded test case IDs.
 * @param record - The run record whose regression data to display.
 */
export function printRegressionStatus(record: RunRecord): void {
	const reg = record.regression;
	const color =
		reg.regression_status === "clean"
			? GREEN
			: reg.regression_status === "warning"
				? YELLOW
				: RED;

	stderr(
		`${c(BOLD)}Regression:${_c(RESET)} ${maybeColor(color, reg.regression_status)}`,
	);
	stderr(`  Suite delta: ${formatDelta(reg.suite_delta)}`);
	stderr(`  Baseline: ${reg.baseline_run_id ?? "none"}`);
	if (reg.test_cases_excluded.length > 0) {
		stderr(`  Excluded: ${reg.test_cases_excluded.join(", ")}`);
	}
	stderr();
}

/**
 * Prints the quality gates section showing pass/fail for each gate
 * (suite score, metric scores, max failed cases, low-confidence ratio, regression).
 * @param gates - The quality gate result object.
 */
export function printQualityGates(gates: QualityGateResult): void {
	stderr(`${c(BOLD)}Quality Gates:${_c(RESET)}`);
	const overallIcon = icon(gates.passed ? CHECK : CROSS);
	stderr(
		`  ${maybeColor(gates.passed ? GREEN : RED, overallIcon)} Overall: ${gates.passed ? "PASSED" : "FAILED"}`,
	);

	const g = gates.gates;
	if (g.suiteScore) {
		const gi = g.suiteScore.passed ? GREEN : RED;
		stderr(
			`  ${maybeColor(gi, icon(g.suiteScore.passed ? CHECK : CROSS))} Suite Score: ${(g.suiteScore.actual * 100).toFixed(1)}% >= ${(g.suiteScore.minimum * 100).toFixed(0)}%`,
		);
	}
	if (g.metricScores && g.metricScores.failures.length > 0) {
		for (const f of g.metricScores.failures) {
			stderr(
				`  ${maybeColor(RED, icon(CROSS))} Metric "${f.metric}": ${(f.actual * 100).toFixed(1)}% < ${(f.minimum * 100).toFixed(0)}%`,
			);
		}
	}
	if (g.maxFailedCases) {
		const gi = g.maxFailedCases.passed ? GREEN : RED;
		stderr(
			`  ${maybeColor(gi, icon(g.maxFailedCases.passed ? CHECK : CROSS))} Failed Cases: ${g.maxFailedCases.actual} <= ${g.maxFailedCases.maximum}`,
		);
	}
	if (g.maxLowConfidence) {
		const gi = g.maxLowConfidence.passed ? GREEN : RED;
		stderr(
			`  ${maybeColor(gi, icon(g.maxLowConfidence.passed ? CHECK : CROSS))} Low-Conf Ratio: ${(g.maxLowConfidence.actual * 100).toFixed(1)}% <= ${(g.maxLowConfidence.maximum * 100).toFixed(0)}%`,
		);
	}
	if (g.regression) {
		const gi = g.regression.passed ? GREEN : YELLOW;
		stderr(
			`  ${maybeColor(gi, icon(g.regression.passed ? CHECK : WARN))} Regression: ${g.regression.status}`,
		);
	}
	stderr();
}

/**
 * Prints a single-line run record summary for list output:
 * `run_id  date time  status  score  golden_set  judge`.
 * @param record - The run record to display.
 */
export function printRunRecordRow(record: RunRecord): void {
	const date = record.timestamp.slice(0, 10);
	const time = record.timestamp.slice(11, 19);
	const statusIcon =
		record.status === "passed"
			? icon(CHECK)
			: record.status === "failed"
				? icon(CROSS)
				: icon(WARN);
	const score = formatScore(record.suite_score);

	stderr(
		`${record.run_id}  ${date} ${time}  ${statusIcon}  ${score}  ${record.golden_set_name} v${record.golden_set_version}  ${record.judge_provider}/${record.judge_model}`,
	);
}

/** Prints an error message to stderr with a red cross prefix. */
export function printError(message: string): void {
	stderr(`${maybeColor(RED, icon(CROSS))} ${message}`);
}

/** Prints a success message to stderr with a green check prefix. */
export function printSuccess(message: string): void {
	stderr(`${maybeColor(GREEN, icon(CHECK))} ${message}`);
}

/** Prints an informational message to stderr with a cyan "i" prefix. */
export function printInfo(message: string): void {
	stderr(`${c(CYAN)}i${_c(RESET)} ${message}`);
}

/**
 * Prints a single metric result line with score, threshold, and confidence.
 * Includes the judge's explanation if available.
 *
 * @param metricName - Display name of the metric.
 * @param result - The metric result to display.
 */
export function printMetricResult(
	metricName: string,
	result: MetricResult,
): void {
	const sym = icon(result.passed ? CHECK : CROSS);
	const mColor = result.passed ? GREEN : RED;
	stderr(
		`  ${maybeColor(mColor, sym)} ${metricName}: ${maybeColor(mColor, `${(result.score * 100).toFixed(0)}%`)} (threshold: ${(result.threshold * 100).toFixed(0)}%, confidence: ${(result.confidence * 100).toFixed(0)}%)`,
	);
	if (result.explanation) {
		stderr(`    ${c(GRAY)}${result.explanation}${_c(RESET)}`);
	}
}
