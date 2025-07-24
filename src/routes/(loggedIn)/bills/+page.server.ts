import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { billFilterToText } from '$lib/server/db/actions/helpers/bill/billFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { fileFormActions } from '$lib/server/fileFormActions';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions.js';
import { logging } from '$lib/server/logging';
import { noteFormActions } from '$lib/server/noteFormActions.js';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { extractAutocompleteFromTextFilter } from '$lib/server/helpers/filterConfigExtractor.js';
import { billFilterArray } from '$lib/server/db/actions/helpers/bill/billTextFilter.js';

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

	const filterText = await billFilterToText({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	// Generate autocomplete configuration from server-side filter array
	const autocompleteKeys = extractAutocompleteFromTextFilter(billFilterArray, 'bill');

	return {
		bills: tActions.associatedInfo.addToItems({ db, data: bills, grouping: 'billId' }),
		searchParams: pageInfo.searchParams,
		filterText,
		autocompleteKeys
	};
};

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const actions = {
	...noteFormActions,
	...fileFormActions,
	...associatedInfoFormActions,
	update: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(submitValidation));

		if (!form.valid) {
			return error(400, 'Invalid form data');
		}

		try {
			await tActions.bill.update({ db: db, data: form.data, id: form.data.id });
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
