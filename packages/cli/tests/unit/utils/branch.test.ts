import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	detectBranch,
	isStaleBaseline,
	sanitizeBranch,
} from "../../../src/utils/branch";

describe("detectBranch", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		delete process.env.REGTRACE_BRANCH;
		delete process.env.GITHUB_HEAD_REF;
		delete process.env.GITHUB_REF_NAME;
		delete process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME;
		delete process.env.CI_COMMIT_BRANCH;
		delete process.env.CIRCLE_BRANCH;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("uses REGTRACE_BRANCH env var first", () => {
		process.env.REGTRACE_BRANCH = "feature-x";
		expect(detectBranch()).toBe("feature-x");
	});

	it("uses GITHUB_HEAD_REF for PRs", () => {
		process.env.GITHUB_HEAD_REF = "pr-feature";
		expect(detectBranch()).toBe("pr-feature");
	});

	it("uses GITHUB_REF_NAME as fallback for pushes", () => {
		process.env.GITHUB_REF_NAME = "main";
		expect(detectBranch()).toBe("main");
	});

	it("uses GitLab CI env vars", () => {
		process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME = "gitlab-feature";
		expect(detectBranch()).toBe("gitlab-feature");
	});

	it("uses GitLab CI_COMMIT_BRANCH", () => {
		process.env.CI_COMMIT_BRANCH = "gitlab-main";
		expect(detectBranch()).toBe("gitlab-main");
	});

	it("uses CircleCI env var", () => {
		process.env.CIRCLE_BRANCH = "circle-feature";
		expect(detectBranch()).toBe("circle-feature");
	});

	it("falls back to git rev-parse", () => {
		const branch = detectBranch();
		expect(typeof branch).toBe("string");
		expect(branch.length).toBeGreaterThan(0);
	});
});

describe("sanitizeBranch", () => {
	it("replaces slashes with dashes", () => {
		expect(sanitizeBranch("feature/x")).toBe("feature-x");
	});

	it("replaces non-alphanumeric chars with underscores", () => {
		expect(sanitizeBranch("feat@#$x")).toBe("feat___x");
	});

	it("preserves alphanumeric and dash-underscore", () => {
		expect(sanitizeBranch("main")).toBe("main");
		expect(sanitizeBranch("feature-x_1")).toBe("feature-x_1");
	});
});

describe("isStaleBaseline", () => {
	it("returns true for timestamps older than max age", () => {
		const oldDate = new Date(
			Date.now() - 8 * 24 * 60 * 60 * 1000,
		).toISOString();
		expect(isStaleBaseline(oldDate, 7)).toBe(true);
	});

	it("returns false for recent timestamps", () => {
		const recent = new Date().toISOString();
		expect(isStaleBaseline(recent, 7)).toBe(false);
	});

	it("uses default max age of 7 days", () => {
		const oldDate = new Date(
			Date.now() - 8 * 24 * 60 * 60 * 1000,
		).toISOString();
		expect(isStaleBaseline(oldDate)).toBe(true);
	});
});
