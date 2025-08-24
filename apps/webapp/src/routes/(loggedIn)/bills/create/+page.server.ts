import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { createBillSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { billPageAndFilterValidation } from '$lib/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod4(createBillSchema));

	return { form };
};

const createBillSchemaWithPageAndFilter = z.object({
	...createBillSchema.shape,
	...billPageAndFilterValidation.shape
});

export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createBillSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.bill.create(form.data);
		} catch (e) {
			locals.global
				.logger('bills')
				.error({ code: 'BIL_0004', title: 'Create Bill Error', error: e });
			return message(form, 'Error Creating Bill, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
