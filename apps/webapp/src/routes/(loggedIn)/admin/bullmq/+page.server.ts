import { serverPageInfo } from '$lib/routes.server';
import { getBullMQStatus } from '$lib/server/bullmq/bullmqService';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const pageInfo = await serverPageInfo();
	const bullmqStatus = await getBullMQStatus();

	return {
		pageInfo,
		bullmqStatus
	};
};
