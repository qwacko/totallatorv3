import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createAccountSchema } from '$lib/schema/accountSchema.js';
import { accountPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(createAccountSchema);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(
			request,
			createAccountSchema.merge(accountPageAndFilterValidation)
		);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.account.create(db, form.data);
		} catch (e) {
			logging.info('Create Account Error', e);
			return message(form, 'Error Creating Account, Possibly Already Exists');
		}
		throw redirect(302, form.data.prevPage);
	}
};
