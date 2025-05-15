import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateCategorySchema } from '$lib/schema/categorySchema';
import { categoryPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/categories');

	const category = await tActions.category.getById(db, pageInfo.current.params?.id);
	if (!category) redirect(302, '/categories');
	const form = await superValidate(
		{ id: category.id, title: category.title, status: category.status },
		zod(updateCategorySchema)
	);

	return {
		category,
		form
	};
};

const updateCategorySchemaWithPageAndFilter = updateCategorySchema.merge(
	categoryPageAndFilterValidation
);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateCategorySchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.category.update({ db, data: form.data, id: form.data.id });
		} catch (e) {
			logging.error('Update Category Error', e);
			return message(form, 'Error Updating Category');
		}
		redirect(302, form.data.prevPage);
	}
};
