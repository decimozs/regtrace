import type { QualityGateResult } from "../reports/types";
import type {
	MetricResult,
	RunRecord,
	TestCaseResult,
} from "../schema/run-record.schema";

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
export const GRAY = "\x1b[90m";
const _WHITE = "\x1b[37m";

export const CHECK = "\u2713";
export const CROSS = "\u2717";
export const WARN = "\u26A0";

function _statusIcon(passed: boolean): string {
	return passed ? `${GREEN}${CHECK}${RESET}` : `${RED}${CROSS}${RESET}`;
}

function severityColor(severity: string): string {
	switch (severity) {
		case "pass":
			return `${GREEN}`;
		case "warn":
			return `${YELLOW}`;
		case "fail":
			return `${RED}`;
		default:
			return "";
	}
}

export function printHeader(text: string): void {
	console.log(`\n${BOLD}${CYAN}=== ${text} ===${RESET}\n`);
}

export function printSuiteSummary(record: RunRecord): void {
	const statusIcon =
		record.status === "passed"
			? `${GREEN}${CHECK}${RESET}`
			: record.status === "failed"
				? `${RED}${CROSS}${RESET}`
				: `${YELLOW}${WARN}${RESET}`;
	console.log(
		`${BOLD}Suite:${RESET} ${record.golden_set_name} v${record.golden_set_version}`,
	);
	console.log(`${BOLD}Status:${RESET} ${statusIcon} ${record.status}`);
	console.log(`${BOLD}Score:${RESET} ${formatScore(record.suite_score)}`);
	console.log(`${BOLD}Run ID:${RESET} ${record.run_id}`);
	console.log(`${BOLD}Timestamp:${RESET} ${record.timestamp}`);
	console.log(`${BOLD}Duration:${RESET} ${record.duration_ms}ms`);
	console.log(`${BOLD}Trigger:${RESET} ${record.trigger}`);
	console.log();
}

export function printMetricSummary(record: RunRecord): void {
	console.log(`${BOLD}Metric Summary:${RESET}`);
	for (const [name, summary] of Object.entries(record.metric_summary)) {
		const color =
			summary.score >= 0.7 ? GREEN : summary.score >= 0.4 ? YELLOW : RED;
		console.log(
			`  ${name}: ${color}${(summary.score * 100).toFixed(0)}%${RESET} (pass rate: ${(summary.pass_rate * 100).toFixed(0)}%)`,
		);
	}
	console.log();
}

export function printTestCaseResults(results: TestCaseResult[]): void {
	console.log(`${BOLD}Test Cases:${RESET}`);
	for (const tc of results) {
		const color = severityColor(tc.severity);
		const icon = tc.overall_passed
			? `${GREEN}${CHECK}${RESET}`
			: `${RED}${CROSS}${RESET}`;
		console.log(`  ${icon} ${color}${tc.test_case_id}${RESET}`);

		for (const [metricName, mr] of Object.entries(tc.metric_results)) {
			const mColor = mr.passed ? GREEN : RED;
			console.log(
				`    ${metricName}: ${mColor}${(mr.score * 100).toFixed(0)}%${RESET} (threshold: ${(mr.threshold * 100).toFixed(0)}%)`,
			);
		}
	}
	console.log();
}

export function printRegressionStatus(record: RunRecord): void {
	const reg = record.regression;
	const color =
		reg.regression_status === "clean"
			? GREEN
			: reg.regression_status === "warning"
				? YELLOW
				: RED;
	const icon =
		reg.regression_status === "clean"
			? `${GREEN}${CHECK}${RESET}`
			: `${color}${WARN}${RESET}`;

	console.log(
		`${BOLD}Regression:${RESET} ${icon} ${color}${reg.regression_status}${RESET}`,
	);
	console.log(`  Suite delta: ${formatDelta(reg.suite_delta)}`);
	console.log(`  Baseline: ${reg.baseline_run_id ?? "none"}`);
	if (reg.test_cases_excluded.length > 0) {
		console.log(`  Excluded: ${reg.test_cases_excluded.join(", ")}`);
	}
	console.log();
}

