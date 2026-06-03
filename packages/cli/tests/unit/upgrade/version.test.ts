import { describe, expect, it } from "bun:test";
import {
	compareVersions,
	isPrerelease,
	parseVersion,
} from "../../../src/upgrade/version";

function mustParse(raw: string) {
	const v = parseVersion(raw);
	if (!v) throw new Error(`Failed to parse version: ${raw}`);
	return v;
}

describe("parseVersion", () => {
	it("parses full version with v prefix", () => {
		const v = mustParse("v1.2.3");
		expect(v.major).toBe(1);
		expect(v.minor).toBe(2);
		expect(v.patch).toBe(3);
		expect(v.prerelease).toBeNull();
	});

	it("parses version without v prefix", () => {
		const v = mustParse("1.0.0");
		expect(v.major).toBe(1);
		expect(v.prerelease).toBeNull();
	});

	it("parses prerelease version", () => {
		const v = mustParse("v1.0.0-beta.1");
		expect(v.prerelease).toBe("beta.1");
	});

	it("returns null for invalid string", () => {
		expect(parseVersion("abc")).toBeNull();
		expect(parseVersion("1.2")).toBeNull();
		expect(parseVersion("")).toBeNull();
	});
});

describe("compareVersions", () => {
	it("returns 0 for identical versions", () => {
		const a = mustParse("v1.0.0");
		const b = mustParse("1.0.0");
		expect(compareVersions(a, b)).toBe(0);
	});

	it("returns -1 when a < b (patch)", () => {
		const a = mustParse("v1.0.0");
		const b = mustParse("v1.0.1");
		expect(compareVersions(a, b)).toBe(-1);
	});

	it("returns 1 when a > b (minor)", () => {
		const a = mustParse("v1.2.0");
		const b = mustParse("v1.1.9");
		expect(compareVersions(a, b)).toBe(1);
	});

	it("returns 1 when a > b (major)", () => {
		const a = mustParse("v2.0.0");
		const b = mustParse("v1.99.99");
		expect(compareVersions(a, b)).toBe(1);
	});

	it("prerelease is less than release", () => {
		const a = mustParse("v1.0.0");
		const b = mustParse("v1.0.0-rc.1");
		expect(compareVersions(a, b)).toBe(1);
		expect(compareVersions(b, a)).toBe(-1);
	});

	it("compares equal prereleases", () => {
		const a = mustParse("v1.0.0-beta");
		const b = mustParse("v1.0.0-beta");
		expect(compareVersions(a, b)).toBe(0);
	});
});

describe("isPrerelease", () => {
	it("returns true for prerelease", () => {
		const v = mustParse("v1.0.0-alpha");
		expect(isPrerelease(v)).toBe(true);
	});

	it("returns false for stable", () => {
		const v = mustParse("v1.0.0");
		expect(isPrerelease(v)).toBe(false);
	});
});
