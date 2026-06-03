import { accessSync, constants } from "node:fs";
import { readFile, rm, unlink } from "node:fs/promises";
import { createInterface } from "node:readline";
import { downloadRelease } from "../upgrade/download";
import { type ApiError, getLatestRelease } from "../upgrade/github-api";
import { detectPlatform } from "../upgrade/platform";
import { performSwap } from "../upgrade/swap";
import { verifyChecksum } from "../upgrade/verify";
import { compareVersions, parseVersion } from "../upgrade/version";
import { printError, printInfo, printSuccess } from "./print";

declare const __VERSION__: string | undefined;

export interface UpgradeOptions {
	yes?: boolean;
	prerelease?: boolean;
	noVerify?: boolean;
	dryRun?: boolean;
}

/**
 * Run the `regtrace upgrade` flow: check GitHub for a newer release,
 * prompt the user, download, verify, and replace the current binary.
 */
export async function upgradeCommand(options: UpgradeOptions): Promise<void> {
	// --- 1. Detect platform ---
	let platformInfo: { info: { os: string; arch: string }; asset: string };
	try {
		platformInfo = detectPlatform();
	} catch (err) {
		printError(err instanceof Error ? err.message : "Unsupported platform");
		process.exit(1);
	}

	// --- 2. Get current version ---
	const currentTag =
		typeof __VERSION__ === "string" ? __VERSION__ : "0.0.0-dev";
	const currentParsed = parseVersion(currentTag);

	// --- 3. Fetch latest release ---
	printInfo("Checking for updates...");

	const result = await getLatestRelease(platformInfo.asset, {
		prerelease: options.prerelease,
	});

	if ("error" in result) {
		handleApiError(result.error);
		process.exit(1);
	}

	const { release } = result;

	// --- 4. Validate asset exists in release ---
	if (!release.assetUrl) {
		printError(
			`Release ${release.tagName} does not include ${platformInfo.asset}. Cannot upgrade.`,
		);
		process.exit(1);
	}

	// --- 5. Compare versions ---
	if (currentParsed && compareVersions(release.version, currentParsed) <= 0) {
		const currentDisplay = currentTag.replace(/^v/, "");
		printInfo(`Already up to date (${currentDisplay}).`);
		return;
	}

	// --- 6. Print version info ---
	const currentDisplay = currentTag.replace(/^v/, "");
	const latestDisplay = release.tagName.replace(/^v/, "");

	printInfo(`Current: v${currentDisplay}`);
	printInfo(`Latest:  v${latestDisplay}`);

	// --- 7. Dry run? ---
	if (options.dryRun) {
		printInfo(`Would download: ${release.assetUrl}`);
		return;
	}

	// --- 8. Confirm ---
	if (!options.yes) {
		const ok = await confirmPrompt("\nUpgrade? [y/N] ");
		if (!ok) {
			printInfo("Upgrade cancelled.");
			return;
		}
	}

	// --- 9. Check write permission ---
	try {
		accessSync(process.execPath, constants.W_OK);
	} catch {
		printError(
			`No write permission for ${process.execPath}. Try: sudo regtrace upgrade`,
		);
		process.exit(1);
	}

	// --- 10. Download ---
	printInfo("Downloading...");

	let files: { binaryPath: string; sha256Path: string };
	try {
		files = await downloadRelease(
			release.assetUrl,
			release.sha256Url,
			platformInfo.asset,
		);
	} catch (err) {
		printError(err instanceof Error ? err.message : "Download failed");
		process.exit(1);
	}

	// --- 11. Verify ---
	if (!options.noVerify && release.sha256Url) {
		printInfo("Verifying checksum...");

		let sha256Content: string;
		try {
			sha256Content = await readFile(files.sha256Path, "utf-8");
		} catch {
			printError("Checksum file not found. Use --no-verify to skip.");
			await cleanupFiles(files.binaryPath, files.sha256Path);
			process.exit(1);
		}

		const valid = await verifyChecksum(files.binaryPath, sha256Content);
		if (!valid) {
			printError("Checksum mismatch — download may be corrupted or tampered.");
			await cleanupFiles(files.binaryPath, files.sha256Path);
			process.exit(1);
		}

		printSuccess("Checksum verified");
	}

	// --- 12. Swap ---
	printInfo("Upgrading...");
	performSwap(files.binaryPath, process.execPath);
}

/**
 * Print a human-readable API error and optionally a fallback command.
 */
function handleApiError(error: ApiError): void {
	switch (error.kind) {
		case "rate_limit": {
			const msg = error.retryAfter
				? `GitHub API rate limited. Retry after ${error.retryAfter}s.`
				: "GitHub API rate limited. Try again later.";
			printError(msg);
			break;
		}
		case "no_releases":
			printError("No GitHub releases found.");
			break;
		case "asset_not_found":
			printError(`Asset ${error.assetName} not found in the latest release.`);
			break;
		case "network":
			printError(`Network error: ${error.message}`);
			break;
	}
}

/**
 * Prompt the user for a yes/no answer via stdin.
 */
function confirmPrompt(question: string): Promise<boolean> {
	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stderr,
		});
		rl.question(question, (answer) => {
			rl.close();
			const trimmed = answer.trim().toLowerCase();
			resolve(trimmed === "y" || trimmed === "yes");
		});
	});
}

/**
 * Best-effort cleanup of downloaded temp files.
 */
async function cleanupFiles(
	binaryPath: string,
	sha256Path: string,
): Promise<void> {
	try {
		await unlink(binaryPath);
	} catch {
		// ignore
	}
	try {
		await rm(sha256Path, { force: true });
	} catch {
		// ignore
	}
}
