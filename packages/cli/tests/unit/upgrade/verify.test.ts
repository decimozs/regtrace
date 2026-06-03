import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	computeSha256,
	parseSha256File,
	verifyChecksum,
} from "../../../src/upgrade/verify";

describe("parseSha256File", () => {
	it("parses standard sha256sum format", () => {
		const hash = "a".repeat(64);
		const content = `${hash}  regtrace-linux-x64\n`;
		expect(parseSha256File(content)).toBe(hash);
	});

	it("returns null for empty content", () => {
		expect(parseSha256File("")).toBeNull();
	});

	it("returns null for invalid hash", () => {
		expect(parseSha256File("abc  filename")).toBeNull();
	});

	it("handles whitespace around content", () => {
		const hash = "b".repeat(64);
		const content = `  ${hash}  regtrace-darwin-arm64  `;
		expect(parseSha256File(content)).toBe(hash);
	});
});

describe("computeSha256", () => {
	const tmpDir = mkdtempSync(join(tmpdir(), "regtrace-test-verify-"));

	it("computes SHA256 of a known file", async () => {
		const testFile = join(tmpDir, "test.bin");
		writeFileSync(testFile, "hello world");
		const hash = await computeSha256(testFile);
		expect(hash).toBe(
			"b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
		);
	});

	it("produces same hash for same content", async () => {
		const a = join(tmpDir, "a.bin");
		const b = join(tmpDir, "b.bin");
		writeFileSync(a, "same content");
		writeFileSync(b, "same content");
		const hashA = await computeSha256(a);
		const hashB = await computeSha256(b);
		expect(hashA).toBe(hashB);
	});

	it("produces different hash for different content", async () => {
		const a = join(tmpDir, "x.bin");
		const b = join(tmpDir, "y.bin");
		writeFileSync(a, "content A");
		writeFileSync(b, "content B");
		const hashA = await computeSha256(a);
		const hashB = await computeSha256(b);
		expect(hashA).not.toBe(hashB);
	});
});

describe("verifyChecksum", () => {
	const tmpDir = mkdtempSync(join(tmpdir(), "regtrace-test-verify2-"));
	const binaryPath = join(tmpDir, "regtrace-test");

	it("returns true for matching checksum", async () => {
		writeFileSync(binaryPath, "verify me");
		const hash = await computeSha256(binaryPath);
		const sha256Content = `${hash}  regtrace-test\n`;
		expect(await verifyChecksum(binaryPath, sha256Content)).toBe(true);
	});

	it("returns false for mismatched checksum", async () => {
		writeFileSync(binaryPath, "verify me");
		const fakeHash = "f".repeat(64);
		const sha256Content = `${fakeHash}  regtrace-test\n`;
		expect(await verifyChecksum(binaryPath, sha256Content)).toBe(false);
	});

	it("returns false for unparseable checksum file", async () => {
		writeFileSync(binaryPath, "anything");
		expect(await verifyChecksum(binaryPath, "bad content")).toBe(false);
	});
});
