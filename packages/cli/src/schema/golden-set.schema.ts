import {
	array,
	literal,
	nullable,
	number,
	object,
	string,
	union,
	enum as zEnum,
} from "zod";

const METRIC_NAMES = ["factuality", "format", "tone", "regression"] as const;

export const interactionTypeSchema = union([
	literal("single_turn"),
	literal("rag"),
]);

const thresholdsSchema = object({
	factuality: nullable(number().min(0).max(1)).optional(),
	format: nullable(number().min(0).max(1)).optional(),
	tone: nullable(number().min(0).max(1)).optional(),
}).optional();

const documentSchema = object({
	source: string(),
	content: string(),
	retrieval_score: nullable(number().min(0).max(1)).optional(),
});

const contextSchema = object({
	documents: array(documentSchema),
});

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

export type GoldenSet = {
	name: string;
	version: string;
	description: string;
	interaction_type: "single_turn" | "rag";
	tags: string[];
	author: string;
	created_at: string;
	updated_at: string;
	test_cases: TestCase[];
};

export type TestCase = {
	id: string;
	description: string;
	input: string;
	system_prompt: string | null;
	expected_output: string;
	actual_output: string | null;
	metrics: string[];
	thresholds?: {
		factuality?: number | null;
		format?: number | null;
		tone?: number | null;
	} | null;
	tags: string[];
	weight: number;
	context?: {
		documents: {
			source: string;
			content: string;
			retrieval_score?: number | null;
		}[];
	} | null;
};

export type InteractionType = "single_turn" | "rag";
export type MetricName = (typeof METRIC_NAMES)[number];

export { METRIC_NAMES };
