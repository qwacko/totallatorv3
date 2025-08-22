import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { idSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';

export const _routeConfig = {
	paramsValidation: z.object({ id: z.string() })
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/budgets');

	const budget = await tActions.budget.getById(pageInfo.current.params?.id);
	if (!budget) redirect(302, '/budgets');

	return {
		budget
	};
};

export const actions = {
	default: async ({ params, locals }) => {
		try {
			await tActions.budget.delete(idSchema.parse(params));
		} catch (e) {
			locals.global
				.logger('budgets')
				.error({ code: 'BUD_0002', title: 'Delete Budget Error', error: e });
			return {};
		}
		redirect(302, '/budgets');
	}
};
