import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { load } from "js-yaml";
import {
	type ValidationResult,
	validateConfig,
} from "../schema/validators/config.validator";

const CONFIG_FILENAMES = ["regtrace.config.yaml", "regtrace.config.yml"];

/** Result of loading a regtrace config, including the resolved file path on success. */
export type LoadConfigResult = ValidationResult & { configPath?: string };

/**
 * Walk upward from `startDir` looking for a regtrace config file.
 * @param startDir - Directory to start searching from. Defaults to `process.cwd()`.
 * @returns The absolute path to the first matching config file, or `null` if none is found.
 */
export function findConfigFile(
	startDir: string = process.cwd(),
): string | null {
	let current = resolve(startDir);

	while (true) {
		for (const filename of CONFIG_FILENAMES) {
			const filePath = resolve(current, filename);
			if (existsSync(filePath)) {
				return filePath;
			}
		}

		const parent = dirname(current);
		if (parent === current) break; // filesystem root reached
		current = parent;
	}

	return null;
}

/**
 * Read, parse, and validate a regtrace YAML config file.
 * @param filePath - Explicit path to the config file. If omitted, the nearest config is located via `findConfigFile`.
 * @returns A `LoadConfigResult` — on success includes the parsed config data and resolved `configPath`; on failure includes a list of field-level errors.
 */
export async function loadConfigFromFile(
	filePath?: string,
): Promise<LoadConfigResult> {
	const configPath = filePath ?? findConfigFile();

	if (!configPath) {
		const searchHint = filePath
			? `File not found: ${filePath}`
			: "No regtrace.config.yaml or regtrace.config.yml found in current or parent directories. Run `regtrace init` to create one.";
		return {
			success: false,
			errors: [
				{
					field: "file",
					message: searchHint,
				},
			],
		};
	}

	let content: string;
	try {
		content = await readFile(configPath, "utf-8");
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			success: false,
			errors: [
				{
					field: "file",
					message: `Cannot read config file (${basename(configPath)}): ${message}`,
				},
			],
		};
	}

	let parsed: unknown;
	try {
		parsed = load(content);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			success: false,
			errors: [
				{
					field: "file",
					message: `YAML parse error in ${basename(configPath)}: ${message}`,
				},
			],
		};
	}

	const result = validateConfig(parsed);
	if (result.success) {
		return { ...result, configPath };
	}
	return result;
}
