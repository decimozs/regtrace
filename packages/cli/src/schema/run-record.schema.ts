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

/** Schema for the overall status of a completed evaluation run. */
export const runStatusSchema = union([
	literal("passed"),
	literal("failed"),
	literal("errored"),
]);

/** Schema for the trigger that initiated a run. */
export const runTriggerSchema = union([
	literal("cli"),
	literal("ci"),
	literal("watch"),
]);

/** Schema for the severity level of a regression comparison. */
export const regressionStatusSchema = union([
	literal("clean"),
	literal("warning"),
	literal("critical"),
]);

/** Schema for a single assertion detail within a metric result. */
const assertionDetailSchema = object({
	check: string(),
	passed: boolean(),
	expected: string().optional(),
	actual: string().optional(),
	message: string().optional(),
});

/** Schema for a single metric's evaluation result within a test case. */
const metricResultSchema = object({
	metric_name: string(),
	score: number().min(0).max(1),
	confidence: number().min(0).max(1),
	passed: boolean(),
	threshold: number().min(0).max(1),
	explanation: string(),
	evaluation_type: union([literal("deterministic"), literal("llm_judged")]),
	token_cost: number().int().min(0),
	details: array(assertionDetailSchema).optional(),
});

/** Schema for a test case result including per-metric scores and regression delta. */
export const testCaseResultSchema = object({
	test_case_id: string(),
	input: string(),
	actual_output: string(),
	overall_passed: boolean(),
	severity: union([literal("pass"), literal("warn"), literal("fail")]),
	metric_results: record(string(), metricResultSchema),
	regression_delta: record(string(), number()).optional(),
});

/** Schema for the regression comparison block within a run record. */
export const regressionBlockSchema = object({
	baseline_run_id: nullable(string()),
	baseline_golden_set_version: nullable(string()),
	current_golden_set_version: string(),
	version_change_detected: boolean(),
	suite_delta: number(),
	regression_status: regressionStatusSchema,
	test_cases_excluded: array(string()),
	metric_deltas: record(string(), number()),
	metric_tolerances_applied: record(string(), number()).optional(),
});

/**
 * Root Zod schema for a persisted run record.
 * Captures all evaluation results, regression data, and metadata for a single `regtrace run`.
 */
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
	branch: string().optional(),
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

/** Inferred TypeScript type from runRecordSchema. */
export type RunRecord = z.infer<typeof runRecordSchema>;

/** Inferred TypeScript type from runStatusSchema. */
export type RunStatus = z.infer<typeof runStatusSchema>;

/** Inferred TypeScript type from runTriggerSchema. */
export type RunTrigger = z.infer<typeof runTriggerSchema>;

/** Inferred TypeScript type from regressionStatusSchema. */
export type RegressionStatus = z.infer<typeof regressionStatusSchema>;

/** Inferred TypeScript type from testCaseResultSchema. */
export type TestCaseResult = z.infer<typeof testCaseResultSchema>;

/** Inferred TypeScript type from metricResultSchema. */
export type MetricResult = z.infer<typeof metricResultSchema>;

/** Inferred TypeScript type from assertionDetailSchema. */
export type AssertionDetail = z.infer<typeof assertionDetailSchema>;

/** Inferred TypeScript type from regressionBlockSchema. */
export type RegressionBlock = z.infer<typeof regressionBlockSchema>;
