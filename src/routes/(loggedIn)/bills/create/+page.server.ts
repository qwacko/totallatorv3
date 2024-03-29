import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createBillSchema } from '$lib/schema/billSchema.js';
import { billPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(createBillSchema));

	return { form };
};

const createBillSchemaWithPageAndFilter = createBillSchema.merge(billPageAndFilterValidation);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(createBillSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.bill.create(db, form.data);
		} catch (e) {
			logging.error('Create Bill Error', e);
			return message(form, 'Error Creating Bill, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
