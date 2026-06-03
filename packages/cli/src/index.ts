#!/usr/bin/env bun
declare const __VERSION__: string | undefined;

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import {
	baselinePinCommand,
	baselineShowCommand,
	baselineUnpinCommand,
} from "./cli/baseline.command";
import { initCommand } from "./cli/init.command";
import { historyCommand, listCommand } from "./cli/list.command";
import { configureColor, isCiEnvironment, printError } from "./cli/print";
import { runCommand } from "./cli/run.command";
import { watchCommand } from "./cli/watch.command";
import { rebuildDb } from "./storage/db-store";

configureColor(
	process.env.NO_COLOR ? "never" : isCiEnvironment() ? "never" : "auto",
);

process.on("unhandledRejection", (err) => {
	printError(
		`Unhandled error: ${err instanceof Error ? err.message : String(err)}`,
	);
	process.exit(1);
});

const program = new Command();

program
	.name("regtrace")
	.description("LLM evaluation and benchmarking tool")
	.version(typeof __VERSION__ === "string" ? __VERSION__ : getVersion())
	.addHelpText(
		"afterAll",
		`
Examples:
  regtrace init                  Create a new project
  regtrace init --force          Overwrite existing files
  regtrace run                   Run all golden sets
  regtrace run --set qa.yaml     Run a specific set
  regtrace run --format json     JSON output (stdout)
  regtrace run --ci              CI mode (no color, exit 1 on failure)
  regtrace run --bail            Stop at first suite failure
  regtrace run --dry-run         Validate config without evaluating
  regtrace list                  List recent runs
  regtrace history --run-id <id> Show a specific run
  regtrace history --diff <a> <b> Compare two runs
  regtrace watch                 Watch files and re-run on change
  regtrace baseline pin <run-id> Pin a run as baseline
  regtrace baseline show         Show current baseline`,
	);

program
	.command("init")
	.description("Scaffold a new regtrace project")
	.option("-d, --dir <path>", "Target directory (default: current dir)")
	.option("--force", "Overwrite existing files")
	.action(async (options: { dir?: string; force?: boolean }) => {
		await initCommand(options);
	});

program
	.command("run")
	.description("Run evaluations against golden sets")
	.option("-c, --config <path>", "Path to config file")
	.option("-s, --set <name>", "Run a specific golden set (path or alias)")
	.option("-t, --trigger <type>", "Run trigger type: cli|ci|watch", "cli")
	.option("-f, --format <type>", "Output format: terminal|json|markdown")
	.option("-o, --output <path>", "Write report to file")
	.option("--ci", "CI mode — suppress color, exit 1 on quality gate failure")
	.option("--no-ci", "Disable CI mode auto-detection")
	.option("--verbose", "Show all test cases, including passing ones")
	.option(
		"--dry-run",
		"Validate config, golden sets, and env without evaluating",
	)
	.option("--bail", "Stop after first suite that fails quality gates")
	.option("--generate", "Generate actual_output from LLM for null test cases")
	.option("--quiet", "Suppress progress output, show only errors and results")
	.addHelpText(
		"after",
		`
Examples:
  regtrace run
  regtrace run --format json        # JSON output to stdout
  regtrace run --format json -o report.json
  regtrace run --set my-set --ci --bail
  regtrace run --dry-run            # Validate setup
  regtrace run --generate           # Generate actual_output from LLM for null test cases`,
	)
	.action(
		async (options: {
			config?: string;
			set?: string;
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
		}) => {
			await runCommand({
				config: options.config,
				setName: options.set,
				trigger: (options.trigger as "cli" | "ci" | "watch") ?? "cli",
				format: options.format,
				output: options.output,
				ci: options.ci,
				noCi: options.noCi,
				verbose: options.verbose,
				dryRun: options.dryRun,
				bail: options.bail,
				generate: options.generate,
				quiet: options.quiet,
			});
		},
	);

program
	.command("watch")
	.description("Watch golden set files and re-run evaluations on change")
	.option("-c, --config <path>", "Path to config file")
	.addHelpText(
		"after",
		`
Examples:
  regtrace watch
  regtrace watch --config /path/to/regtrace.config.yaml`,
	)
	.action(async (options: { config?: string }) => {
		await watchCommand(options);
	});

program
	.command("list")
	.description("List all run records")
	.option("-c, --config <path>", "Path to config file")
	.action(async (options: { config?: string }) => {
		await listCommand(options);
	});

program
	.command("history")
	.description("Show run details or diff two runs")
	.option("-c, --config <path>", "Path to config file")
	.option("-r, --run-id <id>", "Specific run ID to inspect")
	.option(
		"-d, --diff <run-b>",
		"Diff against another run (or immediate predecessor)",
	)
	.addHelpText(
		"after",
		`
Examples:
  regtrace history                          Latest run
  regtrace history --run-id run_20260101_abc Latest run
  regtrace history --diff run_20260101_abc  Compare with predecessor
  regtrace history --diff run_a run_b       Compare two specific runs`,
	)
	.action(
		async (options: { config?: string; runId?: string; diff?: string }) => {
			await historyCommand(options);
		},
	);

program
	.command("baseline")
	.description("Manage baseline for regression detection")
	.addCommand(
		new Command("pin")
			.description("Pin a specific run as baseline")
			.argument("<run-id>", "Run ID to pin")
			.option("-c, --config <path>", "Path to config file")
			.action(async (runId: string, options: { config?: string }) => {
				await baselinePinCommand({ config: options.config, runId });
			}),
	)
	.addCommand(
		new Command("unpin")
			.description("Revert to last_passing strategy")
			.option("-c, --config <path>", "Path to config file")
			.action(async (options: { config?: string }) => {
				await baselineUnpinCommand(options);
			}),
	)
	.addCommand(
		new Command("show")
			.description("Show current baseline info")
			.option("-c, --config <path>", "Path to config file")
			.action(async (options: { config?: string }) => {
				await baselineShowCommand(options);
			}),
	);

program
	.command("db")
	.description("Manage the run database")
	.addCommand(
		new Command("rebuild")
			.description("Rebuild database from .regtrace/runs/ files")
			.option("-c, --config <path>", "Path to config file")
			.action(async (options: { config?: string }) => {
				const { loadConfigFromFile } = await import("./storage/config-loader");
				const result = await loadConfigFromFile(options.config);
				if (!result.success || !result.configPath) {
					console.error(
						"Config not found. Run `regtrace init` to create a project.",
					);
					process.exit(2);
				}
				const configDir = resolve(result.configPath, "..");
				const dbPath = resolve(
					configDir,
					result.data.storage?.db.path ?? ".regtrace/regtrace.db",
				);
				const count = rebuildDb(configDir, dbPath);
				console.log(`Rebuilt database: ${count} runs imported.`);
			}),
	);

program.parse();

function getVersion(): string {
	try {
		const pkgPath = resolve(import.meta.dirname ?? ".", "..", "package.json");
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
		return pkg.version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}
