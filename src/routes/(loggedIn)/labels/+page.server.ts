import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { labelFilterToText } from '$lib/server/db/actions/helpers/label/labelFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/client';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;

	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const labels = await tActions.label.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const redirectRequired = labels.page >= labels.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, labels.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const labelSummary = await tActions.journalView.summary({
		db,
		filter: { ...defaultJournalFilter(), label: pageInfo.searchParams }
	});

	const filterText = await labelFilterToText({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const labelDropdowns = await tActions.label.listForDropdown({ db });

	return {
		labels,
		searchParams: pageInfo.searchParams,
		filterText,
		labelSummary,
		labelDropdowns
	};
};

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const actions = {
	update: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, submitValidation);

		if (!form.valid) {
			return error(400, 'Invalid form data');
		}

		try {
			await tActions.label.update(db, form.data);
			return {
				status: 200,
				body: {
					message: 'Label Updated'
				}
			};
		} catch (e) {
			logging.error('Label Update Error', JSON.stringify(e, null, 2));
			return error(500, 'Error updating label');
		}
	}
};
