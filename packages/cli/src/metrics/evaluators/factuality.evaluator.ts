import { buildJudgeConfig, judgeFactuality } from "../../judge/judge";
import type { MetricResult } from "../../schema/run-record.schema";
import type { EvaluateInput, MetricEvaluator } from "../types";
import { stripCodeFences } from "../utils";

/**
 * Describes a single leaf-value mismatch found during JSON factuality comparison.
 */
interface JsonMismatch {
	path: string;
	kind: "missing" | "wrong" | "extra" | "type_mismatch";
	expected: string;
	actual: string;
}

/**
 * Recursive accumulator for JSON factuality comparison.
 */
interface JsonCompareAccum {
	matched: number;
	expected: number;
	extra: number;
	mismatches: JsonMismatch[];
}

/**
 * Splits text into lowercase alphanumeric tokens, stripping punctuation.
 * @param text - The raw text to tokenize
 * @returns An array of non-empty lowercase word tokens
 */
function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((t) => t.length > 0);
}

/**
 * Condenses a raw error message from an LLM judge into a short, human-readable string.
 * Extracts structured `code` / `message` pairs from JSON API responses and falls back to
 * well-known error tokens or a truncated raw string.
 * @param rawMessage - The raw error string from the judge call
 * @returns A truncated error description safe for inclusion in evaluation explanations
 */
function truncateJudgeError(rawMessage: string): string {
	const cleaned = rawMessage.trim();
	// Extract error code from JSON API responses (order-agnostic)
	const codeMatch = cleaned.match(/"code"\s*:\s*"([^"]+)"/);
	const msgMatch = cleaned.match(/"message"\s*:\s*"([^"]+)"/);
	if (codeMatch) {
		const code = codeMatch[1] as string;
		const msg = msgMatch ? (msgMatch[1] as string) : "";
		if (msg && msg.length > 80) return `${code}: ${msg.slice(0, 80)}...`;
		if (msg) return `${code}: ${msg}`;
		return code;
	}
	const shortMatch = cleaned.match(
		/\b(rate_limit_exceeded|model_decommissioned|invalid_request_error|authentication_error)\b/,
	);
	if (shortMatch) return shortMatch[0] as string;
	if (cleaned.length > 120) return `${cleaned.slice(0, 120)}...`;
	return cleaned;
}

/**
 * Computes the Jaccard-like word overlap ratio between two texts.
 * @param actual - The output produced by the system under test
 * @param expected - The reference output to compare against
 * @returns A value in [0, 1] where 1 means every actual token appeared in expected and vice versa
 */
function wordOverlapScore(actual: string, expected: string): number {
	const actualTokens = tokenize(actual);
	const expectedTokens = tokenize(expected);

	if (expectedTokens.length === 0) return actualTokens.length === 0 ? 1 : 0;
	if (actualTokens.length === 0) return 0;

	const actualSet = new Set(actualTokens);
	const expectedSet = new Set(expectedTokens);

	let overlap = 0;
	for (const token of actualSet) {
		if (expectedSet.has(token)) overlap++;
	}

	const total = new Set([...actualSet, ...expectedSet]).size;
	return overlap / total;
}

/**
 * Computes the n-gram overlap ratio between two texts.
 * Falls back to unigram word overlap when the expected text is shorter than `n` tokens.
 * @param actual - The output produced by the system under test
 * @param expected - The reference output to compare against
 * @param n - The n-gram size
 * @returns A Jaccard-like overlap score in [0, 1]
 */
function ngramOverlap(actual: string, expected: string, n: number): number {
	const actualTokens = tokenize(actual);
	const expectedTokens = tokenize(expected);

	if (expectedTokens.length < n) {
		return wordOverlapScore(actual, expected);
	}
	if (actualTokens.length < n) return 0;

	const actualNgrams = new Set<string>();
	for (let i = 0; i <= actualTokens.length - n; i++) {
		actualNgrams.add(actualTokens.slice(i, i + n).join(" "));
	}

	const expectedNgrams = new Set<string>();
	for (let i = 0; i <= expectedTokens.length - n; i++) {
		expectedNgrams.add(expectedTokens.slice(i, i + n).join(" "));
	}

	let overlap = 0;
	for (const ngram of actualNgrams) {
		if (expectedNgrams.has(ngram)) overlap++;
	}

	const total = new Set([...actualNgrams, ...expectedNgrams]).size;
	return total > 0 ? overlap / total : 0;
}

/**
 * Blends unigram and bigram overlap scores into a single claim-overlap metric.
 * Weights bigrams at 0.6 and unigrams at 0.4 to prioritize phrase-level accuracy.
 * @param actual - The output produced by the system under test
 * @param expected - The reference output to compare against
 * @returns A weighted overlap score in [0, 1]
 */
