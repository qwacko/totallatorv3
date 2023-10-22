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

	const form = await superValidate(createSimpleTransactionSchemaCore);

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
			throw redirect(302, form.data.currentPage);
		}

		try {
			await tActions.journal.createFromSimpleTransaction({ db, transaction: form.data });
		} catch (e) {
			logging.info('Create Transaction Error', e);
			return message(form, 'Error Creating Transaction');
		}
		throw redirect(302, form.data.prevPage);
	}
};
