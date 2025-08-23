import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import {
	createSimpleTransactionSchemaCore,
	defaultJournalFilter,
	journalFilterSchema
} from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { pageAndFilterValidation } from '$lib/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);

	data.locals.global.logger('journals').trace({
		code: 'WEB_JRN_030',
		title: 'Journal creation page loaded',
		userId: data.locals.user?.id
	});

	const form = await superValidate(
		{
			date: new Date().toISOString().slice(0, 10),
			description: '',
			amount: 0,
			importId: null,
			importDetailId: null,
			linked: true,
			reconciled: false,
			dataChecked: false,
			complete: false,
			tagTitle: null,
			tagId: undefined,
			billTitle: null,
			billId: undefined,
			budgetTitle: null,
			budgetId: undefined,
			categoryTitle: null,
			categoryId: undefined,
			fromAccountTitle: null,
			fromAccountId: undefined,
			toAccountTitle: null,
			toAccountId: undefined
		},
		zod4(createSimpleTransactionSchemaCore)
	);

	return { form };
};

const createValidation = z.object({
	...createSimpleTransactionSchemaCore.shape,
	...pageAndFilterValidation.shape
});

export const actions = {
	default: async ({ request, locals }) => {
		const startTime = Date.now();
		const form = await superValidate(request, zod4(createValidation));

		if (!form.valid) {
			locals.global.logger('journals').warn({
				code: 'WEB_JRN_031',
				title: 'Journal creation form validation failed',
				userId: locals.user?.id,
				validationErrors: form.errors
			});
			return { form };
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			locals.global.logger('journals').warn({
				code: 'WEB_JRN_032',
				title: 'Journal creation filter parsing failed',
				userId: locals.user?.id,
				filterParseError: parsedFilter.error
			});
			redirect(302, form.data.currentPage);
		}

		const { filter, prevPage, currentPage, ...transactionData } = form.data;
		locals.global.logger('journals').info({
			code: 'WEB_JRN_033',
			title: 'Journal creation initiated via web',
			userId: locals.user?.id,
			transactionData: {
				date: transactionData.date,
				amount: transactionData.amount,
				description: transactionData.description,
				fromAccount: transactionData.fromAccountTitle || transactionData.fromAccountId,
				toAccount: transactionData.toAccountTitle || transactionData.toAccountId
			}
		});

		try {
			const journalId = await tActions.journal.createFromSimpleTransaction({
				transaction: form.data
			});

			const duration = Date.now() - startTime;
			locals.global.logger('journals').info({
				code: 'WEB_JRN_034',
				title: 'Journal created successfully via web',
				userId: locals.user?.id,
				journalId,
				transactionAmount: transactionData.amount,
				transactionDescription: transactionData.description,
				duration
			});
		} catch (e) {
			const duration = Date.now() - startTime;
			locals.global.logger('journals').error({
				code: 'WEB_JRN_035',
				title: 'Journal creation failed via web',
				userId: locals.user?.id,
				transactionAmount: transactionData.amount,
				transactionDescription: transactionData.description,
				duration,
				error: e
			});
			return message(form, 'Error Creating Transaction');
		}
		redirect(302, form.data.prevPage);
	}
};

export const _routeConfig = {
	searchParamsValidation: journalFilterSchema.optional().catch(defaultJournalFilter())
} satisfies SingleServerRouteConfig;
