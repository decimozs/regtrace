import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { $ } from "bun";

const pkgPath = resolve("packages/cli/package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const version: string = pkg.version ?? "0.0.0";

const outfile = process.argv[2] ?? "./regtrace";
const defineArg = `__VERSION__="${version}"`;

const result =
	await $`bun build --compile --minify ./packages/cli/src/index.ts --outfile ${outfile} --define ${defineArg}`;

if (result.exitCode === 0) {
	const size = Bun.file(outfile).size;
	const sizeStr =
		size > 1024 * 1024
			? `${(size / 1024 / 1024).toFixed(1)} MB`
			: `${(size / 1024).toFixed(1)} KB`;
	console.log(`✓ regtrace v${version} built (${sizeStr})`);
} else {
	console.error("Build failed");
	process.exit(1);
}
