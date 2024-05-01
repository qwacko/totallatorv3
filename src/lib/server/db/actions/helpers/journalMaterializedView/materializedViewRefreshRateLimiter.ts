import { logging } from '$lib/server/logging';

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
				logging.debug('Materialized View Refreshed');
			});
		}, timeout);
	};

	return {
		updateLastRequest
	};
};
