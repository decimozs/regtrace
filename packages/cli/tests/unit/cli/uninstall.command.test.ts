import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import { chmodSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	confirmPrompt,
	generateWindowsUninstallScript,
	type UninstallOptions,
	uninstallCommand,
} from "../../../src/cli/uninstall.command";

const tmpBase = ".test-tmp/uninstall-test";

function tmpPath(name: string): string {
	return resolve(tmpBase, name);
}

let origExit: typeof process.exit;

beforeAll(() => {
	origExit = process.exit;
});

beforeEach(() => {
	process.exit = ((code?: number) => {
		throw new Error(`process.exit(${code})`);
	}) as typeof process.exit;
});

afterAll(() => {
	process.exit = origExit;
	try {
		rmSync(tmpBase, { recursive: true, force: true });
	} catch {
		// ignore
	}
});

async function runCommand(
	options: UninstallOptions,
	target?: string,
): Promise<{ code: number | undefined }> {
	try {
		await uninstallCommand(options, target);
		return { code: undefined };
	} catch (err) {
		const msg = (err as Error).message;
		if (msg.startsWith("process.exit(")) {
			const match = msg.match(/process\.exit\((\d+)\)/);
			return { code: match ? Number(match[1]) : 1 };
		}
		throw err;
	}
}

describe("uninstallCommand", () => {
	it("exits when parent directory lacks write permission", async () => {
		mkdirSync(tmpBase, { recursive: true });
		const dir = tmpPath("readonly-dir");
		mkdirSync(dir);
		const target = `${dir}/binary`;
		writeFileSync(target, "dummy");
		chmodSync(dir, 0o555);

		const result = await runCommand({ yes: true }, target);
		// Root can bypass permission checks
		if (process.getuid?.() !== 0) {
			expect(result.code).toBe(1);
		}
	});

	it("deletes the binary on success", async () => {
		mkdirSync(tmpBase, { recursive: true });
		const target = tmpPath("delete-me");
		writeFileSync(target, "dummy");

		await runCommand({ yes: true }, target);
		expect(() => statSync(target)).toThrow();
	});

	it("handles binary already gone (ENOENT)", async () => {
		mkdirSync(tmpBase, { recursive: true });
		const target = tmpPath("already-gone");

		const result = await runCommand({ yes: true }, target);
		expect(result.code).toBeUndefined();
	});

	it("resolves confirmPrompt as a Promise<boolean>", () => {
		const p = confirmPrompt("test?");
		expect(p).toBeInstanceOf(Promise);
	});
});

describe("generateWindowsUninstallScript", () => {
	it("includes correct PID, target, and cleanup commands", () => {
		const script = generateWindowsUninstallScript("C:\\regtrace.exe", 12345);
		expect(script).toContain("set REGRACE_PID=12345");
		expect(script).toContain("set REGRACE_BIN=C:\\regtrace.exe");
		expect(script).toContain("tasklist.exe");
		expect(script).toContain('del "%REGRACE_BIN%"');
		expect(script).toContain('del "%REGRACE_BIN%.backup"');
		expect(script).toContain('del "%~f0"');
	});
});
