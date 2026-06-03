export interface PlatformInfo {
	os: string;
	arch: string;
}

/** Known regtrace release assets. */
const ASSET_MAP: Record<string, string | undefined> = {
	"linux-x64": "regtrace-linux-x64",
	"darwin-arm64": "regtrace-darwin-arm64",
	"win32-x64": "regtrace-windows-x64.exe",
};

/**
 * Detect the current platform and map it to the matching release asset name.
 * @returns Platform info and asset name.
 * @throws If the current platform/arch combo has no published release.
 */
export function detectPlatform(): { info: PlatformInfo; asset: string } {
	const os = process.platform;
	const arch = process.arch;
	const key = `${os}-${arch}`;
	const asset = ASSET_MAP[key];
	if (!asset) {
		throw new Error(
			`No regtrace release binary for ${os}-${arch}. Supported: linux-x64, darwin-arm64, windows-x64.`,
		);
	}
	return { info: { os, arch }, asset };
}