export function printQualityGates(gates: QualityGateResult): void {
	console.log(`${BOLD}Quality Gates:${RESET}`);
	const icon = gates.passed
		? `${GREEN}${CHECK}${RESET}`
		: `${RED}${CROSS}${RESET}`;
	console.log(`  ${icon} Overall: ${gates.passed ? "PASSED" : "FAILED"}`);

	const g = gates.gates;
	if (g.suiteScore) {
		const gi = g.suiteScore.passed ? GREEN : RED;
		console.log(
			`  ${gi}${g.suiteScore.passed ? CHECK : CROSS}${RESET} Suite Score: ${(g.suiteScore.actual * 100).toFixed(1)}% >= ${(g.suiteScore.minimum * 100).toFixed(0)}%`,
		);
	}
	if (g.metricScores && g.metricScores.failures.length > 0) {
		for (const f of g.metricScores.failures) {
			console.log(
				`  ${RED}${CROSS}${RESET} Metric "${f.metric}": ${(f.actual * 100).toFixed(1)}% < ${(f.minimum * 100).toFixed(0)}%`,
			);
		}
	}
	if (g.maxFailedCases) {
		const gi = g.maxFailedCases.passed ? GREEN : RED;
		console.log(
			`  ${gi}${g.maxFailedCases.passed ? CHECK : CROSS}${RESET} Failed Cases: ${g.maxFailedCases.actual} <= ${g.maxFailedCases.maximum}`,
		);
	}
	if (g.maxLowConfidence) {
		const gi = g.maxLowConfidence.passed ? GREEN : RED;
		console.log(
			`  ${gi}${g.maxLowConfidence.passed ? CHECK : CROSS}${RESET} Low-Conf Ratio: ${(g.maxLowConfidence.actual * 100).toFixed(1)}% <= ${(g.maxLowConfidence.maximum * 100).toFixed(0)}%`,
		);
	}
	if (g.regression) {
		const gi = g.regression.passed ? GREEN : YELLOW;
		const ri = g.regression.passed ? CHECK : WARN;
		console.log(`  ${gi}${ri}${RESET} Regression: ${g.regression.status}`);
	}
	console.log();
}

function formatScore(score: number): string {
	const color = score >= 0.7 ? GREEN : score >= 0.4 ? YELLOW : RED;
	return `${color}${(score * 100).toFixed(1)}%${RESET}`;
}

function formatDelta(delta: number): string {
	const color = delta >= 0 ? GREEN : RED;
	const sign = delta >= 0 ? "+" : "";
	return `${color}${sign}${(delta * 100).toFixed(1)}%${RESET}`;
}

export function printRunRecordRow(record: RunRecord): void {
	const date = record.timestamp.slice(0, 10);
	const time = record.timestamp.slice(11, 19);
	const statusIcon =
		record.status === "passed"
			? `${GREEN}${CHECK}${RESET}`
			: record.status === "failed"
				? `${RED}${CROSS}${RESET}`
				: `${YELLOW}${WARN}${RESET}`;
	const score = formatScore(record.suite_score);

	console.log(
		`${record.run_id}  ${date} ${time}  ${statusIcon}  ${score}  ${record.golden_set_name} v${record.golden_set_version}  ${record.judge_provider}/${record.judge_model}`,
	);
}

export function printError(message: string): void {
	console.error(`${RED}${CROSS}${RESET} ${message}`);
}

export function printSuccess(message: string): void {
	console.log(`${GREEN}${CHECK}${RESET} ${message}`);
}

export function printInfo(message: string): void {
	console.log(`${CYAN}i${RESET} ${message}`);
}

export function printMetricResult(
	metricName: string,
	result: MetricResult,
): void {
	const icon = result.passed
		? `${GREEN}${CHECK}${RESET}`
		: `${RED}${CROSS}${RESET}`;
	console.log(
		`  ${icon} ${metricName}: ${(result.score * 100).toFixed(0)}% (threshold: ${(result.threshold * 100).toFixed(0)}%, confidence: ${(result.confidence * 100).toFixed(0)}%)`,
	);
	if (result.explanation) {
		console.log(`    ${GRAY}${result.explanation}${RESET}`);
	}
}
