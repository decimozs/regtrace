export class BaseProvider {
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

	protected requireApiKey(
		apiKey: string | undefined,
		providerName: string,
		envVar: string,
	): string {
		if (apiKey && apiKey !== "") return apiKey;
		const fromEnv = process.env[envVar];
		if (fromEnv && fromEnv !== "") return fromEnv;
		throw new Error(
			`${providerName} API key not configured. Set ${envVar} or pass apiKey in judge config.`,
		);
	}

	protected sanitizeError(
		provider: string,
		status: number,
		body: string,
	): string {
		const sanitized = body
			.slice(0, 400)
			.replace(/sk-[a-zA-Z0-9_-]{10,}/g, "sk-...")
			.replace(/gsk_[a-zA-Z0-9_-]{10,}/g, "gsk_...")
			.replace(/AIza[a-zA-Z0-9_-]{10,}/g, "AIza...");
		return `${provider} API error ${status}: ${sanitized}`;
	}
}
