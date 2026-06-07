import { describe, expect, it } from "bun:test";
import { concurrentMap } from "../../../src/utils/concurrent-map";

describe("concurrentMap", () => {
	it("processes all items", async () => {
		const result = await concurrentMap(
			[1, 2, 3],
			(n) => Promise.resolve(n * 2),
			2,
		);
		expect(result).toEqual([2, 4, 6]);
	});

	it("handles empty input", async () => {
		const result = await concurrentMap(
			[],
			(n: number) => Promise.resolve(n),
			4,
		);
		expect(result).toEqual([]);
	});

	it("limits concurrency", async () => {
		let active = 0;
		let maxActive = 0;
		const fn = async (n: number) => {
			active++;
			maxActive = Math.max(maxActive, active);
			await new Promise((r) => setTimeout(r, 10));
			active--;
			return n;
		};
		await concurrentMap([1, 2, 3, 4, 5, 6, 7, 8], fn, 3);
		expect(maxActive).toBe(3);
	});

	it("runs with concurrency 1 (serial)", async () => {
		const order: number[] = [];
		const fn = async (n: number) => {
			await new Promise((r) => setTimeout(r, 5));
			order.push(n);
			return n;
		};
		await concurrentMap([1, 2, 3], fn, 1);
		expect(order).toEqual([1, 2, 3]);
	});

	it("runs with concurrency higher than item count", async () => {
		const fn = (n: number) => Promise.resolve(n * 10);
		const result = await concurrentMap([1, 2], fn, 10);
		expect(result).toEqual([10, 20]);
	});

	it("preserves item order", async () => {
		const delays = [30, 10, 20];
		const result = await concurrentMap(
			delays,
			(ms) => new Promise<number>((r) => setTimeout(() => r(ms), ms)),
			3,
		);
		expect(result).toEqual([30, 10, 20]);
	});
});