function checkClaimOverlap(actual: string, expected: string): number {
	const unigramScore = ngramOverlap(actual, expected, 1);
	const bigramScore = ngramOverlap(actual, expected, 2);

	return unigramScore * 0.4 + bigramScore * 0.6;
}

/**
 * Recursively compares two parsed JSON values and accumulates match/mismatch info.
 *
 * Objects: iterates over union of keys. Keys in expected only → counted in `expected`.
 * Keys in actual only → counted as `extra`. Both present → recurse.
 *
 * Arrays of objects: positional (element-wise). Extra/missing → mismatch.
 * Arrays of primitives: set-based (order-independent) Jaccard overlap.
 *
 * Strings: whitespace-normalized exact match.
 * Numbers: within 0.01 tolerance.
 * Booleans/null: exact.
 *
 * @param actual - Parsed JSON value from system output
 * @param expected - Parsed JSON value from reference
 * @param path - Current dot-delimited path for diagnostics
 * @returns Accumulated match/mismatch counts
 */
function compareJsonValue(
	actual: unknown,
	expected: unknown,
	path: string,
): JsonCompareAccum {
	if (typeof actual !== typeof expected) {
		return {
			matched: 0,
			expected: 1,
			extra: 0,
			mismatches: [
				{
					path,
					kind: "type_mismatch",
					expected: String(expected),
					actual: String(actual),
				},
			],
		};
	}

	if (actual === null && expected === null) {
		return { matched: 1, expected: 1, extra: 0, mismatches: [] };
	}
	if (actual === null || expected === null) {
		return {
			matched: 0,
			expected: 1,
			extra: 0,
			mismatches: [
				{
					path,
					kind: "wrong",
					expected: String(expected),
					actual: String(actual),
				},
			],
		};
	}

	// --- Arrays ---
	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length === 0 && expected.length === 0) {
			return { matched: 1, expected: 1, extra: 0, mismatches: [] };
		}

		// Detect if array elements are objects or primitives
		const actualObjs = actual.filter(
			(e) => e !== null && typeof e === "object",
		);
		const expectedObjs = expected.filter(
			(e) => e !== null && typeof e === "object",
		);
		const hasObjects = expectedObjs.length > 0 || actualObjs.length > 0;

		if (hasObjects) {
			// Positional comparison for object arrays
			const maxLen = Math.max(actual.length, expected.length);
			let totalMatched = 0;
			let totalExpected = 0;
			let totalExtra = 0;
			const allMismatches: JsonMismatch[] = [];

			for (let i = 0; i < maxLen; i++) {
				const elPath = `${path}[${i}]`;
				if (i >= expected.length) {
					totalExtra++;
					allMismatches.push({
						path: elPath,
						kind: "extra",
						expected: "",
						actual: JSON.stringify(actual[i]),
					});
				} else if (i >= actual.length) {
					totalExpected++;
					allMismatches.push({
						path: elPath,
						kind: "missing",
						expected: JSON.stringify(expected[i]),
						actual: "",
					});
				} else {
					const result = compareJsonValue(actual[i], expected[i], elPath);
					totalMatched += result.matched;
					totalExpected += result.expected;
					totalExtra += result.extra;
					allMismatches.push(...result.mismatches);
				}
			}
			return {
				matched: totalMatched,
				expected: totalExpected,
				extra: totalExtra,
				mismatches: allMismatches,
			};
		}

		// Set-based comparison for primitive arrays
		const actualSet = new Set(actual.map(String));
		const expectedSet = new Set(expected.map(String));
		let matchCount = 0;
		for (const val of actualSet) {
			if (expectedSet.has(val)) matchCount++;
		}
		const extraCount = [...actualSet].filter((v) => !expectedSet.has(v)).length;
		const allMismatches: JsonMismatch[] = [];
		for (const v of [...actualSet].filter((x) => !expectedSet.has(x))) {
			allMismatches.push({ path, kind: "extra", expected: "", actual: v });
		}
		for (const v of [...expectedSet].filter((x) => !actualSet.has(x))) {
			allMismatches.push({ path, kind: "missing", expected: v, actual: "" });
		}
		return {
			matched: matchCount,
			expected: expectedSet.size,
			extra: extraCount,
			mismatches: allMismatches,
		};
	}

	// --- Objects ---
	if (typeof actual === "object" && typeof expected === "object") {
		const actualKeys = Object.keys(actual as Record<string, unknown>);
		const expectedKeys = Object.keys(expected as Record<string, unknown>);
		if (expectedKeys.length === 0) {
			// Empty object — matched if actual is also empty or has extra keys
			const extraKeys = actualKeys.filter((k) => !expectedKeys.includes(k));
			return {
				matched: 1,
				expected: 1,
				extra: extraKeys.length,
				mismatches: extraKeys.map((k) => ({
					path: `${path}.${k}`,
					kind: "extra" as const,
					expected: "",
					actual: JSON.stringify((actual as Record<string, unknown>)[k]),
				})),
			};
		}

		const allKeys = new Set([...actualKeys, ...expectedKeys]);
		let totalMatched = 0;
		let totalExpected = 0;
		let totalExtra = 0;
		const allMismatches: JsonMismatch[] = [];

		for (const key of allKeys) {
			const keyPath = path ? `${path}.${key}` : key;
			const actualVal = (actual as Record<string, unknown>)[key];
			const expectedVal = (expected as Record<string, unknown>)[key];

			if (expectedVal === undefined) {
				totalExtra++;
				allMismatches.push({
					path: keyPath,
					kind: "extra",
					expected: "",
					actual: JSON.stringify(actualVal),
				});
			} else if (actualVal === undefined) {
				totalExpected++;
				allMismatches.push({
					path: keyPath,
					kind: "missing",
					expected: JSON.stringify(expectedVal),
					actual: "",
				});
			} else {
				const result = compareJsonValue(actualVal, expectedVal, keyPath);
				totalMatched += result.matched;
				totalExpected += result.expected;
				totalExtra += result.extra;
				allMismatches.push(...result.mismatches);
			}
		}

		return {
			matched: totalMatched,
			expected: totalExpected,
			extra: totalExtra,
			mismatches: allMismatches,
		};
	}

	// --- Primitives ---
	if (typeof actual === "string" && typeof expected === "string") {
		if (actual.trim() === expected.trim()) {
			return { matched: 1, expected: 1, extra: 0, mismatches: [] };
		}
		return {
			matched: 0,
			expected: 1,
			extra: 0,
			mismatches: [{ path, kind: "wrong", expected, actual }],
		};
	}

	if (typeof actual === "number" && typeof expected === "number") {
		if (Math.abs(actual - expected) <= 0.01) {
			return { matched: 1, expected: 1, extra: 0, mismatches: [] };
		}
		return {
			matched: 0,
			expected: 1,
			extra: 0,
			mismatches: [
				{
					path,
					kind: "wrong",
					expected: String(expected),
					actual: String(actual),
				},
			],
		};
	}

	const isMatch = actual === expected;
	return {
		matched: isMatch ? 1 : 0,
		expected: 1,
		extra: 0,
		mismatches: isMatch
			? []
			: [
					{
						path,
						kind: "wrong",
						expected: String(expected),
						actual: String(actual),
					},
				],
	};
}

