import { getEnv } from "../utils/env";
import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProvider,
	JudgeProviderResponse,
} from "./types";

class BaseProvider {
	protected async post(
		url: string,
		headers: Record<string, string>,
		body: unknown,
		timeoutMs: number,
	): Promise<Response> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			return await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", ...headers },
				body: JSON.stringify(body),
				signal: controller.signal,
			});
		} finally {
			clearTimeout(timer);
		}
	}
}

function buildOpenAiMessages(system: string, user: string): unknown[] {
	return [
		{ role: "system", content: system },
		{ role: "user", content: user },
	];
}

export class OpenAiProvider extends BaseProvider implements JudgeProvider {
	async evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse> {
		const apiKey = config.apiKey ?? getEnv("OPENAI_API_KEY") ?? "";
		const url =
			config.localEndpoint ?? "https://api.openai.com/v1/chat/completions";

		const body = {
			model: config.model,
			messages: buildOpenAiMessages(
				messages[0]?.content ?? "",
				messages[1]?.content ?? "",
			),
			temperature: config.temperature,
			max_tokens: config.maxTokens,
		};

		const response = await this.post(
			url,
			{ Authorization: `Bearer ${apiKey}` },
			body,
			config.timeoutMs,
		);

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`OpenAI API error ${response.status}: ${text}`);
		}

		const data = (await response.json()) as {
			choices: { message: { content: string } }[];
			usage: { prompt_tokens: number; completion_tokens: number };
		};

		return {
			content: data.choices[0]?.message?.content ?? "",
			inputTokens: data.usage?.prompt_tokens ?? 0,
			outputTokens: data.usage?.completion_tokens ?? 0,
		};
	}
}

export class AnthropicProvider extends BaseProvider implements JudgeProvider {
	async evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse> {
		const apiKey = config.apiKey ?? getEnv("ANTHROPIC_API_KEY") ?? "";
		const url = config.localEndpoint ?? "https://api.anthropic.com/v1/messages";

		const systemMsg = messages.find((m) => m.role === "system");
		const userMsg = messages.find((m) => m.role === "user");

		const body: Record<string, unknown> = {
			model: config.model,
			max_tokens: config.maxTokens,
			temperature: config.temperature,
			messages: [{ role: "user", content: userMsg?.content ?? "" }],
		};

		if (systemMsg) {
			body.system = systemMsg.content;
		}

		const response = await this.post(
			url,
			{
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body,
			config.timeoutMs,
		);

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Anthropic API error ${response.status}: ${text}`);
		}

		const data = (await response.json()) as {
			content: { text: string }[];
			usage: { input_tokens: number; output_tokens: number };
		};

		return {
			content: data.content?.[0]?.text ?? "",
			inputTokens: data.usage?.input_tokens ?? 0,
			outputTokens: data.usage?.output_tokens ?? 0,
		};
	}
}

export class GeminiProvider extends BaseProvider implements JudgeProvider {
	async evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse> {
		const apiKey = config.apiKey ?? getEnv("GEMINI_API_KEY") ?? "";
		const baseUrl =
			config.localEndpoint?.replace(/\/$/, "") ??
			"https://generativelanguage.googleapis.com";

		const systemMsg = messages.find((m) => m.role === "system");
		const userMsg = messages.find((m) => m.role === "user");

		const contents: Record<string, unknown>[] = [];
		if (systemMsg) {
			contents.push({
				role: "user",
				parts: [
					{
						text: `[System Instruction]\n${systemMsg.content}\n\n[User Message]\n${userMsg?.content ?? ""}`,
					},
				],
			});
		} else {
			contents.push({
				role: "user",
				parts: [{ text: userMsg?.content ?? "" }],
			});
		}

		const body = {
			contents,
			generationConfig: {
				temperature: config.temperature,
				maxOutputTokens: config.maxTokens,
			},
		};

		const apiUrl = `${baseUrl}/v1/models/${config.model}:generateContent?key=${apiKey}`;

		const response = await this.post(apiUrl, {}, body, config.timeoutMs);

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Gemini API error ${response.status}: ${text}`);
		}

		const data = (await response.json()) as {
			candidates: { content: { parts: { text: string }[] } }[];
			usageMetadata?: {
				promptTokenCount: number;
				candidatesTokenCount: number;
			};
		};

		return {
			content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
			inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
			outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
		};
	}
}

export class GroqProvider extends BaseProvider implements JudgeProvider {
	async evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse> {
		const apiKey = config.apiKey ?? getEnv("GROQ_API_KEY") ?? "";
		const url =
			config.localEndpoint ?? "https://api.groq.com/openai/v1/chat/completions";

		const body = {
			model: config.model,
			messages: buildOpenAiMessages(
				messages[0]?.content ?? "",
				messages[1]?.content ?? "",
			),
			temperature: config.temperature,
			max_tokens: config.maxTokens,
		};

		const response = await this.post(
			url,
			{ Authorization: `Bearer ${apiKey}` },
			body,
			config.timeoutMs,
		);

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Groq API error ${response.status}: ${text}`);
		}

		const data = (await response.json()) as {
			choices: { message: { content: string } }[];
			usage: { prompt_tokens: number; completion_tokens: number };
		};

		return {
			content: data.choices[0]?.message?.content ?? "",
			inputTokens: data.usage?.prompt_tokens ?? 0,
			outputTokens: data.usage?.completion_tokens ?? 0,
		};
	}
}

export class OllamaProvider extends BaseProvider implements JudgeProvider {
	async evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse> {
		const baseUrl = config.localEndpoint ?? "http://localhost:11434";
		const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;

		const body = {
			model: config.model,
			messages: [
				{ role: "system", content: messages[0]?.content ?? "" },
				{ role: "user", content: messages[1]?.content ?? "" },
			],
			options: {
				temperature: config.temperature,
				num_predict: config.maxTokens,
			},
			stream: false,
		};

		const response = await this.post(url, {}, body, config.timeoutMs);

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Ollama API error ${response.status}: ${text}`);
		}

		const data = (await response.json()) as {
			message?: { content: string };
			eval_count?: number;
		};

		return {
			content: data.message?.content ?? "",
			inputTokens: 0,
			outputTokens: data.eval_count ?? 0,
		};
	}
}

export type ProviderConstructor = new () => JudgeProvider;

export const PROVIDER_MAP: Record<string, ProviderConstructor> = {
	openai: OpenAiProvider,
	anthropic: AnthropicProvider,
	gemini: GeminiProvider,
	groq: GroqProvider,
	ollama: OllamaProvider,
};
