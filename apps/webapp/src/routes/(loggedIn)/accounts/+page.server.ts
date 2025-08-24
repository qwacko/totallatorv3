import { error, redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { accountFilterToText } from '@totallator/business-logic';
import { tActions } from '@totallator/business-logic';
import { accountFilterArray } from '@totallator/business-logic';
import { accountFilterSchema, accountTypeEnum } from '@totallator/shared';
import { defaultAllJournalFilter, type JournalFilterSchemaInputType } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.server.js';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions.js';
import { fileFormActions } from '$lib/server/fileFormActions';
import { extractAutocompleteFromTextFilter } from '$lib/server/helpers/filterConfigExtractor.js';
import { noteFormActions } from '$lib/server/noteFormActions';

export const _routeConfig = {
	searchParamsValidation: accountFilterSchema.optional().catch({})
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
	const startTime = Date.now();
	authGuard(data);
	const db = data.locals.db;
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const searchParams = pageInfo.searchParams || { page: 0, pageSize: 10 };

	data.locals.global.logger('accounts').debug({
		code: 'WEB_ACC_001',
		title: 'Accounts page loaded',
		userId: data.locals.user?.id,
		searchParams,
		pageSize: searchParams.pageSize,
		page: searchParams.page
	});

	try {
		const accounts = await tActions.account.list({
			filter: searchParams
		});
		const redirectRequired = accounts.page >= accounts.pageCount;
		if (redirectRequired) {
			const targetPage = Math.max(0, accounts.pageCount - 1);
			data.locals.global.logger('accounts').debug({
				code: 'WEB_ACC_002',
				title: 'Account page redirect required',
				currentPage: accounts.page,
				pageCount: accounts.pageCount,
				targetPage
			});
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
			filter: filteredItems
		});

		const filterText = await accountFilterToText({
			filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
			db
		});

		// Generate autocomplete configuration from server-side filter array
		const autocompleteKeys = extractAutocompleteFromTextFilter(accountFilterArray, 'account');

		const duration = Date.now() - startTime;
		data.locals.global.logger('accounts').debug({
			code: 'WEB_ACC_003',
			title: 'Accounts page data loaded successfully',
			accountCount: accounts.data.length,
			totalCount: accounts.count,
			pageCount: accounts.pageCount,
			duration
		});

		return {
			accounts: tActions.associatedInfo.addToItems({
				data: accounts,
				grouping: 'accountId'
			}),
			searchParams: pageInfo.searchParams,
			filterText,
			accountSummary,
			autocompleteKeys
		};
	} catch (e) {
		const duration = Date.now() - startTime;
		data.locals.global.logger('accounts').error({
			code: 'WEB_ACC_004',
			title: 'Failed to load accounts page',
			searchParams,
			duration,
			error: e
		});
		throw e;
	}
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
		const startTime = Date.now();
		const form = await superValidate(request, zod4(submitValidation));

		if (!form.valid) {
			locals.global.logger('accounts').warn({
				code: 'WEB_ACC_010',
				title: 'Account update form validation failed',
				validationErrors: form.errors,
				formData: form.data
			});
			return error(400, 'Invalid form data');
		}

		const { id, ...restData } = form.data;
		locals.global.logger('accounts').info({
			code: 'WEB_ACC_011',
			title: 'Account update initiated',
			accountId: id,
			updateData: restData,
			userId: locals.user?.id
		});

		try {
			await tActions.account.update({ id, data: restData });

			const duration = Date.now() - startTime;
			locals.global.logger('accounts').info({
				code: 'WEB_ACC_012',
				title: 'Account updated successfully via web',
				accountId: id,
				updateData: restData,
				userId: locals.user?.id,
				duration
			});

			return {
				status: 200,
				body: {
					message: 'Account Updated'
				}
			};
		} catch (e) {
			const duration = Date.now() - startTime;
			locals.global.logger('accounts').error({
				code: 'WEB_ACC_013',
				title: 'Account update failed via web',
				accountId: id,
				updateData: restData,
				userId: locals.user?.id,
				duration,
				error: e
			});
			return error(500, 'Error updating account');
		}
	}
};