/**
 * Formats up to three JSON mismatches into a human-readable explanation string.
 * @param score - The computed factuality score
 * @param acc - The accumulated comparison result
 * @returns A formatted explanation string
 */
function formatJsonExplanation(score: number, acc: JsonCompareAccum): string {
	const totalVals = acc.expected + acc.extra;
	const header = `Factuality score ${(score * 100).toFixed(0)}%: ${acc.matched}/${totalVals} leaf values match`;

	const lines = acc.mismatches.slice(0, 3).map((m) => {
		switch (m.kind) {
			case "missing":
				return `  ✗ ${m.path}: missing, expected ${m.expected}`;
			case "extra":
				return `  ✗ ${m.path}: unexpected, got ${m.actual}`;
			case "type_mismatch":
				return `  ✗ ${m.path}: type mismatch, expected ${m.expected}, got ${m.actual}`;
			case "wrong":
				return `  ✗ ${m.path}: expected "${m.expected}", got "${m.actual}"`;
			default:
				return `  ✗ ${m.path}: ${m.kind}`;
		}
	});

	if (acc.mismatches.length > 3) {
		lines.push(`  … and ${acc.mismatches.length - 3} more`);
	}

	return [header, ...lines].join("\n");
}

/**
 * Attempts to compare two strings as JSON. If both parse successfully,
 * returns a structural factuality score with diagnostics.
 * Otherwise returns null (caller should fall back to word overlap).
 *
 * Code fences are stripped from both strings before parsing.
 *
 * @param actual - The system output
 * @param expected - The reference output
 * @returns Factuality result or null if either string is not valid JSON
 */
function tryJsonCompare(
	actual: string,
	expected: string,
): { score: number; explanation: string } | null {
	let actualParsed: unknown;
	let expectedParsed: unknown;

	try {
		actualParsed = JSON.parse(stripCodeFences(actual));
		expectedParsed = JSON.parse(stripCodeFences(expected));
	} catch {
		return null;
	}

	const acc = compareJsonValue(actualParsed, expectedParsed, "$");
	const totalVals = acc.expected + acc.extra;
	const score = totalVals > 0 ? acc.matched / totalVals : 1;
	const explanation = formatJsonExplanation(score, acc);

	return { score, explanation };
}

