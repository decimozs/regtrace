import {
	type GoldenSet,
	goldenSetSchema,
	type TestCase,
} from "../golden-set.schema";

export interface ValidationError {
	field: string;
	message: string;
}

export type ValidationResult =
	| { success: true; data: GoldenSet }
	| { success: false; errors: ValidationError[] };

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
