import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes';
import { defaultAllJournalFilter } from '$lib/schema/journalSchema.js';
import {
	updateReportConfigurationSchema,
	updateReportElementSchema
} from '$lib/schema/reportSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { dropdownItems } from '$lib/server/dropdownItems';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;

	const id = data.params.id;

	if (!id) {
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
		id
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
		zod(updateReportElementSchema)
	);

	const configForm = await superValidate(
		{
			title: elementData.reportElementConfig.title || undefined,
			group: elementData.reportElementConfig.group || undefined,
			layout: elementData.reportElementConfig.layout || undefined
		},
		zod(updateReportConfigurationSchema)
	);

	const elementConfigWithData = await tActions.report.reportElement.getWithData({
		db,
		id
	});

	return {
		elementData,
		elementConfigWithData,
		form,
		configForm,
		dropdowns: dropdownItems({ db })
	};
};
