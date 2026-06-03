import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

/**
 * Parse a SHA256 checksum file (single-line format produced by `sha256sum`):
 * `<hex-hash>  <filename>`.
 * @returns The hex hash string, or `null` if the file cannot be parsed.
 */
export function parseSha256File(content: string): string | null {
	const match = /^([a-f0-9]{64})\s/.exec(content.trim());
	if (!match) return null;
	return match[1] ?? null;
}

/**
 * Compute the SHA256 hex digest of a binary file.
 * @param filePath - Absolute path to the downloaded binary.
 * @returns The hex-encoded SHA256 digest.
 */
export async function computeSha256(filePath: string): Promise<string> {
	const hash = createHash("sha256");
	const data = await readFile(filePath);
	hash.update(data);
	return hash.digest("hex");
}

/**
 * Verify a downloaded binary against its published `.sha256` checksum.
 * @param binaryPath - Absolute path to the downloaded binary.
 * @param sha256Content - Raw content of the `.sha256` checksum file.
 * @returns `true` if the hash matches, `false` otherwise.
 */
export async function verifyChecksum(
	binaryPath: string,
	sha256Content: string,
): Promise<boolean> {
	const expected = parseSha256File(sha256Content);
	if (!expected) return false;
	const actual = await computeSha256(binaryPath);
	return actual === expected;
}
