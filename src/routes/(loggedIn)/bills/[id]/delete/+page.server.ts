import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { idSchema } from '$lib/schema/idSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/bills');

	const bill = await tActions.bill.getById(db, pageInfo.current.params?.id);
	if (!bill) redirect(302, '/bills');

	return {
		bill
	};
};

export const actions = {
	default: async ({ params }) => {
		try {
			await tActions.bill.delete(db, idSchema.parse(params));
		} catch (e) {
			logging.error('Delete Bill Error', e);
			return {};
		}
		redirect(302, '/bills');
	}
};
