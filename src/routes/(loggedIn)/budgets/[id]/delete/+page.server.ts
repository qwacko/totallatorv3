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

	if (!pageInfo.current.params?.id) throw redirect(302, '/budgets');

	const budget = await tActions.budget.getById(db, pageInfo.current.params?.id);
	if (!budget) throw redirect(302, '/budgets');

	return {
		budget
	};
};

export const actions = {
	default: async ({ params }) => {
		try {
			await tActions.budget.delete(db, idSchema.parse(params));
		} catch (e) {
			logging.error('Delete Budget Error', e);
			return {};
		}
		throw redirect(302, '/budgets');
	}
};
