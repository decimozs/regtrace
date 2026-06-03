import type { MetricResult } from "../schema/run-record.schema";
import { getEnv } from "../utils/env";
import { logger } from "../utils/logger";
import { buildFactualityPrompt, buildTonePrompt } from "./prompts";
import { PROVIDER_MAP } from "./providers";
import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProviderResponse,
	JudgeResult,
} from "./types";

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
			`${providerName} API key not configured. Set ${envVar} in .env (see .env.example) or pass apiKey in judge config.`,
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
		"openai/gpt-4o": { input: 2.5, output: 10 },
		"openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
		"openai/gpt-4.1": { input: 2, output: 8 },
		"openai/gpt-4.1-mini": { input: 0.4, output: 1.6 },
		"openai/gpt-4.1-nano": { input: 0.1, output: 0.4 },
		"anthropic/claude-sonnet-4-20250514": { input: 3, output: 15 },
		"anthropic/claude-haiku-4-5-20251001": { input: 1, output: 5 },
		"gemini/gemini-2.5-pro": { input: 1.25, output: 10 },
		"gemini/gemini-2.5-flash": { input: 0.15, output: 0.6 },
		"groq/llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
		"groq/llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
		"groq/llama3-70b-8192": { input: 0.59, output: 0.79 },
		"groq/llama3-8b-8192": { input: 0.05, output: 0.08 },
		"groq/mixtral-8x7b-32768": { input: 0.24, output: 0.24 },
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
	const attempt = config.retryAttempts - retriesLeft;
	try {
		return await provider.evaluate(messages, config);
	} catch (err) {
		if (retriesLeft <= 0) throw err;
		const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 30000);
		logger.warn(
			`Judge call failed, retrying in ${Math.round(delay)}ms (${retriesLeft} left): ${err instanceof Error ? err.message : String(err)}`,
		);
		await new Promise((r) => setTimeout(r, delay));
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

async function judgeMetric(
	promptBuilder: () => JudgeMessage[],
	judgeConfig: JudgeConfig,
	fallbackConfig?: JudgeConfig,
): Promise<JudgeResult> {
	try {
		requireProviderApiKey(judgeConfig.provider, judgeConfig.apiKey);
		const provider = createProvider(judgeConfig.provider);
		const messages = promptBuilder();

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
	} catch (err) {
		// Try fallback provider if primary fails
		if (fallbackConfig) {
			logger.warn(
				`Primary judge ${judgeConfig.provider}/${judgeConfig.model} failed, trying fallback ${fallbackConfig.provider}/${fallbackConfig.model}: ${err instanceof Error ? err.message : String(err)}`,
			);
			return judgeMetric(promptBuilder, fallbackConfig, undefined);
		}
		throw err;
	}
}

export async function judgeFactuality(
	input: string,
	expectedOutput: string,
	actualOutput: string,
	judgeConfig: JudgeConfig,
	claimDepth: "shallow" | "deep",
	fallbackConfig?: JudgeConfig,
): Promise<JudgeResult> {
	return judgeMetric(
		() =>
			buildFactualityPrompt(input, expectedOutput, actualOutput, claimDepth),
		judgeConfig,
		fallbackConfig,
	);
}

export async function judgeTone(
	input: string,
	expectedOutput: string,
	actualOutput: string,
	judgeConfig: JudgeConfig,
	toneProfile: string | null | undefined,
	fallbackConfig?: JudgeConfig,
): Promise<JudgeResult> {
	return judgeMetric(
		() => buildTonePrompt(input, expectedOutput, actualOutput, toneProfile),
		judgeConfig,
		fallbackConfig,
	);
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
