import { serverPageInfo } from '$lib/routes.server';
import { getBullMQStatus } from '$lib/server/bullmq/bullmqService';

export const load = async (data) => {
	const pageInfo = await serverPageInfo(data.route.id, data);
	const bullmqStatus = await getBullMQStatus();

	return {
		pageInfo,
		bullmqStatus
	};
};
