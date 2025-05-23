import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateBudgetSchema } from '$lib/schema/budgetSchema';
import { labelPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/budgets');

	const budget = await tActions.budget.getById(db, pageInfo.current.params?.id);
	if (!budget) redirect(302, '/budgets');
	const form = await superValidate(
		{ id: budget.id, title: budget.title, status: budget.status },
		zod(updateBudgetSchema)
	);

	return {
		budget,
		form
	};
};

const updateBudgetSchemaWithPageAndFilter = updateBudgetSchema.merge(labelPageAndFilterValidation);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateBudgetSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.budget.update({ db, data: form.data, id: form.data.id });
		} catch (e) {
			logging.error('Update Budget Error', e);
			return message(form, 'Error Updating Budget');
		}
		redirect(302, form.data.prevPage);
	}
};
