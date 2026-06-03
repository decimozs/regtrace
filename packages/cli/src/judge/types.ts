/** Configuration for an LLM judge provider call. */
export interface JudgeConfig {
	/** Provider identifier (e.g. "openai", "anthropic"). */
	provider: string;
	/** Model identifier (e.g. "gpt-4o", "claude-sonnet-4-20250514"). */
	model: string;
	/** Sampling temperature (0–2). */
	temperature: number;
	/** Maximum tokens in the completion response. */
	maxTokens: number;
	/** Request timeout in milliseconds. */
	timeoutMs: number;
	/** Maximum number of retry attempts on transient failures. */
	retryAttempts: number;
	/** Optional local inference endpoint URL (for Ollama or compatible servers). */
	localEndpoint?: string;
	/** Optional API key; overrides the provider's environment variable. */
	apiKey?: string;
}

/** Scored result returned by the judge after evaluating a metric. */
export interface JudgeResult {
	/** Overall metric score (0–1). */
	score: number;
	/** Judge confidence in its own score (0–1). */
	confidence: number;
	/** Human-readable explanation of the score. */
	explanation: string;
	/** Estimated cost in USD cents for this judge call. */
	tokenCost: number;
	/** Number of prompt tokens consumed. */
	inputTokens: number;
	/** Number of completion tokens produced. */
	outputTokens: number;
}

/** Contract that every judge provider must implement. */
export interface JudgeProvider {
	/**
	 * Sends messages to the LLM and returns the raw response.
	 * @param messages - The conversation messages to send.
	 * @param config - Judge configuration controlling model, temperature, retries, etc.
	 * @returns The provider's response including token usage.
	 */
	evaluate(
		messages: JudgeMessage[],
		config: JudgeConfig,
	): Promise<JudgeProviderResponse>;
}

/** A single message in a judge conversation. */
export interface JudgeMessage {
	/** The role of the message author. */
	role: "system" | "user" | "assistant";
	/** The text content of the message. */
	content: string;
}

/** Raw response returned by a judge provider. */
export interface JudgeProviderResponse {
	/** The LLM's text output (expected to be JSON). */
	content: string;
	/** Number of prompt tokens consumed. */
	inputTokens: number;
	/** Number of completion tokens produced. */
	outputTokens: number;
}
