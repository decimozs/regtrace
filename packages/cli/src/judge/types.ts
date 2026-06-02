export interface JudgeConfig {
	provider: string;
	model: string;
	temperature: number;
	maxTokens: number;
	timeoutMs: number;
	retryAttempts: number;
	localEndpoint?: string;
	apiKey?: string;
}

export interface JudgeResult {
	score: number;
	confidence: number;
	explanation: string;
	tokenCost: number;
	inputTokens: number;
	outputTokens: number;
}

export interface JudgeProvider {
	evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse>;
}

export interface JudgeMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface JudgeProviderResponse {
	content: string;
	inputTokens: number;
	outputTokens: number;
}
