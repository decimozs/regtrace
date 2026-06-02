export async function concurrentMap<T, R>(
	items: T[],
	fn: (item: T, index: number) => Promise<R>,
	concurrency: number,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let next = 0;

	async function worker(): Promise<void> {
		while (next < items.length) {
			const i = next++;
			const item = items[i] as T;
			results[i] = await fn(item, i);
		}
	}

	const pool = Array.from(
		{ length: Math.min(concurrency, items.length) },
		worker,
	);
	await Promise.all(pool);
	return results;
}
