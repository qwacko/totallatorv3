import { getContextStore } from '@totallator/context';

export const getLogger = () => {
	const context = getContextStore();

	return context.global.logger;
};
