import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { load } from "js-yaml";
import {
	type ValidationResult,
	validateGoldenSet,
} from "../schema/validators/golden-set.validator";

export type LoadResult = ValidationResult;

export async function loadGoldenSetFromFile(
	filePath: string,
): Promise<LoadResult> {
	let content: string;
	try {
		content = await readFile(filePath, "utf-8");
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			success: false,
			errors: [
				{
					field: "file",
					message: `Cannot read golden set (${basename(filePath)}): ${message}`,
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
					message: `YAML parse error in ${basename(filePath)}: ${message}`,
				},
			],
		};
	}

	return validateGoldenSet(parsed);
}
