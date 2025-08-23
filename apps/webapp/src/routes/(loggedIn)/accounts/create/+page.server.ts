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

	data.locals.global.logger('accounts').trace({
		code: 'WEB_ACC_020',
		title: 'Account creation page loaded',
		userId: data.locals.user?.id
	});

	const form = await superValidate(zod4(createAccountSchema));

	return { form };
};

const createAccountSchemaWithPageAndFilter = z.object({
	...createAccountSchema.shape,
	...accountPageAndFilterValidation.shape
});

export const actions = {
	default: async ({ request, locals }) => {
		const startTime = Date.now();
		const form = await superValidate(request, zod4(createAccountSchemaWithPageAndFilter));

		if (!form.valid) {
			locals.global.logger('accounts').warn({
				code: 'WEB_ACC_021',
				title: 'Account creation form validation failed',
				userId: locals.user?.id,
				validationErrors: form.errors,
				formData: form.data
			});
			return { form };
		}

		const { prevPage, ...accountData } = form.data;
		locals.global.logger('accounts').info({
			code: 'WEB_ACC_022',
			title: 'Account creation initiated via web',
			userId: locals.user?.id,
			accountData: {
				...accountData,
				// Don't log sensitive data, just the structure
				title: accountData.title,
				type: accountData.type,
				status: accountData.status
			}
		});

		try {
			const accountId = await tActions.account.create(accountData);

			const duration = Date.now() - startTime;
			locals.global.logger('accounts').info({
				code: 'WEB_ACC_023',
				title: 'Account created successfully via web',
				userId: locals.user?.id,
				accountId,
				accountTitle: accountData.title,
				accountType: accountData.type,
				duration
			});
		} catch (e) {
			const duration = Date.now() - startTime;
			locals.global.logger('accounts').error({
				code: 'WEB_ACC_024',
				title: 'Account creation failed via web',
				userId: locals.user?.id,
				accountTitle: accountData.title,
				accountType: accountData.type,
				duration,
				error: e
			});
			return message(form, 'Error Creating Account, Possibly Already Exists');
		}
		redirect(302, prevPage);
	}
};
