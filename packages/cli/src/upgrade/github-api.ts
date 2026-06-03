import { compareVersions, parseVersion } from "./version";

const REPO = "decimozs/regtrace";
const API_BASE = `https://api.github.com/repos/${REPO}/releases`;

export interface ReleaseInfo {
	tagName: string;
	version: {
		major: number;
		minor: number;
		patch: number;
		prerelease: string | null;
	};
	assetUrl: string;
	assetName: string;
	sha256Url: string;
}

export type ApiError =
	| { kind: "rate_limit"; retryAfter?: number }
	| { kind: "no_releases" }
	| { kind: "asset_not_found"; assetName: string }
	| { kind: "network"; message: string };

interface GitHubAsset {
	name: string;
	browser_download_url: string;
}

interface GitHubRelease {
	tag_name: string;
	prerelease: boolean;
	draft: boolean;
	assets: GitHubAsset[];
}

/**
 * Fetch the latest release from GitHub.
 * @param assetName - The expected release asset name for this platform.
 * @param options.prerelease - When `true`, include prerelease versions.
 * @returns Release info or an error descriptor.
 */
export async function getLatestRelease(
	assetName: string,
	options?: { prerelease?: boolean },
): Promise<{ release: ReleaseInfo } | { error: ApiError }> {
	const url = options?.prerelease
		? `${API_BASE}?per_page=20`
		: `${API_BASE}/latest`;

	try {
		const res = await fetch(url, {
			headers: { Accept: "application/vnd.github+json" },
		});

		if (res.status === 403 || res.status === 429) {
			const retryAfter = res.headers.get("retry-after");
			return {
				error: {
					kind: "rate_limit",
					retryAfter: retryAfter ? Number(retryAfter) : undefined,
				},
			};
		}

		if (!res.ok) {
			return {
				error: {
					kind: "network",
					message: `GitHub API returned ${res.status}: ${res.statusText}`,
				},
			};
		}

		if (options?.prerelease) {
			const releases = (await res.json()) as GitHubRelease[];
			const latest = pickLatestRelease(releases);
			if (!latest) {
				return { error: { kind: "no_releases" } };
			}
			return { release: toReleaseInfo(latest, assetName) };
		}

		const release = (await res.json()) as GitHubRelease;
		return { release: toReleaseInfo(release, assetName) };
	} catch (err) {
		return {
			error: {
				kind: "network",
				message: err instanceof Error ? err.message : String(err),
			},
		};
	}
}

function pickLatestRelease(releases: GitHubRelease[]): GitHubRelease | null {
	let best: GitHubRelease | null = null;
	let bestParsed: ReturnType<typeof parseVersion> = null;

	for (const r of releases) {
		if (r.draft) continue;
		const parsed = parseVersion(r.tag_name);
		if (!parsed) continue;

		if (!best) {
			best = r;
			bestParsed = parsed;
			continue;
		}

		if (bestParsed && compareVersions(parsed, bestParsed) > 0) {
			best = r;
			bestParsed = parsed;
		}
	}

	return best;
}

function toReleaseInfo(release: GitHubRelease, assetName: string): ReleaseInfo {
	const parsed = parseVersion(release.tag_name);
	const tagName = release.tag_name;
	const version = parsed ?? {
		major: 0,
		minor: 0,
		patch: 0,
		prerelease: null,
	};

	const asset = release.assets.find((a) => a.name === assetName);
	const assetUrl = asset?.browser_download_url ?? "";
	const sha256Asset = release.assets.find(
		(a) => a.name === `${assetName}.sha256`,
	);
	const sha256Url = sha256Asset?.browser_download_url ?? "";

	return { tagName, version, assetUrl, assetName, sha256Url };
}
