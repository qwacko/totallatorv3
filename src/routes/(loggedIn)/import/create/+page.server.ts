import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes.js';
import { createImportSchema } from '$lib/schema/importSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { fail, redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(createImportSchema));

	return { form };
};

export const actions = {
	create: async ({ request, locals }) => {
		const db = locals.db;

		const form = await superValidate(request, zod(createImportSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		let newId: undefined | string = undefined;

		try {
			if (form.data.importMappingId) {
				const result = await tActions.importMapping.getById({ db, id: form.data.importMappingId });
				if (!result) {
					return setError(
						form,
						'importMappingId',
						`Mapping ${form.data.importMappingId} Not Found`
					);
				}
			}
			newId = await tActions.import.store({
				db,
				data: form.data
			});
		} catch (e) {
			logging.error('Import Create Error', JSON.stringify(e, null, 2));
			const parsedError = z.object({ message: z.string() }).safeParse(e);
			if (parsedError.success) {
				return message(form, parsedError.data.message, { status: 400 });
			}
			return message(form, 'Unknown Error Loading File', { status: 400 });
		}
		if (newId) {
			if (form.data.autoProcess) {
				redirect(302, urlGenerator({ address: '/(loggedIn)/import', searchParamsValue: {} }).url);
			} else {
				redirect(
					302,
					urlGenerator({ address: '/(loggedIn)/import/[id]', paramsValue: { id: newId } }).url
				);
			}
		}
		return message(form, 'Unknown Error. Not Processed');
	}
};
