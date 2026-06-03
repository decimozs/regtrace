import { jsonReporter } from "./json-reporter";
import { markdownReporter } from "./markdown-reporter";
import type { ReportData, ReportGenerator } from "./types";

/** Registry of available report generators keyed by format name. */
const GENERATORS: Record<string, ReportGenerator> = {
	json: jsonReporter,
	markdown: markdownReporter,
};

/**
 * Retrieves a report generator by format name.
 * Falls back to the JSON reporter when the format is unrecognised.
 * @param format - The report format identifier (`"json"` or `"markdown"`)
 * @returns The matching {@link ReportGenerator}, or the JSON reporter as a default
 */
export function getReporter(format: string): ReportGenerator {
	const gen = GENERATORS[format];
	if (gen) return gen;
	return jsonReporter;
}

/**
 * Generates a report string in the specified format from run data.
 * @param data - The run record and quality gate results to report on
 * @param format - The report format (`"json"` or `"markdown"`)
 * @returns The formatted report string
 */
export function generateReport(data: ReportData, format: string): string {
	const reporter = getReporter(format);
	return reporter.generate(data);
}
