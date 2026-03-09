import type { SingleServerRouteConfig } from 'skroutes';

import { tActions } from '@totallator/business-logic';
import { idSchema } from '@totallator/shared';

import { addTypedJob } from '$lib/server/bullmq/bullmqService';
import { WEBAPP_QUEUES } from '$lib/server/bullmq/jobContracts';
import type { WorkerJobMap } from '$lib/server/bullmq/jobContracts';

export const actions = {
	reprocess: async ({ params, locals }) => {
		try {
			await addTypedJob<WorkerJobMap, 'import-reprocess'>(
				WEBAPP_QUEUES.BACKGROUND,
				'import-reprocess',
				{ importId: params.id }
			);
		} catch (e) {
			locals.global.logger('import').error({
				code: 'IMP_0003',
				title: 'Reprocess Import Error',
				error: JSON.stringify(e, null, 2)
			});
		}
	},
	triggerImport: async ({ params }) =>
		addTypedJob<WorkerJobMap, 'import-trigger'>(WEBAPP_QUEUES.BACKGROUND, 'import-trigger', {
			importId: params.id
		}),
	clean: async ({ params, locals }) => {
		try {
			await addTypedJob<WorkerJobMap, 'import-clean'>(WEBAPP_QUEUES.BACKGROUND, 'import-clean', {
				importId: params.id
			});
		} catch (e) {
			locals.global.logger('import').error({
				code: 'IMP_0004',
				title: 'Clean Import Error',
				error: JSON.stringify(e, null, 2)
			});
		}
	},
	toggleAutoClean: async ({ params }) => {
		const id = params.id;

		const importData = await tActions.import.get({ id });

		if (!importData.importInfo) {
			return;
		}

		await tActions.import.update({
			data: { id, autoClean: !importData.importInfo.import.autoClean }
		});
	},
	toggleAutoProcess: async ({ params }) => {
		const id = params.id;

		const importData = await tActions.import.get({ id });

		if (!importData.importInfo) {
			return;
		}

		await tActions.import.update({
			data: { id, autoProcess: !importData.importInfo.import.autoProcess }
		});
	}
};

export const _routeConfig = {
	paramsValidation: idSchema
} satisfies SingleServerRouteConfig;
