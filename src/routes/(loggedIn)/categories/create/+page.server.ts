import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createCategorySchema } from '$lib/schema/categorySchema.js';
import { categoryPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(createCategorySchema));

	return { form };
};

const createCategorySchemaWithPageAndFilter = createCategorySchema.merge(
	categoryPageAndFilterValidation
);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(createCategorySchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.category.create(db, form.data);
		} catch (e) {
			logging.error('Create Category Error', e);
			return message(form, 'Error Creating Category, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
