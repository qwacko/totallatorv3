import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { accountTypeEnum } from '$lib/schema/accountTypeSchema.js';
import {
	defaultAllJournalFilter,
	type JournalFilterSchemaInputType
} from '$lib/schema/journalSchema';
import { accountFilterToText } from '$lib/server/db/actions/helpers/account/accountFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { noteFormActions } from '$lib/server/noteFormActions';
import { fileFormActions } from '$lib/server/fileFormActions';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions.js';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const searchParams = pageInfo.searchParams || { page: 0, pageSize: 10 };

	const accounts = await tActions.account.list({
		db,
		filter: searchParams
	});
	const redirectRequired = accounts.page >= accounts.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, accounts.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const filteredItems = {
		...defaultAllJournalFilter(),
		account: {
			type:
				searchParams.id || (searchParams.title && searchParams.title !== '')
					? [...accountTypeEnum]
					: ['asset', 'liability'],
			...searchParams
		}
	} satisfies JournalFilterSchemaInputType;

	const accountSummary = await tActions.journalView.summary({
		db,
		filter: filteredItems
	});

	const filterText = await accountFilterToText({
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
		db
	});

	return {
		accounts: tActions.associatedInfo.addToItems({ db, data: accounts, grouping: 'accountId' }),
		searchParams: pageInfo.searchParams,
		filterText,
		accountSummary
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
			const { id, ...restData } = form.data;
			await tActions.account.update({ db, id, data: restData });
			return {
				status: 200,
				body: {
					message: 'Account Updated'
				}
			};
		} catch (e) {
			logging.error('Account Update Error', e);
			return error(500, 'Error updating account');
		}
	}
};
