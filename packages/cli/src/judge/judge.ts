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

/** Maps provider names to the environment variable that holds their API key. */
const PROVIDER_ENV_MAP: Record<string, string> = {
	openai: "OPENAI_API_KEY",
	anthropic: "ANTHROPIC_API_KEY",
	gemini: "GEMINI_API_KEY",
	groq: "GROQ_API_KEY",
};

/**
 * Validates that an API key is available for the given provider.
 * @param providerName - The LLM provider identifier (e.g. "openai", "anthropic").
 * @param configApiKey - An explicit API key from judge config; skips env lookup if provided.
 * @throws If no config key is provided and the required env var is unset.
 */
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

/**
 * Instantiates a judge provider by name.
 * @param providerName - The provider identifier to look up in PROVIDER_MAP.
 * @returns A new provider instance.
 * @throws If the provider name is not registered in PROVIDER_MAP.
 */
function createProvider(providerName: string) {
	const ProviderClass = PROVIDER_MAP[providerName];
	if (!ProviderClass) {
		throw new Error(
			`Unknown judge provider: "${providerName}". Supported: ${Object.keys(PROVIDER_MAP).join(", ")}`,
		);
	}
	return new ProviderClass();
}

/**
 * Estimates the USD cost of a judge call based on per-model pricing rates.
 * Rates are in USD per 1M tokens. Returns 0 for unrecognised models.
 * @param provider - The provider name (e.g. "openai").
 * @param model - The model identifier (e.g. "gpt-4o").
 * @param inputTokens - Number of prompt tokens consumed.
 * @param outputTokens - Number of completion tokens produced.
 * @returns Estimated cost in USD cents, rounded to 2 decimal places.
 */
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

	// Pricing rates are per 1M tokens; convert to cents for integer-friendly storage
	const inputCost = (inputTokens / 1_000_000) * rate.input;
	const outputCost = (outputTokens / 1_000_000) * rate.output;

	const costCents = (inputCost + outputCost) * 100;
	return Math.round(costCents * 100) / 100;
}

/**
 * Calls a judge provider with exponential backoff and jitter.
 * Delay formula: min(1000 × 2^attempt + random jitter, 30s).
 * @param provider - The provider instance to call.
 * @param messages - The prompt messages to send.
 * @param config - Judge configuration including retry settings.
 * @param retriesLeft - Number of remaining retry attempts.
 * @returns The provider's evaluation response.
 * @throws If all retries are exhausted or a non-retryable error occurs.
 */
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

/**
 * Extracts score, confidence, and explanation from a judge's JSON response.
 * Falls back to regex extraction when the response is not valid JSON;
 * in that case confidence defaults to 0.5 and explanation is truncated to 200 chars.
 * @param response - Raw text output from the LLM judge.
 * @returns Parsed score, confidence, and explanation.
 */
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
		// "overall" is the tone metric's top-level key; normalise to "score"
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

/**
 * Sends a prompt to the judge provider and returns the scored result, falling back to a secondary provider on failure.
 * @param promptBuilder - Lazy builder that produces the message array to send.
 * @param judgeConfig - Primary judge configuration.
 * @param fallbackConfig - Optional fallback provider config used when the primary call fails.
 * @returns The judge's evaluation result with cost metadata.
 * @throws If both primary and fallback providers fail.
 */
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
		if (fallbackConfig) {
			logger.warn(
				`Primary judge ${judgeConfig.provider}/${judgeConfig.model} failed, trying fallback ${fallbackConfig.provider}/${fallbackConfig.model}: ${err instanceof Error ? err.message : String(err)}`,
			);
			return judgeMetric(promptBuilder, fallbackConfig, undefined);
		}
		throw err;
	}
}

/**
 * Evaluates the factual accuracy of an LLM output against expected output.
 * @param input - The original user prompt or query.
 * @param expectedOutput - The reference output to compare against.
 * @param actualOutput - The LLM-generated output being evaluated.
 * @param judgeConfig - Primary judge provider configuration.
 * @param claimDepth - "shallow" for main claims only, "deep" for exhaustive claim extraction.
 * @param fallbackConfig - Optional fallback judge config used on primary failure.
 * @returns Scored factuality result with token cost.
 * @throws If both primary and fallback judge calls fail.
 * @example
 * ```ts
 * const result = await judgeFactuality(
 *   "What is the capital of France?",
 *   "Paris",
 *   "Paris is the capital of France.",
 *   { provider: "openai", model: "gpt-4o", ... },
 *   "shallow",
 * );
 * ```
 */
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

/**
 * Evaluates how well the tone of an LLM output matches expectations.
 * @param input - The original user prompt or query.
 * @param expectedOutput - The reference output whose tone to match.
 * @param actualOutput - The LLM-generated output being evaluated.
 * @param judgeConfig - Primary judge provider configuration.
 * @param toneProfile - Optional natural-language tone description (e.g. "professional and concise").
 * @param fallbackConfig - Optional fallback judge config used on primary failure.
 * @returns Scored tone result with dimensional breakdown and token cost.
 * @throws If both primary and fallback judge calls fail.
 * @example
 * ```ts
 * const result = await judgeTone(
 *   "Explain quantum computing",
 *   "A brief professional explanation...",
 *   "So basically quantum computers...",
 *   { provider: "anthropic", model: "claude-sonnet-4-20250514", ... },
 *   "professional and concise",
 * );
 * ```
 */
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

/**
 * Converts snake_case config properties to camelCase judge config fields.
 * @param config - The raw judge config from the regtrace config file.
 * @returns A JudgeConfig object ready for provider consumption.
 * @example
 * ```ts
 * const cfg = buildJudgeConfig({
 *   provider: "openai",
 *   model: "gpt-4o",
 *   temperature: 0.1,
 *   max_tokens: 4096,
 *   timeout_ms: 30000,
 *   retry_attempts: 3,
 * });
 * ```
 */
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

/**
 * Converts a judge result into a persisted metric result, applying the pass/fail threshold.
 * @param metricName - The metric identifier (e.g. "factuality", "tone").
 * @param judgeResult - The raw judge evaluation result.
 * @param threshold - Minimum score required to pass (0–1).
 * @param _fallbackScore - Reserved for future use; currently ignored.
 * @returns A MetricResult suitable for storage and report generation.
 */
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
