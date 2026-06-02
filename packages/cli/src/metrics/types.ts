import type { Config } from "../schema/config.schema";
import type { TestCase } from "../schema/golden-set.schema";
import type { MetricResult } from "../schema/run-record.schema";

export interface EvaluateInput {
	testCase: TestCase;
	actualOutput: string;
	expectedOutput: string;
	config: Config;
	metricConfig: Record<string, unknown>;
	threshold: number;
}

export interface MetricEvaluator {
	metricName: string;
	evaluate(input: EvaluateInput): Promise<MetricResult>;
}
