import type { Config } from "../schema/config.schema";
import type {
	MetricResult,
	RegressionBlock,
	TestCaseResult,
} from "../schema/run-record.schema";
import { factualityEvaluator } from "./evaluators/factuality.evaluator";
import { formatEvaluator } from "./evaluators/format.evaluator";
import {
	type BaselineRecord,
	buildRegressionBlock,
	regressionEvaluator,
} from "./evaluators/regression.evaluator";
import { toneEvaluator } from "./evaluators/tone.evaluator";
import type { EvaluateInput, MetricEvaluator } from "./types";

const EVALUATOR_MAP: Record<string, MetricEvaluator> = {
	factuality: factualityEvaluator,
	format: formatEvaluator,
	tone: toneEvaluator,
	regression: regressionEvaluator,
};

function getThresholdForMetric(
	testCase: EvaluateInput["testCase"],
	config: Config,
	metricName: string,
): number {
	if (testCase.thresholds) {
		const tcThreshold = (testCase.thresholds as Record<string, number | null>)[
			metricName
		];
		if (tcThreshold != null) return tcThreshold;
	}
	return config.metrics.default_threshold;
}

function determineSeverity(
	overallPassed: boolean,
	metricResults: Record<string, MetricResult>,
): "pass" | "warn" | "fail" {
	if (overallPassed) return "pass";

	const failures = Object.values(metricResults).filter((r) => !r.passed);
	const hasCritical = failures.some((r) => r.score < 0.3);
	if (hasCritical) return "fail";

	return "warn";
}

async function evaluateMetric(
	evaluator: MetricEvaluator,
	input: EvaluateInput,
): Promise<MetricResult> {
	return evaluator.evaluate(input);
}

async function concurrentMap<T, R>(
	items: T[],
	fn: (item: T, index: number) => Promise<R>,
	concurrency: number,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let next = 0;

	async function worker(): Promise<void> {
		while (next < items.length) {
			const i = next++;
			const item = items[i] as T;
			results[i] = await fn(item, i);
		}
	}

	const pool = Array.from(
		{ length: Math.min(concurrency, items.length) },
		worker,
	);
	await Promise.all(pool);
	return results;
}

export interface EvaluateTestCaseParams {
	testCase: EvaluateInput["testCase"];
	actualOutput: string;
	expectedOutput: string;
	config: Config;
	baselineRecord: BaselineRecord | null;
	currentGoldenSetVersion: string;
}

export interface EvaluateTestCaseResult {
	testCaseResult: TestCaseResult;
	aggregateScore: number;
}

export async function evaluateTestCase(
	params: EvaluateTestCaseParams,
): Promise<EvaluateTestCaseResult> {
	const {
		testCase,
		actualOutput,
		expectedOutput,
		config,
		baselineRecord,
		currentGoldenSetVersion,
	} = params;

	const metricResults: Record<string, MetricResult> = {};
	let aggregateScore = 0;
	let metricCount = 0;

	const metricEntries = await Promise.all(
		testCase.metrics.map(async (metricName) => {
			const evaluator = EVALUATOR_MAP[metricName];
			if (!evaluator) {
				metricCount++;
				return {
					metricName,
					result: {
						metric_name: metricName,
						score: 0,
						threshold: getThresholdForMetric(testCase, config, metricName),
						passed: false,
						confidence: 1,
						evaluation_type: "deterministic" as const,
						token_cost: 0,
						explanation: `Unknown metric "${metricName}". Valid: factuality, format, tone, regression`,
					},
				};
			}

			const metricConfig =
				((config.metrics as Record<string, unknown>)[metricName] as Record<
					string,
					unknown
				>) ?? {};

			const threshold = getThresholdForMetric(testCase, config, metricName);

			const evaluateInput: EvaluateInput = {
				testCase,
				actualOutput,
				expectedOutput,
				config,
				metricConfig,
				threshold,
			};

			if (metricName === "regression") {
				evaluateInput.metricConfig._regressionContext = {
					baseline: baselineRecord,
					currentGoldenSetVersion,
				};
			}

			const result = await evaluateMetric(evaluator, evaluateInput);
			metricCount++;
			return { metricName, result };
		}),
	);

	for (const { metricName, result } of metricEntries) {
		metricResults[metricName] = result;
		aggregateScore += result.score;
	}

	if (metricCount === 0) {
		metricCount = 1;
	}

	const avgScore = metricCount > 0 ? aggregateScore / metricCount : 0;
	const overallPassed = Object.values(metricResults).every((r) => r.passed);
	const severity = determineSeverity(overallPassed, metricResults);

	const testCaseResult: TestCaseResult = {
		test_case_id: testCase.id,
		input: testCase.input,
		actual_output: actualOutput,
		overall_passed: overallPassed,
		severity,
		metric_results: metricResults,
	};

	return { testCaseResult, aggregateScore: avgScore };
}

