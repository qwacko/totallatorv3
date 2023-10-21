import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createSimpleTransactionSchemaCore } from '$lib/schema/journalSchema.js';
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

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, createSimpleTransactionSchemaCore);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.journal.createFromSimpleTransaction({ db, transaction: form.data });
		} catch (e) {
			logging.info('Create Transaction Error', e);
			return message(form, 'Error Creating Transaction');
		}
		throw redirect(302, '/journals');
	}
};
