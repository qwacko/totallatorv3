import { serverEnv } from './serverEnv';

type logClasses = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
type logParams = Parameters<typeof console.log>;
export const loggingFunction = (logClass: logClasses = 'INFO', ...params: logParams) => {
	if (serverEnv.LOGGING) {
		const time = new Date().toISOString();
		console.log(`${time} - ${logClass} : `, ...params);
	}
};

const logErrors = serverEnv.LOGGING_CLASSES.includes('ERROR');
const logWarns = serverEnv.LOGGING_CLASSES.includes('WARN');
const logInfos = serverEnv.LOGGING_CLASSES.includes('INFO');
const logDebugs = serverEnv.LOGGING_CLASSES.includes('DEBUG');
const logTraces = serverEnv.LOGGING_CLASSES.includes('TRACE');

export const logging = {
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

if (!serverEnv.TEST_ENV) {
	logging.info('Server Environment:', serverEnv);
}
