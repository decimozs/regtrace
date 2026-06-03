import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";

import { generateOutput } from "../../../src/cli/generate";

const tempDirs: string[] = [];

beforeEach(() => {
	process.env.OPENAI_API_KEY = "sk-test-openai";
	process.env.GROQ_API_KEY = "gsk-test-groq";
	process.env.ANTHROPIC_API_KEY = "sk-ant-test";
	process.env.GEMINI_API_KEY = "AIza-test-gemini";
});

afterAll(() => {
	for (const dir of tempDirs) {
		try {
			rmSync(dir, { recursive: true, force: true });
		} catch {
			// ignore
		}
	}
});

const BASE_GEN_CONFIG = {
	provider: "openai",
	model: "gpt-4o-mini",
	temperature: 0.1,
	max_tokens: 500,
	timeout_ms: 5000,
	retry_attempts: 0,
};

function mockFetch(responseBody: unknown, status = 200) {
	globalThis.fetch = Object.assign(
		async (_request: Request | URL | string, _init?: RequestInit) =>
			new Response(JSON.stringify(responseBody), { status }),
		{ preconnect: () => {} },
	) as unknown as typeof globalThis.fetch;
}

describe("generateOutput", () => {
	it("returns content from provider", async () => {
		mockFetch({
			choices: [{ message: { content: "The capital of France is Paris." } }],
			usage: { prompt_tokens: 20, completion_tokens: 10 },
		});

		const result = await generateOutput(
			"What is the capital of France?",
			null,
			BASE_GEN_CONFIG,
		);

		expect(result).toBe("The capital of France is Paris.");
	});

	it("returns content even with system prompt", async () => {
		mockFetch({
			choices: [{ message: { content: "System-guided answer" } }],
			usage: { prompt_tokens: 30, completion_tokens: 12 },
		});

		const result = await generateOutput(
			"Hello",
			"You are a helpful assistant",
			BASE_GEN_CONFIG,
		);

		expect(result).toBe("System-guided answer");
	});

	it("throws for unknown provider", async () => {
		expect(
			generateOutput("test", null, {
				...BASE_GEN_CONFIG,
				provider: "nonexistent",
			}),
		).rejects.toThrow('Unknown judge provider: "nonexistent"');
	});

	it("routes to the correct provider URL", async () => {
		let capturedUrl = "";
		globalThis.fetch = Object.assign(
			async (request: Request | URL | string) => {
				capturedUrl =
					typeof request === "string" ? request : request.toString();
				return new Response(
					JSON.stringify({
						choices: [{ message: { content: "test" } }],
						usage: { prompt_tokens: 5, completion_tokens: 3 },
					}),
					{ status: 200 },
				);
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		await generateOutput("test", null, {
			...BASE_GEN_CONFIG,
			provider: "openai",
		});

		expect(capturedUrl).toContain("openai.com");
	});

	it("supports groq provider", async () => {
		mockFetch({
			choices: [{ message: { content: "Groq answer" } }],
			usage: { prompt_tokens: 10, completion_tokens: 5 },
		});

		const result = await generateOutput("test", null, {
			...BASE_GEN_CONFIG,
			provider: "groq",
		});

		expect(result).toBe("Groq answer");
	});

	it("supports local endpoint for ollama provider", async () => {
		let capturedUrl = "";
		globalThis.fetch = Object.assign(
			async (request: Request | URL | string) => {
				capturedUrl =
					typeof request === "string" ? request : request.toString();
				return new Response(
					JSON.stringify({
						message: { content: "Ollama answer" },
						eval_count: 15,
					}),
					{ status: 200 },
				);
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		const result = await generateOutput("test", null, {
			...BASE_GEN_CONFIG,
			provider: "ollama",
			local_endpoint: "http://localhost:11434",
		});

		expect(result).toBe("Ollama answer");
		expect(capturedUrl).toContain("localhost:11434");
	});

	it("throws on API error from provider", async () => {
		mockFetch({ error: "unauthorized" }, 401);

		expect(
			generateOutput("test", null, { ...BASE_GEN_CONFIG, retry_attempts: 0 }),
		).rejects.toThrow("OpenAI API error");
	});
});
