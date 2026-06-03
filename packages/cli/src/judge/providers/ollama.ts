import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProvider,
	JudgeProviderResponse,
} from "../types";
import { BaseProvider } from "./base";

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
			throw new Error(this.sanitizeError("Ollama", response.status, text));
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
