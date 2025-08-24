import type { ServerRouteConfig } from 'skroutes';
import z from 'zod';

import { tActions } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';

export const _routeConfig = {
	paramsValidation: z.object({ id: z.string(), filename: z.string() })
} satisfies ServerRouteConfig[string];

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { params }
	} = serverPageInfo(data.route.id, data);

	if (!params || !params.filename) {
		throw new Error('No params');
	}

	const autoImportData = await tActions.autoImport.getData({
		id: params.id
	});

	return new Response(JSON.stringify(autoImportData, null, 2), {
		status: 200,
		headers: {
			'Content-Type': 'application/octet-stream',
			'Content-Disposition': `attachment; filename=${params.filename}`
		}
	});
};
