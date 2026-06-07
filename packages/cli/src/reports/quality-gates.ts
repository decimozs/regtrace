import { checkNfrGates, nfrAllPassed } from "../metrics/nfr";
import type { Config } from "../schema/config.schema";
import type { RunRecord } from "../schema/run-record.schema";
import type { QualityGateResult } from "./types";

/**
 * Evaluates all configured quality gates against a completed run record.
 *
 * Checks suite score minimum, per-metric score minimums, max failed test cases,
 * max low-confidence ratio, and optional regression gate. A gate must be
 * explicitly configured to appear in the results; absent configuration is skipped.
 *
 * @param record - The completed run record to evaluate
 * @param config - The run configuration defining gate thresholds
 * @returns A {@link QualityGateResult} with an overall pass/fail and per-gate details
 */
export function checkQualityGates(
	record: RunRecord,
	config: Config,
): QualityGateResult {
	const gates: QualityGateResult["gates"] = {};
	let allPassed = true;

	const minScore = config.quality_gates.suite_score_minimum;
	const suitePassed = record.suite_score >= minScore;
	gates.suiteScore = {
		passed: suitePassed,
		actual: record.suite_score,
		minimum: minScore,
	};
	if (!suitePassed) allPassed = false;

	if (config.quality_gates.metric_score_minimums) {
		const failures: { metric: string; actual: number; minimum: number }[] = [];
		for (const [metric, min] of Object.entries(
			config.quality_gates.metric_score_minimums,
		)) {
			const summary = record.metric_summary[metric];
			if (summary && summary.score < min) {
				failures.push({ metric, actual: summary.score, minimum: min });
			}
		}
		if (failures.length > 0) allPassed = false;
		gates.metricScores = { passed: failures.length === 0, failures };
	}

	const maxFailed = config.quality_gates.max_failed_test_cases;
	const failedCount = record.test_case_results.filter(
		(tc) => tc.severity === "fail",
	).length;
	const failedPassed = failedCount <= maxFailed;
	gates.maxFailedCases = {
		passed: failedPassed,
		actual: failedCount,
		maximum: maxFailed,
	};
	if (!failedPassed) allPassed = false;

	// Low-confidence means any metric result with confidence below 0.5
	const maxLowConf = config.quality_gates.max_low_confidence_ratio;
	const lowConfCount = record.test_case_results.filter((tc) => {
		return Object.values(tc.metric_results).some((mr) => mr.confidence < 0.5);
	}).length;
	const lowConfRatio =
		record.test_case_results.length > 0
			? lowConfCount / record.test_case_results.length
			: 0;
	const lowConfPassed = lowConfRatio <= maxLowConf;
	gates.maxLowConfidence = {
		passed: lowConfPassed,
		actual: lowConfRatio,
		maximum: maxLowConf,
	};
	if (!lowConfPassed) allPassed = false;

	if (config.quality_gates.regression_gate) {
		const regStatus = record.regression.regression_status;
		const regPassed = regStatus === "clean";
		gates.regression = { passed: regPassed, status: regStatus };
		if (!regPassed) allPassed = false;
	}

	if (config.nfr_gates) {
		const nfrResult = checkNfrGates(record, config.nfr_gates);
		const nfrPassed = nfrAllPassed(nfrResult);
		gates.nfr = { passed: nfrPassed, gates: nfrResult };
		if (!nfrPassed) allPassed = false;
	}

	return { passed: allPassed, gates };
}
