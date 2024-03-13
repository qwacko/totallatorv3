import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter, journalFilterSchema } from '$lib/schema/journalSchema.js';
import { pageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { urlGenerator } from '$lib/routes.js';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates.js';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journalView.list({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter()
	});

	return { count: journalData.count };
};

export const actions = {
	delete: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(pageAndFilterValidation));

		if (!form.valid) {
			redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			redirect(302, form.data.currentPage);
		}

		try {
			const journals = await tActions.journalView.list({ db, filter: parsedFilter.data });

			const transactionIds = filterNullUndefinedAndDuplicates(
				journals.data.map((item) => item.transactionId)
			);

			await tActions.journal.hardDeleteTransactions({ db, transactionIds });
		} catch (e) {
			logging.error('Error Updating Journal State : ', e);
			redirect(
				302,
				form.data.prevPage ||
					urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: defaultJournalFilter()
					}).url
			);
		}

		redirect(302, form.data.prevPage);
	}
};
