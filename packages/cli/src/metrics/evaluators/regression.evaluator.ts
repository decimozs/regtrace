import type {
	MetricResult,
	RegressionBlock,
} from "../../schema/run-record.schema";
import type { EvaluateInput, MetricEvaluator } from "../types";

export interface BaselineRecord {
	run_id: string;
	golden_set_version: string;
	suite_score: number;
	metric_summary: Record<string, { score: number; pass_rate: number }>;
}

export interface RegressionContext {
	baseline: BaselineRecord | null;
	currentGoldenSetVersion: string;
}

function calculateDelta(current: number, baseline: number): number {
	if (baseline === 0) return current > 0 ? 1 : 0;
	return (current - baseline) / baseline;
}

function determineRegressionStatus(
	suiteDelta: number,
	tolerance: number,
	criticalThreshold: number,
): "clean" | "warning" | "critical" {
	if (suiteDelta >= -tolerance) return "clean";
	if (suiteDelta >= -criticalThreshold) return "warning";
	return "critical";
}

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
