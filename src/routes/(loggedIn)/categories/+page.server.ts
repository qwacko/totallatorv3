import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { categoryFilterToText } from '$lib/server/db/actions/helpers/category/categoryFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { noteFormActions } from '$lib/server/noteFormActions.js';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { fileFormActions } from '$lib/server/fileFormActions';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const categories = await tActions.category.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = categories.page >= categories.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, categories.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const categorySummary = tActions.journalView.summary({
		db,
		filter: { ...defaultJournalFilter(), category: pageInfo.searchParams }
	});

	const filterText = await categoryFilterToText({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const categoryDropdowns = await tActions.category.listForDropdown({ db });

	return {
		categories: await tActions.file.addFilesToItems({
			db,
			grouping: 'category',
			data: await tActions.note.addNotesToItems({ db, data: categories, grouping: 'category' })
		}),
		searchParams: pageInfo.searchParams,
		filterText,
		categorySummary,
		categoryDropdowns
	};
};

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const actions = {
	...noteFormActions,
	...fileFormActions,
	update: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(submitValidation));

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
			logging.error('Category Update Error', e);
			return error(500, 'Error updating category');
		}
	}
};
