import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createBudgetSchema } from '$lib/schema/budgetSchema.js';
import { budgetPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(createBudgetSchema);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(
			request,
			createBudgetSchema.merge(budgetPageAndFilterValidation)
		);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.budget.create(db, form.data);
		} catch (e) {
			logging.error('Create Budget Error', e);
			return message(form, 'Error Creating Budget, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
