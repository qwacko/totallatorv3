import { authGuard } from '$lib/authGuard/authGuardConfig';
import { tActions } from '$lib/server/db/actions/tActions';
import { serverPageInfo } from '$lib/routes';
import { fail, redirect } from '@sveltejs/kit';
import { urlGenerator } from '$lib/routes';
import { superValidate } from 'sveltekit-superforms';
import { updateAutoImportFormSchema } from '$lib/schema/autoImportSchema.js';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (request) => {
	authGuard(request);
	const { current } = serverPageInfo(request.route.id, request);

	if (!current.params || !current.params.id) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/autoImport', searchParamsValue: {} }).url);
	}

	const autoImportDetail = await tActions.autoImport.getById({
		db: request.locals.db,
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
		zod(updateAutoImportFormSchema)
	);

	return {
		autoImportDetail,
		form
	};
};

export const actions = {
	enableDisable: async (request) => {
		const id = request.params.id;
		const db = request.locals.db;
		const form = await request.request.formData();

		const enable = form.get('enable');
		const disable = form.get('disable');

		try {
			if (enable && enable.toString() === 'true') {
				await tActions.autoImport.update({
					db,
					data: { id, enabled: true }
				});
			}
			if (disable && disable.toString() === 'true') {
				await tActions.autoImport.update({
					db,
					data: { id, enabled: false }
				});
			}
		} catch (e) {
			console.error('Error enabling/disabling autoImport', e);
			return fail(400);
		}
	},
	update: async (request) => {
		const db = request.locals.db;
		const form = await superValidate(request, zod(updateAutoImportFormSchema));

		try {
			await tActions.autoImport.update({
				db,
				data: form.data
			});
		} catch (e) {
			console.error('Error updating autoImport', e);
			return fail(400);
		}
	},
	getData: async (request) => {
		console.log('Getting Data');

		const transactions = await tActions.autoImport.getData({
			db: request.locals.db,
			id: request.params.id
		});

		console.log('Transactions Received Count = ', transactions.length);
		return { data: transactions };
	},
	updateSampleData: async (request) => {
		await tActions.autoImport.updateSampleData({
			db: request.locals.db,
			id: request.params.id
		});
	},
	trigger: async (request) => {
		await tActions.autoImport.trigger({
			db: request.locals.db,
			id: request.params.id
		});
	}
};
