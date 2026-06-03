import { PROVIDER_MAP } from "../judge/providers";
import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProviderResponse,
} from "../judge/types";
import type { EnvVars } from "../utils/env";

const PROVIDER_ENV_MAP: Record<string, keyof EnvVars> = {
	openai: "OPENAI_API_KEY",
	anthropic: "ANTHROPIC_API_KEY",
	gemini: "GEMINI_API_KEY",
	groq: "GROQ_API_KEY",
};

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
