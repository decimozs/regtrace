import { buildJudgeConfig, judgeFactuality } from "../../judge/judge";
import type { MetricResult } from "../../schema/run-record.schema";
import type { EvaluateInput, MetricEvaluator } from "../types";

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((t) => t.length > 0);
}

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

function checkClaimOverlap(actual: string, expected: string): number {
	const unigramScore = ngramOverlap(actual, expected, 1);
	const bigramScore = ngramOverlap(actual, expected, 2);

	return unigramScore * 0.4 + bigramScore * 0.6;
}

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

	let score = checkClaimOverlap(input.actualOutput, input.expectedOutput);

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
