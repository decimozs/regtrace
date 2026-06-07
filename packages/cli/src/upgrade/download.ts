import { chmodSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface DownloadedFiles {
	binaryPath: string;
	sha256Path: string;
}

/**
 * Remove stale temp files from a previous failed download, then download the
 * release binary and its `.sha256` checksum file to a temp directory.
 * @param binaryUrl - URL of the release binary.
 * @param sha256Url - URL of the `.sha256` checksum file.
 * @param assetName - Name of the asset (used for the temp filename).
 * @returns Paths to the downloaded files.
 */
export async function downloadRelease(
	binaryUrl: string,
	sha256Url: string,
	assetName: string,
): Promise<DownloadedFiles> {
	const tmpDir = tmpdir();
	const binaryPath = join(tmpDir, assetName);
	const sha256Path = join(tmpDir, `${assetName}.sha256`);

	await rm(binaryPath, { force: true });
	await rm(sha256Path, { force: true });

	const [binaryRes, sha256Res] = await Promise.all([
		fetch(binaryUrl),
		fetch(sha256Url),
	]);

	if (!binaryRes.ok) {
		throw new Error(
			`Failed to download binary: ${binaryRes.status} ${binaryRes.statusText}`,
		);
	}

	const binaryBuffer = await binaryRes.arrayBuffer();
	await writeFile(binaryPath, new Uint8Array(binaryBuffer));
	chmodSync(binaryPath, 0o755);

	if (sha256Url && sha256Res.ok) {
		const sha256Text = await sha256Res.text();
		await writeFile(sha256Path, sha256Text, "utf-8");
	}

	return { binaryPath, sha256Path };
}
