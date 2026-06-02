import { describe, expect, it } from "bun:test";
import { validateConfig } from "../../../src/schema/validators/config.validator";

function makeMinimalConfig(overrides: Record<string, unknown> = {}) {
	return {
		project: {
			name: "test-project",
			version: "1.0",
			description: "Test project",
		},
		golden_sets: [
			{
				path: "golden-sets/qa.yaml",
				enabled: true,
				weight: 1,
			},
		],
		metrics: {
			enabled: ["factuality", "format", "tone", "regression"],
			default_threshold: 0.7,
			default_weight: 1,
			factuality: {
				mode: "strict",
				claim_extraction_depth: "shallow",
				rag_faithfulness_only: false,
			},
			format: {
				sub_checks: {
					length: true,
					json_validity: true,
					json_schema: true,
					markdown_structure: true,
					required_fields: true,
					forbidden_content: true,
					regex_match: true,
				},
				length_tolerance: 0.2,
				strict_json: false,
			},
			tone: {
				sub_dimensions: {
					formality: true,
					sentiment: true,
					assertiveness: true,
					persona_consistency: true,
					verbosity: true,
				},
			},
			regression: {
				enabled: true,
				baseline_strategy: "last_passing",
				tolerance: 0.05,
				critical_threshold: 0.15,
				exclude_new_test_cases: true,
			},
		},
		judge: {
			primary: {
				provider: "anthropic",
				model: "claude-3-5-sonnet-20240620",
				temperature: 0.1,
				max_tokens: 4096,
				timeout_ms: 30000,
				retry_attempts: 3,
			},
			cost_controls: {
				max_tokens_per_run: 100000,
				warn_at_tokens: 80000,
			},
		},
		run: { concurrency: 1 },
		quality_gates: {
			suite_score_minimum: 0.7,
			max_failed_test_cases: 0,
			max_low_confidence_ratio: 0.1,
			regression_gate: true,
		},
		output: {
			run_history_limit: 50,
			default_format: "terminal",
			explain_by_default: false,
			color: "auto",
			ci_mode_auto_detect: true,
		},
		...overrides,
	};
}

describe("config validator", () => {
	it("passes a fully valid config", () => {
		const data = makeMinimalConfig();
		const result = validateConfig(data);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.project.name).toBe("test-project");
		}
	});

	it("fails when no golden sets are enabled", () => {
		const data = makeMinimalConfig({
			golden_sets: [{ path: "gs.yaml", enabled: false, weight: 1 }],
		});
		const result = validateConfig(data);

		expect(result.success).toBe(false);
		if (!result.success) {
			const error = result.errors.find((e) => e.field === "golden_sets");
			expect(error).toBeDefined();
		}
	});

	it("fails when pinned strategy has no pinned_run_id", () => {
		const data = makeMinimalConfig({
			metrics: {
				...makeMinimalConfig().metrics,
				regression: {
					...makeMinimalConfig().metrics.regression,
					baseline_strategy: "pinned",
					pinned_run_id: null,
				},
			},
		});
		const result = validateConfig(data);

		expect(result.success).toBe(false);
		if (!result.success) {
			const error = result.errors.find(
				(e) => e.field === "metrics.regression.pinned_run_id",
			);
			expect(error).toBeDefined();
		}
	});

	it("fails when factuality has both strict mode and rag_faithfulness_only", () => {
		const data = makeMinimalConfig({
			metrics: {
				...makeMinimalConfig().metrics,
				factuality: {
					...makeMinimalConfig().metrics.factuality,
					mode: "strict",
					rag_faithfulness_only: true,
				},
			},
		});
		const result = validateConfig(data);

		expect(result.success).toBe(false);
		if (!result.success) {
			const error = result.errors.find((e) => e.field === "metrics.factuality");
			expect(error).toBeDefined();
		}
	});
});
