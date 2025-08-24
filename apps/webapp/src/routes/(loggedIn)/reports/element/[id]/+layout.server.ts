import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { tActions } from '@totallator/business-logic';
import { defaultAllJournalFilter } from '@totallator/shared';
import { updateReportConfigurationSchema, updateReportElementSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes';

export const load = async (data) => {
	authGuard(data);

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
		zod4(updateReportElementSchema)
	);

	const configForm = await superValidate(
		{
			title: elementData.reportElementConfig.title || undefined,
			group: elementData.reportElementConfig.group || undefined,
			layout: elementData.reportElementConfig.layout || undefined
		},
		zod4(updateReportConfigurationSchema)
	);

	const elementConfigWithData = await tActions.report.reportElement.getWithData({ id });

	return {
		elementData,
		elementConfigWithData,
		form,
		configForm
	};
};
