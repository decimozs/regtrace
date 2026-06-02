import { getEnv } from "../../utils/env";
import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProvider,
	JudgeProviderResponse,
} from "../types";
import { BaseProvider } from "./base";

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
