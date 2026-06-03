export interface ParsedVersion {
	major: number;
	minor: number;
	patch: number;
	prerelease: string | null;
}

/** Result of comparing two versions. */
export type VersionCompare = -1 | 0 | 1;

/**
 * Normalize a GitHub release tag (e.g. "v1.0.0" or "v1.0.0-beta.1") to a
 * {@link ParsedVersion}. Strips leading "v" if present.
 * @returns Parsed components, or `null` if the string is not valid semver.
 */
export function parseVersion(raw: string): ParsedVersion | null {
	const cleaned = raw.replace(/^v/, "");
	const match = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(cleaned);
	if (!match) return null;
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
		prerelease: match[4] ?? null,
	};
}

/**
 * Compare two parsed versions.
 * @returns `-1` if a < b, `0` if equal, `1` if a > b.
 * Prerelease versions are less than their release counterparts
 * (e.g., 1.0.0 < 1.0.0-beta.1).
 */
export function compareVersions(
	a: ParsedVersion,
	b: ParsedVersion,
): VersionCompare {
	if (a.major !== b.major) return a.major > b.major ? 1 : -1;
	if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
	if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;

	const aPre = a.prerelease !== null;
	const bPre = b.prerelease !== null;
	if (aPre !== bPre) return aPre ? -1 : 1;
	return 0;
}

/**
 * Check whether a parsed version includes a prerelease suffix.
 */
export function isPrerelease(v: ParsedVersion): boolean {
	return v.prerelease !== null;
}
