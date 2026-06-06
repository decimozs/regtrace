/**
 * Strip markdown code fences (```json, ```, `) from a string.
 * Common in LLM outputs — valid JSON inside fences should not be penalized.
 * @param text - The raw string potentially wrapped in code fences
 * @returns The string with outer code fences removed, trimmed
 */
export function stripCodeFences(text: string): string {
	return text
		.replace(/^```[a-zA-Z]*\n?/, "")
		.replace(/```$/, "")
		.trim();
}
