import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import {
	createSimpleTransactionSchemaCore,
	journalFilterSchema
} from '$lib/schema/journalSchema.js';
import { pageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(
		{
			//@ts-expect-error There Is An Unknown Error Here
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
		createSimpleTransactionSchemaCore
	);

	return { form };
};

const createValidation = createSimpleTransactionSchemaCore.merge(pageAndFilterValidation);

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, createValidation);

		if (!form.valid) {
			logging.error('Update Form Is Not Valid', form.errors);
			return { form };
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			logging.error('Update Filter Is Not Valid', parsedFilter.error);
			redirect(302, form.data.currentPage);
		}

		try {
			await tActions.journal.createFromSimpleTransaction({ db, transaction: form.data });
		} catch (e) {
			logging.info('Create Transaction Error', e);
			return message(form, 'Error Creating Transaction');
		}
		redirect(302, form.data.prevPage);
	}
};
