import { getLogger } from '@/logger';

export const materializedViewRefreshRateLimiter = ({
	timeout,
	performRefresh
}: {
	timeout: number;
	performRefresh: () => Promise<boolean>;
}) => {
	let timeoutTrigger: NodeJS.Timeout | undefined;

	const triggerRefresh = async () => {
		performRefresh();
	};

	const updateLastRequest = () => {
		if (timeoutTrigger) {
			clearTimeout(timeoutTrigger);
		}

		timeoutTrigger = setTimeout(() => {
			triggerRefresh().then(() => {
				getLogger('materialized-views').debug('Materialized View Refreshed');
			});
		}, timeout);
	};

	return {
		updateLastRequest
	};
};
