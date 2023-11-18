import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';
import { setError, superValidate } from 'sveltekit-superforms/server';
import {
	importMappingDetailSchema,
	importMappingDetailWithRefinementSchema,
	importMappingUpdateFormSchema
} from '$lib/schema/importMappingSchema';
import { dropdownItems } from '$lib/server/dropdownItems.js';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params) {
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} }).url
		);
	}

	const importMapping = await tActions.importMapping.getById({
		db,
		id: current.params.id
	});

	if (!importMapping) {
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} }).url
		);
	}

	const form = await superValidate(
		{ title: importMapping.title, configuration: JSON.stringify(importMapping.configuration) },
		importMappingUpdateFormSchema
	);

	const detailForm = await superValidate(importMapping.configuration, importMappingDetailSchema);

	return {
		importMapping,
		form,
		detailForm,
		dropdowns: dropdownItems({ db })
	};
};

export const actions = {
	default: async (data) => {
		const id = data.params.id;
		const form = await superValidate(
			data.request,
			importMappingUpdateFormSchema.merge(z.object({ prevPage: z.string().optional() }))
		);

		if (!form.valid) {
			return form;
		}

		const { configuration, prevPage, ...restData } = form.data;

		const configurationProcessed = importMappingDetailWithRefinementSchema.safeParse(
			JSON.parse(configuration)
		);

		if (!configurationProcessed.success) {
			return setError(form, 'configuration', 'Configuration Is Invalid');
		}

		try {
			await tActions.importMapping.update({
				db,
				id,
				data: {
					configuration: configurationProcessed.data,
					...restData
				}
			});
		} catch (e) {
			return setError(form, 'Import Mapping Update Error');
		}

		throw redirect(
			302,
			prevPage || urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} }).url
		);
	}
};
