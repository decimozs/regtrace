import { spawn } from "node:child_process";
import { accessSync, constants, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline";
import { printError, printInfo, printSuccess } from "./print";

export interface UninstallOptions {
	yes?: boolean;
}

/**
 * Run the `regtrace uninstall` flow: check permissions, confirm, then
 * remove the binary. On Unix the binary is deleted immediately. On Windows
 * a background batch script removes it after the process exits.
 *
 * @param options - Command options (`-y` skips confirmation).
 * @param targetPath - Binary path (default: `process.execPath`). Exposed for testing.
 */
export async function uninstallCommand(
	options: UninstallOptions,
	targetPath?: string,
): Promise<void> {
	const target = targetPath ?? process.execPath;
	const backup = `${target}.backup`;

	// 1. Check existence & permission
	try {
		accessSync(target, constants.F_OK);
	} catch {
		printInfo(`Binary not found at ${target}. Nothing to uninstall.`);
		return;
	}

	try {
		accessSync(dirname(target), constants.W_OK);
	} catch {
		const hint =
			process.platform === "win32"
				? "Run as Administrator"
				: "Try: sudo regtrace uninstall";
		printError(`No write permission for ${target}. ${hint}.`);
		process.exit(1);
	}

	// 2. Confirm
	if (!options.yes) {
		const ok = await confirmPrompt(
			`Remove regtrace binary at ${target}? [y/N] `,
		);
		if (!ok) {
			printInfo("Uninstall cancelled.");
			return;
		}
	}

	// 3. Platform branch
	if (process.platform === "win32") {
		uninstallWindows(target);
	}

	// 4. Unix: unlink directly
	try {
		unlinkSync(target);
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code;
		if (code === "ENOENT") {
			printInfo(`Binary not found at ${target}. Nothing to uninstall.`);
			return;
		}
		printError(`Failed to remove ${target}: ${(err as Error).message}`);
		process.exit(1);
	}

	// Cleanup backup
	try {
		unlinkSync(backup);
	} catch {
		// non-fatal
	}

	printSuccess(
		"regtrace uninstalled.\n  Project files (.regtrace/, configs, golden sets) left in place.",
	);
}

/**
 * Prompt the user for a yes/no answer via stdin.
 * Exported for testing.
 *
 * @param question - The prompt text to display.
 * @returns `true` if the user answered "y" or "yes".
 */
export function confirmPrompt(question: string): Promise<boolean> {
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
 * Generate a Windows batch script that waits for the parent process to exit,
 * then deletes the regtrace binary (and `.backup` if it exists), and finally
 * removes itself.
 *
 * @param target - Path to the regtrace binary.
 * @param pid - Parent process PID to wait for.
 * @returns The batch script content as a string.
 */
export function generateWindowsUninstallScript(
	target: string,
	pid: number,
): string {
	return `@echo off
set REGRACE_PID=${pid}
set REGRACE_BIN=${target}
:wait
%SystemRoot%\\System32\\tasklist.exe /FI "PID eq %REGRACE_PID%" 2>NUL | %SystemRoot%\\System32\\findstr.exe /I "regtrace" >NUL
if not errorlevel 1 (
    %SystemRoot%\\System32\\ping.exe 127.0.0.1 -n 2 -w 1000 >NUL
    goto wait
)
del "%REGRACE_BIN%" >NUL 2>&1
if exist "%REGRACE_BIN%.backup" del "%REGRACE_BIN%.backup" >NUL 2>&1
del "%~f0" >NUL 2>&1
`;
}

/**
 * Write a temp `.cmd` script and spawn it detached (Windows only).
 * Never returns — exits the process.
 */
function uninstallWindows(target: string): never {
	const tmpDir = process.env.TEMP ?? "C:\\Windows\\Temp";
	const scriptPath = `${tmpDir}\\regtrace-uninstall-${Date.now()}.cmd`;
	const script = generateWindowsUninstallScript(target, process.pid);
	writeFileSync(scriptPath, script, "utf-8");
	const child = spawn(scriptPath, [], { detached: true, stdio: "ignore" });
	child.unref();
	printInfo("regtrace will be removed after this process exits.");
	process.exit(0);
}
