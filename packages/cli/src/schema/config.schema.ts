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

/** Union of supported LLM provider identifiers. */
const providerSchema = union([
	literal("openai"),
	literal("anthropic"),
	literal("gemini"),
	literal("groq"),
	literal("ollama"),
]);

/** Schema for a single judge provider configuration. */
const judgeConfigSchema = object({
	provider: providerSchema,
	model: string(),
	temperature: number().min(0).max(2).default(0.1),
	max_tokens: number().int().positive().default(4096),
	timeout_ms: number().int().positive().default(30000),
	retry_attempts: number().int().min(0).default(3),
	local_endpoint: nullable(string()).optional(),
});

/** Schema for format sub-check toggles. */
const subChecksSchema = object({
	length: boolean().default(true),
	json_validity: boolean().default(true),
	json_schema: boolean().default(true),
	markdown_structure: boolean().default(true),
	required_fields: boolean().default(true),
	forbidden_content: boolean().default(true),
	regex_match: boolean().default(true),
});

/** Schema for tone sub-dimension toggles. */
const subDimensionsSchema = object({
	formality: boolean().default(true),
	sentiment: boolean().default(true),
	assertiveness: boolean().default(true),
	persona_consistency: boolean().default(true),
	verbosity: boolean().default(true),
});

/** Schema for factuality metric configuration. */
const factualityConfigSchema = object({
	mode: union([literal("strict"), literal("lenient")]).default("strict"),
	claim_extraction_depth: union([literal("shallow"), literal("deep")]).default(
		"shallow",
	),
	rag_faithfulness_only: boolean().default(false),
});

/** Schema for format metric configuration. */
const formatConfigSchema = object({
	sub_checks: subChecksSchema,
	length_tolerance: number().min(0).max(1).default(0.2),
	strict_json: boolean().default(false),
});

/** Schema for tone metric configuration. */
const toneConfigSchema = object({
	tone_profile: nullable(string()).optional(),
	sub_dimensions: subDimensionsSchema,
	sub_dimension_weights: record(string(), number()).optional(),
});

/** Schema for regression metric configuration. */
const regressionConfigSchema = object({
	enabled: boolean().default(true),
	baseline_strategy: union([
		literal("last_passing"),
		literal("pinned"),
	]).default("last_passing"),
	pinned_run_id: nullable(string()).optional(),
	tolerance: number().min(0).max(1).default(0.05),
	critical_threshold: number().min(0).max(1).default(0.15),
	exclude_new_test_cases: boolean().default(true),
});

/** Schema for top-level metrics configuration. */
const metricsConfigSchema = object({
	enabled: array(string()).default([
		"factuality",
		"format",
		"tone",
		"regression",
	]),
	default_threshold: number().min(0).max(1).default(0.7),
	default_weight: number().min(0).default(1),
	factuality: factualityConfigSchema,
	format: formatConfigSchema,
	tone: toneConfigSchema,
	regression: regressionConfigSchema,
});

/** Schema for a golden-set entry within the config file. */
const goldenSetEntrySchema = object({
	path: string().min(1),
	alias: nullable(string()).optional(),
	enabled: boolean().default(true),
	weight: number().min(0).default(1),
	store_in_db: boolean().default(true),
});

/** Schema for quality gate configuration that determines pass/fail outcomes. */
const qualityGatesSchema = object({
	suite_score_minimum: number().min(0).max(1).default(0.7),
	metric_score_minimums: record(string(), number()).optional(),
	max_failed_test_cases: number().int().min(0).default(0),
	max_low_confidence_ratio: number().min(0).max(1).default(0.1),
	regression_gate: boolean().default(true),
});

/** Schema for run execution configuration. */
const runConfigSchema = object({
	concurrency: number().int().min(1).max(20).default(1),
});

/** Schema for output and reporting configuration. */
const outputConfigSchema = object({
	run_history_limit: number().int().positive().default(50),
	default_format: union([
		literal("terminal"),
		literal("json"),
		literal("markdown"),
	]).default("terminal"),
	explain_by_default: boolean().default(false),
	color: union([literal("auto"), literal("always"), literal("never")]).default(
		"auto",
	),
	report_path: nullable(string()).optional(),
	ci_mode_auto_detect: boolean().default(true),
});

/** Schema for SQLite database configuration. */
const dbConfigSchema = object({
	enabled: boolean().default(false),
	path: string().default(".regtrace/regtrace.db"),
});

/** Schema for storage configuration. */
const storageConfigSchema = object({
	db: dbConfigSchema,
});

/**
 * Root Zod schema for the regtrace configuration file.
 * Validates structure, defaults, and constraints for every config field.
 */
export const configSchema = object({
	project: object({
		name: string().min(1),
		version: string().min(1).default("1.0"),
		description: nullable(string()).optional(),
	}),
	golden_sets: array(goldenSetEntrySchema).min(1),
	metrics: metricsConfigSchema,
	judge: object({
		primary: judgeConfigSchema,
		fallback: nullable(judgeConfigSchema).optional(),
	}),
	generator: judgeConfigSchema.optional(),
	run: runConfigSchema,
	quality_gates: qualityGatesSchema,
	output: outputConfigSchema,
	storage: storageConfigSchema.optional(),
});

/** Inferred TypeScript type from configSchema. */
export type Config = z.infer<typeof configSchema>;

/** Union type of the supported judge provider names. */
export type JudgeProvider =
	| "openai"
	| "anthropic"
	| "gemini"
	| "groq"
	| "ollama";
