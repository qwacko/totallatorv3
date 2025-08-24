import type { ServerRouteConfig } from 'skroutes';
import z from 'zod';

import { tActions } from '@totallator/business-logic';
import { accountFilterSchema, downloadTypeSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.server.js';

export const _routeConfig = {
	searchParamsValidation: z
		.object({ ...accountFilterSchema.shape, ...downloadTypeSchema.shape })
		.optional()
		.catch({})
} satisfies ServerRouteConfig[string];

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);

	const csvData = await tActions.account.generateCSVData({
		filter: searchParams,
		returnType: searchParams?.downloadType || 'default'
	});

	const dateText = new Date().toISOString().slice(0, 19);

	return new Response(csvData, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachement; filename=${dateText}-accountExport.csv`
		}
	});
};
