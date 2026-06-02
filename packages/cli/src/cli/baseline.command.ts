import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { dump, load } from "js-yaml";
import { loadConfigFromFile } from "../storage/config-loader";
import { loadRunRecord } from "../storage/run-store";
import { printError, printHeader, printInfo, printSuccess } from "./print";

function getConfigPath(config?: string): string {
	if (config) return resolve(config);
	return resolve(process.cwd(), "regtrace.config.yaml");
}

export async function baselinePinCommand(options: {
	config?: string;
	runId: string;
}): Promise<void> {
	const configPath = getConfigPath(options.config);
	let configRaw: string;

	try {
		configRaw = readFileSync(configPath, "utf-8");
	} catch {
		printError(`Config not found: ${configPath}`);
		process.exit(1);
	}

	const configDir = resolve(configPath, "..");
	const record = await loadRunRecord(configDir, options.runId);

	if (!record) {
		printError(`Run record "${options.runId}" not found`);
		process.exit(1);
	}

	const loaded = await loadConfigFromFile(configPath);
	if (!loaded.success) {
		printError("Invalid config file");
		process.exit(1);
	}

	const parsed = load(configRaw) as Record<string, unknown>;
	const metrics = (parsed.metrics as Record<string, unknown>) ?? {};
	const regression = (metrics.regression as Record<string, unknown>) ?? {};
	regression.baseline_strategy = "pinned";
	regression.pinned_run_id = options.runId;
	metrics.regression = regression;
	parsed.metrics = metrics;

	writeFileSync(configPath, dump(parsed), "utf-8");

	printHeader("Baseline Pinned");
	printSuccess(`Pinned "${options.runId}" as baseline`);
	printInfo(`Updated: ${configPath}`);
}

export async function baselineUnpinCommand(options: {
	config?: string;
}): Promise<void> {
	const configPath = getConfigPath(options.config);
	let configRaw: string;

	try {
		configRaw = readFileSync(configPath, "utf-8");
	} catch {
		printError(`Config not found: ${configPath}`);
		process.exit(1);
	}

	const parsed = load(configRaw) as Record<string, unknown>;
	const metrics = parsed.metrics as Record<string, unknown> | undefined;
	if (metrics) {
		const regression = metrics.regression as
			| Record<string, unknown>
			| undefined;
		if (regression) {
			regression.baseline_strategy = "last_passing";
			delete regression.pinned_run_id;
		}
	}

	writeFileSync(configPath, dump(parsed), "utf-8");

	printHeader("Baseline Unpinned");
	printSuccess("Reverted to last_passing strategy");
	printInfo(`Updated: ${configPath}`);
}

export async function baselineShowCommand(options: {
	config?: string;
}): Promise<void> {
	const configPath = getConfigPath(options.config);
	let configRaw: string;

	try {
		configRaw = readFileSync(configPath, "utf-8");
	} catch {
		printError(`Config not found: ${configPath}`);
		process.exit(1);
	}

	const configDir = resolve(configPath, "..");
	const parsed = load(configRaw) as Record<string, unknown>;
	const metrics = parsed.metrics as Record<string, unknown> | undefined;
	const regression = metrics?.regression as Record<string, unknown> | undefined;
	const strategy = regression?.baseline_strategy as string | undefined;
	const pinnedRunId = regression?.pinned_run_id as string | undefined;

	printHeader("Current Baseline");

	if (strategy === "pinned" && pinnedRunId) {
		const record = await loadRunRecord(configDir, pinnedRunId);
		if (record) {
			printSuccess(`Pinned run: ${pinnedRunId}`);
			printInfo(
				`  Suite: ${record.golden_set_name} v${record.golden_set_version}`,
			);
			printInfo(`  Score: ${(record.suite_score * 100).toFixed(1)}%`);
		} else {
			printInfo(`Pinned run: ${pinnedRunId} (not found in local storage)`);
		}
	} else {
		printInfo("Strategy: last_passing (latest passing run)");
	}
}
