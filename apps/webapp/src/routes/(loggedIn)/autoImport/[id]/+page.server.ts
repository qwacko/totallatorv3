import { fail, redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { tActions } from '@totallator/business-logic';
import { idSchema, updateAutoImportFormSchema } from '@totallator/shared';
import type { ImportFilterSchemaType } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { urlGenerator } from '$lib/routes';
import { serverPageInfo } from '$lib/routes.server';

export const load = async (request) => {
	authGuard(request);
	const { current } = serverPageInfo(request.route.id, request);

	if (!current.params || !current.params.id) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/autoImport', searchParamsValue: {} }).url);
	}

	const autoImportDetail = await tActions.autoImport.getById({
		id: current.params.id
	});

	if (!autoImportDetail) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/autoImport', searchParamsValue: {} }).url);
	}

	const form = await superValidate(
		{
			...autoImportDetail,
			...autoImportDetail.config,
			type: autoImportDetail.type
		},
		zod4(updateAutoImportFormSchema)
	);

	const importListFilter: ImportFilterSchemaType = {
		autoImportId: current.params.id,
		page: 0,
		pageSize: 5,
		orderBy: [{ direction: 'desc', field: 'createdAt' }]
	};

	const imports = tActions.import.listDetails({
		filter: importListFilter
	});

	return {
		autoImportDetail,
		form,
		imports,
		importListFilter
	};
};

export const actions = {
	enableDisable: async (request) => {
		const id = request.params.id;
		const form = await request.request.formData();

		const enable = form.get('enable') !== null;
		const disable = form.get('disable') !== null;
		try {
			if (enable) {
				console.log('Enabling autoImport', id);
				await tActions.autoImport.update({
					data: { id, enabled: true }
				});
			}
			if (disable) {
				console.log('Disabling autoImport', id);
				await tActions.autoImport.update({
					data: { id, enabled: false }
				});
			}
		} catch (e) {
			console.error('Error enabling/disabling autoImport', e);
			return fail(400);
		}
	},
	update: async (request) => {
		const form = await superValidate(request, zod4(updateAutoImportFormSchema));

		try {
			await tActions.autoImport.update({
				data: form.data
			});
		} catch (e) {
			console.error('Error updating autoImport', e);
			return fail(400);
		}
	},
	getData: async (request) => {
		const transactions = await tActions.autoImport.getData({
			id: request.params.id
		});

		return { data: transactions };
	},
	updateSampleData: async (request) => {
		await tActions.autoImport.updateSampleData({
			id: request.params.id
		});
	},
	trigger: async (request) => {
		await tActions.autoImport.trigger({
			id: request.params.id
		});
	}
};

export const _routeConfig = {
	paramsValidation: idSchema
} satisfies SingleServerRouteConfig;
