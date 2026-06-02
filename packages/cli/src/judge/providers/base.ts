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
}
