import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tagPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';
import { updateTagSchema } from '$lib/schema/tagSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) throw redirect(302, '/tags');

	const tag = await tActions.tag.getById(db, pageInfo.current.params?.id);
	if (!tag) throw redirect(302, '/tags');
	const form = await superValidate(
		{ id: tag.id, title: tag.title, status: tag.status },
		updateTagSchema
	);

	return {
		tag,
		form
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, updateTagSchema.merge(tagPageAndFilterValidation));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.tag.update(db, form.data);
		} catch (e) {
			logging.info('Update Tag Error', e);
			return message(form, 'Error Updating Tag');
		}
		throw redirect(302, form.data.prevPage);
	}
};
