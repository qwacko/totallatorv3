import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';

import { tActions } from '@totallator/business-logic';
import { idSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGeneratorServer } from '$lib/routes.server';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params) {
		redirect(
			302,
			urlGeneratorServer({
				address: '/(loggedIn)/importMapping',
				searchParamsValue: {}
			}).url
		);
	}

	const importMappingInfo = await tActions.importMapping.getById({
		id: current.params.id
	});

	if (!importMappingInfo) {
		redirect(
			302,
			urlGeneratorServer({
				address: '/(loggedIn)/importMapping',
				searchParamsValue: {}
			}).url
		);
	}

	return {
		importMapping: importMappingInfo
	};
};

export const actions = {
	default: async ({ params, request, locals }) => {
		const id = params.id;
		const form = await request.formData();
		const prevPage = form.get('prevPage');

		await tActions.importMapping.delete({ id });

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
	paramsValidation: idSchema
} satisfies SingleServerRouteConfig;
