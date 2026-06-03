import type { JudgeMessage } from "./types";

/**
 * Builds the system and user messages for a factuality evaluation prompt.
 * @param input - The original user prompt or query.
 * @param expectedOutput - The reference output to compare against.
 * @param actualOutput - The LLM-generated output being evaluated.
 * @param claimDepth - "shallow" compares main claims; "deep" exhaustively extracts every factual claim.
 * @returns A two-element message array (system + user) for the judge model.
 */
export function buildFactualityPrompt(
	input: string,
	expectedOutput: string,
	actualOutput: string,
	claimDepth: "shallow" | "deep",
): JudgeMessage[] {
	const depthInstructions =
		claimDepth === "deep"
			? "Extract every factual claim from the actual output. For each claim, determine if it is supported by the expected output. Consider: explicit claims, implied claims, numerical accuracy, named entities, and relationships between concepts."
			: "Compare the main factual claims in the actual output against the expected output. Focus on: key facts, named entities, numerical data, and overall accuracy of statements.";

	return [
		{
			role: "system",
			content: `You are a precise factuality evaluator. Your task is to assess how factually accurate an LLM output is compared to the expected output.

${depthInstructions}

Important guidelines:
- Do not award higher scores simply because the response is longer or more detailed. Focus on factual accuracy alone.
- The source model of the actual output is unknown to you. Evaluate based on content, not perceived origin or style.
- If you are uncertain about any claim, report low confidence rather than guessing.
- Be consistent across evaluations — apply the same standards regardless of response length or complexity.

Return your evaluation as valid JSON with these exact fields:
{
  "score": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "explanation": "<brief reason for the score>",
  "matching_claims": <count of matching claims>,
  "contradicting_claims": <count of contradicting claims>,
  "hallucinated_claims": <count of hallucinated claims>
}

Score guidelines:
- 1.0: Output perfectly matches expected facts
- 0.7-0.9: Minor differences, core facts correct
- 0.4-0.6: Some facts correct, some incorrect or missing
- 0.1-0.3: Most facts incorrect
- 0.0: Completely fabricated or contradictory`,
		},
		{
			role: "user",
			content: `Input: ${input}

Expected output: ${expectedOutput}

Actual output: ${actualOutput}

Evaluate the factuality of the actual output compared to the expected output. Return JSON only.`,
		},
	];
}

/**
 * Builds the system and user messages for a tone evaluation prompt.
 * @param input - The original user prompt or query.
 * @param expectedOutput - The reference output whose tone to match.
 * @param actualOutput - The LLM-generated output being evaluated.
 * @param toneProfile - Optional natural-language tone description overriding the expected output as reference.
 * @returns A two-element message array (system + user) for the judge model.
 */
export function buildTonePrompt(
	input: string,
	expectedOutput: string,
	actualOutput: string,
	toneProfile: string | null | undefined,
): JudgeMessage[] {
	const profileInstruction = toneProfile
		? `The expected tone profile is: "${toneProfile}". Use this as the reference for evaluation.`
		: "Use the expected output as the reference for tone evaluation.";

	return [
		{
			role: "system",
			content: `You are a tone evaluator. Assess how well the actual output's tone matches the expected tone.

${profileInstruction}

Important guidelines:
- Do not favor longer responses. Evaluate tone independently of response length.
- The source model of the actual output is unknown to you. Evaluate the tone itself, not style you associate with any model.
- If uncertain about a dimension, report low confidence rather than guessing.
- Be consistent — apply the same standards across different response lengths and styles.

Rate the following dimensions on a scale of 0.0 to 1.0:
- formality: How formal or informal is the language?
- sentiment: Positive, negative, or neutral tone?
- assertiveness: How confident and direct is the language?
- persona_consistency: Does it maintain a consistent voice/persona?
- verbosity: Is the length and detail level appropriate?

Return your evaluation as valid JSON with these exact fields:
{
  "overall": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "dimensions": {
    "formality": <number 0.0 to 1.0>,
    "sentiment": <number 0.0 to 1.0>,
    "assertiveness": <number 0.0 to 1.0>,
    "persona_consistency": <number 0.0 to 1.0>,
    "verbosity": <number 0.0 to 1.0>
  },
  "explanation": "<brief explanation of the evaluation>"
}`,
		},
		{
			role: "user",
			content: `Input: ${input}

Expected output: ${expectedOutput}

Actual output: ${actualOutput}

Evaluate the tone of the actual output. Return JSON only.`,
		},
	];
}
