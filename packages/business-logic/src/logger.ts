import { getContextStore } from '@totallator/context';
import type { LoggerDomain } from '@totallator/context';

export const getLogger = (domain?: LoggerDomain) => {
	const context = getContextStore();

	if (domain) {
		return context.global.logger(domain);
	}

	return context.global.logger;
};