export interface EvaluateSuiteParams {
	config: Config;
	testCases: EvaluateTestCaseParams[];
}

export interface EvaluateSuiteResult {
	suiteScore: number;
	metricSummary: Record<string, { score: number; pass_rate: number }>;
	testCaseResults: TestCaseResult[];
	regression: RegressionBlock;
}

export async function evaluateSuite(
	params: EvaluateSuiteParams,
): Promise<EvaluateSuiteResult> {
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const concurrency = params.config.run.concurrency;
	const results: EvaluateTestCaseResult[] = [];

	let batchCount = 0;
	for (let i = 0; i < params.testCases.length; i += concurrency) {
		const batch = params.testCases.slice(i, i + concurrency);
		if (batchCount > 0) await sleep(20000);
		const batchResults = await concurrentMap(
			batch,
			(tc) => evaluateTestCase(tc),
			concurrency,
		);
		results.push(...batchResults);
		batchCount++;
	}

	const testCaseResults = results.map((r) => r.testCaseResult);

	const totalWeight = params.testCases.reduce(
		(sum, tc) => sum + (tc.testCase.weight ?? 1),
		0,
	);

	let weightedSum = 0;
	for (let i = 0; i < results.length; i++) {
		const tc = params.testCases[i];
		const r = results[i];
		if (tc && r) {
			weightedSum += r.aggregateScore * (tc.testCase.weight ?? 1);
		}
	}
	const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
	const suiteScore = Math.max(0, Math.min(1, weightedScore));

	const allMetricNames = new Set<string>();
	for (const r of results) {
		for (const metricName of Object.keys(r.testCaseResult.metric_results)) {
			allMetricNames.add(metricName);
		}
	}

	const metricSummary: Record<string, { score: number; pass_rate: number }> =
		{};
	for (const metricName of allMetricNames) {
		const scores: number[] = [];
		let passed = 0;
		for (const r of results) {
			const metricResult = r.testCaseResult.metric_results[metricName];
			if (metricResult) {
				scores.push(metricResult.score);
				if (metricResult.passed) passed++;
			}
		}
		metricSummary[metricName] = {
			score:
				scores.length > 0
					? scores.reduce((a, b) => a + b, 0) / scores.length
					: 0,
			pass_rate: scores.length > 0 ? passed / scores.length : 0,
		};
	}

	const allMetricResults: Record<string, MetricResult> = {};
	for (const r of results) {
		Object.assign(allMetricResults, r.testCaseResult.metric_results);
	}

	const regressionConfig = params.config.metrics.regression;
	const testCaseIds = params.testCases.map((tc) => tc.testCase.id);
	const baselineRecord = params.testCases[0]?.baselineRecord ?? null;

	const regression = buildRegressionBlock(
		baselineRecord,
		params.testCases[0]?.currentGoldenSetVersion ?? "",
		suiteScore,
		allMetricResults,
		testCaseIds,
		{
			tolerance: regressionConfig.tolerance,
			criticalThreshold: regressionConfig.critical_threshold,
			excludeNewTestCases: regressionConfig.exclude_new_test_cases,
		},
	);

	return {
		suiteScore,
		metricSummary: metricSummary as Record<
			string,
			{ score: number; pass_rate: number }
		>,
		testCaseResults,
		regression,
	};
}
