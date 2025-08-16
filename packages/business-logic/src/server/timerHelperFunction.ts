import { getLogger } from '@/logger';

export const timerHelperFunction = (title: string) => {
	const startTime = Date.now();

	return {
		end: () => {
			const endTime = Date.now();
			const duration = endTime - startTime;
			getLogger('queries').debug({ duration, title }, `${title} took ${duration}ms`);
		}
	};
};
