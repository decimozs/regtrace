import type { RunRecord } from "../schema/run-record.schema";

export interface NfrGateResult {
	latency?: { passed: boolean; actual_ms: number; max_ms: number };
	cost?: { passed: boolean; actual_usd: number; max_usd: number };
	coverage?: { passed: boolean; actual: number; min: number };
}

export interface NfrGatesConfig {
	max_latency_ms?: number;
	max_cost_usd?: number;
	min_coverage?: number;
}

export function checkNfrGates(
	record: RunRecord,
	config: NfrGatesConfig | undefined,
): NfrGateResult {
	const result: NfrGateResult = {};

	if (config?.max_latency_ms != null) {
		result.latency = {
			passed: record.duration_ms <= config.max_latency_ms,
			actual_ms: record.duration_ms,
			max_ms: config.max_latency_ms,
		};
	}

	if (config?.max_cost_usd != null) {
		let totalCostCents = 0;
		for (const tc of record.test_case_results) {
			for (const mr of Object.values(tc.metric_results)) {
				totalCostCents += mr.token_cost;
			}
		}
		const actualUsd = totalCostCents / 100;
		result.cost = {
			passed: actualUsd <= config.max_cost_usd,
			actual_usd: actualUsd,
			max_usd: config.max_cost_usd,
		};
	}

	if (config?.min_coverage != null) {
		const total = record.test_case_results.length;
		const passed = record.test_case_results.filter(
			(tc) => tc.overall_passed,
		).length;
		const coverage = total > 0 ? passed / total : 0;
		result.coverage = {
			passed: coverage >= config.min_coverage,
			actual: coverage,
			min: config.min_coverage,
		};
	}

	return result;
}

export function nfrAllPassed(result: NfrGateResult): boolean {
	for (const gate of Object.values(result)) {
		if (!gate.passed) return false;
	}
	return true;
}