/**
 * Runs the deterministic (shallow) factuality check using n-gram overlap heuristics.
 *
 * When `rag_faithfulness_only` is enabled and no context is provided, the check is skipped with a
 * perfect score. In `strict` mode, scores between 0.3 and 1.0 are penalized by 0.1 to tighten
 * the pass/fail boundary around borderline matches.
 *
 * @param input - The evaluation input
 * @returns A score and human-readable explanation
 */
async function evaluateShallow(
	input: EvaluateInput,
): Promise<{ score: number; explanation: string }> {
	const mode = (input.metricConfig.mode as string) ?? "strict";
	const ragFaithfulnessOnly =
		(input.metricConfig.rag_faithfulness_only as boolean) ?? false;

	if (ragFaithfulnessOnly && !input.testCase.context) {
		return {
			score: 1,
			explanation: "No RAG context provided, factuality check skipped",
		};
	}

	// Try JSON structural comparison first (auto-detect)
	const jsonResult = tryJsonCompare(input.actualOutput, input.expectedOutput);
	if (jsonResult) {
		return jsonResult;
	}

	// Fall back to word overlap
	let score = checkClaimOverlap(input.actualOutput, input.expectedOutput);

	// Strict mode penalises borderline scores that are above 0.3 but not a perfect match
	if (mode === "strict" && score > 0.3 && score < 1) {
		score = Math.max(0, score - 0.1);
	}

	const explanation =
		score >= 0.7
			? `Factuality score ${(score * 100).toFixed(0)}%: output substantially covers expected content`
			: score >= 0.4
				? `Factuality score ${(score * 100).toFixed(0)}%: partial content overlap detected`
				: `Factuality score ${(score * 100).toFixed(0)}%: low content overlap with expected output`;

	return { score, explanation };
}

/**
 * Delegates factuality evaluation to an LLM judge for deep claim extraction and comparison.
 * @param input - The evaluation input
 * @returns The judge's score, confidence, explanation, and token cost
 */
async function evaluateDeep(input: EvaluateInput): Promise<{
	score: number;
	confidence: number;
	explanation: string;
	tokenCost: number;
}> {
	const judgeCfg = buildJudgeConfig(input.config.judge.primary);
	const fallbackCfg = input.config.judge.fallback
		? buildJudgeConfig(input.config.judge.fallback)
		: undefined;
	const claimDepth =
		(input.metricConfig.claim_extraction_depth as string) ?? "deep";

	const result = await judgeFactuality(
		input.testCase.input,
		input.expectedOutput,
		input.actualOutput,
		judgeCfg,
		claimDepth as "shallow" | "deep",
		fallbackCfg,
	);

	return {
		score: result.score,
		confidence: result.confidence,
		explanation: result.explanation,
		tokenCost: result.tokenCost,
	};
}

/**
 * Evaluates factual accuracy of an output against expectations.
 *
 * In `deep` mode, an LLM judge performs claim-by-claim comparison. If the judge call fails,
 * the evaluator gracefully degrades to the deterministic shallow path with reduced confidence (0.5)
 * and an explanation that includes the truncated error. In `shallow` mode, the evaluator first
 * attempts a JSON structural comparison (auto-detected when both actual and expected parse as JSON),
 * falling back to n-gram word overlap heuristics when they don't.
 *
 * @param input - The evaluation input
 * @returns A {@link MetricResult} with `evaluation_type` of `"llm_judged"` or `"deterministic"`
 */
export const factualityEvaluator: MetricEvaluator = {
	metricName: "factuality",

	async evaluate(input: EvaluateInput): Promise<MetricResult> {
		const claimDepth =
			(input.metricConfig.claim_extraction_depth as string) ?? "shallow";

		if (claimDepth === "deep") {
			try {
				const result = await evaluateDeep(input);
				return {
					metric_name: "factuality",
					score: result.score,
					confidence: result.confidence,
					passed: result.score >= input.threshold,
					threshold: input.threshold,
					explanation: result.explanation,
					evaluation_type: "llm_judged",
					token_cost: result.tokenCost,
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				// Graceful degradation: fall back to deterministic overlap check
				const fallback = await evaluateShallow(input);
				return {
					metric_name: "factuality",
					score: fallback.score,
					confidence: 0.5,
					passed: fallback.score >= input.threshold,
					threshold: input.threshold,
					explanation: `LLM judge failed (${truncateJudgeError(message)}), fallback: ${fallback.explanation}`,
					evaluation_type: "deterministic",
					token_cost: 0,
				};
			}
		}

		const { score, explanation } = await evaluateShallow(input);
		return {
			metric_name: "factuality",
			score,
			confidence: 1,
			passed: score >= input.threshold,
			threshold: input.threshold,
			explanation,
			evaluation_type: "deterministic",
			token_cost: 0,
		};
	},
};
