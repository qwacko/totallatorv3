import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import {
	defaultAllJournalFilter,
	journalFilterSchemaWithoutPagination
} from '$lib/schema/journalSchema.js';
import { updateReportElementSchema } from '$lib/schema/reportSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { dropdownItems } from '$lib/server/dropdownItems';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params) {
		redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultAllJournalFilter()
			}).url
		);
	}

	const elementData = await tActions.report.reportElement.get({
		db,
		id: pageInfo.current.params.id
	});

	if (!elementData) {
		redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultAllJournalFilter()
			}).url
		);
	}

	const form = await superValidate(
		{
			id: elementData.id,
			title: elementData.title || undefined
		},
		updateReportElementSchema
	);

	// const configForm = await superValidate(
	// 	elementData.reportElementConfig.configuration,
	// 	reportElementConfigurationFormSchema
	// );

	const elementConfigWithData = await tActions.report.reportElement.getWithData({
		db,
		id: pageInfo.current.params.id
	});

	return {
		elementData,
		elementConfigWithData,
		form,
		// configForm,
		dropdowns: dropdownItems({ db })
	};
};

export const actions = {
	update: async (data) => {
		const db = data.locals.db;
		const id = data.params.id;
		const form = await superValidate(data.request, updateReportElementSchema);

		if (!form.valid) {
			return form;
		}

		try {
			await tActions.report.reportElement.update({ db, data: { ...form.data, id } });
		} catch (e) {
			logging.error('Error Updating Report Element : ', e);
		}
	},
	addFilter: async (data) => {
		const id = data.params.id;
		const db = data.locals.db;

		try {
			await tActions.report.reportElement.addFilter({ db, id });
		} catch (e) {
			logging.error('Error Adding Filter to Report Element', e);
		}

		return;
	},
	updateFilter: async (data) => {
		const id = data.params.id;
		const db = data.locals.db;

		const form = await data.request.formData();
		const filterText = form.get('filterText');

		try {
			if (!filterText) {
				throw new Error('Filter Text not found');
			}

			const transformedFilterText = journalFilterSchemaWithoutPagination.safeParse(
				JSON.parse(filterText.toString())
			);

			if (!transformedFilterText.success) {
				throw new Error(`Filter Text not valid : ${transformedFilterText.error.message}`);
			}

			await tActions.report.reportElement.updateFilter({
				db,
				id,
				filter: transformedFilterText.data
			});
		} catch (e) {
			logging.error('Error Updating Filter to Report Element', e);
		}

		return;
	},
	removeFilter: async (data) => {
		const id = data.params.id;
		const db = data.locals.db;

		try {
			await tActions.report.reportElement.removeFilter({ db, id });
		} catch (e) {
			logging.error('Error Removing Filter to Report Element', e);
		}

		return;
	}
	// updateConfig: async (data) => {
	// 	const formData = await superValidate(data.request, reportElementConfigurationFormSchema);

	// 	if (!formData.valid) {
	// 		return formData;
	// 	}

	// 	const db = data.locals.db;
	// 	const id = data.params.id;

	// 	const checkedData = reportElementConfigurationSchema.safeParse(formData.data);

	// 	if (!checkedData.success) {
	// 		logging.error('Error Processing Config Changed Data : ', formData.data, checkedData.error);
	// 		return message(formData, 'Error Processing Config Change', { status: 400 });
	// 	}

	// 	try {
	// 		await tActions.report.reportElement.updateConfig({ db, id, data: checkedData.data });
	// 	} catch (e) {
	// 		logging.error('Error Updating Report Element Config : ', e);
	// 		return message(formData, 'Error Updating Report Element Config', { status: 400 });
	// 	}
	// 	return formData;
	// }
};
