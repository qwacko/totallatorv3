import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tagPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';
import { updateTagSchema } from '$lib/schema/tagSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/tags');

	const tag = await tActions.tag.getById(db, pageInfo.current.params?.id);
	if (!tag) redirect(302, '/tags');
	const form = await superValidate(
		{ id: tag.id, title: tag.title, status: tag.status },
		zod(updateTagSchema)
	);

	return {
		tag,
		form
	};
};

const updateTagSchemaWithPageAndFilter = updateTagSchema.merge(tagPageAndFilterValidation);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateTagSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.tag.update(db, form.data);
		} catch (e) {
			logging.error('Update Tag Error', e);
			return message(form, 'Error Updating Tag');
		}
		redirect(302, form.data.prevPage);
	}
};
