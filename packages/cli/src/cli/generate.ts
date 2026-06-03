import { PROVIDER_MAP } from "../judge/providers";
import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProviderResponse,
} from "../judge/types";
import type { EnvVars } from "../utils/env";

/** Maps provider names to their required environment variable names. Ollama is absent because it needs no key. */
const PROVIDER_ENV_MAP: Record<string, keyof EnvVars> = {
	openai: "OPENAI_API_KEY",
	anthropic: "ANTHROPIC_API_KEY",
	gemini: "GEMINI_API_KEY",
	groq: "GROQ_API_KEY",
};

/**
 * Resolves an API key for an LLM provider during output generation.
 * Checks the config-supplied key first, then the environment variable.
 * Throws for cloud providers (OpenAI, Anthropic, Gemini, Groq) when no key is found.
 *
 * @param providerName - Provider identifier (e.g. "anthropic", "openai", "ollama").
 * @param configApiKey - Key supplied via the generator config, if any.
 * @returns The resolved API key, or `undefined` for keyless providers like Ollama.
 * @throws When a cloud provider has no key in config or environment.
 */
function requireGenerateApiKey(
	providerName: string,
	configApiKey?: string,
): string | undefined {
	if (configApiKey && configApiKey !== "") return configApiKey;
	const envVar = PROVIDER_ENV_MAP[providerName];
	if (envVar) {
		const fromEnv = process.env[envVar];
		if (fromEnv && fromEnv !== "") return fromEnv;
		// Providers with an env var require a key
		throw new Error(
			`${providerName} API key not configured for generation. Set ${envVar} in .env (see .env.example) or pass apiKey in generator config.`,
		);
	}
	// Providers without an env var (ollama) don't need a key
	return undefined;
}

/**
 * Generates an LLM output string for a test case by calling the configured provider.
 * Used by `--generate` to fill `actual_output` fields before evaluation.
 *
 * @param input - The user prompt (test case `input` field).
 * @param systemPrompt - Optional system prompt, or `null` to omit.
 * @param config - Provider and model configuration for the generation call.
 * @returns The generated text content from the LLM response.
 * @throws When the provider is unknown or the API key is missing.
 * @example
 * const output = await generateOutput("What is the capital of France?", null, {
 *   provider: "anthropic", model: "claude-haiku-4-5-20251001",
 *   temperature: 0.1, max_tokens: 4096, timeout_ms: 30000, retry_attempts: 3,
 * });
 */
export async function generateOutput(
	input: string,
	systemPrompt: string | null,
	config: {
		provider: string;
		model: string;
		temperature: number;
		max_tokens: number;
		timeout_ms: number;
		retry_attempts: number;
		local_endpoint?: string | null;
	},
): Promise<string> {
	const ProviderClass = PROVIDER_MAP[config.provider];
	if (!ProviderClass) {
		throw new Error(`Unknown judge provider: "${config.provider}"`);
	}

	const apiKey = requireGenerateApiKey(config.provider);

	const judgeConfig: JudgeConfig = {
		provider: config.provider,
		model: config.model,
		temperature: config.temperature,
		maxTokens: config.max_tokens,
		timeoutMs: config.timeout_ms,
		retryAttempts: config.retry_attempts,
		localEndpoint: config.local_endpoint ?? undefined,
		apiKey,
	};

	const provider = new ProviderClass();
	const messages: JudgeMessage[] = [];
	if (systemPrompt) {
		messages.push({ role: "system", content: systemPrompt });
	}
	messages.push({ role: "user", content: input });

	const response: JudgeProviderResponse = await provider.evaluate(
		messages,
		judgeConfig,
	);

	return response.content;
}
