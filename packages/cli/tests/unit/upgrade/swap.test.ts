import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	chmodSync,
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { completeSwap } from "../../../src/upgrade/swap";

const tmpDir = mkdtempSync(join(tmpdir(), "regtrace-test-swap-"));

beforeAll(() => {
	process.env.REGRACE_UPGRADE_RETRIES = "5";
});

afterAll(() => {
	delete process.env.REGRACE_UPGRADE_RETRIES;
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("completeSwap", () => {
	it("renames source to target and cleans up backup", () => {
		const source = join(tmpDir, "new-binary");
		const target = join(tmpDir, "current-binary");
		const backup = join(tmpDir, "current-binary.backup");

		// Write executable scripts
		writeFileSync(target, "#!/bin/sh\necho 1.0.0\n");
		chmodSync(target, 0o755);
		writeFileSync(source, "#!/bin/sh\necho 2.0.0\n");
		chmodSync(source, 0o755);
		writeFileSync(backup, "#!/bin/sh\necho 1.0.0\n");
		chmodSync(backup, 0o755);

		const result = completeSwap(source, target, backup);

		expect(result).toBe(true);
		expect(existsSync(source)).toBe(false);
		expect(readFileSync(target, "utf-8")).toContain("2.0.0");
		expect(existsSync(backup)).toBe(false);
	});

	it("restores backup when --version check fails", () => {
		const source = join(tmpDir, "bad-new-binary");
		const target = join(tmpDir, "current-binary-2");
		const backup = join(tmpDir, "current-binary-2.backup");

		writeFileSync(target, "#!/bin/sh\necho 1.0.0\n");
		chmodSync(target, 0o755);
		// New binary exits non-zero (simulates --version failure)
		writeFileSync(source, "#!/bin/sh\nexit 1\n");
		chmodSync(source, 0o755);
		writeFileSync(backup, "#!/bin/sh\necho 1.0.0\n");
		chmodSync(backup, 0o755);

		const result = completeSwap(source, target, backup);

		expect(result).toBe(false);
		expect(readFileSync(target, "utf-8")).toContain("1.0.0");
		expect(existsSync(backup)).toBe(false);
	});

	it("returns false when source doesnt exist and backup restore works", () => {
		const source = join(tmpDir, "nonexistent-source");
		const target = join(tmpDir, "current-binary-3");
		const backup = join(tmpDir, "current-binary-3.backup");

		writeFileSync(target, "original");
		writeFileSync(backup, "backup-content");

		const result = completeSwap(source, target, backup);

		expect(result).toBe(false);
		// After retry loop fails to rename source, it restores from backup
		expect(readFileSync(target, "utf-8")).toBe("backup-content");
		expect(existsSync(backup)).toBe(false);
	});

	it("returns false when both rename and backup restore fail", () => {
		const source = join(tmpDir, "nonexistent-source");
		const target = join(tmpDir, "current-binary-4");
		const backup = join(tmpDir, "nonexistent-backup");

		writeFileSync(target, "original");

		const result = completeSwap(source, target, backup);

		expect(result).toBe(false);
	});
});
