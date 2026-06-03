import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { getLatestRelease } from "../../../src/upgrade/github-api";

function mockFetch(responseBody: unknown, status = 200) {
	globalThis.fetch = Object.assign(
		async (_request: Request | URL | string, _init?: RequestInit) =>
			new Response(JSON.stringify(responseBody), { status }),
		{ preconnect: () => {} },
	) as unknown as typeof globalThis.fetch;
}

function makeAsset(name: string) {
	return {
		name,
		browser_download_url: `https://github.com/decimozs/regtrace/releases/latest/download/${name}`,
	};
}

function makeRelease(
	overrides: Partial<{
		tag_name: string;
		prerelease: boolean;
		draft: boolean;
		assets: ReturnType<typeof makeAsset>[];
	}> = {},
) {
	return {
		tag_name: "v1.0.0",
		prerelease: false,
		draft: false,
		assets: [
			makeAsset("regtrace-linux-x64"),
			makeAsset("regtrace-linux-x64.sha256"),
		],
		...overrides,
	};
}

describe("getLatestRelease", () => {
	beforeEach(() => {
		mockFetch(makeRelease());
	});

	afterEach(() => {
		globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
	});

	it("returns release info for matching asset", async () => {
		const result = await getLatestRelease("regtrace-linux-x64");
		expect("release" in result).toBe(true);
		if ("release" in result) {
			expect(result.release.tagName).toBe("v1.0.0");
			expect(result.release.assetUrl).toContain("regtrace-linux-x64");
			expect(result.release.sha256Url).toContain("regtrace-linux-x64.sha256");
		}
	});

	it("returns empty assetUrl when asset not found", async () => {
		const result = await getLatestRelease("nonexistent-asset");
		expect("release" in result).toBe(true);
		if ("release" in result) {
			expect(result.release.assetUrl).toBe("");
			expect(result.release.sha256Url).toBe("");
		}
	});

	it("returns rate_limit error on 403", async () => {
		mockFetch({ message: "rate limit" }, 403);
		const result = await getLatestRelease("regtrace-linux-x64");
		expect("error" in result).toBe(true);
		if ("error" in result) {
			expect(result.error.kind).toBe("rate_limit");
		}
	});

	it("returns rate_limit error on 429", async () => {
		mockFetch({ message: "too many" }, 429);
		const result = await getLatestRelease("regtrace-linux-x64");
		expect("error" in result).toBe(true);
		if ("error" in result) {
			expect(result.error.kind).toBe("rate_limit");
		}
	});

	it("returns network error on non-ok status", async () => {
		mockFetch({ message: "not found" }, 404);
		const result = await getLatestRelease("regtrace-linux-x64");
		expect("error" in result).toBe(true);
		if ("error" in result) {
			expect(result.error.kind).toBe("network");
		}
	});

	it("returns network error on fetch failure", async () => {
		globalThis.fetch = Object.assign(
			async () => {
				throw new Error("connection refused");
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;
		const result = await getLatestRelease("regtrace-linux-x64");
		expect("error" in result).toBe(true);
		if ("error" in result) {
			expect(result.error.kind).toBe("network");
		}
	});

	it("returns no_releases when prerelease list is empty", async () => {
		mockFetch([]);
		const result = await getLatestRelease("regtrace-linux-x64", {
			prerelease: true,
		});
		expect("error" in result).toBe(true);
		if ("error" in result) {
			expect(result.error.kind).toBe("no_releases");
		}
	});

	it("picks latest from prerelease list", async () => {
		mockFetch([
			makeRelease({ tag_name: "v1.0.0", prerelease: false }),
			makeRelease({ tag_name: "v1.1.0-beta.1", prerelease: true }),
			makeRelease({ tag_name: "v0.9.0", prerelease: false }),
		]);
		const result = await getLatestRelease("regtrace-linux-x64", {
			prerelease: true,
		});
		expect("release" in result).toBe(true);
		if ("release" in result) {
			expect(result.release.tagName).toBe("v1.1.0-beta.1");
		}
	});

	it("picks stable over prerelease in default mode", async () => {
		mockFetch(makeRelease({ tag_name: "v1.0.0" }));
		const result = await getLatestRelease("regtrace-linux-x64");
		expect("release" in result).toBe(true);
		if ("release" in result) {
			expect(result.release.tagName).toBe("v1.0.0");
		}
	});
});
