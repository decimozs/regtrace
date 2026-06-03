import type { MetricResult } from "../../schema/run-record.schema";
import type { EvaluateInput, MetricEvaluator } from "../types";

type SubCheck =
	| "length"
	| "json_validity"
	| "json_schema"
	| "markdown_structure"
	| "required_fields"
	| "forbidden_content"
	| "regex_match";

function checkJsonValidity(actual: string): boolean {
	try {
		JSON.parse(actual);
		return true;
	} catch {
		return false;
	}
}

function compareJsonStructure(actual: string, expected: string): number {
	let actualParsed: unknown;
	let expectedParsed: unknown;
	try {
		actualParsed = JSON.parse(actual);
		expectedParsed = JSON.parse(expected);
	} catch {
		return 0;
	}

	return compareJsonValues(actualParsed, expectedParsed);
}

function compareJsonValues(actual: unknown, expected: unknown): number {
	if (typeof actual !== typeof expected) return 0;
	if (actual === null && expected === null) return 1;
	if (actual === null || expected === null) return 0;

	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length === 0 && expected.length === 0) return 1;
		if (actual.length === 0 || expected.length === 0) return 0;
		const maxLen = Math.max(actual.length, expected.length);
		let totalScore = 0;
		for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
			totalScore += compareJsonValues(actual[i], expected[i]);
		}
		return totalScore / maxLen;
	}

	if (typeof actual === "object" && typeof expected === "object") {
		const actualKeys = Object.keys(actual as Record<string, unknown>);
		const expectedKeys = Object.keys(expected as Record<string, unknown>);
		if (expectedKeys.length === 0) return 1;
		const allKeys = new Set([...actualKeys, ...expectedKeys]);
		let totalScore = 0;
		for (const key of allKeys) {
			const actualVal = (actual as Record<string, unknown>)[key];
			const expectedVal = (expected as Record<string, unknown>)[key];
			if (expectedVal === undefined) continue;
			if (actualVal === undefined) {
				totalScore += 0;
			} else {
				totalScore += compareJsonValues(actualVal, expectedVal);
			}
		}
		return totalScore / expectedKeys.length;
	}

	if (typeof actual === "string" && typeof expected === "string") {
		return actual === expected ? 1 : 0;
	}

	return actual === expected ? 1 : 0;
}

function checkMarkdownStructure(actual: string): number {
	const hasHeadings = /^#{1,6}\s/m.test(actual);
	const hasLists = /^[\s]*[-*+]\s/m.test(actual) || /^\d+\.\s/m.test(actual);
	const hasCodeBlocks = /```[\s\S]*?```/m.test(actual);
	const hasTables = /\|.+\|/.test(actual) && /^[\s]*\|[-:| ]+\|/.test(actual);
	const hasParagraphs = actual.split("\n\n").length > 1;

	const checks = [
		hasHeadings,
		hasLists,
		hasCodeBlocks,
		hasTables,
		hasParagraphs,
	];
	const passed = checks.filter(Boolean).length;
	return passed / checks.length;
}

function checkRequiredFields(actual: string, expected: string): number {
	const words = expected
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.split(/\s+/)
		.filter((w) => w.length > 3);

	if (words.length === 0) return 1;

	const uniqueWords = [...new Set(words)];
	const actualLower = actual.toLowerCase();
	const found = uniqueWords.filter((w) => actualLower.includes(w)).length;

	return found / uniqueWords.length;
}

const FORBIDDEN_PATTERNS = [
	/\bI'm sorry\b/i,
	/\bI cannot\b/i,
	/\bI don't have\b/i,
	/\bAs an AI\b/i,
	/\bI am an AI\b/i,
	/\bIt seems\b/i,
	/\bI think\b/i,
	/\bI believe\b/i,
	/\bI'm not sure\b/i,
	/\bI don't know\b/i,
];

function checkForbiddenContent(actual: string): number {
	const matches = FORBIDDEN_PATTERNS.filter((p) => p.test(actual)).length;
	if (matches === 0) return 1;
	return Math.max(0, 1 - matches * 0.2);
}

