import type { SingleServerRouteConfig } from 'skroutes';

import { tActions, tHelpers } from '@totallator/business-logic';
import { fileFilterSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';
import { addTypedJob } from '$lib/server/bullmq/bullmqService';
import { WEBAPP_QUEUES } from '$lib/server/bullmq/jobContracts';
import type { WorkerJobMap } from '$lib/server/bullmq/jobContracts';
import { extractAutocompleteFromTextFilter } from '$lib/server/helpers/filterConfigExtractor.js';

export const _routeConfig = {
	searchParamsValidation: fileFilterSchema.optional().catch({})
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	const files = await tActions.file.list({
		filter: current.searchParams || { page: 0, pageSize: 10 }
	});

	const filterText = await tActions.file.filterToText({
		filter: current.searchParams || { page: 0, pageSize: 10 }
	});

	// Generate autocomplete configuration from server-side filter array
	const autocompleteKeys = extractAutocompleteFromTextFilter(tHelpers.file.filterArray, 'file');

	return {
		searchParams: current.searchParams,
		files,
		filterText,
		autocompleteKeys
	};
};

export const actions = {
	checkFiles: async () => {
		await addTypedJob<WorkerJobMap, 'file-check-exists'>(
			WEBAPP_QUEUES.BACKGROUND,
			'file-check-exists',
			{}
		);
	}
};
