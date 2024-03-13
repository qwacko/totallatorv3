import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createAccountSchema } from '$lib/schema/accountSchema.js';
import { accountPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(createAccountSchema));

	return { form };
};

const createAccountSchemaWithPageAndFilter = createAccountSchema.merge(
	accountPageAndFilterValidation
);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(createAccountSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.account.create(db, form.data);
		} catch (e) {
			logging.error('Create Account Error', e);
			return message(form, 'Error Creating Account, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
