import {
	array,
	boolean,
	literal,
	nullable,
	number,
	object,
	record,
	string,
	union,
	type z,
} from "zod";

export const runStatusSchema = union([
	literal("passed"),
	literal("failed"),
	literal("errored"),
]);

export const runTriggerSchema = union([
	literal("cli"),
	literal("ci"),
	literal("watch"),
]);

export const regressionStatusSchema = union([
	literal("clean"),
	literal("warning"),
	literal("critical"),
]);

const metricResultSchema = object({
	metric_name: string(),
	score: number().min(0).max(1),
	confidence: number().min(0).max(1),
	passed: boolean(),
	threshold: number().min(0).max(1),
	explanation: string(),
	evaluation_type: union([literal("deterministic"), literal("llm_judged")]),
	token_cost: number().int().min(0),
});

export const testCaseResultSchema = object({
	test_case_id: string(),
	input: string(),
	actual_output: string(),
	overall_passed: boolean(),
	severity: union([literal("pass"), literal("warn"), literal("fail")]),
	metric_results: record(string(), metricResultSchema),
	regression_delta: record(string(), number()).optional(),
});

export const regressionBlockSchema = object({
	baseline_run_id: nullable(string()),
	baseline_golden_set_version: nullable(string()),
	current_golden_set_version: string(),
	version_change_detected: boolean(),
	suite_delta: number(),
	regression_status: regressionStatusSchema,
	test_cases_excluded: array(string()),
	metric_deltas: record(string(), number()),
});

export const runRecordSchema = object({
	run_id: string(),
	timestamp: string(),
	status: runStatusSchema,
	trigger: runTriggerSchema,
	duration_ms: number().int().min(0),
	regtrace_version: string(),
	judge_provider: string(),
	judge_model: string(),
	config_hash: string(),
	golden_set_name: string(),
	golden_set_version: string(),
	golden_set_file_hash: string(),
	suite_score: number().min(0).max(1),
	metric_summary: record(
		string(),
		object({
			score: number().min(0).max(1),
			pass_rate: number().min(0).max(1),
		}),
	),
	test_case_results: array(testCaseResultSchema),
	regression: regressionBlockSchema,
});

export type RunRecord = z.infer<typeof runRecordSchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;
export type RunTrigger = z.infer<typeof runTriggerSchema>;
export type RegressionStatus = z.infer<typeof regressionStatusSchema>;
export type TestCaseResult = z.infer<typeof testCaseResultSchema>;
export type MetricResult = z.infer<typeof metricResultSchema>;
export type RegressionBlock = z.infer<typeof regressionBlockSchema>;
