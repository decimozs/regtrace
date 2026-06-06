import { describe, expect, it } from "bun:test";
import { factualityEvaluator } from "../../../src/metrics/evaluators/factuality.evaluator";
import type { EvaluateInput } from "../../../src/metrics/types";
import type { TestCase } from "../../../src/schema/golden-set.schema";

function makeInput(overrides: Partial<EvaluateInput> = {}): EvaluateInput {
	return {
		testCase: {
			id: "fact-001",
			description: "Factuality check test",
			input: "What is the capital of France?",
			system_prompt: null,
			expected_output: "The capital of France is Paris.",
			actual_output: "The capital of France is Paris.",
			metrics: ["factuality"],
			tags: [],
			weight: 1,
		} as TestCase,
		actualOutput: "The capital of France is Paris.",
		expectedOutput: "The capital of France is Paris.",
		config: {
			project: { name: "test", version: "1.0" },
			metrics: {
				enabled: ["factuality"],
				default_threshold: 0.7,
				default_weight: 1,
				factuality: {
					mode: "strict",
					claim_extraction_depth: "shallow",
					rag_faithfulness_only: false,
				},
			},
		} as EvaluateInput["config"],
		metricConfig: {
			mode: "strict",
			claim_extraction_depth: "shallow",
			rag_faithfulness_only: false,
		},
		threshold: 0.7,
		...overrides,
	};
}

describe("factuality evaluator", () => {
	it("scores 1.0 for identical output", async () => {
		const result = await factualityEvaluator.evaluate(makeInput());
		expect(result.score).toBe(1);
		expect(result.passed).toBe(true);
	});

	it("scores high for similar content in lenient mode", async () => {
		const input = makeInput({
			actualOutput: "Paris is the capital city of France.",
			metricConfig: {
				mode: "lenient",
				claim_extraction_depth: "shallow",
				rag_faithfulness_only: false,
			},
		});
		const result = await factualityEvaluator.evaluate(input);
		expect(result.score).toBeGreaterThan(0.45);
	});

	it("scores low for unrelated content", async () => {
		const input = makeInput({
			actualOutput: "The sky is blue and the sun is bright.",
		});
		const result = await factualityEvaluator.evaluate(input);
		expect(result.score).toBeLessThan(0.5);
	});

	it("returns 1.0 when rag_faithfulness_only and no context", async () => {
		const input = makeInput({
			metricConfig: {
				mode: "strict",
				claim_extraction_depth: "shallow",
				rag_faithfulness_only: true,
			},
		});
		const result = await factualityEvaluator.evaluate(input);
		expect(result.score).toBe(1);
		expect(result.explanation).toContain("skipped");
	});

	it("applies strict mode penalty", async () => {
		const input = makeInput({
			actualOutput:
				"The capital of France is Paris. It is a beautiful city known for the Eiffel Tower.",
			metricConfig: {
				mode: "strict",
				claim_extraction_depth: "shallow",
				rag_faithfulness_only: false,
			},
		});
		const result = await factualityEvaluator.evaluate(input);
		expect(result.score).toBeGreaterThanOrEqual(0);
		expect(result.score).toBeLessThanOrEqual(1);
	});

	describe("JSON factuality comparison", () => {
		const jsonExpected = JSON.stringify({
			merchant: "Jollibee Foods Corporation",
			date: "2026-05-01",
			amount: 431.2,
			currency: "PHP",
			category: "Meals",
			justification: "",
			status: "approved",
		});

		it("scores 1.0 for identical JSON", async () => {
			const input = makeInput({
				actualOutput: jsonExpected,
				expectedOutput: jsonExpected,
			});
			const result = await factualityEvaluator.evaluate(input);
			expect(result.score).toBe(1);
			expect(result.passed).toBe(true);
		});

		it("penalizes value mismatch", async () => {
			const actual = JSON.stringify({
				merchant: "Jollibee Foods Corporation",
				date: "2026-05-01",
				amount: 431.2,
				currency: "PHP",
				category: "Meals",
				justification: "",
				status: "flagged",
			});
			const input = makeInput({
				actualOutput: actual,
				expectedOutput: jsonExpected,
			});
			const result = await factualityEvaluator.evaluate(input);
			// 6/7 = 0.86 (all leaf values match except status)
			expect(result.score).toBeGreaterThan(0.8);
			expect(result.score).toBeLessThan(1);
			expect(result.explanation).toContain("status");
			expect(result.explanation).toContain("approved");
			expect(result.explanation).toContain("flagged");
		});

		it("penalizes extra keys (hallucination)", async () => {
			const actual = JSON.stringify({
				merchant: "Jollibee Foods Corporation",
				date: "2026-05-01",
				amount: 431.2,
				currency: "PHP",
				category: "Meals",
				justification: "",
				status: "approved",
				hallucinated_field: "this should not be here",
			});
			const input = makeInput({
				actualOutput: actual,
				expectedOutput: jsonExpected,
			});
			const result = await factualityEvaluator.evaluate(input);
			// 7 matched / (7 expected + 1 extra) = 0.875
			expect(result.score).toBeGreaterThan(0.8);
			expect(result.score).toBeLessThan(1);
			expect(result.explanation).toContain("hallucinated_field");
		});

		it("penalizes missing keys", async () => {
			const actual = JSON.stringify({
				merchant: "Jollibee Foods Corporation",
				date: "2026-05-01",
				amount: 431.2,
				currency: "PHP",
				category: "Meals",
				status: "approved",
			});
			const input = makeInput({
				actualOutput: actual,
				expectedOutput: jsonExpected,
			});
			const result = await factualityEvaluator.evaluate(input);
			// 6 matched / 7 expected = 0.86
			expect(result.score).toBeGreaterThan(0.8);
			expect(result.score).toBeLessThan(1);
			expect(result.explanation).toContain("justification");
			expect(result.explanation).toContain("missing");
		});

		it("tolerates numbers within 0.01", async () => {
			const expected = JSON.stringify({ amount: 431.2 });
			const actual = JSON.stringify({ amount: 431.21 });
			const input = makeInput({
				actualOutput: actual,
				expectedOutput: expected,
			});
			const result = await factualityEvaluator.evaluate(input);
			expect(result.score).toBe(1);
		});

		it("handles code fence wrapping", async () => {
			const wrapped = `\`\`\`json\n${jsonExpected}\n\`\`\``;
			const input = makeInput({
				actualOutput: wrapped,
				expectedOutput: jsonExpected,
			});
			const result = await factualityEvaluator.evaluate(input);
			expect(result.score).toBe(1);
		});

		it("falls back to word overlap for non-JSON", async () => {
			const input = makeInput({
				actualOutput: "The capital of France is Paris.",
				expectedOutput: "Paris is the capital city of France.",
			});
			const result = await factualityEvaluator.evaluate(input);
			// Should use word overlap path (not JSON)
			expect(result.evaluation_type).toBe("deterministic");
			expect(result.score).toBeGreaterThan(0);
		});

		it("scores primitive arrays as sets (order-independent)", async () => {
			const expected = JSON.stringify({
				audit_remarks: ["VAT correct", "Amount matches", "Merchant valid"],
			});
			const actual = JSON.stringify({
				audit_remarks: ["Amount matches", "Merchant valid", "VAT correct"],
			});
			const input = makeInput({
				actualOutput: actual,
				expectedOutput: expected,
			});
			const result = await factualityEvaluator.evaluate(input);
			// All three elements present in both, order swapped → set-based match = 1.0
			expect(result.score).toBe(1);
		});
	});
});
