import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { createAccountSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { accountPageAndFilterValidation } from '$lib/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod4(createAccountSchema));

	return { form };
};

const createAccountSchemaWithPageAndFilter = z.object({
	...createAccountSchema.shape,
	...accountPageAndFilterValidation.shape
});

export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createAccountSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.account.create(form.data);
		} catch (e) {
			locals.global
				.logger('accounts')
				.error({ code: 'ACC_0002', title: 'Create Account Error', error: e });
			return message(form, 'Error Creating Account, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
