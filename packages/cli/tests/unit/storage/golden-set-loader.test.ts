import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { loadGoldenSetFromFile } from "../../../src/storage/golden-set-loader";

const FIXTURES = resolve(__dirname, "../../fixtures/golden-sets");

describe("loadGoldenSetFromFile", () => {
	it("loads a valid single-turn golden set", async () => {
		const result = await loadGoldenSetFromFile(
			resolve(FIXTURES, "valid-single-turn.yaml"),
		);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("customer-support-qa");
			expect(result.data.test_cases.length).toBe(2);
		}
	});

	it("loads a valid RAG golden set with context", async () => {
		const result = await loadGoldenSetFromFile(
			resolve(FIXTURES, "valid-rag.yaml"),
		);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.interaction_type).toBe("rag");
			expect(result.data.test_cases.length).toBe(2);
			const firstCase = result.data.test_cases[0];
			expect(firstCase?.context).toBeDefined();
			expect(firstCase?.context?.documents?.length).toBeGreaterThan(0);
		}
	});

	it("returns error for non-existent file", async () => {
		const result = await loadGoldenSetFromFile(
			resolve(FIXTURES, "no-such-file.yaml"),
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors[0]?.field).toBe("file");
		}
	});

	it("returns validation error for golden set with missing required fields", async () => {
		const result = await loadGoldenSetFromFile(
			resolve(FIXTURES, "invalid-missing-id.yaml"),
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.length).toBeGreaterThan(0);
		}
	});

	it("returns validation error for golden set with duplicate IDs", async () => {
		const result = await loadGoldenSetFromFile(
			resolve(FIXTURES, "invalid-duplicate-id.yaml"),
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			const dupError = result.errors.find((e) =>
				e.message.includes("Duplicate"),
			);
			expect(dupError).toBeDefined();
		}
	});
});
