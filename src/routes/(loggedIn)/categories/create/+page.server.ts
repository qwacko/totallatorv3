import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createCategorySchema } from '$lib/schema/categorySchema.js';
import { categoryPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(createCategorySchema);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(
			request,
			createCategorySchema.merge(categoryPageAndFilterValidation)
		);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.category.create(db, form.data);
		} catch (e) {
			logging.info('Create Category Error', e);
			return message(form, 'Error Creating Category, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
