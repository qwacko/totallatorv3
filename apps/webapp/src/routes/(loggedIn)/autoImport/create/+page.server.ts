import { redirect } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { tActions } from '@totallator/business-logic';
import { createAutoImportFormSchema, createAutoImportSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes.js';

export const load = async (request) => {
	authGuard(request);

	const form = await superValidate(zod4(createAutoImportFormSchema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createAutoImportFormSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { title, enabled, frequency, importMappingId, type, ...config } = form.data;

		const validatedData = createAutoImportSchema.safeParse({
			title,
			enabled,
			frequency,
			importMappingId,
			type,
			config: { ...config, type }
		});

		if (!validatedData.success) {
			return message(form, validatedData.error.message);
		}

		let id = '';

		try {
			id = await tActions.autoImport.create({
				data: validatedData.data
			});
		} catch (e) {
			locals.global.logger('auto-import').error({
				code: 'AI_0001',
				title: 'Error Creating Auto Import',
				error: e
			});
			return message(form, 'Error Creating Auto Import');
		}
		return redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/autoImport/[id]',
				paramsValue: { id }
			}).url
		);
	}
};
