type logClasses = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
type logParams = Parameters<typeof console.log>;

export const getLogger = (enable: boolean, log_classes: string[]) => {
	const loggingFunction = (logClass: logClasses = 'INFO', ...params: logParams) => {
		if (enable) {
			const time = new Date().toISOString();
			console.log(`${time} - ${logClass} : `, ...params);
		}
	};

	const logErrors = log_classes.includes('ERROR');
	const logWarns = log_classes.includes('WARN');
	const logInfos = log_classes.includes('INFO');
	const logDebugs = log_classes.includes('DEBUG');
	const logTraces = log_classes.includes('TRACE');

	const logging = {
		error: (...params: logParams) => {
			if (logErrors) loggingFunction('ERROR', ...params);
		},
		warn: (...params: logParams) => {
			if (logWarns) loggingFunction('WARN', ...params);
		},
		info: (...params: logParams) => {
			if (logInfos) loggingFunction('INFO', ...params);
		},
		debug: (...params: logParams) => {
			if (logDebugs) loggingFunction('DEBUG', ...params);
		},
		trace: (...params: logParams) => {
			if (logTraces) loggingFunction('TRACE', ...params);
		}
	};

	return logging;
};

export type LoggerType = ReturnType<typeof getLogger>;

// if (!serverEnv.TEST_ENV) {
// 	logging.info('Server Environment:', serverEnv);
// }
