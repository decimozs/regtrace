import { afterAll, describe, expect, it } from "bun:test";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const CLI_ENTRY = resolve(import.meta.dirname ?? ".", "../../src/index.ts");

const tempDirs: string[] = [];

afterAll(() => {
	for (const dir of tempDirs) {
		try {
			rmSync(dir, { recursive: true, force: true });
		} catch {
			// ignore cleanup errors
		}
	}
});

function tmpDir(): string {
	const d = resolve(
		import.meta.dirname ?? ".",
		"../../.test-tmp",
		`int_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
	);
	mkdirSync(d, { recursive: true });
	tempDirs.push(d);
	return d;
}

function writeFiles(
	dir: string,
	config: string,
	goldenSet: string,
): { configPath: string; goldenSetPath: string } {
	const cfgPath = resolve(dir, "regtrace.config.yaml");
	writeFileSync(cfgPath, config, "utf-8");
	const gsPath = resolve(dir, "golden-set.yaml");
	writeFileSync(gsPath, goldenSet, "utf-8");
	return { configPath: cfgPath, goldenSetPath: gsPath };
}

const BASE_CONFIG = (
	qg: string = `  suite_score_minimum: 0.7
  max_failed_test_cases: 5
  max_low_confidence_ratio: 1.0
  regression_gate: false`,
) => `project:
  name: integration-test
  version: "1.0"
golden_sets:
  - path: golden-set.yaml
    enabled: true
metrics:
  enabled: [factuality, format]
  default_threshold: 0.7
  factuality:
    mode: strict
    claim_extraction_depth: shallow
    rag_faithfulness_only: false
  format:
    sub_checks:
      length: true
      json_validity: true
      json_schema: true
      markdown_structure: true
      required_fields: true
      forbidden_content: true
      regex_match: true
    length_tolerance: 0.2
    strict_json: false
  tone:
    sub_dimensions:
      formality: true
      sentiment: true
      assertiveness: true
      persona_consistency: true
      verbosity: true
  regression:
    enabled: true
    baseline_strategy: last_passing
    tolerance: 0.05
    critical_threshold: 0.15
    exclude_new_test_cases: true
judge:
  primary:
    provider: anthropic
    model: claude-3-haiku-20240307
    temperature: 0.1
    max_tokens: 4096
    timeout_ms: 5000
    retry_attempts: 0
  cost_controls:
    max_tokens_per_run: 100000
    warn_at_tokens: 80000
run:
  concurrency: 1
quality_gates:
${qg}
output:
  run_history_limit: 50
  default_format: terminal
  color: always
  ci_mode_auto_detect: false
`;

const DEFAULT_GS = `name: integration-gs
version: "1.0"
description: Integration test cases
interaction_type: single_turn
tags: [test]
author: test
created_at: "2026-01-01"
updated_at: "2026-01-01"
test_cases:
  - id: pass-001
    description: Passing case
    input: "What is the capital of France?"
    system_prompt: null
    expected_output: "Paris"
    actual_output: "Paris"
    metrics: [factuality, format]
    tags: []
    weight: 1
  - id: fail-001
    description: Failing case
    input: "What is 2+2?"
    system_prompt: null
    expected_output: "5"
    actual_output: "4"
    metrics: [factuality, format]
    tags: []
    weight: 1
`;

const ALL_PASS_GS = `name: integration-gs
version: "1.0"
description: All passing
interaction_type: single_turn
tags: [test]
author: test
created_at: "2026-01-01"
updated_at: "2026-01-01"
test_cases:
  - id: pass-001
    description: Passing case
    input: "What is the capital of France?"
    system_prompt: null
    expected_output: "Paris"
    actual_output: "Paris"
    metrics: [factuality, format]
    tags: []
    weight: 1
  - id: pass-002
    description: Another passing
    input: "What is 2+2?"
    system_prompt: null
    expected_output: "4"
    actual_output: "4"
    metrics: [factuality, format]
    tags: []
    weight: 1
`;

async function runCli(
	args: string[],
	cwd: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
	const proc = Bun.spawn(["bun", "run", CLI_ENTRY, ...args], {
		cwd,
		env: {
			...process.env,
			NO_COLOR: "1",
			ANTHROPIC_API_KEY: "",
			OPENAI_API_KEY: "",
		},
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { exitCode, stdout, stderr };
}

function latestRecord(dir: string): Record<string, unknown> | null {
	const runsDir = resolve(dir, ".regtrace", "runs");
	if (!existsSync(runsDir)) return null;
	const files = readdirSync(runsDir)
		.filter((f) => f.endsWith(".json"))
		.sort()
		.reverse();
	if (files.length === 0) return null;
	const latest = files[0];
	if (!latest) return null;
	return JSON.parse(readFileSync(resolve(runsDir, latest), "utf-8"));
}

describe("init", () => {
	it("scaffolds project files", async () => {
		const dir = tmpDir();
		const { exitCode, stdout } = await runCli(["init", "--dir", dir], dir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("initialized");
		expect(existsSync(resolve(dir, "regtrace.config.yaml"))).toBe(true);
		expect(existsSync(resolve(dir, "golden-sets", "qa.yaml"))).toBe(true);
	});
});

describe("run", () => {
	it("evaluates and persists run record", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, BASE_CONFIG(), DEFAULT_GS);

		const { exitCode, stdout } = await runCli(
			["run", "--config", configPath],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("suite(s) evaluated");

		const record = latestRecord(dir);
		expect(record).not.toBeNull();
		expect(record?.golden_set_name).toBe("integration-gs");
		expect(typeof record?.suite_score).toBe("number");
		expect(Array.isArray(record?.test_case_results)).toBe(true);
		expect(record?.test_case_results).toHaveLength(2);
	});

	it("outputs JSON report with --format json", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, BASE_CONFIG(), DEFAULT_GS);
		const outPath = resolve(dir, "report.json");

		const { exitCode } = await runCli(
			["run", "--config", configPath, "--format", "json", "--output", outPath],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(existsSync(outPath)).toBe(true);
		const report = JSON.parse(readFileSync(outPath, "utf-8"));
		expect(report.suite.name).toBe("integration-gs");
		expect(report.summary).toBeDefined();
		expect(report.test_cases).toHaveLength(2);
	});

	it("outputs Markdown report with --format markdown", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, BASE_CONFIG(), DEFAULT_GS);
		const outPath = resolve(dir, "report.md");

		const { exitCode } = await runCli(
			[
				"run",
				"--config",
				configPath,
				"--format",
				"markdown",
				"--output",
				outPath,
			],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(existsSync(outPath)).toBe(true);
		const report = readFileSync(outPath, "utf-8");
		expect(report).toContain("Regtrace Report");
		expect(report).toContain("Quality Gates");
	});

	it("rejects invalid config", async () => {
		const dir = tmpDir();
		writeFileSync(resolve(dir, "bad.yaml"), "invalid: [\nbad: yaml", "utf-8");

		const { exitCode } = await runCli(
			["run", "--config", resolve(dir, "bad.yaml")],
			dir,
		);

		expect(exitCode).toBe(1);
	});
});

describe("list + history", () => {
	it("shows runs after evaluation", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, BASE_CONFIG(), DEFAULT_GS);

		await runCli(["run", "--config", configPath], dir);
		expect(latestRecord(dir)).not.toBeNull();

		const { exitCode, stdout } = await runCli(
			["list", "--config", configPath],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("integration-gs");
	});

	it("shows specific run with --run-id", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(dir, BASE_CONFIG(), DEFAULT_GS);

		await runCli(["run", "--config", configPath], dir);
		const record = latestRecord(dir);
		const runId = record?.run_id as string;

		const { exitCode, stdout } = await runCli(
			["history", "--config", configPath, "--run-id", runId],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(stdout).toContain(runId);
	});
});

describe("quality gates", () => {
	it("fails when suite_score_minimum not met", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(
			dir,
			BASE_CONFIG(`  suite_score_minimum: 0.99
  max_failed_test_cases: 5
  max_low_confidence_ratio: 1.0
  regression_gate: false`),
			DEFAULT_GS,
		);

		const { exitCode, stdout } = await runCli(
			["run", "--config", configPath],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("FAILED");
		const record = latestRecord(dir);
		expect(record?.status).toBe("failed");
	});

	it("passes when all gates satisfied", async () => {
		const dir = tmpDir();
		const { configPath } = writeFiles(
			dir,
			BASE_CONFIG(`  suite_score_minimum: 0.1
  max_failed_test_cases: 5
  max_low_confidence_ratio: 1.0
  regression_gate: false`),
			ALL_PASS_GS,
		);

		const { exitCode, stdout } = await runCli(
			["run", "--config", configPath],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("PASSED");
		const record = latestRecord(dir);
		expect(record?.status).toBe("passed");
	});
});

describe("error handling", () => {
	it("handles missing config gracefully", async () => {
		const dir = tmpDir();
		const { exitCode } = await runCli(
			["run", "--config", resolve(dir, "no-such.yaml")],
			dir,
		);
		expect(exitCode).toBe(1);
	});

	it("handles missing golden set without crashing", async () => {
		const dir = tmpDir();
		const cfg = BASE_CONFIG().replace("golden-set.yaml", "no-such.yaml");
		writeFileSync(resolve(dir, "regtrace.config.yaml"), cfg, "utf-8");

		const { exitCode, stdout } = await runCli(
			["run", "--config", resolve(dir, "regtrace.config.yaml")],
			dir,
		);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("suite(s) evaluated");
	});
});
