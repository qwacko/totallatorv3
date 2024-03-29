import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createBudgetSchema } from '$lib/schema/budgetSchema.js';
import { budgetPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(createBudgetSchema));

	return { form };
};

const createBudgetSchemaWithPageAndFilter = createBudgetSchema.merge(budgetPageAndFilterValidation);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(createBudgetSchemaWithPageAndFilter));

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
