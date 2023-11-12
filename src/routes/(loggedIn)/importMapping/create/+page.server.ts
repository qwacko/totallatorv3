import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes.js';
import {
	importMappingCreateFormSchema,
	importMappingDetailSchema,
	importMappingDetailWithRefinementSchema
} from '$lib/schema/importMappingSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { dropdownItems } from '$lib/server/dropdownItems.js';
import { logging } from '$lib/server/logging';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms/client';
import { z } from 'zod';

export const load = (data) => {
	authGuard(data);
	serverPageInfo(data.route.id, data);

	const form = superValidate({ title: '', configuration: '' }, importMappingCreateFormSchema);
	const detailForm = superValidate({}, importMappingDetailSchema);

	return { form, detailForm, dropdowns: dropdownItems({ db }) };
};

export const actions = {
	default: async (data) => {
		const form = await superValidate(
			data.request,
			importMappingCreateFormSchema.merge(z.object({ prevPage: z.string().optional() }))
		);

		if (!form.valid) {
			return { form };
		}

		const detailFormData = importMappingDetailWithRefinementSchema.safeParse(
			JSON.parse(form.data.configuration)
		);

		if (!detailFormData.success) {
			return setError(
				form,
				'configuration',
				`Configuration Error : ${detailFormData.error.message}`
			);
		}

		try {
			await tActions.importMapping.create({
				db: db,
				data: {
					title: form.data.title,
					configuration: detailFormData.data
				}
			});
		} catch (e) {
			logging.error('Import Mapping Create Error', JSON.stringify(e, null, 2));

			return fail(400, { message: 'Unknown Error Creating Import Mapping' });
		}

		if (form.data.prevPage) {
			throw redirect(302, form.data.prevPage);
		}
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} }).url
		);
	}
};
