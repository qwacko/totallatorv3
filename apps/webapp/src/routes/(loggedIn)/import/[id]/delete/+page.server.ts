import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';

import { idSchema } from '@totallator/shared';

import { urlGenerator } from '$lib/routes';
import { addTypedJob } from '$lib/server/bullmq/bullmqService';
import { WEBAPP_QUEUES } from '$lib/server/bullmq/jobContracts';
import type { WorkerJobMap } from '$lib/server/bullmq/jobContracts';

export const load = async (data) => {
	const parentData = await data.parent();

	const canDelete = parentData.canDelete;

	if (!canDelete) {
		redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/import/[id]',
				paramsValue: { id: data.params.id }
			}).url
		);
	}
};

export const actions = {
	default: async ({ params, locals }) => {
		let deleted = false;
		try {
			await addTypedJob<WorkerJobMap, 'import-delete'>(WEBAPP_QUEUES.BACKGROUND, 'import-delete', {
				importId: params.id
			});
			deleted = true;
		} catch (e) {
			locals.global.logger('import').error({
				code: 'IMP_0002',
				title: 'Import Delete Error',
				error: JSON.stringify(e, null, 2)
			});
		}

		if (deleted) {
			redirect(302, urlGenerator({ address: '/(loggedIn)/import', searchParamsValue: {} }).url);
		}
	}
};

export const _routeConfig = {
	paramsValidation: idSchema
} satisfies SingleServerRouteConfig;
