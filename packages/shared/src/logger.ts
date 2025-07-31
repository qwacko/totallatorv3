export type LogClass = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
export type LogParams = Parameters<typeof console.log>;
import type {} from '@totallator/context'

export interface LoggerConfig {
	LOGGING: boolean;
	LOGGING_CLASSES: LogClass[];
}

export const createLogger = (config: LoggerConfig) => {
	const loggingFunction = (logClass: LogClass = 'INFO', ...params: LogParams) => {
		if (config.LOGGING) {
			const time = new Date().toISOString();
			console.log(`${time} - ${logClass} : `, ...params);
		}
	};

	const logErrors = config.LOGGING_CLASSES.includes('ERROR');
	const logWarns = config.LOGGING_CLASSES.includes('WARN');
	const logInfos = config.LOGGING_CLASSES.includes('INFO');
	const logDebugs = config.LOGGING_CLASSES.includes('DEBUG');
	const logTraces = config.LOGGING_CLASSES.includes('TRACE');

	return {
		error: (...params: LogParams) => {
			if (logErrors) loggingFunction('ERROR', ...params);
		},
		warn: (...params: LogParams) => {
			if (logWarns) loggingFunction('WARN', ...params);
		},
		info: (...params: LogParams) => {
			if (logInfos) loggingFunction('INFO', ...params);
		},
		debug: (...params: LogParams) => {
			if (logDebugs) loggingFunction('DEBUG', ...params);
		},
		trace: (...params: LogParams) => {
			if (logTraces) loggingFunction('TRACE', ...params);
		}
	};
};

export type Logger = ReturnType<typeof createLogger>;
