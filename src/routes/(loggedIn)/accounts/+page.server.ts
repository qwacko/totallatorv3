import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { accountTypeEnum } from '$lib/schema/accountTypeSchema.js';
import {
	defaultAllJournalFilter,
	type JournalFilterSchemaInputType
} from '$lib/schema/journalSchema';
import { accountFilterToText } from '$lib/server/db/actions/helpers/accountFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/client';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const searchParams = pageInfo.searchParams || { page: 0, pageSize: 10 };

	const accounts = await tActions.account.list({
		db,
		filter: searchParams
	});
	const redirectRequired = accounts.page >= accounts.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, accounts.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
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

	const accountSummary = tActions.journal.summary({
		db,
		filter: filteredItems
	});

	return {
		accounts,
		searchParams: pageInfo.searchParams,
		filterText: accountFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		accountSummary,
		accountDropdown: tActions.account.listForDropdown({ db })
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
			const { id, ...restData } = form.data;
			await tActions.account.update({ db, id, data: restData });
			return {
				status: 200,
				body: {
					message: 'Account Updated'
				}
			};
		} catch (e) {
			console.log('Account Update Error', e);
			return error(500, 'Error updating account');
		}
	}
};
