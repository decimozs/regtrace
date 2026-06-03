import { buildJudgeConfig, judgeTone } from "../../judge/judge";
import type { MetricResult } from "../../schema/run-record.schema";
import type { EvaluateInput, MetricEvaluator } from "../types";
import {
	FORMAL_WORDS,
	INFORMAL_WORDS,
	NEGATIVE_WORDS,
	POSITIVE_WORDS,
} from "./tone.wordlists";

/**
 * Condenses a raw error message from an LLM judge into a short, human-readable string.
 * Mirrors the same truncation logic used in the factuality evaluator for consistent error reporting.
 * @param rawMessage - The raw error string from the judge call
 * @returns A truncated error description safe for inclusion in evaluation explanations
 */
function truncateJudgeError(rawMessage: string): string {
	const cleaned = rawMessage.trim();
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
 * Counts how many tokens in `text` are present in `words`.
 * Tokens are extracted by lowercasing and splitting on non-alphanumeric characters.
 * @param text - The text to scan
 * @param words - A set of words to match against
 * @returns The number of matching tokens
 */
function countMatches(text: string, words: Set<string>): number {
	const tokens = text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/);
	return tokens.filter((t) => words.has(t)).length;
}

/**
 * Scores output formality by rewarding formal word usage and penalising informal language.
 *
 * Formal and informal counts are normalised by 5% of total tokens to avoid inflating scores
 * on short texts. Informal penalty is halved (0.5 multiplier) so formal signal dominates.
 *
 * @param actual - The output text to evaluate
 * @returns A formality score in [0, 1]
 */
function checkFormality(actual: string): number {
	const formalCount = countMatches(actual, FORMAL_WORDS);
	const informalCount = countMatches(actual, INFORMAL_WORDS);
	const totalTokens = actual.split(/\s+/).length;

	// 5% of total tokens as a normalisation baseline to avoid inflation on short texts
	const formalScore =
		totalTokens > 0
			? Math.min(1, formalCount / Math.max(1, totalTokens * 0.05))
			: 0.5;

	const informalPenalty =
		totalTokens > 0
			? Math.min(1, informalCount / Math.max(1, totalTokens * 0.05))
			: 0;

	return Math.max(0, Math.min(1, formalScore - informalPenalty * 0.5));
}

/**
 * Scores sentiment alignment between actual and expected output using positive/negative word lists.
 * Returns 0 when the sentiment signs differ (opposite polarity), and a ratio of magnitudes when they agree.
 * @param actual - The output text to evaluate
 * @param expected - The reference text whose sentiment direction is the target
 * @returns A sentiment alignment score in [0, 1] (1 when expected has no sentiment words)
 */
function checkSentiment(actual: string, expected: string): number {
	const actualPositive = countMatches(actual, POSITIVE_WORDS);
	const actualNegative = countMatches(actual, NEGATIVE_WORDS);
	const expectedPositive = countMatches(expected, POSITIVE_WORDS);
	const expectedNegative = countMatches(expected, NEGATIVE_WORDS);

	const actualSentiment = actualPositive - actualNegative;
	const expectedSentiment = expectedPositive - expectedNegative;

	if (expectedSentiment === 0) return 1;
	if (Math.sign(actualSentiment) === Math.sign(expectedSentiment)) {
		return Math.min(1, Math.abs(actualSentiment) / Math.abs(expectedSentiment));
	}
	return 0;
}

/**
 * Scores assertiveness by comparing hedge-word vs assertive-word presence using whole-phrase regex matching.
 * Returns 0.5 (neutral) when neither category is found.
 * @param actual - The output text to evaluate
 * @returns An assertiveness score in [0, 1]
 */
function checkAssertiveness(actual: string): number {
	const hedgeWords = [
		"maybe",
		"perhaps",
		"possibly",
		"probably",
		"might",
		"could",
		"would",
		"somewhat",
		"rather",
		"quite",
		"tend to",
		"seems",
		"appears",
		"maybe",
		"sort of",
		"kind of",
		"i think",
		"i believe",
		"in my opinion",
	];

	const assertiveWords = [
		"must",
		"will",
		"always",
		"never",
		"definitely",
		"certainly",
		"absolutely",
		"undoubtedly",
		"surely",
		"clearly",
		"obviously",
		"without doubt",
	];

	const hedgeCount = hedgeWords.filter((w) => {
		try {
			return new RegExp(`\\b${w}\\b`, "i").test(actual);
		} catch {
			return false;
		}
	}).length;

	const assertiveCount = assertiveWords.filter((w) => {
		try {
			return new RegExp(`\\b${w}\\b`, "i").test(actual);
		} catch {
			return false;
		}
	}).length;

	const total = hedgeCount + assertiveCount;
	if (total === 0) return 0.5;
	return assertiveCount / total;
}

/**
 * Checks persona consistency by comparing pronoun usage density between actual and expected output.
 * @param actual - The output text to evaluate
 * @param expected - The reference text whose pronoun density is the target
 * @returns A consistency score in [0, 1] (1 when expected has no pronouns)
 */
function checkPersonaConsistency(actual: string, expected: string): number {
	const actualPronouns = (actual.match(/\b(I|we|you|he|she|they|it)\b/gi) ?? [])
		.length;
	const expectedPronouns = (
		expected.match(/\b(I|we|you|he|she|they|it)\b/gi) ?? []
	).length;

	if (expectedPronouns === 0) return 1;
	if (actualPronouns === 0) return 0.5;
	return Math.min(1, actualPronouns / expectedPronouns);
}

