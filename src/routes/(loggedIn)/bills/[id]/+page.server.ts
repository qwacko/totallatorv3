import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateBillSchema } from '$lib/schema/billSchema';
import { billPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/bills');

	const bill = await tActions.bill.getById(db, pageInfo.current.params?.id);
	if (!bill) redirect(302, '/bills');
	const form = await superValidate(
		{ id: bill.id, title: bill.title, status: bill.status },
		zod(updateBillSchema)
	);

	return {
		bill,
		form
	};
};

const updateBillSchemaWithPageAndFilter = updateBillSchema.merge(billPageAndFilterValidation);

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateBillSchemaWithPageAndFilter));

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.bill.update({ db, data: form.data, id: form.data.id });
		} catch (e) {
			logging.error('Update Bill Error', e);
			return message(form, 'Error Updating Bill');
		}
		redirect(302, form.data.prevPage);
	}
};
