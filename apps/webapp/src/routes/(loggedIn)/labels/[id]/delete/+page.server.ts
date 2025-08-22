import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { idSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/labels');

	const label = await tActions.label.getById(pageInfo.current.params?.id);
	if (!label) redirect(302, '/labels');

	return {
		label
	};
};

export const actions = {
	default: async ({ params, locals }) => {
		try {
			await tActions.label.softDelete(idSchema.parse(params));
		} catch (e) {
			locals.global
				.logger('labels')
				.error({ code: 'LBL_0004', title: 'Delete Label Error', error: e });
			return {};
		}
		redirect(302, '/labels');
	}
};

export const _routeConfig = {
	paramsValidation: z.object({ id: z.string() })
} satisfies SingleServerRouteConfig;
