import { authGuard } from '$lib/authGuard/authGuardConfig';
import { journalFilterSchemaWithoutPagination } from '$lib/schema/journalSchema.js';
import {
	updateReportConfigurationSchema,
	updateReportElementSchema
} from '$lib/schema/reportSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';


export const load = async (data) => {
	authGuard(data);
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
	},
	updateConfig: async (data) => {
		const formData = await superValidate(data.request, updateReportConfigurationSchema);

		if (!formData.valid) {
			return formData;
		}

		const db = data.locals.db;
		const id = data.params.id;

		try {
			await tActions.report.reportElementConfiguration.update({
				db,
				reportElementId: id,
				data: formData.data
			});
		} catch (e) {
			logging.error('Error Updating Report Element Config : ', e);
			return message(formData, 'Error Updating Report Element Config', { status: 400 });
		}
		return formData;
	},
	addConfigFilter: async (data) => {
		const id = data.params.id;
		const db = data.locals.db;

		const reportElement = await tActions.report.reportElement.get({ db, id });

		if (!reportElement) {
			return fail(400, { message: 'Report Element Not Found' });
		}

		try {
			await tActions.report.reportElementConfiguration.addFilter({
				db,
				configId: reportElement.reportElementConfigId
			});
		} catch (e) {
			logging.error('Error Adding Filter to Report Element', e);
			return fail(400, { message: 'Error Adding Filter to Report Element' });
		}

		return;
	},
	updateConfigFilter: async (data) => {
		const id = data.params.id;
		const db = data.locals.db;

		const form = await data.request.formData();
		const filterText = form.get('filterText');
		const filterId = form.get('filterId');

		const reportElement = await tActions.report.reportElement.get({ db, id });

		if (!reportElement) {
			return fail(400, { message: 'Report Element Not Found' });
		}

		try {
			if (!filterText) {
				throw new Error('Filter Text not found');
			}
			if (!filterId) {
				throw new Error('Filter Id not found');
			}

			const transformedFilterText = journalFilterSchemaWithoutPagination.safeParse(
				JSON.parse(filterText.toString())
			);

			if (!transformedFilterText.success) {
				throw new Error(`Filter Text not valid : ${transformedFilterText.error.message}`);
			}

			await tActions.report.reportElementConfiguration.updateFilter({
				db,
				configId: reportElement.reportElementConfigId,
				filterId: filterId.toString(),
				filter: transformedFilterText.data
			});
		} catch (e) {
			logging.error('Error Updating Filter on Report Configuration', e);
			return fail(400, { message: 'Error Updating Filter to Report Element' });
		}

		return;
	},
	removeConfigFilter: async (data) => {
		const id = data.params.id;
		const db = data.locals.db;

		const reportElement = await tActions.report.reportElement.get({ db, id });

		if (!reportElement) {
			return fail(400, { message: 'Report Element Not Found' });
		}

		const form = await data.request.formData();
		const filterId = form.get('filterId');

		if (!filterId) {
			return fail(400, { message: 'Filter Id not found' });
		}

		try {
			await tActions.report.reportElementConfiguration.removeFilter({
				db,
				configId: reportElement.reportElementConfigId,
				filterId: filterId.toString()
			});
		} catch (e) {
			logging.error('Error Removing Filter to Report Element', e);
			return fail(400, { message: 'Error Removing Filter to Report Element' });
		}

		return;
	}
};
