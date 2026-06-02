import { getEnv } from "../../utils/env";
import type {
	JudgeConfig,
	JudgeMessage,
	JudgeProvider,
	JudgeProviderResponse,
} from "../types";
import { BaseProvider } from "./base";

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
