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

	if (!pageInfo.current.params?.id) throw redirect(302, '/categories');

	const category = await tActions.category.getById(db, pageInfo.current.params?.id);
	if (!category) throw redirect(302, '/categories');

	return {
		category
	};
};

export const actions = {
	default: async ({ params }) => {
		try {
			await tActions.category.delete(db, idSchema.parse(params));
		} catch (e) {
			logging.error('Delete Category Error', e);
			return {};
		}
		throw redirect(302, '/categories');
	}
};