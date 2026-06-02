import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { load } from "js-yaml";
import { validateGoldenSet } from "../../../src/schema/validators/golden-set.validator";

function loadFixture(name: string): unknown {
	const path = resolve(__dirname, "../../fixtures/golden-sets", name);
	const content = readFileSync(path, "utf-8");
	return load(content);
}

describe("goldenSet validator", () => {
	it("passes a valid single-turn golden set", () => {
		const data = loadFixture("valid-single-turn.yaml");
		const result = validateGoldenSet(data);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("customer-support-qa");
			expect(result.data.test_cases.length).toBe(2);
			const firstCase = result.data.test_cases[0];
			expect(firstCase?.id).toBe("cs-001");
			expect(firstCase?.weight).toBe(1.5);
		}
	});

	it("passes a valid RAG golden set", () => {
		const data = loadFixture("valid-rag.yaml");
		const result = validateGoldenSet(data);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.interaction_type).toBe("rag");
			expect(result.data.test_cases.length).toBe(2);
		}
	});

	it("fails when a test case is missing the id field", () => {
		const data = loadFixture("invalid-missing-id.yaml");
		const result = validateGoldenSet(data);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.length).toBeGreaterThan(0);
			const idError = result.errors.find((e) =>
				e.message.toLowerCase().includes("id"),
			);
			expect(idError).toBeDefined();
		}
	});

	it("fails when test cases have duplicate ids", () => {
		const data = loadFixture("invalid-duplicate-id.yaml");
		const result = validateGoldenSet(data);

		expect(result.success).toBe(false);
		if (!result.success) {
			const dupError = result.errors.find((e) =>
				e.message.includes("Duplicate"),
			);
			expect(dupError).toBeDefined();
		}
	});

	it("fails when a RAG test case has no context", () => {
		const data = loadFixture("valid-rag.yaml");
		const parsed = data as Record<string, unknown>;
		const testCases = (parsed.test_cases as unknown[]).map((tc, i) => {
			if (i === 0) {
				return { ...(tc as object), context: null };
			}
			return tc;
		});
		const modified = { ...parsed, test_cases: testCases };
		const result = validateGoldenSet(modified);

		expect(result.success).toBe(false);
		if (!result.success) {
			const contextError = result.errors.find((e) =>
				e.field.includes("context"),
			);
			expect(contextError).toBeDefined();
		}
	});
});
