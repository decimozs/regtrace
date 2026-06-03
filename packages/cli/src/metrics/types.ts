import type { Config } from "../schema/config.schema";
import type { TestCase } from "../schema/golden-set.schema";
import type { MetricResult } from "../schema/run-record.schema";

/** Context needed by the regression evaluator to compare current results against a historical baseline. */
export interface RegressionContext {
	baseline: {
		run_id: string;
		golden_set_version: string;
		suite_score: number;
		metric_summary: Record<string, { score: number; pass_rate: number }>;
	} | null;
	currentGoldenSetVersion: string;
}

/** The input payload passed to every metric evaluator's `evaluate` method. */
export interface EvaluateInput {
	testCase: TestCase;
	actualOutput: string;
	expectedOutput: string;
	config: Config;
	metricConfig: Record<string, unknown>;
	threshold: number;
	regressionContext?: RegressionContext;
}

/** Contract that all metric evaluators must implement. Each evaluator has a name and an async `evaluate` method. */
export interface MetricEvaluator {
	metricName: string;
	evaluate(input: EvaluateInput): Promise<MetricResult>;
}
