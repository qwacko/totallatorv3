import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGeneratorServer } from '$lib/routes.server';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params) {
		redirect(
			302,
			urlGeneratorServer({
				address: '/(loggedIn)/filters',
				searchParamsValue: {}
			}).url
		);
	}

	const filterInfo = await tActions.reusableFitler.getById({
		id: current.params.id
	});

	if (!filterInfo) {
		redirect(
			302,
			urlGeneratorServer({
				address: '/(loggedIn)/filters',
				searchParamsValue: {}
			}).url
		);
	}

	return {
		filter: filterInfo
	};
};

export const actions = {
	default: async ({ params, request, locals }) => {
		const id = params.id;
		const form = await request.formData();
		const prevPage = form.get('prevPage');

		await tActions.reusableFitler.delete({ id });

		redirect(
			302,
			prevPage
				? prevPage.toString()
				: urlGeneratorServer({
						address: '/(loggedIn)/filters',
						searchParamsValue: {}
					}).url
		);
	}
};

export const _routeConfig = {
	paramsValidation: z.object({ id: z.string() })
} satisfies SingleServerRouteConfig;
