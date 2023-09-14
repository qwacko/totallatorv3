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

	if (!pageInfo.params?.id) throw redirect(302, '/tags');

	const tag = await tActions.tag.getById(db, pageInfo.params?.id);
	if (!tag) throw redirect(302, '/tags');

	return {
		tag
	};
};

export const actions = {
	default: async ({ params }) => {
		try {
			await tActions.tag.delete(db, idSchema.parse(params));
		} catch (e) {
			logging.error('Delete Tag Error', e);
			return {};
		}
		throw redirect(302, '/tags');
	}
};
