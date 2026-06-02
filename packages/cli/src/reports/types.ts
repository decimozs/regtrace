import type { Config } from "../schema/config.schema";
import type { RunRecord } from "../schema/run-record.schema";

export interface QualityGateResult {
	passed: boolean;
	gates: {
		suiteScore?: { passed: boolean; actual: number; minimum: number };
		metricScores?: {
			passed: boolean;
			failures: { metric: string; actual: number; minimum: number }[];
		};
		maxFailedCases?: { passed: boolean; actual: number; maximum: number };
		maxLowConfidence?: { passed: boolean; actual: number; maximum: number };
		regression?: { passed: boolean; status: string };
	};
}

export interface ReportData {
	run: RunRecord;
	qualityGates: QualityGateResult;
	config: Config;
}

export interface ReportGenerator {
	generate(data: ReportData): string;
}