function checkRegexMatch(actual: string, expected: string): number {
	// ReDoS guard: limit regex length and reject complex patterns
	if (expected.length > 500) return 0;
	if (
		/(\(.*\)\{.*,\}|\(\?.*\{.*,\}|\[\^?.*\{.*,\}|\\[wWdDsS]\{.*,\})/.test(
			expected,
		)
	) {
		return 0;
	}
	try {
		const regex = new RegExp(expected, "m");
		return regex.test(actual) ? 1 : 0;
	} catch {
		return 0;
	}
}

function checkLength(
	actual: string,
	expected: string,
	tolerance: number,
): number {
	if (expected.length === 0) return actual.length === 0 ? 1 : 0;
	const ratio = actual.length / expected.length;
	const lower = 1 - tolerance;
	const upper = 1 + tolerance;
	if (ratio >= lower && ratio <= upper) return 1;
	if (ratio < lower) return Math.max(0, ratio / lower);
	return Math.max(0, (upper * 2 - ratio) / upper);
}

const SUB_CHECK_MAP: Record<
	SubCheck,
	(input: EvaluateInput) => { score: number; detail: string }
> = {
	length: (input) => {
		const tolerance = (input.metricConfig.length_tolerance as number) ?? 0.2;
		const score = checkLength(
			input.actualOutput,
			input.expectedOutput,
			tolerance,
		);
		return {
			score,
			detail: `length: actual=${input.actualOutput.length}, expected=${input.expectedOutput.length}, score=${score.toFixed(3)}`,
		};
	},

	json_validity: (input) => {
		const score = checkJsonValidity(input.actualOutput) ? 1 : 0;
		return {
			score,
			detail: `json_validity: ${score === 1 ? "valid" : "invalid"}`,
		};
	},

	json_schema: (input) => {
		const score = compareJsonStructure(
			input.actualOutput,
			input.expectedOutput,
		);
		return { score, detail: `json_schema_match: ${(score * 100).toFixed(0)}%` };
	},

	markdown_structure: (input) => {
		const score = checkMarkdownStructure(input.actualOutput);
		return {
			score,
			detail: `markdown_structure: ${(score * 100).toFixed(0)}%`,
		};
	},

	required_fields: (input) => {
		const score = checkRequiredFields(input.actualOutput, input.expectedOutput);
		return { score, detail: `required_fields: ${(score * 100).toFixed(0)}%` };
	},

	forbidden_content: (input) => {
		const score = checkForbiddenContent(input.actualOutput);
		return { score, detail: `forbidden_content: ${(score * 100).toFixed(0)}%` };
	},

	regex_match: (input) => {
		const score = checkRegexMatch(input.actualOutput, input.expectedOutput);
		return {
			score,
			detail: `regex_match: ${score === 1 ? "matched" : "no match"}`,
		};
	},
};

export const formatEvaluator: MetricEvaluator = {
	metricName: "format",

	async evaluate(input: EvaluateInput): Promise<MetricResult> {
		const subChecks = input.metricConfig.sub_checks as
			| Record<string, boolean>
			| undefined;

		const results: { score: number; detail: string }[] = [];
		const details: string[] = [];

		for (const [checkName, enabled] of Object.entries(subChecks ?? {})) {
			if (!enabled) continue;
			const checkFn = SUB_CHECK_MAP[checkName as SubCheck];
			if (!checkFn) continue;
			const result = checkFn(input);
			results.push(result);
			details.push(result.detail);
		}

		if (results.length === 0) {
			return {
				metric_name: "format",
				score: 1,
				confidence: 1,
				passed: true,
				threshold: input.threshold,
				explanation: "No format sub-checks enabled",
				evaluation_type: "deterministic",
				token_cost: 0,
			};
		}

		const avgScore =
			results.reduce((sum, r) => sum + r.score, 0) / results.length;
		const passed = avgScore >= input.threshold;

		return {
			metric_name: "format",
			score: avgScore,
			confidence: 1,
			passed,
			threshold: input.threshold,
			explanation: details.join("; "),
			evaluation_type: "deterministic",
			token_cost: 0,
		};
	},
};
