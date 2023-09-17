import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateLabelSchema } from '$lib/schema/labelSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	logging.info('labels/[id] load function : ', pageInfo);

	if (!pageInfo.current.params?.id) throw redirect(302, '/labels');

	const label = await tActions.label.getById(db, pageInfo.current.params?.id);
	if (!label) throw redirect(302, '/labels');
	const form = await superValidate(
		{ id: label.id, title: label.title, status: label.status },
		updateLabelSchema
	);

	return {
		label,
		form
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, updateLabelSchema);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.label.update(db, form.data);
		} catch (e) {
			logging.info('Update Label Error', e);
			return message(form, 'Error Updating Label');
		}
		throw redirect(302, '/labels');
	}
};
