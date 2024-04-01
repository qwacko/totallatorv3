import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	importMappingDetailSchema,
	importMappingDetailWithRefinementSchema,
	importMappingUpdateFormSchema
} from '$lib/schema/importMappingSchema';
import { dropdownItems } from '$lib/server/dropdownItems.js';
import { z } from 'zod';
import { bufferingHelper } from '$lib/server/bufferingHelper.js';
import type { ImportFilterSchemaType } from '$lib/schema/importSchema.js';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current } = serverPageInfo(data.route.id, data);
	bufferingHelper(data);

	if (!current.params) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} }).url
		);
	}

	const importMapping = await tActions.importMapping.getById({
		db,
		id: current.params.id
	});

	if (!importMapping) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} }).url
		);
	}

	const form = await superValidate(
		{ title: importMapping.title, configuration: JSON.stringify(importMapping.configuration) },
		zod(importMappingUpdateFormSchema)
	);

	const autoImports = await tActions.autoImport.list({
		db,
		filter: { importMappingId: importMapping.id, pageSize: 100 }
	});

	const detailForm = await superValidate(
		importMapping.configuration,
		zod(importMappingDetailSchema)
	);

	const importFilter: ImportFilterSchemaType = {
		mapping: importMapping.id,
		page: 0,
		pageSize: 5,
		orderBy: [{ direction: 'desc', field: 'createdAt' }]
	};

	const imports = tActions.import.listDetails({
		db,
		filter: importFilter
	});

	return {
		importMapping,
		form,
		detailForm,
		dropdowns: dropdownItems({ db }),
		autoImports,
		importFilter,
		imports
	};
};

const importMappingUpdateFormSchemaWithPrevPage = importMappingUpdateFormSchema.merge(
	z.object({ prevPage: z.string().optional() })
);

export const actions = {
	default: async (data) => {
		const id = data.params.id;
		const form = await superValidate(data.request, zod(importMappingUpdateFormSchemaWithPrevPage));

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
				db: data.locals.db,
				id,
				data: {
					configuration: configurationProcessed.data,
					...restData
				}
			});
		} catch (e) {
			return setError(form, 'Import Mapping Update Error');
		}

		redirect(
			302,
			prevPage || urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} }).url
		);
	}
};
