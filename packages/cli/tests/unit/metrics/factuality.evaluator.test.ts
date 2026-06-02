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
});
