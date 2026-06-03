import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, renameSync, unlinkSync } from "node:fs";

const RETRY_DELAY_MS = 100;

/**
 * Back up the current binary, then spawn the downloaded replacement with
 * `--complete-upgrade` to finish the swap after this process exits.
 *
 * @param newBinaryPath - Path to the freshly-downloaded replacement binary.
 * @param currentBinaryPath - Path to the currently-running binary (process.execPath).
 * @returns This function never returns — it exits the process.
 */
export function performSwap(
	newBinaryPath: string,
	currentBinaryPath: string,
): never {
	const backupPath = `${currentBinaryPath}.backup`;

	copyFileSync(currentBinaryPath, backupPath);

	const child = spawn(
		newBinaryPath,
		["--complete-upgrade", newBinaryPath, currentBinaryPath, backupPath],
		{
			detached: true,
			stdio: "ignore",
		},
	);

	child.unref();

	process.exit(0);
}

/**
 * Completes the upgrade by renaming the new binary into place.
 * Called by the new binary immediately after the old process exits.
 *
 * @param sourcePath - Temp path of the downloaded binary.
 * @param targetPath - Destination path (current binary's old location).
 * @param backupPath - Path of the backup copy.
 * @returns `true` on success, `false` if the swap failed and backup was restored.
 */
/** @returns Retry count. Default 50 (5s), overridable via env for tests. */
function getMaxRetries(): number {
	return Number(process.env.REGRACE_UPGRADE_RETRIES) || 50;
}

export function completeSwap(
	sourcePath: string,
	targetPath: string,
	backupPath: string,
): boolean {
	const maxRetries = getMaxRetries();
	// Retry loop: the old process may still hold the file handle.
	let lastErr: Error | null = null;
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			renameSync(sourcePath, targetPath);
			lastErr = null;
			break;
		} catch (err) {
			lastErr = err instanceof Error ? err : new Error(String(err));
			// Sleep synchronously — fine for a self-upgrade helper.
			Atomics.wait(
				new Int32Array(new SharedArrayBuffer(4)),
				0,
				0,
				RETRY_DELAY_MS,
			);
		}
	}

	if (lastErr) {
		// Restore from backup
		try {
			renameSync(backupPath, targetPath);
		} catch {
			// Both binaries are missing — critical failure.
			console.error(
				`Critical: upgrade failed and backup could not be restored.\n  Target: ${targetPath}\n  Backup: ${backupPath}`,
			);
		}
		return false;
	}

	// Verify the new binary runs
	try {
		execFileSync(targetPath, ["--version"], {
			stdio: "pipe",
			timeout: 10_000,
		});
	} catch {
		try {
			renameSync(backupPath, targetPath);
		} catch {
			console.error(
				`Critical: upgrade verification failed and backup could not be restored.\n  Target: ${targetPath}\n  Backup: ${backupPath}`,
			);
		}
		return false;
	}

	// Cleanup backup
	try {
		unlinkSync(backupPath);
	} catch {
		// non-fatal
	}

	return true;
}
