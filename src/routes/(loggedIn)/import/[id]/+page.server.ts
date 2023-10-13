import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo } = serverPageInfo(data.route.id, data);

	if (!pageInfo.params?.id) {
		throw redirect(302, urlGenerator({ address: '/(loggedIn)/import' }).url);
	}

	const info = await tActions.import.get({ id: pageInfo.params.id, db });

	if (!info) {
		throw redirect(302, urlGenerator({ address: '/(loggedIn)/import' }).url);
	}

	return {
		id: pageInfo.params.id,
		info,
		streaming: {
			data: tActions.import.getDetail({ db, id: pageInfo.params.id })
		}
	};
};

export const actions = {
	reprocess: async ({ params }) => {
		try {
			await tActions.import.reprocess({ db, id: params.id });
		} catch (e) {
			console.log(e);
		}
	}
};
