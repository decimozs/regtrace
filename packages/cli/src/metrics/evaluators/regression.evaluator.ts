import type {
	MetricResult,
	RegressionBlock,
} from "../../schema/run-record.schema";
import type { EvaluateInput, MetricEvaluator } from "../types";

/** A snapshot of a previous run used as the baseline for regression comparison. */
export interface BaselineRecord {
	run_id: string;
	golden_set_version: string;
	suite_score: number;
	metric_summary: Record<string, { score: number; pass_rate: number }>;
}

/** Context injected into the regression evaluator carrying the baseline and current golden-set version. */
export interface RegressionContext {
	baseline: BaselineRecord | null;
	currentGoldenSetVersion: string;
}

/**
 * Computes the relative percentage change from `baseline` to `current`.
 * Returns 1 when `baseline` is 0 (any positive improvement is maximal), and 0 when both are 0.
 * @param current - The current score
 * @param baseline - The baseline score to compare against
 * @returns A signed delta as a fraction (e.g. -0.1 means a 10% regression)
 */
function calculateDelta(current: number, baseline: number): number {
	if (baseline === 0) return current > 0 ? 1 : 0;
	return (current - baseline) / baseline;
}

/**
 * Classifies a suite-level delta into a regression severity.
 * @param suiteDelta - The fractional change in suite score from baseline
 * @param tolerance - The maximum acceptable negative delta before warning (e.g. 0.05 = 5%)
 * @param criticalThreshold - The delta below which regression is marked critical (e.g. 0.15 = 15%)
 * @returns `"clean"` if within tolerance, `"warning"` if below tolerance but above critical, or `"critical"`
 */
function determineRegressionStatus(
	suiteDelta: number,
	tolerance: number,
	criticalThreshold: number,
): "clean" | "warning" | "critical" {
	if (suiteDelta >= -tolerance) return "clean";
	if (suiteDelta >= -criticalThreshold) return "warning";
	return "critical";
}

/**
 * Builds the regression block for a run record by comparing current scores against a baseline.
 *
 * When no baseline is available, returns a clean block with zero delta and no excluded test cases.
 * When `excludeNewTestCases` is enabled, test cases not present in the baseline summary are excluded
 * from the regression comparison to avoid false positives from expanding test coverage.
 *
 * @param baseline - The baseline record, or `null` for a first run
 * @param currentGoldenSetVersion - The version of the golden set being evaluated
 * @param suiteScore - The current weighted suite score
 * @param metricResults - Per-metric results from the current run
 * @param testCaseIds - The IDs of test cases in the current run
 * @param config - Regression configuration including tolerance, critical threshold, and exclusion setting
 * @returns A {@link RegressionBlock} suitable for inclusion in a run record
 */
export function buildRegressionBlock(
	baseline: BaselineRecord | null,
	currentGoldenSetVersion: string,
	suiteScore: number,
	metricResults: Record<string, MetricResult>,
	testCaseIds: string[],
	config: {
		tolerance: number;
		criticalThreshold: number;
		excludeNewTestCases: boolean;
	},
): RegressionBlock {
	if (!baseline) {
		return {
			baseline_run_id: null,
			baseline_golden_set_version: null,
			current_golden_set_version: currentGoldenSetVersion,
			version_change_detected: false,
			suite_delta: 0,
			regression_status: "clean",
			test_cases_excluded: [],
			metric_deltas: {},
		};
	}

	const versionChange = currentGoldenSetVersion !== baseline.golden_set_version;

	const excludedTestCases: string[] = [];
	const includedTestCases: string[] = [];
	if (config.excludeNewTestCases && baseline) {
		for (const tcId of testCaseIds) {
			if (baseline.metric_summary[tcId]) {
				includedTestCases.push(tcId);
			} else {
				excludedTestCases.push(tcId);
			}
		}
	}

	const suiteDelta = calculateDelta(suiteScore, baseline.suite_score);

	const metricDeltas: Record<string, number> = {};
	for (const [metricName, result] of Object.entries(metricResults)) {
		const baselineMetric = baseline.metric_summary[metricName];
		if (baselineMetric) {
			metricDeltas[metricName] = calculateDelta(
				result.score,
				baselineMetric.score,
			);
		} else {
			// Metrics absent from baseline are treated as neutral (0 delta)
			metricDeltas[metricName] = 0;
		}
	}

	const regressionStatus = determineRegressionStatus(
		suiteDelta,
		config.tolerance,
		config.criticalThreshold,
	);

	return {
		baseline_run_id: baseline.run_id,
		baseline_golden_set_version: baseline.golden_set_version,
		current_golden_set_version: currentGoldenSetVersion,
		version_change_detected: versionChange,
		suite_delta: suiteDelta,
		regression_status: regressionStatus,
		test_cases_excluded: excludedTestCases,
		metric_deltas: metricDeltas,
	};
}

/**
 * Evaluates whether the current output represents a regression compared to the baseline.
 *
 * Falls back to a perfect score (1.0, passed) when no baseline exists. Otherwise, computes a delta
 * against the baseline suite score and maps it to a pass/warn/fail status. The resulting score is
 * discretised: 1 for clean, 0.5 for warning, and 0 for critical.
 *
 * @param input - The evaluation input including regression context and metric config with tolerance/threshold overrides
 * @returns A deterministic {@link MetricResult} indicating regression status
 */
export const regressionEvaluator: MetricEvaluator = {
	metricName: "regression",

	async evaluate(input: EvaluateInput): Promise<MetricResult> {
		const tolerance = (input.metricConfig.tolerance as number) ?? 0.05;
		const criticalThreshold =
			(input.metricConfig.critical_threshold as number) ?? 0.15;

		const regCtx = input.regressionContext as RegressionContext | undefined;
		const baseline = regCtx?.baseline ?? null;

		if (!baseline) {
			return {
				metric_name: "regression",
				score: 1,
				confidence: 1,
				passed: true,
				threshold: input.threshold,
				explanation: "No baseline available for regression comparison",
				evaluation_type: "deterministic",
				token_cost: 0,
			};
		}

		const currentScore = (input.metricConfig._currentScore as number) ?? 0;
		const delta = calculateDelta(currentScore, baseline.suite_score);
		const status = determineRegressionStatus(
			delta,
			tolerance,
			criticalThreshold,
		);

		// Discretise: clean → 1, critical → 0, warning → 0.5
		const passed = status === "clean";
		const score = passed ? 1 : delta < -criticalThreshold ? 0 : 0.5;

		return {
			metric_name: "regression",
			score,
			confidence: 1,
			passed,
			threshold: input.threshold,
			explanation: `Regression delta: ${(delta * 100).toFixed(1)}% (${status})`,
			evaluation_type: "deterministic",
			token_cost: 0,
		};
	},
};
