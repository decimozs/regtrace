import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateReport } from "../reports/reporter";
import type { ReportData } from "../reports/types";
import { loadConfigFromFile } from "../storage/config-loader";
import { loadGoldenSetFromFile } from "../storage/golden-set-loader";
import {
	configureColor,
	isCiEnvironment,
	printError,
	printHeader,
	printInfo,
	printMetricSummary,
	printQualityGates,
	printSuccess,
	printSuiteSummary,
	printTestCaseResults,
} from "./print";
import { runPipeline } from "./run-pipeline";

const VALID_FORMATS = ["terminal", "json", "markdown"] as const;
const VALID_TRIGGERS = ["cli", "ci", "watch"] as const;

interface RunOptions {
	config?: string;
	setName?: string;
	trigger?: string;
	format?: string;
	output?: string;
	ci?: boolean;
	noCi?: boolean;
	verbose?: boolean;
	dryRun?: boolean;
	bail?: boolean;
	generate?: boolean;
	quiet?: boolean;
}

function validateOption<T>(
	value: string | undefined,
	valid: readonly T[],
	name: string,
): T | undefined {
	if (value === undefined) return undefined;
	if ((valid as readonly string[]).includes(value)) return value as T;
	printError(
		`Invalid ${name} "${value}". Valid: ${valid.map((v) => `"${String(v)}"`).join(", ")}`,
	);
	process.exit(2);
}

export async function runCommand(options: RunOptions): Promise<void> {
	const startTime = Date.now();
	const trigger = validateOption(
		options.trigger ?? "cli",
		VALID_TRIGGERS,
		"trigger",
	);
	if (!trigger) return;

	const ciMode = options.ci === true;
	const noColor = options.noCi ? false : ciMode || isCiEnvironment();
	configureColor(noColor ? "never" : "auto");

	if (options.dryRun) {
		await runDryRun(options);
		return;
	}

	printHeader("regtrace run");

	// Load config
	const configPrep = await loadConfigFromFile(options.config);
	if (!configPrep.success) {
		for (const err of configPrep.errors) {
			printError(`${err.field}: ${err.message}`);
		}
		printError(
			"Fix the config or run `regtrace init` to create a new project.",
		);
		process.exit(2);
	}
	if (!configPrep.configPath) {
		printError("Config path not found");
		process.exit(2);
	}

	const config = configPrep.data;
	const configDir = resolve(configPrep.configPath, "..");
	const configContent = readFileSync(configPrep.configPath, "utf-8");

	// Validate format
	const format =
		validateOption(options.format ?? "terminal", VALID_FORMATS, "format") ??
		"terminal";

	// Filter to requested set
	let enabledSets = config.golden_sets.filter((gs) => gs.enabled);
	if (options.setName) {
		const filtered = enabledSets.filter(
			(gs) => gs.path === options.setName || gs.alias === options.setName,
		);
		if (filtered.length === 0) {
			printError(`No golden set matches "${options.setName}".`);
			printInfo(
				`Available sets: ${config.golden_sets
					.filter((gs) => gs.enabled)
					.map((gs) => gs.path)
					.join(", ")}`,
			);
			process.exit(2);
		}
		enabledSets = filtered;
	}

	if (ciMode) {
		printInfo(
			"CI mode — output suppressed, exit code reflects quality gates\n",
		);
	}

	// Run the pipeline
	const pipelineResults = await runPipeline(
		config,
		configDir,
		configContent,
		startTime,
		{
			generate: options.generate,
			trigger: trigger as "cli" | "ci" | "watch",
			quiet: options.quiet,
		},
	);

	// Output results
	for (const { run: record, qualityGates } of pipelineResults) {
		if (format === "json") {
			const reportData: ReportData = { run: record, qualityGates, config };
			const report = generateReport(reportData, "json");
			const outputPath =
				options.output ??
				config.output.report_path ??
				`.regtrace/report-${record.run_id}.json`;
			writeFileSync(outputPath, report, "utf-8");
			console.log(JSON.stringify(reportData, null, 2));
		} else if (format === "markdown") {
			const reportData: ReportData = { run: record, qualityGates, config };
			const report = generateReport(reportData, "markdown");
			const outputPath =
				options.output ??
				config.output.report_path ??
				`.regtrace/report-${record.run_id}.md`;
			writeFileSync(outputPath, report, "utf-8");
			printInfo(`Report written: ${outputPath}`);
		} else {
			printSuiteSummary(record);
			printTestCaseResults(record.test_case_results, {
				verbose: options.verbose,
			});
			printMetricSummary(record);
			printQualityGates(qualityGates);
		}

		if (options.bail && !qualityGates.passed) {
			printError("Bailing after first suite failure (--bail)");
			process.exit(1);
		}
	}

	// Summary
	const passCount = pipelineResults.filter((r) => r.qualityGates.passed).length;
	const failCount = pipelineResults.filter(
		(r) => !r.qualityGates.passed,
	).length;
	const totalDurationMs = Date.now() - startTime;

	console.error();
	printHeader("Run Complete");
	printInfo(`${pipelineResults.length} suite(s) evaluated`);
	printInfo(`${totalDurationMs}ms total`);
	if (passCount > 0) printSuccess(`${passCount} suite(s) passed`);
	if (failCount > 0) printError(`${failCount} suite(s) failed`);
	console.error();

	if (ciMode && failCount > 0) process.exit(1);
}

