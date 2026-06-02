const PREFIX = "[regtrace]";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel) {
	currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
	return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

export const logger = {
	debug(message: string, ...args: unknown[]) {
		if (!shouldLog("debug")) return;
		console.error(`${PREFIX} [debug] ${message}`, ...args);
	},

	info(message: string, ...args: unknown[]) {
		if (!shouldLog("info")) return;
		console.error(`${PREFIX} ${message}`, ...args);
	},

	warn(message: string, ...args: unknown[]) {
		if (!shouldLog("warn")) return;
		console.error(`${PREFIX} [warn] ${message}`, ...args);
	},

	error(message: string, ...args: unknown[]) {
		if (!shouldLog("error")) return;
		console.error(`${PREFIX} [error] ${message}`, ...args);
	},
};
