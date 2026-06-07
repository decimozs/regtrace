import { describe, expect, it } from "bun:test";
import {
	buildGoldenSet,
	detectMetrics,
} from "../../../src/cli/scaffold.command";

describe("detectMetrics", () => {
	it("adds tone for prose output", () => {
		const metrics = detectMetrics(
			"The quick brown fox jumps over the lazy dog.",
		);
		expect(metrics).toContain("factuality");
		expect(metrics).toContain("format");
		expect(metrics).toContain("tone");
	});

	it("omits tone for JSON output", () => {
		const metrics = detectMetrics('{"key": "value"}');
		expect(metrics).toContain("factuality");
		expect(metrics).toContain("format");
		expect(metrics).not.toContain("tone");
	});

	it("omits tone for short output", () => {
		const metrics = detectMetrics("42");
		expect(metrics).toContain("factuality");
		expect(metrics).toContain("format");
		expect(metrics).not.toContain("tone");
	});
});

describe("buildGoldenSet", () => {
	it("builds valid golden set YAML from inputs", () => {
		const inputs = [
			{
				input: "What is 2+2?",
				output: "4",
				systemPrompt: "Be concise",
				description: "Math test",
			},
			{
				input: "Capital of France?",
				output: "Paris",
				description: "Geography test",
			},
		];
		const yaml = buildGoldenSet(inputs, "test-set");
		expect(yaml).toContain("name: test-set");
		expect(yaml).toContain("test_cases:");
		expect(yaml).toContain("scaffold-001");
		expect(yaml).toContain("scaffold-002");
		expect(yaml).toContain("expected_output: '4'");
		expect(yaml).toContain("actual_output: null");
		expect(yaml).toContain("author: regtrace scaffold");
		expect(yaml).toContain("version: 0.1.0");
	});

	it("orders test cases sequentially", () => {
		const inputs = [
			{ input: "Q1", output: "A1" },
			{ input: "Q2", output: "A2" },
			{ input: "Q3", output: "A3" },
		];
		const yaml = buildGoldenSet(inputs, "ordered");
		const firstIdx = yaml.indexOf("scaffold-001");
		const secondIdx = yaml.indexOf("scaffold-002");
		const thirdIdx = yaml.indexOf("scaffold-003");
		expect(firstIdx).toBeGreaterThan(0);
		expect(secondIdx).toBeGreaterThan(firstIdx);
		expect(thirdIdx).toBeGreaterThan(secondIdx);
	});

	it("handles single input", () => {
		const inputs = [{ input: "Q1", output: "A1" }];
		const yaml = buildGoldenSet(inputs, "single");
		expect(yaml).toContain("scaffold-001");
		expect(yaml).not.toContain("scaffold-002");
	});

	it("includes interaction_type single_turn", () => {
		const inputs = [{ input: "Q", output: "A" }];
		const yaml = buildGoldenSet(inputs, "type-test");
		expect(yaml).toContain("interaction_type: single_turn");
	});
});