/**
 * Scores how closely `actual`'s verbosity matches `expected`'s length.
 * Returns 1 when the length ratio is between 0.5 and 2, then decreases linearly outside that band.
 * @param actual - The output text
 * @param expected - The reference text whose length defines the target range
 * @returns A verbosity-compliance score in [0, 1]
 */
function checkVerbosity(actual: string, expected: string): number {
	const actualLen = actual.length;
	const expectedLen = expected.length;

	if (expectedLen === 0) return actualLen === 0 ? 1 : 0;
	const ratio = actualLen / expectedLen;

	if (ratio >= 0.5 && ratio <= 2) return 1;
	if (ratio < 0.5) return Math.max(0, ratio / 0.5);
	return Math.max(0, (2 * 2 - ratio) / 2);
}

/** Maps tone sub-dimension names to their heuristic scoring functions. */
const DIMENSION_CHECK_MAP: Record<
	string,
	(input: EvaluateInput) => { score: number; detail: string }
> = {
	formality: (input) => {
		const score = checkFormality(input.actualOutput);
		return { score, detail: `formality score: ${(score * 100).toFixed(0)}%` };
	},
	sentiment: (input) => {
		const score = checkSentiment(input.actualOutput, input.expectedOutput);
		return { score, detail: `sentiment match: ${(score * 100).toFixed(0)}%` };
	},
	assertiveness: (input) => {
		const score = checkAssertiveness(input.actualOutput);
		return {
			score,
			detail: `assertiveness score: ${(score * 100).toFixed(0)}%`,
		};
	},
	persona_consistency: (input) => {
		const score = checkPersonaConsistency(
			input.actualOutput,
			input.expectedOutput,
		);
		return {
			score,
			detail: `persona consistency: ${(score * 100).toFixed(0)}%`,
		};
	},
	verbosity: (input) => {
		const score = checkVerbosity(input.actualOutput, input.expectedOutput);
		return { score, detail: `verbosity match: ${(score * 100).toFixed(0)}%` };
	},
};

/**
 * Runs deterministic tone heuristics across the enabled sub-dimensions.
 *
 * When no sub-dimensions are enabled, returns a perfect score with confidence 1.
 * Otherwise, the average score across enabled dimensions is returned with confidence 0.7
 * (reflecting the heuristic nature of word-list-based analysis).
 *
 * @param input - The evaluation input including metric config with `sub_dimensions`
 * @returns A score, confidence, and explanation summarising each dimension
 */
function evaluateHeuristicTone(input: EvaluateInput): {
	score: number;
	confidence: number;
	explanation: string;
} {
	const subDimensions = input.metricConfig.sub_dimensions as
		| Record<string, boolean>
		| undefined;
	const _dimensionWeights = input.metricConfig.sub_dimension_weights as
		| Record<string, number>
		| undefined;

	const results: { score: number; detail: string }[] = [];
	const details: string[] = [];

	for (const [dimension, enabled] of Object.entries(subDimensions ?? {})) {
		if (!enabled) continue;
		const checkFn = DIMENSION_CHECK_MAP[dimension];
		if (!checkFn) continue;
		const result = checkFn(input);
		results.push(result);
		details.push(result.detail);
	}

	if (results.length === 0) {
		return {
			score: 1,
			confidence: 1,
			explanation: "No tone sub-dimensions enabled",
		};
	}

	const avgScore =
		results.reduce((sum, r) => sum + r.score, 0) / results.length;

	return {
		score: Math.max(0, Math.min(1, avgScore)),
		confidence: 0.7,
		explanation: details.join("; "),
	};
}

/**
 * Evaluates output tone by first attempting an LLM judge, then falling back to word-list heuristics.
 *
 * On judge failure, the heuristic result is used with a deterministic `evaluation_type` and
 * a truncated error message prepended to the explanation.
 *
 * @param input - The evaluation input including metric config with `tone_profile`
 * @returns A {@link MetricResult} scored by the LLM judge or the heuristic fallback
 */
export const toneEvaluator: MetricEvaluator = {
	metricName: "tone",

	async evaluate(input: EvaluateInput): Promise<MetricResult> {
		try {
			const judgeCfg = buildJudgeConfig(input.config.judge.primary);
			const fallbackCfg = input.config.judge.fallback
				? buildJudgeConfig(input.config.judge.fallback)
				: undefined;
			const toneProfile = input.metricConfig.tone_profile as
				| string
				| null
				| undefined;

			const result = await judgeTone(
				input.testCase.input,
				input.expectedOutput,
				input.actualOutput,
				judgeCfg,
				toneProfile,
				fallbackCfg,
			);

			return {
				metric_name: "tone",
				score: result.score,
				confidence: result.confidence,
				passed: result.score >= input.threshold,
				threshold: input.threshold,
				explanation: result.explanation,
				evaluation_type: "llm_judged",
				token_cost: Math.round(result.tokenCost),
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			// Graceful degradation: fall back to deterministic heuristics
			const fallback = evaluateHeuristicTone(input);

			return {
				metric_name: "tone",
				score: fallback.score,
				confidence: fallback.confidence,
				passed: fallback.score >= input.threshold,
				threshold: input.threshold,
				explanation: `LLM judge failed (${truncateJudgeError(message)}), fallback: ${fallback.explanation}`,
				evaluation_type: "deterministic",
				token_cost: 0,
			};
		}
	},
};
