import type { MetricResult } from "../schema/run-record.schema";
import { getEnv } from "../utils/env";
import { logger } from "../utils/logger";
import { buildFactualityPrompt, buildTonePrompt } from "./prompts";
import { PROVIDER_MAP } from "./providers";
import type { JudgeConfig, JudgeProviderResponse, JudgeResult } from "./types";

const PROVIDER_ENV_MAP: Record<string, string> = {
	openai: "OPENAI_API_KEY",
	anthropic: "ANTHROPIC_API_KEY",
	gemini: "GEMINI_API_KEY",
	groq: "GROQ_API_KEY",
};

function requireProviderApiKey(
	providerName: string,
	configApiKey?: string,
): void {
	if (configApiKey) return;
	const envVar = PROVIDER_ENV_MAP[providerName];
	if (!envVar) return;
	if (!getEnv(envVar as never)) {
		throw new Error(
			`${providerName} API key not configured. Set ${envVar} or pass apiKey in judge config.`,
		);
	}
}

function createProvider(providerName: string) {
	const ProviderClass = PROVIDER_MAP[providerName];
	if (!ProviderClass) {
		throw new Error(
			`Unknown judge provider: "${providerName}". Supported: ${Object.keys(PROVIDER_MAP).join(", ")}`,
		);
	}
	return new ProviderClass();
}

function estimateTokenCost(
	provider: string,
	model: string,
	inputTokens: number,
	outputTokens: number,
): number {
	const modelKey = `${provider}/${model}`;

	const rates: Record<string, { input: number; output: number }> = {
		"openai/gpt-4": { input: 10, output: 30 },
		"openai/gpt-4-turbo": { input: 10, output: 30 },
		"openai/gpt-4o": { input: 2.5, output: 10 },
		"openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
		"openai/gpt-3.5-turbo": { input: 0.5, output: 1.5 },
		"anthropic/claude-3-5-sonnet": { input: 3, output: 15 },
		"anthropic/claude-3-opus": { input: 15, output: 75 },
		"anthropic/claude-3-haiku": { input: 0.25, output: 1.25 },
		"gemini/gemini-1.5-pro": { input: 3.5, output: 10.5 },
		"gemini/gemini-1.5-flash": { input: 0.075, output: 0.3 },
	};

	const rate = rates[modelKey];
	if (!rate) return 0;

	const inputCost = (inputTokens / 1_000_000) * rate.input;
	const outputCost = (outputTokens / 1_000_000) * rate.output;

	const costCents = (inputCost + outputCost) * 100;
	return Math.round(costCents * 100) / 100;
}

async function callWithRetry(
	provider: ReturnType<typeof createProvider>,
	messages: Parameters<ReturnType<typeof createProvider>["evaluate"]>[0],
	config: JudgeConfig,
	retriesLeft: number,
): Promise<JudgeProviderResponse> {
	try {
		return await provider.evaluate(messages, config);
	} catch (err) {
		if (retriesLeft <= 0) throw err;
		logger.warn(
			`Judge call failed, retrying (${retriesLeft} left): ${err instanceof Error ? err.message : String(err)}`,
		);
		return callWithRetry(provider, messages, config, retriesLeft - 1);
	}
}

function parseJsonScore(response: string): {
	score: number;
	confidence: number;
	explanation: string;
} {
	const cleaned = response
		.replace(/```json\s*/g, "")
		.replace(/```\s*/g, "")
		.trim();

	try {
		const parsed = JSON.parse(cleaned) as Record<string, unknown>;
		const score = Math.max(
			0,
			Math.min(1, Number(parsed.score ?? parsed.overall ?? 0)),
		);
		const confidence = Math.max(
			0,
			Math.min(1, Number(parsed.confidence ?? 0.5)),
		);
		const explanation = String(parsed.explanation ?? parsed.explanation ?? "");
		return { score, confidence, explanation };
	} catch {
		const scoreMatch = response.match(/["']?score["']?\s*:\s*([01]\.?\d*)/i);
		const overallMatch = response.match(
			/["']?overall["']?\s*:\s*([01]\.?\d*)/i,
		);
		const score = Math.max(
			0,
			Math.min(1, Number(scoreMatch?.[1] ?? overallMatch?.[1] ?? 0.5)),
		);
		return { score, confidence: 0.5, explanation: response.slice(0, 200) };
	}
}

export async function judgeFactuality(
	input: string,
	expectedOutput: string,
	actualOutput: string,
	judgeConfig: JudgeConfig,
	claimDepth: "shallow" | "deep",
): Promise<JudgeResult> {
	requireProviderApiKey(judgeConfig.provider, judgeConfig.apiKey);
	const provider = createProvider(judgeConfig.provider);
	const messages = buildFactualityPrompt(
		input,
		expectedOutput,
		actualOutput,
		claimDepth,
	);

	const response = await callWithRetry(
		provider,
		messages,
		judgeConfig,
		judgeConfig.retryAttempts,
	);
	const { score, confidence, explanation } = parseJsonScore(response.content);
	const tokenCost = estimateTokenCost(
		judgeConfig.provider,
		judgeConfig.model,
		response.inputTokens,
		response.outputTokens,
	);

	return {
		score,
		confidence,
		explanation,
		tokenCost,
		inputTokens: response.inputTokens,
		outputTokens: response.outputTokens,
	};
}

export async function judgeTone(
	input: string,
	expectedOutput: string,
	actualOutput: string,
	judgeConfig: JudgeConfig,
	toneProfile: string | null | undefined,
): Promise<JudgeResult> {
	requireProviderApiKey(judgeConfig.provider, judgeConfig.apiKey);
	const provider = createProvider(judgeConfig.provider);
	const messages = buildTonePrompt(
		input,
		expectedOutput,
		actualOutput,
		toneProfile,
	);

	const response = await callWithRetry(
		provider,
		messages,
		judgeConfig,
		judgeConfig.retryAttempts,
	);
	const { score, confidence, explanation } = parseJsonScore(response.content);
	const tokenCost = estimateTokenCost(
		judgeConfig.provider,
		judgeConfig.model,
		response.inputTokens,
		response.outputTokens,
	);

	return {
		score,
		confidence,
		explanation,
		tokenCost,
		inputTokens: response.inputTokens,
		outputTokens: response.outputTokens,
	};
}

export function buildJudgeConfig(config: {
	provider: string;
	model: string;
	temperature: number;
	max_tokens: number;
	timeout_ms: number;
	retry_attempts: number;
	local_endpoint?: string | null;
}): JudgeConfig {
	return {
		provider: config.provider,
		model: config.model,
		temperature: config.temperature,
		maxTokens: config.max_tokens,
		timeoutMs: config.timeout_ms,
		retryAttempts: config.retry_attempts,
		localEndpoint: config.local_endpoint ?? undefined,
	};
}

export function metricResultFromJudge(
	metricName: string,
	judgeResult: JudgeResult,
	threshold: number,
	_fallbackScore: number,
): MetricResult {
	const passed = judgeResult.score >= threshold;
	return {
		metric_name: metricName,
		score: judgeResult.score,
		confidence: judgeResult.confidence,
		passed,
		threshold,
		explanation: judgeResult.explanation,
		evaluation_type: "llm_judged",
		token_cost: Math.round(judgeResult.tokenCost),
	};
}
