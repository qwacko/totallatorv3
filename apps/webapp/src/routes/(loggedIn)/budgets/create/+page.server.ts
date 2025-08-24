import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { createBudgetSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { budgetPageAndFilterValidation } from '$lib/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod4(createBudgetSchema));

	return { form };
};

const createBudgetSchemaWithPageAndFilter = z.object({
	...createBudgetSchema.shape,
	...budgetPageAndFilterValidation.shape
});

export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createBudgetSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.budget.create(form.data);
		} catch (e) {
			locals.global
				.logger('budgets')
				.error({ code: 'BUD_0004', title: 'Create Budget Error', error: e });
			return message(form, 'Error Creating Budget, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
