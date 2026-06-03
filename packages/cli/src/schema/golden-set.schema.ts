import {
	array,
	literal,
	nullable,
	number,
	object,
	string,
	union,
	type z,
	enum as zEnum,
} from "zod";

/** Canonical metric names used across the evaluation pipeline. */
const METRIC_NAMES = ["factuality", "format", "tone", "regression"] as const;

/**
 * Schema for the interaction type of a golden set.
 * "single_turn" for one-shot Q&A; "rag" for retrieval-augmented generation.
 */
export const interactionTypeSchema = union([
	literal("single_turn"),
	literal("rag"),
]);

/** Schema for per-metric threshold overrides within a test case. */
const thresholdsSchema = object({
	factuality: nullable(number().min(0).max(1)).optional(),
	format: nullable(number().min(0).max(1)).optional(),
	tone: nullable(number().min(0).max(1)).optional(),
}).optional();

/** Schema for a single document in a RAG context block. */
const documentSchema = object({
	source: string(),
	content: string(),
	retrieval_score: nullable(number().min(0).max(1)).optional(),
});

/** Schema for the context block of a RAG test case. */
const contextSchema = object({
	documents: array(documentSchema),
});

/**
 * Schema for a single test case within a golden set.
 * Each test case defines input, expected output, applicable metrics, and optional thresholds.
 */
export const testCaseSchema = object({
	id: string().min(1),
	description: string().min(1),
	input: string().min(1),
	system_prompt: nullable(string()),
	expected_output: string().min(1),
	actual_output: nullable(string()),
	metrics: array(zEnum(METRIC_NAMES)).min(1),
	thresholds: thresholdsSchema,
	tags: array(string()),
	weight: number().min(0).default(1),
	context: nullable(contextSchema).optional(),
});

/**
 * Root Zod schema for a golden-set YAML file.
 * Validates metadata, interaction type, and all test cases.
 */
export const goldenSetSchema = object({
	name: string().min(1),
	version: string().min(1),
	description: string().min(1),
	interaction_type: interactionTypeSchema,
	tags: array(string()),
	author: string().min(1),
	created_at: string().min(1),
	updated_at: string().min(1),
	test_cases: array(testCaseSchema).min(1),
});

/** Inferred TypeScript type from goldenSetSchema. */
export type GoldenSet = z.infer<typeof goldenSetSchema>;

/** Inferred TypeScript type from testCaseSchema. */
export type TestCase = z.infer<typeof testCaseSchema>;

/** Supported golden-set interaction types. */
export type InteractionType = "single_turn" | "rag";

/** Canonical metric name literal type derived from METRIC_NAMES. */
export type MetricName = (typeof METRIC_NAMES)[number];

export { METRIC_NAMES };
