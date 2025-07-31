export type LogClass = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
export type LogParams = Parameters<typeof console.log>;

export const createLogger = (enable: boolean, logClasses: string[]) => {
	const loggingFunction = (logClass: LogClass = 'INFO', ...params: LogParams) => {
		if (enable) {
			const time = new Date().toISOString();
			console.log(`${time} - ${logClass} : `, ...params);
		}
	};

	const logErrors = logClasses.includes('ERROR');
	const logWarns = logClasses.includes('WARN');
	const logInfos = logClasses.includes('INFO');
	const logDebugs = logClasses.includes('DEBUG');
	const logTraces = logClasses.includes('TRACE');

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