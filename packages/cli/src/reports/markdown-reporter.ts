import type { ReportData, ReportGenerator } from "./types";

/**
 * Formats a pass/fail label with an emoji indicator.
 * @param passed - Whether the gate or test case passed
 * @param label - The text to display beside the emoji
 * @returns A string like `"✅ PASSED"` or `"❌ FAILED"`
 */
function statusBadge(passed: boolean, label: string): string {
	return passed ? `✅ ${label}` : `❌ ${label}`;
}

/**
 * Formats a decimal score as a percentage string with one decimal place.
 * @param value - A score between 0 and 1
 * @returns A percentage string like `"85.0%"`
 */
function pct(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

/**
 * Generates a human-readable Markdown report from run data, including summary tables,
 * per-metric scores, regression deltas, quality gate results, and per-test-case breakdowns.
 *
 * @param data - The run record and quality gate results to report on
 * @returns A complete Markdown document as a single string
 */
export const markdownReporter: ReportGenerator = {
	generate(data: ReportData): string {
		const r = data.run;
		const lines: string[] = [];

		lines.push(
			`# Regtrace Report: ${r.golden_set_name} v${r.golden_set_version}`,
		);
		lines.push("");
		lines.push(`- **Run ID:** \`${r.run_id}\``);
		lines.push(`- **Timestamp:** ${r.timestamp}`);
		lines.push(`- **Duration:** ${r.duration_ms}ms`);
		lines.push(`- **Trigger:** ${r.trigger}`);
		lines.push(`- **Judge:** ${r.judge_provider} / ${r.judge_model}`);
		lines.push("");

		lines.push("## Summary");
		lines.push("");
		lines.push(`| Metric | Value |`);
		lines.push(`|--------|-------|`);
		lines.push(`| Status | ${statusBadge(r.status === "passed", r.status)} |`);
		lines.push(`| Suite Score | ${pct(r.suite_score)} |`);
		const passed = r.test_case_results.filter((t) => t.overall_passed).length;
		const failed = r.test_case_results.filter((t) => !t.overall_passed).length;
		lines.push(`| Test Cases | ${passed} ✅ / ${failed} ❌ |`);
		lines.push("");

		lines.push("### Per-Metric Scores");
		lines.push("");
		lines.push("| Metric | Score | Pass Rate |");
		lines.push("|--------|-------|-----------|");
		for (const [name, s] of Object.entries(r.metric_summary)) {
			lines.push(`| ${name} | ${pct(s.score)} | ${pct(s.pass_rate)} |`);
		}
		lines.push("");

		if (r.regression.baseline_run_id) {
			lines.push("## Regression");
			lines.push("");
			lines.push(`- **Status:** ${r.regression.regression_status}`);
			lines.push(
				`- **Suite Delta:** ${(r.regression.suite_delta * 100).toFixed(1)}%`,
			);
			lines.push(`- **Baseline:** \`${r.regression.baseline_run_id}\``);
			if (Object.keys(r.regression.metric_deltas).length > 0) {
				lines.push("");
				lines.push("| Metric | Delta |");
				lines.push("|--------|-------|");
				for (const [name, delta] of Object.entries(
					r.regression.metric_deltas,
				)) {
					lines.push(`| ${name} | ${(delta * 100).toFixed(1)}% |`);
				}
			}
			lines.push("");
		}

		lines.push("## Quality Gates");
		lines.push("");
		lines.push(
			`**Overall:** ${statusBadge(data.qualityGates.passed, data.qualityGates.passed ? "PASSED" : "FAILED")}`,
		);
		lines.push("");
		lines.push("| Gate | Result |");
		lines.push("|------|--------|");
		const g = data.qualityGates.gates;
		if (g.suiteScore) {
			lines.push(
				`| Suite Score ≥ ${pct(g.suiteScore.minimum)} | ${statusBadge(g.suiteScore.passed, `${pct(g.suiteScore.actual)}`)} |`,
			);
		}
		if (g.metricScores) {
			const status = g.metricScores.passed
				? "All met"
				: `${g.metricScores.failures.length} below minimum`;
			lines.push(
				`| Per-Metric Minimums | ${statusBadge(g.metricScores.passed, status)} |`,
			);
		}
		if (g.maxFailedCases) {
			lines.push(
				`| Max Failed Cases ≤ ${g.maxFailedCases.maximum} | ${statusBadge(g.maxFailedCases.passed, `${g.maxFailedCases.actual} failed`)} |`,
			);
		}
		if (g.maxLowConfidence) {
			lines.push(
				`| Max Low-Confidence ≤ ${pct(g.maxLowConfidence.maximum)} | ${statusBadge(g.maxLowConfidence.passed, `${pct(g.maxLowConfidence.actual)}`)} |`,
			);
		}
		if (g.regression) {
			lines.push(
				`| Regression Gate | ${statusBadge(g.regression.passed, g.regression.status)} |`,
			);
		}
		if (g.nfr) {
			const nfr = g.nfr.gates;
			if (nfr.latency) {
				lines.push(
					`| Max Latency ≤ ${(nfr.latency.max_ms / 1000).toFixed(0)}s | ${statusBadge(nfr.latency.passed, `${(nfr.latency.actual_ms / 1000).toFixed(1)}s`)} |`,
				);
			}
			if (nfr.cost) {
				lines.push(
					`| Max Cost ≤ $${nfr.cost.max_usd.toFixed(2)} | ${statusBadge(nfr.cost.passed, `$${nfr.cost.actual_usd.toFixed(2)}`)} |`,
				);
			}
			if (nfr.coverage) {
				lines.push(
					`| Min Coverage ≥ ${pct(nfr.coverage.min)} | ${statusBadge(nfr.coverage.passed, `${pct(nfr.coverage.actual)}`)} |`,
				);
			}
		}
		lines.push("");

		lines.push("## Test Case Results");
		lines.push("");
		for (const tc of r.test_case_results) {
			const icon = tc.overall_passed
				? "✅"
				: tc.severity === "warn"
					? "⚠️"
					: "❌";
			lines.push(`### ${icon} ${tc.test_case_id}`);
			lines.push("");
			lines.push(`- **Input:** \`${truncate(tc.input, 80)}\``);
			lines.push(`- **Actual Output:** \`${truncate(tc.actual_output, 80)}\``);
			lines.push(`- **Severity:** ${tc.severity}`);
			lines.push("");
			lines.push("| Metric | Score | Threshold | Passed | Confidence |");
			lines.push("|--------|-------|-----------|--------|------------|");
			for (const [name, mr] of Object.entries(tc.metric_results)) {
				const passIcon = mr.passed ? "✅" : "❌";
				lines.push(
					`| ${name} | ${pct(mr.score)} | ${pct(mr.threshold)} | ${passIcon} | ${pct(mr.confidence)} |`,
				);
			}
			lines.push("");
			const detailsEntries = Object.entries(tc.metric_results).filter(
				([_, mr]) => mr.details && mr.details.length > 0,
			);
			if (detailsEntries.length > 0) {
				for (const [name, mr] of detailsEntries) {
					const failedDetails = mr.details?.filter((d) => !d.passed);
					if (!failedDetails || failedDetails.length === 0) continue;
					lines.push(
						`<details><summary>${failedDetails.length} failure(s) in ${name}</summary>`,
					);
					lines.push("");
					lines.push("| Check | Expected | Actual |");
					lines.push("|-------|----------|--------|");
					for (const d of failedDetails) {
						const exp = d.expected ? `\`${d.expected}\`` : "—";
						const act = d.actual ? `\`${d.actual}\`` : "—";
						lines.push(`| ${d.check} | ${exp} | ${act} |`);
					}
					lines.push("</details>");
					lines.push("");
				}
			}
		}

		lines.push("---");
		lines.push(`*Report generated by regtrace v${r.regtrace_version}*`);

		return lines.join("\n");
	},
};

/**
 * Truncates text to `maxLen` characters and escapes newlines for inline display.
 * @param text - The text to truncate
 * @param maxLen - Maximum character length before truncation
 * @returns The truncated, newline-escaped string
 */
function truncate(text: string, maxLen: number): string {
	if (text.length <= maxLen) return text.replace(/\n/g, "\\n");
	return `${text.slice(0, maxLen).replace(/\n/g, "\\n")}...`;
}
