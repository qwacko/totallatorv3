/**
 * Available log levels in order of increasing verbosity.
 */
export type LogClass = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

/**
 * Parameters that can be passed to logging functions (same as console.log).
 */
export type LogParams = Parameters<typeof console.log>;

/**
 * Create a configurable logger instance.
 * 
 * The logger respects both global enable/disable settings and per-level
 * configuration. Each log level can be individually enabled or disabled
 * through the logClasses array.
 * 
 * @param enable Global logging enable/disable flag
 * @param logClasses Array of log levels to enable (e.g., ['ERROR', 'WARN', 'INFO'])
 * @returns Logger instance with level-specific methods
 */
export const createLogger = (enable: boolean, logClasses: string[]) => {
	const loggingFunction = (logClass: LogClass = 'INFO', ...params: LogParams) => {
		if (enable) {
			const time = new Date().toISOString();
			console.log(`${time} - ${logClass} : `, ...params);
		}
	};

	// Pre-compute which log levels are enabled for performance
	const logErrors = logClasses.includes('ERROR');
	const logWarns = logClasses.includes('WARN');
	const logInfos = logClasses.includes('INFO');
	const logDebugs = logClasses.includes('DEBUG');
	const logTraces = logClasses.includes('TRACE');

	return {
		/** Log error-level messages (highest priority) */
		error: (...params: LogParams) => {
			if (logErrors) loggingFunction('ERROR', ...params);
		},
		/** Log warning-level messages */
		warn: (...params: LogParams) => {
			if (logWarns) loggingFunction('WARN', ...params);
		},
		/** Log informational messages */
		info: (...params: LogParams) => {
			if (logInfos) loggingFunction('INFO', ...params);
		},
		/** Log debug messages (development/troubleshooting) */
		debug: (...params: LogParams) => {
			if (logDebugs) loggingFunction('DEBUG', ...params);
		},
		/** Log trace messages (lowest priority, highest verbosity) */
		trace: (...params: LogParams) => {
			if (logTraces) loggingFunction('TRACE', ...params);
		}
	};
};

/**
 * Logger instance type with all logging methods.
 */
export type Logger = ReturnType<typeof createLogger>;