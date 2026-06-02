import { logger } from "./logger";

export interface EnvVars {
	ANTHROPIC_API_KEY?: string;
	OPENAI_API_KEY?: string;
	GEMINI_API_KEY?: string;
	GROQ_API_KEY?: string;
}

const REQUIRED_VARS: (keyof EnvVars)[] = [];
const _OPTIONAL_VARS: (keyof EnvVars)[] = [
	"ANTHROPIC_API_KEY",
	"OPENAI_API_KEY",
	"GEMINI_API_KEY",
	"GROQ_API_KEY",
];

let loaded = false;

export function loadEnv(): void {
	if (loaded) return;

	const dotenv = require("dotenv");
	dotenv.config();

	const missing: string[] = [];
	for (const key of REQUIRED_VARS) {
		if (!process.env[key]) {
			missing.push(key);
		}
	}

	if (missing.length > 0) {
		logger.error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
		logger.error(
			`Create a .env file or set these variables in your environment.`,
		);
		process.exit(2);
	}

	loaded = true;
}

export function getEnv(key: keyof EnvVars): string | undefined {
	if (!loaded) {
		loadEnv();
	}
	return process.env[key];
}

export function getEnvOrThrow(key: keyof EnvVars): string {
	const value = getEnv(key);
	if (!value) {
		throw new Error(
			`Required environment variable ${key} is not set. ` +
				`Add it to your .env file or export it in your shell.`,
		);
	}
	return value;
}