async function runDryRun(options: RunOptions): Promise<void> {
	const dryStart = Date.now();
	printHeader("regtrace dry-run");

	const configPrep = await loadConfigFromFile(options.config);
	if (!configPrep.success) {
		for (const err of configPrep.errors) {
			printError(`${err.field}: ${err.message}`);
		}
		process.exit(2);
	}

	const config = configPrep.data;
	const configDir = configPrep.configPath
		? resolve(configPrep.configPath, "..")
		: process.cwd();
	const enabledSets = config.golden_sets.filter((gs) => gs.enabled);

	printInfo(`Config: valid`);
	printInfo(`Project: ${config.project.name} v${config.project.version}`);
	printInfo(`Golden sets: ${enabledSets.length} enabled`);

	let hasNullOutput = false;
	for (const gsEntry of enabledSets) {
		const fullPath = gsEntry.path.startsWith("/")
			? gsEntry.path
			: resolve(configDir, gsEntry.path);
		const loadResult = await loadGoldenSetFromFile(fullPath);
		if (loadResult.success) {
			printSuccess(
				`  ${gsEntry.path} — ${loadResult.data.test_cases.length} test cases`,
			);
			for (const tc of loadResult.data.test_cases) {
				if (tc.actual_output == null) hasNullOutput = true;
			}
		} else {
			printError(
				`  ${gsEntry.path} — invalid: ${loadResult.errors.map((e) => e.message).join("; ")}`,
			);
		}
	}

	if (hasNullOutput && !options.generate) {
		printInfo(
			"  Some test cases have null actual_output. Use --generate to auto-generate.",
		);
	}

	// Check if any env vars are set for the configured providers
	const judgeProvider = config.judge.primary.provider;
	const providerEnvMap: Record<string, string> = {
		openai: "OPENAI_API_KEY",
		anthropic: "ANTHROPIC_API_KEY",
		gemini: "GEMINI_API_KEY",
		groq: "GROQ_API_KEY",
	};
	const envVar = providerEnvMap[judgeProvider];
	if (envVar && !process.env[envVar]) {
		printInfo(
			`  ${judgeProvider} provider configured but ${envVar} is not set in environment.`,
		);
	}

	printInfo(
		`Judge provider: ${config.judge.primary.provider}/${config.judge.primary.model}`,
	);
	printInfo(
		"Judge provider connectivity: skipped (dry-run does not call providers)",
	);
	const actualMs = Date.now() - dryStart;
	printSuccess(`Dry-run completed in ${actualMs}ms`);
}
