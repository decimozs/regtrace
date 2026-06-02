import { describe, expect, it } from "bun:test";
import { buildJudgeConfig } from "../../../src/judge/judge";
import {
	buildFactualityPrompt,
	buildTonePrompt,
} from "../../../src/judge/prompts";
import {
	AnthropicProvider,
	GeminiProvider,
	GroqProvider,
	OllamaProvider,
	OpenAiProvider,
} from "../../../src/judge/providers";
import type { JudgeConfig } from "../../../src/judge/types";

function mockFetch(responseBody: unknown, status = 200) {
	globalThis.fetch = Object.assign(
		async (_request: Request | URL | string, _init?: RequestInit) =>
			new Response(JSON.stringify(responseBody), { status }),
		{ preconnect: () => {} },
	) as unknown as typeof globalThis.fetch;
}

const MINIMAL_JUDGE_CONFIG: JudgeConfig = {
	provider: "openai",
	model: "gpt-4o-mini",
	temperature: 0.1,
	maxTokens: 500,
	timeoutMs: 5000,
	retryAttempts: 0,
	apiKey: "test-key",
};

describe("OpenAiProvider", () => {
	it("returns parsed content from valid response", async () => {
		mockFetch({
			choices: [
				{
					message: {
						content:
							'{"score": 0.85, "confidence": 0.9, "explanation": "Good match"}',
					},
				},
			],
			usage: { prompt_tokens: 50, completion_tokens: 20 },
		});

		const provider = new OpenAiProvider();
		const result = await provider.evaluate(
			[{ role: "user", content: "test" }],
			MINIMAL_JUDGE_CONFIG,
		);

		expect(result.content).toContain("score");
		expect(result.inputTokens).toBe(50);
		expect(result.outputTokens).toBe(20);
	});

	it("throws on API error", async () => {
		mockFetch({ error: "unauthorized" }, 401);

		const provider = new OpenAiProvider();
		expect(
			provider.evaluate(
				[{ role: "user", content: "test" }],
				MINIMAL_JUDGE_CONFIG,
			),
		).rejects.toThrow("OpenAI API error");
	});
});

describe("AnthropicProvider", () => {
	it("returns parsed content from valid response", async () => {
		mockFetch({
			content: [
				{
					text: '{"score": 0.9, "confidence": 0.95, "explanation": "Excellent"}',
				},
			],
			usage: { input_tokens: 60, output_tokens: 30 },
		});

		const provider = new AnthropicProvider();
		const result = await provider.evaluate(
			[
				{ role: "system", content: "system prompt" },
				{ role: "user", content: "user message" },
			],
			MINIMAL_JUDGE_CONFIG,
		);

		expect(result.content).toContain("score");
		expect(result.inputTokens).toBe(60);
		expect(result.outputTokens).toBe(30);
	});
});

describe("GeminiProvider", () => {
	it("returns parsed content from valid response", async () => {
		mockFetch({
			candidates: [
				{
					content: {
						parts: [
							{
								text: '{"score": 0.75, "confidence": 0.8, "explanation": "Decent"}',
							},
						],
					},
				},
			],
			usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 15 },
		});

		const provider = new GeminiProvider();
		const result = await provider.evaluate(
			[{ role: "user", content: "test" }],
			{ ...MINIMAL_JUDGE_CONFIG, provider: "gemini" },
		);

		expect(result.content).toContain("score");
		expect(result.inputTokens).toBe(40);
		expect(result.outputTokens).toBe(15);
	});
});

describe("GroqProvider", () => {
	it("returns parsed content from valid response", async () => {
		mockFetch({
			choices: [
				{
					message: {
						content:
							'{"score": 0.8, "confidence": 0.85, "explanation": "Good"}',
					},
				},
			],
			usage: { prompt_tokens: 30, completion_tokens: 10 },
		});

		const provider = new GroqProvider();
		const result = await provider.evaluate(
			[{ role: "user", content: "test" }],
			{ ...MINIMAL_JUDGE_CONFIG, provider: "groq" },
		);

		expect(result.content).toContain("score");
	});
});

describe("OllamaProvider", () => {
	it("returns parsed content from valid response", async () => {
		mockFetch({
			message: {
				content: '{"score": 0.7, "confidence": 0.75, "explanation": "OK"}',
			},
			eval_count: 25,
		});

		const provider = new OllamaProvider();
		const result = await provider.evaluate(
			[{ role: "user", content: "test" }],
			{
				...MINIMAL_JUDGE_CONFIG,
				provider: "ollama",
				localEndpoint: "http://localhost:11434",
			},
		);

		expect(result.content).toContain("score");
		expect(result.outputTokens).toBe(25);
	});
});

describe("buildJudgeConfig", () => {
	it("maps config fields correctly", () => {
		const result = buildJudgeConfig({
			provider: "anthropic",
			model: "claude-3-5-sonnet-20240620",
			temperature: 0.2,
			max_tokens: 2000,
			timeout_ms: 15000,
			retry_attempts: 2,
		});

		expect(result.provider).toBe("anthropic");
		expect(result.model).toBe("claude-3-5-sonnet-20240620");
		expect(result.maxTokens).toBe(2000);
		expect(result.timeoutMs).toBe(15000);
		expect(result.retryAttempts).toBe(2);
	});
});

describe("buildFactualityPrompt", () => {
	it("includes input, expected, and actual in prompt", () => {
		const messages = buildFactualityPrompt("What is 2+2?", "4", "4", "shallow");
		expect(messages.length).toBe(2);
		expect(messages[0]?.role).toBe("system");
		expect(messages[1]?.role).toBe("user");
		expect(messages[1]?.content).toContain("What is 2+2?");
		expect(messages[1]?.content).toContain("4");
	});

	it("includes deep claim instructions when depth is deep", () => {
		const messages = buildFactualityPrompt(
			"test",
			"expected",
			"actual",
			"deep",
		);
		const systemMsg = messages[0]?.content ?? "";
		expect(systemMsg).toContain("every factual claim");
	});
});

describe("buildTonePrompt", () => {
	it("includes tone profile when provided", () => {
		const messages = buildTonePrompt(
			"input",
			"expected",
			"actual",
			"professional",
		);
		const systemMsg = messages[0]?.content ?? "";
		expect(systemMsg).toContain("professional");
	});

	it("omits tone profile when not provided", () => {
		const messages = buildTonePrompt("input", "expected", "actual", null);
		const systemMsg = messages[0]?.content ?? "";
		expect(systemMsg).not.toContain("tone profile is:");
	});
});
