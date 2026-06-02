export {
	AnthropicProvider,
	BaseProvider,
	GeminiProvider,
	GroqProvider,
	OllamaProvider,
	OpenAiProvider,
} from "./providers/index";

import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import { OllamaProvider } from "./providers/ollama";
import { OpenAiProvider } from "./providers/openai";

export type ProviderConstructor = new () => InstanceType<typeof OpenAiProvider>;

export const PROVIDER_MAP: Record<string, ProviderConstructor> = {
	openai: OpenAiProvider,
	anthropic: AnthropicProvider,
	gemini: GeminiProvider,
	groq: GroqProvider,
	ollama: OllamaProvider,
};
