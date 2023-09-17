import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateBillSchema } from '$lib/schema/billSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) throw redirect(302, '/bills');

	const bill = await tActions.bill.getById(db, pageInfo.current.params?.id);
	if (!bill) throw redirect(302, '/bills');
	const form = await superValidate(
		{ id: bill.id, title: bill.title, status: bill.status },
		updateBillSchema
	);

	return {
		bill,
		form
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, updateBillSchema);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.bill.update(db, form.data);
		} catch (e) {
			logging.info('Update Bill Error', e);
			return message(form, 'Error Updating Bill');
		}
		throw redirect(302, '/bills');
	}
};
