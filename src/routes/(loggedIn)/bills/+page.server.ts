import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { billFilterToText } from '$lib/server/db/actions/helpers/bill/billFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { fileFormActions } from '$lib/server/fileFormActions';
import { logging } from '$lib/server/logging';
import { noteFormActions } from '$lib/server/noteFormActions.js';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const bills = await tActions.bill.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const redirectRequired = bills.page >= bills.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, bills.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const billSummary = tActions.journalView.summary({
		db,
		filter: { ...defaultJournalFilter(), bill: pageInfo.searchParams }
	});

	const filterText = await billFilterToText({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const billDropdowns = await tActions.bill.listForDropdown({ db });

	return {
		bills: await tActions.file.addFilesToItems({
			db,
			grouping: 'bill',
			data: await tActions.note.addNotesToItems({ db, data: bills, grouping: 'bill' })
		}),
		searchParams: pageInfo.searchParams,
		filterText,
		billSummary,
		billDropdowns
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
