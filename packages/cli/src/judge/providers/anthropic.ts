import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProvider,
	JudgeProviderResponse,
} from "../types";
import { BaseProvider } from "./base";

export class AnthropicProvider extends BaseProvider implements JudgeProvider {
	async evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse> {
		const apiKey = this.requireApiKey(
			config.apiKey,
			"anthropic",
			"ANTHROPIC_API_KEY",
		);
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
			throw new Error(this.sanitizeError("Anthropic", response.status, text));
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
