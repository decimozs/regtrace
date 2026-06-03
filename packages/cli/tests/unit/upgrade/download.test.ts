import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, unlinkSync } from "node:fs";
import { downloadRelease } from "../../../src/upgrade/download";

function mockFetchResponse(
	body: string,
	status = 200,
	contentType = "application/octet-stream",
) {
	return new Response(body, {
		status,
		headers: { "content-type": contentType },
	});
}

describe("downloadRelease", () => {
	beforeEach(() => {
		globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = undefined as unknown as typeof globalThis.fetch;
	});

	it("downloads binary and checksum files", async () => {
		globalThis.fetch = Object.assign(
			async (url: string) => {
				if (url.endsWith(".sha256")) {
					return mockFetchResponse(
						"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890  binary",
					);
				}
				return mockFetchResponse("binary-content");
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		const files = await downloadRelease(
			"https://example.com/binary",
			"https://example.com/binary.sha256",
			"test-binary",
		);

		expect(files.binaryPath).toContain("test-binary");
		expect(files.sha256Path).toContain("test-binary.sha256");
		expect(existsSync(files.binaryPath)).toBe(true);
		expect(existsSync(files.sha256Path)).toBe(true);

		// Cleanup
		unlinkSync(files.binaryPath);
		unlinkSync(files.sha256Path);
	});

	it("throws when binary download fails", async () => {
		globalThis.fetch = Object.assign(
			async (url: string) => {
				if (url.includes("binary") && !url.includes("sha256")) {
					return mockFetchResponse("not found", 404);
				}
				return mockFetchResponse("sha256 content");
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		expect(
			downloadRelease(
				"https://example.com/binary",
				"https://example.com/binary.sha256",
				"test-binary",
			),
		).rejects.toThrow("Failed to download binary");
	});

	it("skips checksum file when sha256Url is empty", async () => {
		globalThis.fetch = Object.assign(
			async () => mockFetchResponse("binary-content"),
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		const files = await downloadRelease(
			"https://example.com/binary",
			"",
			"test-binary",
		);

		expect(existsSync(files.binaryPath)).toBe(true);
		// sha256Path file should not exist since sha256Url was empty
		expect(existsSync(files.sha256Path)).toBe(false);

		unlinkSync(files.binaryPath);
	});

	it("handles checksum download failure gracefully", async () => {
		globalThis.fetch = Object.assign(
			async (url: string) => {
				if (url.endsWith(".sha256")) {
					return mockFetchResponse("not found", 404);
				}
				return mockFetchResponse("binary-content");
			},
			{ preconnect: () => {} },
		) as unknown as typeof globalThis.fetch;

		const files = await downloadRelease(
			"https://example.com/binary",
			"https://example.com/binary.sha256",
			"test-binary",
		);

		expect(existsSync(files.binaryPath)).toBe(true);
		expect(existsSync(files.sha256Path)).toBe(false);

		unlinkSync(files.binaryPath);
	});
});
