import type { ReportData, ReportGenerator } from "./types";

/**
 * Generates a structured JSON report from run data, including suite metadata, per-metric summaries,
 * quality gate results, regression status, judge info, and detailed test case results.
 *
 * @param data - The run record and quality gate results to report on
 * @returns A pretty-printed JSON string
 */
export const jsonReporter: ReportGenerator = {
	generate(data: ReportData): string {
		const payload = {
			suite: {
				name: data.run.golden_set_name,
				version: data.run.golden_set_version,
				run_id: data.run.run_id,
				timestamp: data.run.timestamp,
				duration_ms: data.run.duration_ms,
				trigger: data.run.trigger,
			},
			summary: {
				status: data.run.status,
				suite_score: data.run.suite_score,
				metric_summary: data.run.metric_summary,
				total_test_cases: data.run.test_case_results.length,
				passed: data.run.test_case_results.filter((t) => t.overall_passed)
					.length,
				failed: data.run.test_case_results.filter((t) => !t.overall_passed)
					.length,
				severity_counts: {
					pass: data.run.test_case_results.filter((t) => t.severity === "pass")
						.length,
					warn: data.run.test_case_results.filter((t) => t.severity === "warn")
						.length,
					fail: data.run.test_case_results.filter((t) => t.severity === "fail")
						.length,
				},
			},
			quality_gates: {
				passed: data.qualityGates.passed,
				gates: data.qualityGates.gates,
			},
			regression: {
				status: data.run.regression.regression_status,
				suite_delta: data.run.regression.suite_delta,
				baseline_run_id: data.run.regression.baseline_run_id,
			},
			judge: {
				provider: data.run.judge_provider,
				model: data.run.judge_model,
			},
			test_cases: data.run.test_case_results.map((tc) => ({
				id: tc.test_case_id,
				input: tc.input,
				actual_output: tc.actual_output,
				passed: tc.overall_passed,
				severity: tc.severity,
				metrics: Object.fromEntries(
					Object.entries(tc.metric_results).map(([name, mr]) => [
						name,
						{
							score: mr.score,
							confidence: mr.confidence,
							passed: mr.passed,
							threshold: mr.threshold,
							evaluation_type: mr.evaluation_type,
							token_cost: mr.token_cost,
							explanation: mr.explanation,
						},
					]),
				),
				regression_delta: tc.regression_delta,
			})),
		};

		return JSON.stringify(payload, null, 2);
	},
};
