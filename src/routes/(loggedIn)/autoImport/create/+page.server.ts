import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes.js';
import {
	createAutoImportFormSchema,
	createAutoImportSchema
} from '$lib/schema/autoImportSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging.js';
import { redirect } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (request) => {
	authGuard(request);

	const form = await superValidate(zod(createAutoImportFormSchema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod(createAutoImportFormSchema));
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
				db: locals.db,
				data: validatedData.data
			});
		} catch (e) {
			logging.error('Error Creating Auto Import', e);
			return message(form, 'Error Creating Auto Import');
		}
		return redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/autoImport/[id]', paramsValue: { id } }).url
		);
	}
};
