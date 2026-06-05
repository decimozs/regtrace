import type { MetricResult } from "../../schema/run-record.schema";
import type { EvaluateInput, MetricEvaluator } from "../types";

/** Supported format sub-checks, each mapped to a scoring function in `SUB_CHECK_MAP`. */
type SubCheck =
	| "length"
	| "json_validity"
	| "json_schema"
	| "markdown_structure"
	| "required_fields"
	| "forbidden_content"
	| "regex_match";

/**
 * Returns whether the string is valid JSON.
 * @param actual - The string to validate
 * @returns `true` if `actual` parses as JSON without error
 */
function checkJsonValidity(actual: string): boolean {
	try {
		JSON.parse(stripCodeFences(actual));
		return true;
	} catch {
		return false;
	}
}

/**
 * Computes a structural similarity score between two JSON strings by recursively comparing
 * key presence, array lengths, and value equality. Returns 0 if either string is invalid JSON.
 * @param actual - The JSON string produced by the system under test
 * @param expected - The reference JSON string
 * @returns A similarity score in [0, 1]
 */
function compareJsonStructure(actual: string, expected: string): number {
	let actualParsed: unknown;
	let expectedParsed: unknown;
	try {
		actualParsed = JSON.parse(stripCodeFences(actual));
		expectedParsed = JSON.parse(expected);
	} catch {
		return 0;
	}

	return compareJsonValues(actualParsed, expectedParsed);
}

/**
 * Recursively scores structural similarity between two parsed JSON values.
 * Object keys are compared by presence in `expected`; missing keys score 0, extra keys are ignored.
 * Arrays are compared element-wise, with the score scaled by the longer array's length.
 * @param actual - A parsed JSON value from the system output
 * @param expected - A parsed JSON value from the reference
 * @returns A similarity score in [0, 1]
 */
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

/**
 * Scores markdown structural richness by checking for headings, lists, code blocks, tables, and paragraphs.
 * @param actual - The markdown text to evaluate
 * @returns A score in [0, 1] representing the fraction of structural elements present
 */
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

/**
 * Checks whether significant words from `expected` appear in `actual`, filtering to words longer than 3 characters.
 * @param actual - The output text to search within
 * @param expected - The reference text whose significant words must appear
 * @returns The fraction of unique significant words from `expected` found in `actual`
 */
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

/** Patterns that indicate AI-generated hedging or refusal language. Each match deducts 0.2 from the score. */
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

/**
 * Penalises output containing AI refusal or hedging patterns.
 * @param actual - The output text to check
 * @returns 1 when no forbidden patterns match, decreasing by 0.2 per match (clamped to 0)
 */
function checkForbiddenContent(actual: string): number {
	const matches = FORBIDDEN_PATTERNS.filter((p) => p.test(actual)).length;
	if (matches === 0) return 1;
	return Math.max(0, 1 - matches * 0.2);
}

/**
 * Tests `actual` against `expected` treated as a regex pattern, with ReDoS protection.
 * Patterns longer than 500 characters or containing quantified groups/character classes are rejected.
 * @param actual - The text to test
 * @param expected - The regex pattern string to compile
 * @returns 1 if the pattern matches, 0 otherwise (including when the pattern is unsafe or invalid)
 */
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

/**
 * Scores how closely `actual`'s length matches `expected`'s length within a tolerance band.
 *
 * Inside `[1 - tolerance, 1 + tolerance]` the score is 1. Below the band it scales linearly;
 * above the band it decreases linearly, reaching 0 at `2 × upperBound`.
 *
 * @param actual - The output text
 * @param expected - The reference text whose length defines the target
 * @param tolerance - The fractional tolerance around 1.0 (e.g. 0.2 allows ±20% length deviation)
 * @returns A length-compliance score in [0, 1]
 */
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

/** Maps format sub-check names to their scoring functions. Each returns a score and a detail string. */
const SUB_CHECK_MAP: Record<
	SubCheck,
	(input: EvaluateInput) => { score: number; detail: string }
> = {
	length: (input) => {
		const tolerance = (input.metricConfig.length_tolerance as number) ?? 0.2;
		const cleaned = stripCodeFences(input.actualOutput);
		const score = checkLength(cleaned, input.expectedOutput, tolerance);
		return {
			score,
			detail: `length: actual=${cleaned.length}, expected=${input.expectedOutput.length}, score=${score.toFixed(3)}`,
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
		const score = checkRequiredFields(
			stripCodeFences(input.actualOutput),
			input.expectedOutput,
		);
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

/**
 * Strip markdown code fences (```json, ```, `) from a string.
 * Common LLM behavior — wrap JSON in code blocks. We strip them
 * before JSON-related checks so valid JSON inside fences isn't penalized.
 */
function stripCodeFences(text: string): string {
	return text.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
}

/**
 * Evaluates output format compliance across enabled sub-checks.
 *
 * Sub-checks are configured via `metricConfig.sub_checks` as a map of check name to enabled boolean.
 * When no sub-checks are enabled, the evaluator returns a perfect score with a note.
 * Otherwise, the average score across all enabled checks is compared against the threshold.
 *
 * @param input - The evaluation input including metric config with `sub_checks` and per-check settings
 * @returns A deterministic {@link MetricResult} with an explanation listing each sub-check's result
 */
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
