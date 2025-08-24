import { getLogger } from '@/logger';

export const timerHelperFunction = (title: string) => {
	const startTime = Date.now();

	return {
		end: () => {
			const endTime = Date.now();
			const duration = endTime - startTime;
			getLogger('queries').debug({
				code: 'QUERY_001',
				title: `${title} took ${duration}ms`,
				duration
			});
		}
	};
};
