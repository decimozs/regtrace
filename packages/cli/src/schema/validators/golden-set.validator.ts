import {
	type GoldenSet,
	goldenSetSchema,
	type TestCase,
} from "../golden-set.schema";

/** A single field-level validation error. */
export interface ValidationError {
	/** Dot-path to the invalid field (e.g. "test_cases[2].context"). */
	field: string;
	/** Human-readable description of the constraint that was violated. */
	message: string;
}

/** Discriminated union: either a successfully parsed GoldenSet or a list of validation errors. */
export type ValidationResult =
	| { success: true; data: GoldenSet }
	| { success: false; errors: ValidationError[] };

/**
 * Detects duplicate test case IDs and reports each duplicate once.
 * Only the first occurrence is used as the field reference; subsequent
 * duplicates are listed in the error message for traceability.
 * @param testCases - The test cases to scan for duplicates.
 * @returns Validation errors for any duplicate IDs found.
 */
function findDuplicateIds(testCases: TestCase[]): ValidationError[] {
	const seen = new Map<string, number[]>();
	const errors: ValidationError[] = [];

	for (let i = 0; i < testCases.length; i++) {
		const tc = testCases[i];
		if (!tc) continue;
		const id = tc.id;
		const existing = seen.get(id);
		if (existing) {
			existing.push(i);
			// Report on the second occurrence to avoid double-counting single-pair duplicates
			if (existing.length === 2) {
				const firstIdx = existing[0];
				errors.push({
					field: `test_cases[${firstIdx}].id`,
					message: `Duplicate test case id "${id}" found at indices [${existing.join(", ")}]`,
				});
			}
		} else {
			seen.set(id, [i]);
		}
	}

	return errors;
}

/**
 * Validates a raw golden-set object against the schema and cross-field business rules.
 *
 * Beyond structural validation, enforces:
 * - Test case IDs must be unique within a golden set
 * - RAG golden sets must have a context block on every test case
 *
 * @param data - The raw golden-set object (typically parsed from YAML).
 * @returns A ValidationResult discriminated by the `success` field.
 */
export function validateGoldenSet(data: unknown): ValidationResult {
	const parsed = goldenSetSchema.safeParse(data);

	if (!parsed.success) {
		const errors: ValidationError[] = parsed.error.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));
		return { success: false, errors };
	}

	const goldenSet = parsed.data;
	const extraErrors: ValidationError[] = [];

	const duplicateErrors = findDuplicateIds(goldenSet.test_cases);
	extraErrors.push(...duplicateErrors);

	if (goldenSet.interaction_type === "rag") {
		for (let i = 0; i < goldenSet.test_cases.length; i++) {
			const tc = goldenSet.test_cases[i];
			if (!tc) continue;
			if (!tc.context) {
				extraErrors.push({
					field: `test_cases[${i}].context`,
					message: `RAG test case "${tc.id}" must have a context block`,
				});
			}
		}
	}

	if (extraErrors.length > 0) {
		return { success: false, errors: extraErrors };
	}

	return { success: true, data: goldenSet };
}
