import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { budgetFilterToText } from '$lib/server/db/actions/helpers/budgetFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/client';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const budgets = await tActions.budget.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const redirectRequired = budgets.page >= budgets.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, budgets.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const budgetSummary = tActions.journal.summary({
		db,
		filter: { ...defaultJournalFilter(), budget: pageInfo.searchParams }
	});

	return {
		budgets,
		searchParams: pageInfo.searchParams,
		filterText: budgetFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		budgetSummary,
		budgetDropdowns: tActions.budget.listForDropdown({ db })
	};
};

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const actions = {
	update: async ({ request }) => {
		const form = await superValidate(request, submitValidation);

		if (!form.valid) {
			return error(400, 'Invalid form data');
		}

		try {
			await tActions.budget.update(db, form.data);
			return {
				status: 200,
				body: {
					message: 'Budget Updated'
				}
			};
		} catch (e) {
			console.log('Budget Update Error', e);
			return error(500, 'Error updating budget');
		}
	}
};
