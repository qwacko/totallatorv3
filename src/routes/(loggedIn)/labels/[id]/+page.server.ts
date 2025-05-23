import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateLabelSchema } from '$lib/schema/labelSchema';
import { labelPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/labels');

	const label = await tActions.label.getById(db, pageInfo.current.params?.id);
	if (!label) redirect(302, '/labels');
	const form = await superValidate(
		{ id: label.id, title: label.title, status: label.status },
		zod(updateLabelSchema)
	);

	return {
		label,
		form
	};
};

const updateLabelSchemaWithPageAndFilter = updateLabelSchema.merge(labelPageAndFilterValidation);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateLabelSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.label.update({ db, data: form.data, id: form.data.id });
		} catch (e) {
			logging.error('Update Label Error', e);
			return message(form, 'Error Updating Label');
		}
		redirect(302, form.data.prevPage);
	}
};
