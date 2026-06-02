import { jsonReporter } from "./json-reporter";
import { markdownReporter } from "./markdown-reporter";
import type { ReportData, ReportGenerator } from "./types";

const GENERATORS: Record<string, ReportGenerator> = {
	json: jsonReporter,
	markdown: markdownReporter,
};

export function getReporter(format: string): ReportGenerator {
	const gen = GENERATORS[format];
	if (gen) return gen;
	return jsonReporter;
}

export function generateReport(data: ReportData, format: string): string {
	const reporter = getReporter(format);
	return reporter.generate(data);
}
