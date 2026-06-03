import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { load } from "js-yaml";

const CLI_ENTRY = resolve(import.meta.dirname ?? ".", "../../src/index.ts");
const tempDirs: string[] = [];

afterAll(() => {
	for (const dir of tempDirs) {
		try {
			rmSync(dir, { recursive: true, force: true });
		} catch {
			/* ignore */
		}
	}
});

function tmpDir(): string {
	const d = resolve(
		import.meta.dirname ?? ".",
		"../../.test-tmp",
		`baseline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
	);
	mkdirSync(d, { recursive: true });
	tempDirs.push(d);
	return d;
}

const MINIMAL_CONFIG = `project:
  name: test-project
  version: "1.0"
golden_sets:
  - path: golden-sets/qa.yaml
    enabled: true
    weight: 1
metrics:
  enabled: [format]
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

const SAMPLE_RUN_RECORD = {
	run_id: "run_test_pin_001",
	timestamp: "2026-06-01T12:00:00.000Z",
	status: "passed",
	trigger: "cli",
	duration_ms: 1000,
	regtrace_version: "0.1.0",
	judge_provider: "anthropic",
	judge_model: "claude-3-5-sonnet-20240620",
	config_hash: "abc123",
	golden_set_name: "test-set",
	golden_set_version: "1.0.0",
	golden_set_file_hash: "def456",
	suite_score: 0.85,
	metric_summary: { format: { score: 0.85, pass_rate: 1.0 } },
	test_case_results: [
		{
			test_case_id: "tc-001",
			input: "test",
			actual_output: "output",
			overall_passed: true,
			severity: "pass",
			metric_results: {
				format: {
					metric_name: "format",
					score: 0.85,
					confidence: 1,
					passed: true,
					threshold: 0.7,
					explanation: "All checks passed.",
					evaluation_type: "deterministic",
					token_cost: 0,
				},
			},
		},
	],
	regression: {
		baseline_run_id: null,
		baseline_golden_set_version: null,
		current_golden_set_version: "1.0.0",
		version_change_detected: false,
		suite_delta: 0,
		regression_status: "clean",
		test_cases_excluded: [],
		metric_deltas: {},
	},
};

async function runCli(
	dir: string,
	args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI_ENTRY, ...args], {
		cwd: dir,
		env: {
			...process.env,
			NO_COLOR: "1",
			ANTHROPIC_API_KEY: "",
			OPENAI_API_KEY: "",
		},
	});
	const exitCode = await proc.exited;
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	return { exitCode, stdout, stderr };
}

describe("baseline command", () => {
	it("pin writes pinned strategy to config", async () => {
		const dir = tmpDir();
		writeFileSync(
			resolve(dir, "regtrace.config.yaml"),
			MINIMAL_CONFIG,
			"utf-8",
		);
		const runsDir = resolve(dir, ".regtrace", "runs");
		mkdirSync(runsDir, { recursive: true });
		writeFileSync(
			resolve(runsDir, "run_test_pin_001.json"),
			JSON.stringify(SAMPLE_RUN_RECORD),
			"utf-8",
		);

		const { exitCode } = await runCli(dir, [
			"baseline",
			"pin",
			"run_test_pin_001",
			"--config",
			resolve(dir, "regtrace.config.yaml"),
		]);
		expect(exitCode).toBe(0);

		const updatedConfig = load(
			readFileSync(resolve(dir, "regtrace.config.yaml"), "utf-8"),
		) as Record<string, unknown>;
		const metrics = updatedConfig.metrics as Record<string, unknown>;
		const regression = metrics?.regression as Record<string, unknown>;
		expect(regression?.baseline_strategy).toBe("pinned");
		expect(regression?.pinned_run_id).toBe("run_test_pin_001");
	});

	it("pin shows success message on stdout", async () => {
		const dir = tmpDir();
		writeFileSync(
			resolve(dir, "regtrace.config.yaml"),
			MINIMAL_CONFIG,
			"utf-8",
		);
		const runsDir = resolve(dir, ".regtrace", "runs");
		mkdirSync(runsDir, { recursive: true });
		const record = { ...SAMPLE_RUN_RECORD, run_id: "run_test_pin_002" };
		writeFileSync(
			resolve(runsDir, "run_test_pin_002.json"),
			JSON.stringify(record),
			"utf-8",
		);

		const { stdout } = await runCli(dir, [
			"baseline",
			"pin",
			"run_test_pin_002",
			"--config",
			resolve(dir, "regtrace.config.yaml"),
		]);
		expect(stdout).toContain("Pinned");
	});

	it("pin exits with error for missing run record", async () => {
		const dir = tmpDir();
		writeFileSync(
			resolve(dir, "regtrace.config.yaml"),
			MINIMAL_CONFIG,
			"utf-8",
		);

		const { exitCode } = await runCli(dir, [
			"baseline",
			"pin",
			"nonexistent_run",
			"--config",
			resolve(dir, "regtrace.config.yaml"),
		]);
		expect(exitCode).toBe(2);
	});

	it("unpin reverts config to last_passing strategy", async () => {
		const dir = tmpDir();
		const pinnedConfig = MINIMAL_CONFIG.replace(
			"baseline_strategy: last_passing",
			"baseline_strategy: pinned\n    pinned_run_id: run_prev",
		);
		writeFileSync(resolve(dir, "regtrace.config.yaml"), pinnedConfig, "utf-8");

		const { exitCode } = await runCli(dir, [
			"baseline",
			"unpin",
			"--config",
			resolve(dir, "regtrace.config.yaml"),
		]);
		expect(exitCode).toBe(0);

		const updatedConfig = load(
			readFileSync(resolve(dir, "regtrace.config.yaml"), "utf-8"),
		) as Record<string, unknown>;
		const metrics = updatedConfig.metrics as Record<string, unknown>;
		const regression = metrics?.regression as Record<string, unknown>;
		expect(regression?.baseline_strategy).toBe("last_passing");
		expect(
			(regression as Record<string, unknown>).pinned_run_id,
		).toBeUndefined();
	});

	it("show displays last_passing strategy when not pinned", async () => {
		const dir = tmpDir();
		writeFileSync(
			resolve(dir, "regtrace.config.yaml"),
			MINIMAL_CONFIG,
			"utf-8",
		);

		const { stdout } = await runCli(dir, [
			"baseline",
			"show",
			"--config",
			resolve(dir, "regtrace.config.yaml"),
		]);
		expect(stdout).toContain("last_passing");
	});

	it("show displays pinned run details when pinned", async () => {
		const dir = tmpDir();
		const pinnedConfig = MINIMAL_CONFIG.replace(
			"baseline_strategy: last_passing",
			"baseline_strategy: pinned\n    pinned_run_id: run_test_pin_001",
		);
		writeFileSync(resolve(dir, "regtrace.config.yaml"), pinnedConfig, "utf-8");
		const runsDir = resolve(dir, ".regtrace", "runs");
		mkdirSync(runsDir, { recursive: true });
		writeFileSync(
			resolve(runsDir, "run_test_pin_001.json"),
			JSON.stringify(SAMPLE_RUN_RECORD),
			"utf-8",
		);

		const { stdout } = await runCli(dir, [
			"baseline",
			"show",
			"--config",
			resolve(dir, "regtrace.config.yaml"),
		]);

		expect(stdout).toContain("run_test_pin_001");
		expect(stdout).toContain("85.0%");
	});
});
