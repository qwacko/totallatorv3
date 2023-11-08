import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { billFilterToText } from '$lib/server/db/actions/helpers/billFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const bills = await tActions.bill.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = bills.page >= bills.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, bills.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const billSummary = tActions.journal.summary({
		db,
		filter: { ...defaultJournalFilter(), bill: pageInfo.searchParams }
	});

	return {
		bills,
		searchParams: pageInfo.searchParams,
		filterText: billFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		billSummary,
		billDropdowns: tActions.bill.listForDropdown({ db })
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
			await tActions.bill.update(db, form.data);
			return {
				status: 200,
				body: {
					message: 'Bill Updated'
				}
			};
		} catch (e) {
			logging.error('Bill Update Error', e);
			return error(500, 'Error updating bll');
		}
	}
};
