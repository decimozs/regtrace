import { execSync } from "node:child_process";

export function detectBranch(): string {
	const explicit = process.env.REGTRACE_BRANCH;
	if (explicit) return explicit;

	const ghHead = process.env.GITHUB_HEAD_REF;
	if (ghHead) return ghHead;
	const ghRef = process.env.GITHUB_REF_NAME;
	if (ghRef) return ghRef;

	const glBranch =
		process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME ??
		process.env.CI_COMMIT_BRANCH;
	if (glBranch) return glBranch;

	const circleBranch = process.env.CIRCLE_BRANCH;
	if (circleBranch) return circleBranch;

	try {
		return execSync("git rev-parse --abbrev-ref HEAD", {
			encoding: "utf-8",
			timeout: 5000,
		}).trim();
	} catch {
		return "default";
	}
}

export function sanitizeBranch(branch: string): string {
	return branch.replace(/\//g, "-").replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function isStaleBaseline(
	recordTimestamp: string,
	maxAgeDays = 7,
): boolean {
	const ageMs = Date.now() - new Date(recordTimestamp).getTime();
	const maxMs = maxAgeDays * 24 * 60 * 60 * 1000;
	return ageMs > maxMs;
}
