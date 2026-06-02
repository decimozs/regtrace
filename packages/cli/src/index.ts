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
import { runCommand } from "./cli/run.command";
import { watchCommand } from "./cli/watch.command";

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
  regtrace run                   Run all golden sets
  regtrace run --set qa.yaml     Run a specific set
  regtrace run --format json     JSON output
  regtrace run --ci              CI mode (exit 1 on failure)
  regtrace run --bail            Stop at first suite failure
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
	.action(async (options: { dir?: string }) => {
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
	.option("--ci", "CI mode — exit 1 if quality gates fail")
	.option("--bail", "Stop after first suite that fails quality gates")
	.addHelpText(
		"after",
		`
Examples:
  regtrace run
  regtrace run --format json --output report.json
  regtrace run --set my-set --ci --bail`,
	)
	.action(
		async (options: {
			config?: string;
			set?: string;
			trigger?: string;
			format?: string;
			output?: string;
			ci?: boolean;
			bail?: boolean;
		}) => {
			await runCommand({
				config: options.config,
				setName: options.set,
				trigger: (options.trigger as "cli" | "ci" | "watch") ?? "cli",
				format: options.format,
				output: options.output,
				ci: options.ci,
				bail: options.bail,
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
