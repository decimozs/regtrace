import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dump } from "js-yaml";
import { loadRunRecord } from "../storage/run-store";
import { printError, printHeader, printInfo, printSuccess } from "./print";

function getConfigPath(config?: string): string {
	if (config) return resolve(config);
	return resolve(process.cwd(), "regtrace.config.yaml");
}

interface ScaffoldInput {
	input: string;
	output: string;
	systemPrompt?: string;
	description?: string;
}

function isJsonOutput(output: string): boolean {
	try {
		JSON.parse(output);
		return true;
	} catch {
		return false;
	}
}

function isProseOutput(output: string): boolean {
	return output.split(/\s+/).length >= 5 && output.includes(".");
}

export function detectMetrics(output: string): string[] {
	const metrics = ["factuality", "format"];
	if (isProseOutput(output) || !isJsonOutput(output)) {
		metrics.push("tone");
	}
	return metrics;
}

export function buildGoldenSet(inputs: ScaffoldInput[], name: string): string {
	const now = new Date().toISOString();
	const cases = inputs.map((item, i) => {
		const id = `scaffold-${String(i + 1).padStart(3, "0")}`;
		const metrics = detectMetrics(item.output);
		const tc: Record<string, unknown> = {
			id,
			description: item.description ?? `Auto-generated test case ${id}`,
			input: item.input,
			system_prompt: item.systemPrompt ?? null,
			expected_output: item.output,
			actual_output: null,
			metrics,
			tags: ["scaffolded"],
			weight: 1,
		};
		return tc;
	});

	const goldenSet: Record<string, unknown> = {
		name,
		version: "0.1.0",
		description: `Auto-scaffolded golden set with ${inputs.length} test cases`,
		interaction_type: "single_turn",
		tags: ["scaffolded"],
		author: "regtrace scaffold",
		created_at: now,
		updated_at: now,
		test_cases: cases,
	};

	return dump(goldenSet, {
		indent: 2,
		lineWidth: 120,
		noRefs: true,
		sortKeys: false,
	});
}

function parseJsonl(content: string): ScaffoldInput[] {
	const lines = content.trim().split("\n").filter(Boolean);
	return lines.map((line) => {
		const parsed = JSON.parse(line);
		if (!parsed.input || !parsed.output) {
			throw new Error(`Each JSONL line must have "input" and "output" fields`);
		}
		return {
			input: parsed.input,
			output: parsed.output,
			systemPrompt: parsed.system_prompt,
			description: parsed.description,
		};
	});
}

function parseJson(content: string): ScaffoldInput[] {
	const parsed = JSON.parse(content);
	if (Array.isArray(parsed)) {
		return parsed.map((item) => {
			if (!item.input || !item.output) {
				throw new Error(`Each object must have "input" and "output" fields`);
			}
			return {
				input: item.input,
				output: item.output,
				systemPrompt: item.system_prompt,
				description: item.description,
			};
		});
	}
	if (parsed.input && parsed.output) {
		return [
			{
				input: parsed.input,
				output: parsed.output,
				systemPrompt: parsed.system_prompt,
				description: parsed.description,
			},
		];
	}
	throw new Error(
		"JSON must be an array of {input, output} objects or a single {input, output} object",
	);
}

async function fromRunRecord(
	runId: string,
	basePath: string,
): Promise<ScaffoldInput[]> {
	const record = await loadRunRecord(basePath, runId);
	if (!record) {
		throw new Error(`Run record "${runId}" not found`);
	}
	return record.test_case_results.map((tc) => ({
		input: tc.input,
		output: tc.actual_output,
		description: `From run ${runId}, test case ${tc.test_case_id}`,
	}));
}

function fromFile(filePath: string): ScaffoldInput[] {
	const content = readFileSync(filePath, "utf-8");
	const trimmed = content.trim();
	if (!trimmed) return [];

	// Try full JSON parse first (array or single object)
	try {
		JSON.parse(trimmed);
		return parseJson(trimmed);
	} catch {
		// Not valid full JSON — try JSONL
		return parseJsonl(trimmed);
	}
}

export interface ScaffoldOptions {
	fromRun?: string;
	fromFile?: string;
	write?: boolean;
	name?: string;
	config?: string;
}

export async function scaffoldCommand(options: ScaffoldOptions): Promise<void> {
	const name = options.name ?? "scaffolded";
	const configPath = getConfigPath(options.config);
	const configDir = resolve(configPath, "..");

	let inputs: ScaffoldInput[];

	if (options.fromRun) {
		inputs = await fromRunRecord(options.fromRun, configDir);
	} else if (options.fromFile) {
		const filePath = resolve(process.cwd(), options.fromFile);
		if (!existsSync(filePath)) {
			printError(`File not found: ${filePath}`);
			process.exit(2);
		}
		inputs = fromFile(filePath);
	} else {
		printError("Either --from-run or --from-file is required");
		process.exit(2);
	}

	if (inputs.length === 0) {
		printError("No test cases found in the source");
		process.exit(2);
	}

	const yaml = buildGoldenSet(inputs, name);

	if (options.write) {
		const outputDir = resolve(configDir, "golden-sets");
		const outputPath = resolve(outputDir, `${name}.yaml`);

		if (!existsSync(outputDir)) {
			const { mkdir } = await import("node:fs/promises");
			await mkdir(outputDir, { recursive: true });
		}

		await (await import("node:fs/promises")).writeFile(
			outputPath,
			yaml,
			"utf-8",
		);

		printHeader("Golden Set Scaffolded");
		printSuccess(`Wrote ${inputs.length} test cases to ${outputPath}`);
		printInfo(
			`Run \`regtrace run --set golden-sets/${name}.yaml --generate\` to evaluate`,
		);
	} else {
		printHeader("Golden Set Scaffolded");
		printInfo(`Generated ${inputs.length} test cases. Output below:`);
		console.log(yaml);
	}
}
