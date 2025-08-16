import { getContextStore } from '@totallator/context';
import type { LoggerAction, LoggerDomain, LoggerInstance } from '@totallator/context';

export const getLogger = (domain: LoggerDomain, action?: LoggerAction): LoggerInstance => {
	const context = getContextStore();

	if (action) {
		return context.global.logger(domain, action);
	}
	return context.global.logger(domain);
};
