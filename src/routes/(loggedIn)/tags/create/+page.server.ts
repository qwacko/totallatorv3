import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { tagPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { createTagSchema } from '$lib/schema/tagSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(createTagSchema));

	return { form };
};

const createTagSchemaWithPageAndFilter = createTagSchema.merge(tagPageAndFilterValidation);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(createTagSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.tag.create(db, form.data);
		} catch (e) {
			logging.error('Create Tag Error', e);
			return message(form, 'Error Creating Tag, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
