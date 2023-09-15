import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateCategorySchema } from '$lib/schema/categorySchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) throw redirect(302, '/categories');

	const category = await tActions.category.getById(db, pageInfo.current.params?.id);
	if (!category) throw redirect(302, '/categories');
	const form = await superValidate(
		{ id: category.id, title: category.title, status: category.status },
		updateCategorySchema
	);

	return {
		category,
		form
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, updateCategorySchema);

		logging.info('Update Form: ', form);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.category.update(db, form.data);
		} catch (e) {
			logging.info('Update Category Error', e);
			return message(form, 'Error Updating Category');
		}
		throw redirect(302, '/categories');
	}
};
