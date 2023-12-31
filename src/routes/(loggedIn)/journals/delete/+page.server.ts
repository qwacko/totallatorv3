import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter, journalFilterSchema } from '$lib/schema/journalSchema.js';
import { pageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { urlGenerator } from '$lib/routes.js';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journal.list({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter()
	});

	return { count: journalData.count };
};

export const actions = {
	delete: async ({ request }) => {
		const form = await superValidate(request, pageAndFilterValidation);

		if (!form.valid) {
			redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			redirect(302, form.data.currentPage);
		}

		try {
			const journals = await tActions.journal.list({ db, filter: parsedFilter.data });

			const transactionIds = [...new Set(journals.data.map((item) => item.transactionId))];

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
