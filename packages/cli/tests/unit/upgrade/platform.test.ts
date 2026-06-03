import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { detectPlatform } from "../../../src/upgrade/platform";

describe("detectPlatform", () => {
	const originalPlatform = process.platform;
	const originalArch = process.arch;

	beforeEach(() => {
		// HACK: override readonly process properties via Object.defineProperty.
	});

	afterEach(() => {
		Object.defineProperty(process, "platform", {
			value: originalPlatform,
			configurable: true,
		});
		Object.defineProperty(process, "arch", {
			value: originalArch,
			configurable: true,
		});
	});

	it("detects linux-x64", () => {
		Object.defineProperty(process, "platform", { value: "linux" });
		Object.defineProperty(process, "arch", { value: "x64" });
		const result = detectPlatform();
		expect(result.asset).toBe("regtrace-linux-x64");
		expect(result.info.os).toBe("linux");
		expect(result.info.arch).toBe("x64");
	});

	it("detects darwin-arm64", () => {
		Object.defineProperty(process, "platform", { value: "darwin" });
		Object.defineProperty(process, "arch", { value: "arm64" });
		const result = detectPlatform();
		expect(result.asset).toBe("regtrace-darwin-arm64");
	});

	it("detects win32-x64", () => {
		Object.defineProperty(process, "platform", { value: "win32" });
		Object.defineProperty(process, "arch", { value: "x64" });
		const result = detectPlatform();
		expect(result.asset).toBe("regtrace-windows-x64.exe");
	});

	it("throws for unsupported platform (darwin-x64)", () => {
		Object.defineProperty(process, "platform", { value: "darwin" });
		Object.defineProperty(process, "arch", { value: "x64" });
		expect(() => detectPlatform()).toThrow(/No regtrace release/);
	});

	it("throws for unsupported architecture (linux-arm64)", () => {
		Object.defineProperty(process, "platform", { value: "linux" });
		Object.defineProperty(process, "arch", { value: "arm64" });
		expect(() => detectPlatform()).toThrow(/No regtrace release/);
	});
});
