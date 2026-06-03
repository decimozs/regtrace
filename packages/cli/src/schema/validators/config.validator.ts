import { type Config, configSchema } from "../config.schema";

/** A single field-level validation error. */
export interface ValidationError {
	/** Dot-path to the invalid field (e.g. "metrics.regression.pinned_run_id"). */
	field: string;
	/** Human-readable description of the constraint that was violated. */
	message: string;
}

/** Discriminated union: either a successfully parsed Config or a list of validation errors. */
export type ValidationResult =
	| { success: true; data: Config }
	| { success: false; errors: ValidationError[] };

/**
 * Validates a raw config object against the config schema and cross-field business rules.
 *
 * Beyond structural validation, enforces:
 * - At least one golden set must be enabled
 * - pinned_run_id is required when baseline_strategy is "pinned"
 * - strict mode and rag_faithfulness_only cannot be combined
 *
 * @param data - The raw config object (typically parsed from YAML).
 * @returns A ValidationResult discriminated by the `success` field.
 */
export function validateConfig(data: unknown): ValidationResult {
	const parsed = configSchema.safeParse(data);

	if (!parsed.success) {
		const errors: ValidationError[] = parsed.error.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));
		return { success: false, errors };
	}

	const config = parsed.data;
	const extraErrors: ValidationError[] = [];

	const enabledSets = config.golden_sets.filter((gs) => gs.enabled);
	if (enabledSets.length === 0) {
		extraErrors.push({
			field: "golden_sets",
			message: "At least one golden set must be enabled",
		});
	}

	if (
		config.metrics.regression.baseline_strategy === "pinned" &&
		!config.metrics.regression.pinned_run_id
	) {
		extraErrors.push({
			field: "metrics.regression.pinned_run_id",
			message: "pinned_run_id is required when baseline_strategy is 'pinned'",
		});
	}

	if (
		config.metrics.factuality.mode === "strict" &&
		config.metrics.factuality.rag_faithfulness_only
	) {
		extraErrors.push({
			field: "metrics.factuality",
			message: "strict mode and rag_faithfulness_only cannot be combined",
		});
	}

	if (extraErrors.length > 0) {
		return { success: false, errors: extraErrors };
	}

	return { success: true, data: config };
}
