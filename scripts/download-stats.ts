import { $ } from "bun";

const REPO = "decimozs/regtrace";
const BINARY_PATTERN = /^regtrace-/;
const EXCLUDE_PATTERN = /\.sha256$/;

interface Asset {
	name: string;
	download_count: number;
}

interface Release {
	tag_name: string;
	assets: Asset[];
}

async function main() {
	const raw = await $`gh api repos/${REPO}/releases`.text();
	const releases: Release[] = JSON.parse(raw);

	if (releases.length === 0) {
		console.log("No releases found.");
		return;
	}

	let grandTotal = 0;

	for (const release of releases) {
		const binaries = release.assets.filter(
			(a) => BINARY_PATTERN.test(a.name) && !EXCLUDE_PATTERN.test(a.name),
		);
		if (binaries.length === 0) continue;

		const versionTotal = binaries.reduce((sum, a) => sum + a.download_count, 0);
		grandTotal += versionTotal;

		console.log(`\n${release.tag_name}`);
		const namePad = Math.max(...binaries.map((a) => a.name.length));

		for (const asset of binaries) {
			const count = asset.download_count.toLocaleString();
			console.log(`  ${asset.name.padEnd(namePad)}  ${count.padStart(10)}`);
		}

		const sep = "─".repeat(namePad + 13);
		console.log(`  ${sep}`);
		console.log(
			`  ${"Total".padEnd(namePad)}  ${versionTotal.toLocaleString().padStart(10)}`,
		);
	}

	console.log(`\n${"═".repeat(18)}`);
	console.log(`All versions total: ${grandTotal.toLocaleString()}`);
}

await main();
