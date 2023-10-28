import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createBillSchema } from '$lib/schema/billSchema.js';
import { billPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(createBillSchema);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, createBillSchema.merge(billPageAndFilterValidation));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.bill.create(db, form.data);
		} catch (e) {
			logging.info('Create Bill Error', e);
			return message(form, 'Error Creating Bill, Possibly Already Exists');
		}
		throw redirect(302, form.data.prevPage);
	}
};
