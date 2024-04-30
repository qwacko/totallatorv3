export const materializedViewRefreshRateLimiter = ({
	timeout,
	performRefresh
}: {
	timeout: number;
	performRefresh: () => Promise<boolean>;
}) => {
	let timeoutTrigger: NodeJS.Timeout | undefined;
	let lastUpdate: number;

	const triggerRefresh = async () => {
		performRefresh();
	};

	const updateLastRequest = () => {
		if (timeoutTrigger) {
			clearTimeout(timeoutTrigger);
		}

		timeoutTrigger = setTimeout(() => {
			triggerRefresh().then(() => {
				lastUpdate = Date.now();
			});
		}, timeout);
	};

	return {
		updateLastRequest
	};
};
