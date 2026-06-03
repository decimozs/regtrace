import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	findConfigFile,
	loadConfigFromFile,
} from "../../../src/storage/config-loader";

const TEST_BASE = resolve(__dirname, "../../fixtures/temp-config-loader");

beforeEach(async () => {
	await rm(TEST_BASE, { recursive: true, force: true });
	await mkdir(TEST_BASE, { recursive: true });
});

afterEach(async () => {
	await rm(TEST_BASE, { recursive: true, force: true });
});

const VALID_CONFIG_YAML = `project:
  name: test-project
  version: "1.0"
golden_sets:
  - path: golden-sets/qa.yaml
    enabled: true
    weight: 1
metrics:
  enabled: [factuality, format]
  default_threshold: 0.7
  default_weight: 1
  factuality:
    mode: lenient
    claim_extraction_depth: shallow
    rag_faithfulness_only: false
  format:
    sub_checks:
      length: true
      json_validity: false
    length_tolerance: 0.3
    strict_json: false
  tone:
    sub_dimensions:
      formality: false
      sentiment: false
      assertiveness: false
      persona_consistency: false
      verbosity: false
  regression:
    enabled: true
    baseline_strategy: last_passing
    tolerance: 0.05
    critical_threshold: 0.15
    exclude_new_test_cases: true
judge:
  primary:
    provider: anthropic
    model: claude-3-5-sonnet-20240620
    temperature: 0.1
    max_tokens: 4096
    timeout_ms: 30000
    retry_attempts: 3
run:
  concurrency: 1
quality_gates:
  suite_score_minimum: 0.7
  max_failed_test_cases: 1
  max_low_confidence_ratio: 0.1
  regression_gate: true
output:
  run_history_limit: 50
  default_format: terminal
  color: auto
  ci_mode_auto_detect: true
`;

const INVALID_YAML = `project:
  name: test
  golden_sets:
    - broken: [
`;

describe("findConfigFile", () => {
	it("finds regtrace.config.yaml in the current directory", async () => {
		await writeFile(
			resolve(TEST_BASE, "regtrace.config.yaml"),
			"project:",
			"utf-8",
		);
		const result = findConfigFile(TEST_BASE);
		expect(result).toBe(resolve(TEST_BASE, "regtrace.config.yaml"));
	});

	it("finds regtrace.config.yml as alternative extension", async () => {
		await writeFile(
			resolve(TEST_BASE, "regtrace.config.yml"),
			"project:",
			"utf-8",
		);
		const result = findConfigFile(TEST_BASE);
		expect(result).toBe(resolve(TEST_BASE, "regtrace.config.yml"));
	});

	it("prefers .yaml over .yml when both exist", async () => {
		await writeFile(
			resolve(TEST_BASE, "regtrace.config.yaml"),
			"project: yaml",
			"utf-8",
		);
		await writeFile(
			resolve(TEST_BASE, "regtrace.config.yml"),
			"project: yml",
			"utf-8",
		);
		const result = findConfigFile(TEST_BASE);
		expect(result).toBe(resolve(TEST_BASE, "regtrace.config.yaml"));
	});

	it("walks up to parent directory when not found in current", async () => {
		const childDir = resolve(TEST_BASE, "subdir");
		await mkdir(childDir, { recursive: true });
		await writeFile(
			resolve(TEST_BASE, "regtrace.config.yaml"),
			"project:",
			"utf-8",
		);
		const result = findConfigFile(childDir);
		expect(result).toBe(resolve(TEST_BASE, "regtrace.config.yaml"));
	});

	it("returns null when no config file exists in any parent", async () => {
		const result = findConfigFile(TEST_BASE);
		expect(result).toBeNull();
	});
});

describe("loadConfigFromFile", () => {
	it("loads a valid config from explicit file path", async () => {
		const configPath = resolve(TEST_BASE, "regtrace.config.yaml");
		await writeFile(configPath, VALID_CONFIG_YAML, "utf-8");
		const result = await loadConfigFromFile(configPath);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.project.name).toBe("test-project");
		}
	});

	it("returns error for non-existent file with field and message", async () => {
		const result = await loadConfigFromFile(
			resolve(TEST_BASE, "no-such-file.yaml"),
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors[0]?.field).toBe("file");
			expect(result.errors[0]?.message).toContain("Cannot read config file");
		}
	});

	it("returns error for YAML parse error", async () => {
		const configPath = resolve(TEST_BASE, "bad.yaml");
		await writeFile(configPath, INVALID_YAML, "utf-8");
		const result = await loadConfigFromFile(configPath);
		expect(result.success).toBe(false);
		if (!result.success) {
			const fileError = result.errors.find((e) =>
				e.message.includes("YAML parse error"),
			);
			expect(fileError).toBeDefined();
		}
	});

	it("returns validation error for semantically invalid config", async () => {
		const configPath = resolve(TEST_BASE, "regtrace.config.yaml");
		await writeFile(configPath, "project:", "utf-8");
		const result = await loadConfigFromFile(configPath);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.length).toBeGreaterThan(0);
		}
	});
});
