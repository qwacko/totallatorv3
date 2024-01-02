import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { tagPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { createTagSchema } from '$lib/schema/tagSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(createTagSchema);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, createTagSchema.merge(tagPageAndFilterValidation));

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
