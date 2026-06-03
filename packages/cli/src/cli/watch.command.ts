import { watch } from "node:fs";
import { resolve } from "node:path";
import { loadConfigFromFile } from "../storage/config-loader";
import { printError, printHeader, printInfo } from "./print";

/** Options for the `regtrace watch` command. */
interface WatchOptions {
	config?: string;
}

/**
 * Watches enabled golden set files for changes and re-runs evaluation on each
 * modification. Debounces rapid changes by 500 ms and performs a graceful
 * shutdown on SIGINT/SIGTERM.
 *
 * @param options.config - Path to the config file.
 * @throws Exits with code 2 if config validation fails or no golden sets are enabled.
 * @example
 * await watchCommand({ config: "./regtrace.config.yaml" });
 */
export async function watchCommand(options: WatchOptions): Promise<void> {
	const configResult = await loadConfigFromFile(options.config);

	if (!configResult.success) {
		for (const err of configResult.errors) {
			printError(`${err.field}: ${err.message}`);
		}
		printError("Fix config or run `regtrace init` to create a new project.");
		process.exit(2);
	}

	const config = configResult.data;
	const configPath = configResult.configPath;
	if (!configPath) {
		printError("Config path not found. Run `regtrace init` first.");
		process.exit(2);
	}

	const configDir = resolve(configPath, "..");
	const enabledSets = config.golden_sets.filter((gs) => gs.enabled);

	if (enabledSets.length === 0) {
		printError(
			"No enabled golden sets to watch. Enable at least one golden set in regtrace.config.yaml.",
		);
		process.exit(2);
	}

	const watchPaths = enabledSets.map((gs) => {
		if (gs.path.startsWith("/")) return gs.path;
		return resolve(configDir, gs.path);
	});

	printHeader("regtrace watch");
	printInfo(`Watching ${watchPaths.length} golden set file(s)...`);
	printInfo("Press Ctrl+C to stop");
	console.log();

	// graceful shutdown on SIGINT/SIGTERM
	const cleanup = () => {
		console.log();
		printInfo("Watch stopped");
		process.exit(0);
	};
	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);

	// track pending re-runs for debouncing
	const pending = new Set<string>();
	let timer: ReturnType<typeof setTimeout> | null = null;

	for (const filePath of watchPaths) {
		watch(filePath, (eventType) => {
			if (eventType !== "change") return;

			pending.add(filePath);

			if (timer) clearTimeout(timer);
			timer = setTimeout(async () => {
				const changed = Array.from(pending);
				pending.clear();
				timer = null;

				printInfo(`Change detected: ${changed.join(", ")}`);
				try {
					await runEvaluation(configPath);
				} catch (err) {
					printError(
						`Evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
					);
				}
			}, 500);
		});

		printInfo(`  Watching: ${filePath}`);
	}

	// keep alive
	await new Promise(() => {});
}

/** Lazily imports and runs `runCommand` to avoid circular imports at module load time. */
async function runEvaluation(configPath: string): Promise<void> {
	const { runCommand } = await import("./run.command");
	await runCommand({
		config: configPath,
		trigger: "watch",
	});
}
