import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { categoryFilterToText } from '$lib/server/db/actions/helpers/categoryFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/client';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const categories = await tActions.category.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = categories.page >= categories.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, categories.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const categorySummary = tActions.journal.summary({
		db,
		filter: { ...defaultJournalFilter(), category: pageInfo.searchParams }
	});

	return {
		categories,
		searchParams: pageInfo.searchParams,
		filterText: categoryFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		categorySummary,
		categoryDropdowns: tActions.category.listForDropdown({ db })
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
			await tActions.category.update(db, form.data);
			return {
				status: 200,
				body: {
					message: 'Category Updated'
				}
			};
		} catch (e) {
			console.log('Category Update Error', e);
			return error(500, 'Error updating category');
		}
	}
};
