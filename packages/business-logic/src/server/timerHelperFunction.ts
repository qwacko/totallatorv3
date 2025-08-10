import { getLogger } from '@/logger';

export const timerHelperFunction = (title: string) => {
	const startTime = Date.now();

	return {
		end: () => {
			const endTime = Date.now();
			getLogger().debug(`${title} took ${endTime - startTime}ms`);
		}
	};
};
