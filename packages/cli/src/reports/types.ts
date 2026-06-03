import type { Config } from "../schema/config.schema";
import type { RunRecord } from "../schema/run-record.schema";

/** The result of evaluating all configured quality gates against a run record. */
export interface QualityGateResult {
	/** Whether every enabled gate passed. */
	passed: boolean;
	/** Per-gate details. Each key is present only when the corresponding gate is configured. */
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

/** The data bundle passed to report generators. */
export interface ReportData {
	/** The completed run record with all metric results. */
	run: RunRecord;
	/** Quality gate evaluation results. */
	qualityGates: QualityGateResult;
	/** The run configuration. */
	config: Config;
}

/** Contract for report generators that produce a formatted string from run data. */
export interface ReportGenerator {
	/**
	 * Produces a formatted report from the given run data.
	 * @param data - The run record, quality gate results, and configuration
	 * @returns The formatted report string
	 */
	generate(data: ReportData): string;
}
