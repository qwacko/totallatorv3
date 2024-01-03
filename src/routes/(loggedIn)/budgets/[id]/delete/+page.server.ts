import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { idSchema } from '$lib/schema/idSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/budgets');

	const budget = await tActions.budget.getById(db, pageInfo.current.params?.id);
	if (!budget) redirect(302, '/budgets');

	return {
		budget
	};
};

export const actions = {
	default: async ({ params, locals }) => {
		const db = locals.db;
		try {
			await tActions.budget.delete(db, idSchema.parse(params));
		} catch (e) {
			logging.error('Delete Budget Error', e);
			return {};
		}
		redirect(302, '/budgets');
	}
};
