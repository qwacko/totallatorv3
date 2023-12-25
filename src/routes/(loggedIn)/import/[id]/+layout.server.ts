import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';

import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo } = serverPageInfo(data.route.id, data);

	if (!pageInfo.params?.id) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/import' }).url);
	}

	const info = await tActions.import.get({ id: pageInfo.params.id, db });

	if (!info.importInfo) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/import' }).url);
	}

	const canDelete = await tActions.import.canDelete({ db, id: pageInfo.params.id })

	return {
		id: pageInfo.params.id,
		info,
		canDelete,
		streaming: {
			data: tActions.import.getDetail({ db, id: pageInfo.params.id })
		}
	};
};
